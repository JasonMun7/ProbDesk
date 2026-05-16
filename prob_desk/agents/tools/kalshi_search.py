"""
Paginated Kalshi market search by natural-language query (title, subtitles, ticker).

Use when the user names an event or outcome (e.g. "Scottie Scheffler PGA") without a ticker.
"""

from __future__ import annotations

import json
import re
from typing import Any

from prob_desk.agents.tools.kalshi_api import (
    list_markets_page,
    normalize_market_status_filter,
)

_STOPWORDS = frozenset(
    {
        "a",
        "an",
        "the",
        "on",
        "for",
        "to",
        "in",
        "at",
        "my",
        "demo",
        "kalshi",
        "buy",
        "yes",
        "no",
        "will",
        "win",
        "wins",
        "winning",
    }
)

# Query tokens → Kalshi series_ticker when the user omits series_ticker.
_SERIES_QUERY_HINTS: tuple[tuple[frozenset[str], str], ...] = (
    (
        frozenset(
            {
                "pga",
                "golf",
                "masters",
                "pgatour",
                "ryder",
                "usopen",
            }
        ),
        "KXPGATOUR",
    ),
)


def tokenize_query(query: str) -> list[str]:
    """Split a user phrase into lowercase tokens (drop very short / stop words)."""
    raw = re.findall(r"[a-z0-9]+", query.lower())
    return [t for t in raw if len(t) >= 2 and t not in _STOPWORDS]


def infer_series_tickers(tokens: list[str]) -> list[str]:
    """Guess series_ticker filters from query tokens (e.g. PGA → KXPGATOUR)."""
    token_set = set(tokens)
    out: list[str] = []
    for triggers, series in _SERIES_QUERY_HINTS:
        if token_set & triggers and series not in out:
            out.append(series)
    return out


def market_search_text(market: dict[str, Any]) -> str:
    """Build a single searchable string from API market fields."""
    parts = [
        market.get("ticker"),
        market.get("title"),
        market.get("subtitle"),
        market.get("yes_sub_title"),
        market.get("no_sub_title"),
        market.get("event_ticker"),
    ]
    return " ".join(str(p) for p in parts if p).lower()


def score_market(market: dict[str, Any], tokens: list[str]) -> float:
    """
    Score in [0, 1]: fraction of query tokens found in market text.

    Slight bonus when every token matches.
    """
    if not tokens:
        return 0.0
    text = market_search_text(market)
    hits = sum(1 for t in tokens if t in text)
    if hits == 0:
        return 0.0
    score = hits / len(tokens)
    if hits == len(tokens):
        score = min(1.0, score + 0.1)
    return score


def summarize_market(market: dict[str, Any]) -> dict[str, Any]:
    """Compact dict for LLM consumption."""
    return {
        "ticker": market.get("ticker"),
        "title": market.get("title"),
        "event_ticker": market.get("event_ticker"),
        "status": market.get("status"),
        "yes_sub_title": market.get("yes_sub_title"),
        "yes_ask_dollars": market.get("yes_ask_dollars"),
        "yes_bid_dollars": market.get("yes_bid_dollars"),
        "last_price_dollars": market.get("last_price_dollars"),
    }


def _paginate_and_score(
    tokens: list[str],
    *,
    series_ticker: str,
    event_ticker: str,
    status_filter: str,
    max_pages: int,
    page_limit: int,
    min_score: float,
) -> tuple[list[tuple[float, dict[str, Any]]], int, int, str | None]:
    """Fetch up to ``max_pages`` of markets and return scored hits."""
    all_scored: list[tuple[float, dict[str, Any]]] = []
    markets_scanned = 0
    pages_fetched = 0
    api_error: str | None = None

    cursor = ""
    for _ in range(max_pages):
        page, err = list_markets_page(
            series_ticker=series_ticker,
            event_ticker=event_ticker,
            status=status_filter,
            limit=page_limit,
            cursor=cursor,
        )
        if err:
            api_error = err
            break
        pages_fetched += 1
        markets = page.get("markets") or []
        markets_scanned += len(markets)
        for m in markets:
            if not isinstance(m, dict):
                continue
            s = score_market(m, tokens)
            if s >= min_score:
                all_scored.append((s, m))
        cursor = page.get("cursor") or ""
        if not cursor:
            break

    return all_scored, markets_scanned, pages_fetched, api_error


def _closed_market_hint(
    tokens: list[str],
    *,
    series_ticker: str,
    event_ticker: str,
    min_score: float,
) -> str | None:
    """If open search missed but closed listings match, return a status hint."""
    page, _ = list_markets_page(
        series_ticker=series_ticker,
        event_ticker=event_ticker,
        status="closed",
        limit=200,
    )
    for m in page.get("markets") or []:
        if isinstance(m, dict) and score_market(m, tokens) >= min_score:
            return (
                "Matching markets exist but are closed (not open for trading). "
                "Call again with status=closed or status=settled to list them."
            )
    return None


