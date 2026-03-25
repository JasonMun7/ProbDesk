"""
Kalshi Trade API client for read-only public market data.

Uses the production Trade API v2. Public endpoints do not require API keys.
Optional KALSHI_TRADE_API_BASE overrides the default base URL.

Docs: https://docs.kalshi.com/getting_started/quick_start_market_data
"""

from __future__ import annotations

import json
import os
import traceback
from typing import Any, Optional
from urllib.parse import quote

import httpx
from loguru import logger

DEFAULT_KALSHI_BASE = "https://demo-api.kalshi.co/trade-api/v2"


def _base_url() -> str:
    return os.getenv("KALSHI_TRADE_API_BASE", DEFAULT_KALSHI_BASE).rstrip(
        "/"
    )


def _path_segment(ticker: str) -> str:
    """URL-encode a ticker for use in a path component."""
    return quote(ticker.strip(), safe="-_.~")


def _get(
    path: str,
    *,
    params: Optional[dict[str, Any]] = None,
) -> str:
    url = f"{_base_url()}{path}"
    try:
        with httpx.Client(timeout=30.0) as client:
            resp = client.get(url, params=params)
            resp.raise_for_status()
            return json.dumps(resp.json())
    except httpx.HTTPError as e:
        logger.error("Kalshi API request failed: {}\n{}", e, traceback.format_exc())
        return json.dumps({"error": str(e), "path": path})
    except Exception as e:
        logger.error("Kalshi API unexpected error: {}\n{}", e, traceback.format_exc())
        return json.dumps({"error": str(e), "path": path})


def kalshi_get_markets(
    series_ticker: str = "",
    status: str = "open",
    limit: int = 50,
    cursor: str = "",
) -> str:
    """
    List markets (paginated). Filter by series and status.

    Parameters
    ----------
    series_ticker
        e.g. KXHIGHNY. Empty string omits the filter.
    status
        One of: open, unopened, closed, settled, or empty for any.
    limit
        Page size (API typically allows up to 1000).
    cursor
        Pagination cursor from a previous response.

    Returns
    -------
    str
        JSON string with ``markets`` and optional ``cursor``.
    """
    params: dict[str, Any] = {}
    if series_ticker and series_ticker.strip():
        params["series_ticker"] = series_ticker.strip()
    if status and status.strip():
        params["status"] = status.strip()
    if limit and limit > 0:
        params["limit"] = min(limit, 1000)
    if cursor and cursor.strip():
        params["cursor"] = cursor.strip()
    return _get("/markets", params=params or None)


def kalshi_get_market(market_ticker: str) -> str:
    """
    Get a single market by market ticker.

    Parameters
    ----------
    market_ticker
        Market ticker (e.g. from kalshi_get_markets).
    """
    if not market_ticker or not market_ticker.strip():
        logger.warning("kalshi_get_market: market_ticker is empty")
        return "{}"
    seg = _path_segment(market_ticker)
    return _get(f"/markets/{seg}")


def kalshi_get_orderbook(market_ticker: str) -> str:
    """
    Get the order book for a market (yes/no bids in dollar terms).

    Parameters
    ----------
    market_ticker
        Market ticker.
    """
    if not market_ticker or not market_ticker.strip():
        logger.warning("kalshi_get_orderbook: market_ticker is empty")
        return "{}"
    seg = _path_segment(market_ticker)
    return _get(f"/markets/{seg}/orderbook")


def kalshi_get_series(series_ticker: str) -> str:
    """
    Get metadata for a series (e.g. KXHIGHNY).

    Parameters
    ----------
    series_ticker
        Series ticker.
    """
    if not series_ticker or not series_ticker.strip():
        logger.warning("kalshi_get_series: series_ticker is empty")
        return "{}"
    seg = _path_segment(series_ticker)
    return _get(f"/series/{seg}")


def kalshi_get_event(event_ticker: str) -> str:
    """
    Get a single event by event ticker.

    Parameters
    ----------
    event_ticker
        Event ticker.
    """
    if not event_ticker or not event_ticker.strip():
        logger.warning("kalshi_get_event: event_ticker is empty")
        return "{}"
    seg = _path_segment(event_ticker)
    return _get(f"/events/{seg}")


if __name__ == "__main__":
    print(kalshi_get_series("KXHIGHNY"))
    print(kalshi_get_markets(series_ticker="KXHIGHNY", limit=3))
