"""
Paginated Kalshi market search by natural-language query (title, subtitles, ticker).

Use when the user names an event or outcome (e.g. "Scottie Scheffler PGA") without a ticker.
"""

from __future__ import annotations

import json
import re
from typing import Any

from prob_desk.agents.tools.kalshi_api import list_markets_page

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


def tokenize_query(query: str) -> list[str]:
    """Split a user phrase into lowercase tokens (drop very short / stop words)."""
    raw = re.findall(r"[a-z0-9]+", query.lower())
    return [t for t in raw if len(t) >= 2 and t not in _STOPWORDS]


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
        Optional series filter (e.g. ``KXPGATOUR``).
    event_ticker
        Optional event filter (e.g. ``KXPGATOUR-PGC26``) — strongly recommended
        for large series with many outcomes.
    status
        Market status filter (default ``open``). Kalshi accepts ``unopened``,
        ``open``, ``closed``, ``settled``, or empty for any.
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

    status_filter = status.strip() or "open"

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

    out: dict[str, Any] = {
        "ok": bool(matches),
        "query": query,
        "tokens": tokens,
        "filters": {
            "series_ticker": series_ticker.strip() or None,
            "event_ticker": event_ticker.strip() or None,
            "status": status_filter,
        },
        "markets_scanned": markets_scanned,
        "pages_fetched": pages_fetched,
        "matches": matches,
    }
    if not matches:
        out["hint"] = (
            "No matches. Try a shorter query (player + event name), set event_ticker "
            "(e.g. KXPGATOUR-PGC26), or series_ticker (e.g. KXPGATOUR). "
            "Large series require pagination; this tool scans multiple pages automatically."
        )
        if api_error:
            out["api_error"] = api_error
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
        Optional filter, e.g. ``KXPGATOUR``.
    event_ticker
        Optional filter, e.g. ``KXPGATOUR-PGC26`` (recommended for large series).
    status
        ``open`` (default), or ``unopened``, ``closed``, ``settled``.
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
    "kalshi_search_markets",
    "market_search_text",
    "score_market",
    "search_markets",
    "summarize_market",
    "tokenize_query",
]
