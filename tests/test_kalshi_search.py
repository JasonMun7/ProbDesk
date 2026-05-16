"""Unit tests for Kalshi natural-language market search (no live API)."""

from __future__ import annotations

from prob_desk.agents.tools.kalshi_api import normalize_market_status_filter
from prob_desk.agents.tools.kalshi_search import (
    infer_series_tickers,
    market_search_text,
    score_market,
    search_markets,
    tokenize_query,
)


def test_tokenize_query_drops_stopwords():
    tokens = tokenize_query("Buy YES on Scottie Scheffler for the PGA Championship")
    assert "scottie" in tokens
    assert "scheffler" in tokens
    assert "pga" in tokens
    assert "championship" in tokens
    assert "buy" not in tokens
    assert "yes" not in tokens
    assert "the" not in tokens


def test_score_market_full_name_match():
    market = {
        "ticker": "KXPGATOUR-PGC26-SSCH",
        "title": "Will Scottie Scheffler win the PGA Championship?",
        "yes_sub_title": "Scottie Scheffler",
        "event_ticker": "KXPGATOUR-PGC26",
    }
    tokens = tokenize_query("Scottie Scheffler PGA")
    score = score_market(market, tokens)
    assert score >= 1.0


def test_score_market_no_match():
    market = {
        "ticker": "KXPGATOUR-PGC26-RFOW",
        "title": "Will Rickie Fowler win the PGA Championship?",
        "yes_sub_title": "Rickie Fowler",
    }
    tokens = tokenize_query("Scottie Scheffler")
    assert score_market(market, tokens) == 0.0


def test_market_search_text_includes_subtitles():
    text = market_search_text(
        {"ticker": "T", "title": "Title", "yes_sub_title": "Scottie Scheffler"}
    )
    assert "scottie" in text
    assert "scheffler" in text


def test_search_markets_empty_query():
    out = search_markets("   ")
    assert out["ok"] is False
    assert "error" in out


def test_normalize_market_status_active_alias():
    assert normalize_market_status_filter("active") == "open"
    assert normalize_market_status_filter("open") == "open"
    assert normalize_market_status_filter("") == ""


def test_infer_series_tickers_pga():
    tokens = tokenize_query("Scottie Scheffler PGA")
    assert infer_series_tickers(tokens) == ["KXPGATOUR"]


def test_infer_series_tickers_unrelated():
    tokens = tokenize_query("Bitcoin price above 100k")
    assert infer_series_tickers(tokens) == []


def test_search_markets_autoinfers_series(monkeypatch):
    calls: list[dict] = []

    def fake_list(**kwargs):
        calls.append(kwargs)
        if kwargs.get("series_ticker") == "KXPGATOUR":
            return {
                "markets": [
                    {
                        "ticker": "KXPGATOUR-PGC26-SSCH",
                        "title": "Will Scottie Scheffler win the PGA Championship?",
                        "yes_sub_title": "Scottie Scheffler",
                    },
                ],
                "cursor": "",
            }, None
        return {"markets": [], "cursor": ""}, None

    monkeypatch.setattr(
        "prob_desk.agents.tools.kalshi_search.list_markets_page",
        fake_list,
    )

    out = search_markets("Scottie Scheffler PGA", max_results=5)
    assert out["ok"] is True
    assert out["matches"][0]["ticker"] == "KXPGATOUR-PGC26-SSCH"
    assert out["filters"]["inferred_series_tickers"] == ["KXPGATOUR"]
    assert any(c.get("series_ticker") == "KXPGATOUR" for c in calls)


def test_search_markets_ranks_mock_pages(monkeypatch):
    page_a = {
        "markets": [
            {
                "ticker": "KXPGATOUR-PGC26-RFOW",
                "title": "Will Rickie Fowler win the PGA Championship?",
                "yes_sub_title": "Rickie Fowler",
            },
        ],
        "cursor": "page2",
    }
    page_b = {
        "markets": [
            {
                "ticker": "KXPGATOUR-PGC26-SSCH",
                "title": "Will Scottie Scheffler win the PGA Championship?",
                "yes_sub_title": "Scottie Scheffler",
                "yes_ask_dollars": "0.1900",
            },
        ],
        "cursor": "",
    }
    calls: list[dict] = []

    def fake_list(**kwargs):
        calls.append(kwargs)
        if len(calls) == 1:
            return page_a, None
        return page_b, None

    monkeypatch.setattr(
        "prob_desk.agents.tools.kalshi_search.list_markets_page",
        fake_list,
    )

    out = search_markets(
        "Scottie Scheffler PGA",
        series_ticker="KXPGATOUR",
        max_results=5,
        max_pages=5,
    )
    assert out["ok"] is True
    assert out["matches"][0]["ticker"] == "KXPGATOUR-PGC26-SSCH"
    assert len(calls) >= 2