def search_markets(
    query: str,
    *,
    series_ticker: str = "",
    event_ticker: str = "",
    status: str = "open",
    max_results: int = 10,
    max_pages: int = 30,
    page_limit: int = 200,
    min_score: float = 0.34,
) -> dict[str, Any]:
    """
    Paginate Kalshi ``GET /markets`` and rank by query token overlap.

    Parameters
    ----------
    query
        Natural language, e.g. ``Scottie Scheffler PGA Championship``.
    series_ticker
        Optional series filter (e.g. ``KXPGATOUR``). When empty, common sports
        terms (e.g. ``pga``, ``golf``) auto-select a series ticker.
    event_ticker
        Optional event filter (e.g. ``KXPGATOUR-PGC26``) — strongly recommended
        for large series with many outcomes.
    status
        Market status filter (default ``open``). Kalshi accepts ``unopened``,
        ``open``, ``closed``, ``settled``, or empty for any. ``active`` is
        accepted as an alias for ``open`` (API listing filter, not market field).
    max_results
        Maximum matches returned.
    max_pages
        Pagination cap to avoid runaway API calls.
    page_limit
        Page size per request (API max typically 1000).
    min_score
        Minimum token-overlap score to include a market.
    """
    tokens = tokenize_query(query)
    if not tokens:
        return {
            "ok": False,
            "error": "Query has no searchable terms after tokenization.",
            "query": query,
        }

    status_filter = normalize_market_status_filter(status) or "open"

    series = series_ticker.strip()
    event = event_ticker.strip()
    inferred_series = infer_series_tickers(tokens) if not series and not event else []

    passes: list[tuple[str, str, str, int]] = []
    if series or event:
        passes.append((series, event, status_filter, max_pages))
    else:
        for s in inferred_series:
            passes.append((s, "", status_filter, max_pages))
        if not inferred_series:
            passes.append(("", "", status_filter, max_pages))

    all_scored: list[tuple[float, dict[str, Any]]] = []
    markets_scanned = 0
    pages_fetched = 0
    api_error: str | None = None

    for pass_series, pass_event, pass_status, pass_max_pages in passes:
        scored, scanned, pages, err = _paginate_and_score(
            tokens,
            series_ticker=pass_series,
            event_ticker=pass_event,
            status_filter=pass_status,
            max_pages=pass_max_pages,
            page_limit=page_limit,
            min_score=min_score,
        )
        all_scored.extend(scored)
        markets_scanned += scanned
        pages_fetched += pages
        if err and api_error is None:
            api_error = err

    all_scored.sort(key=lambda x: (-x[0], x[1].get("ticker") or ""))
    seen: set[str] = set()
    matches: list[dict[str, Any]] = []
    for s, m in all_scored:
        ticker = m.get("ticker") or ""
        if ticker in seen:
            continue
        seen.add(ticker)
        row = summarize_market(m)
        row["match_score"] = round(s, 3)
        matches.append(row)
        if len(matches) >= max_results:
            break

    effective_series = series or (inferred_series[0] if inferred_series else None)

    out: dict[str, Any] = {
        "ok": bool(matches),
        "query": query,
        "tokens": tokens,
        "filters": {
            "series_ticker": effective_series,
            "event_ticker": event or None,
            "status": status_filter,
            "inferred_series_tickers": inferred_series or None,
        },
        "markets_scanned": markets_scanned,
        "pages_fetched": pages_fetched,
        "matches": matches,
    }
    if not matches:
        if api_error:
            out["api_error"] = api_error
            if "400" in api_error and "status=active" in api_error.lower():
                out["hint"] = (
                    "Kalshi rejected status=active. Use status=open (default), "
                    "closed, or settled."
                )
            else:
                out["hint"] = (
                    "Search failed against the Kalshi API. Check api_error and retry "
                    "with status=open or a series_ticker (e.g. KXPGATOUR for PGA)."
                )
        else:
            closed_hint = None
            if status_filter == "open" and effective_series:
                closed_hint = _closed_market_hint(
                    tokens,
                    series_ticker=effective_series,
                    event_ticker=event,
                    min_score=min_score,
                )
            if closed_hint:
                out["hint"] = closed_hint
            elif inferred_series:
                out["hint"] = (
                    f"No open markets matched. Auto-searched series "
                    f"{', '.join(inferred_series)}. Try event_ticker "
                    "(e.g. KXPGATOUR-PGC26), status=closed, or a shorter query."
                )
            else:
                out["hint"] = (
                    "No matches in the scanned open-market pages. Add series_ticker "
                    "(e.g. KXPGATOUR for PGA/golf) or event_ticker (e.g. "
                    "KXPGATOUR-PGC26). Unfiltered search only covers the first "
                    f"{max_pages} API pages (~{max_pages * page_limit} markets)."
                )
    return out


def kalshi_search_markets(
    query: str,
    series_ticker: str = "",
    event_ticker: str = "",
    status: str = "open",
    max_results: int = 10,
) -> str:
    """
    Find Kalshi markets by natural language (player name, event title, etc.).

    Use before ``kalshi_get_market`` / order tools when the user did not supply a
    market ticker. Paginates listings and ranks by title, subtitle, and ticker.

    Parameters
    ----------
    query
        e.g. ``Scottie Scheffler PGA Championship``.
    series_ticker
        Optional filter, e.g. ``KXPGATOUR``. Omitted for PGA/golf queries uses
        ``KXPGATOUR`` automatically.
    event_ticker
        Optional filter, e.g. ``KXPGATOUR-PGC26`` (recommended for large series).
    status
        ``open`` (default), or ``unopened``, ``closed``, ``settled``. ``active``
        is treated as ``open``.
    max_results
        Top matches to return (default 10).

    Returns
    -------
    str
        JSON with ``matches`` (ticker, title, prices) and scan metadata.
    """
    result = search_markets(
        query,
        series_ticker=series_ticker,
        event_ticker=event_ticker,
        status=status,
        max_results=max_results,
    )
    return json.dumps(result)


__all__ = [
    "infer_series_tickers",
    "kalshi_search_markets",
    "market_search_text",
    "score_market",
    "search_markets",
    "summarize_market",
    "tokenize_query",
]
