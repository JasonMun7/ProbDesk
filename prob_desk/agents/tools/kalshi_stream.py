"""
Kalshi live quote snapshot via WebSocket (authenticated) or REST orderbook fallback.

WebSocket requires ``KALSHI_API_KEY_ID`` + private key (same as SDK tools). Without
credentials, uses a short REST orderbook poll via :func:`kalshi_get_orderbook`.
"""

from __future__ import annotations

import asyncio
import json
import os
import time
from typing import Any
from urllib.parse import urlparse

from loguru import logger

try:
    import websockets
except ImportError:
    websockets = None  # type: ignore[assignment]

from prob_desk.agents.tools.kalshi_api import DEFAULT_KALSHI_BASE, kalshi_get_orderbook
from prob_desk.agents.tools.kalshi_sdk_client import (
    _load_private_key_pem,
    _trade_api_base,
)

WS_SIGN_PATH = "/trade-api/ws/v2"
DEFAULT_MAX_WAIT_SECONDS = 2.5
DEFAULT_MAX_UPDATES = 3

_WS_HOST_BY_REST_HOST: dict[str, str] = {
    "demo-api.kalshi.co": "external-api-ws.demo.kalshi.co",
    "api.elections.kalshi.com": "external-api-ws.kalshi.com",
}


def _rest_host() -> str:
    base = _trade_api_base() or DEFAULT_KALSHI_BASE
    return urlparse(base).netloc or "demo-api.kalshi.co"


def kalshi_ws_url() -> str:
    """Map ``KALSHI_TRADE_API_BASE`` host to the Kalshi WebSocket endpoint."""
    host = _rest_host()
    ws_host = _WS_HOST_BY_REST_HOST.get(host)
    if not ws_host:
        if "demo" in host:
            ws_host = "external-api-ws.demo.kalshi.co"
        else:
            ws_host = "external-api-ws.kalshi.com"
    return f"wss://{ws_host}{WS_SIGN_PATH}"


def _ws_auth_headers() -> dict[str, str] | None:
    key_id = os.getenv("KALSHI_API_KEY_ID", "").strip()
    pem = _load_private_key_pem()
    if not key_id or not pem:
        return None
    from kalshi_python_sync.auth import KalshiAuth

    auth = KalshiAuth(key_id, pem)
    return auth.create_auth_headers("GET", WS_SIGN_PATH)


def _best_from_orderbook_payload(data: dict[str, Any]) -> dict[str, Any]:
    """Extract top-of-book from REST ``/orderbook`` JSON."""
    ob = data.get("orderbook") if isinstance(data.get("orderbook"), dict) else data
    yes_levels = ob.get("yes") or ob.get("yes_dollars") or []
    no_levels = ob.get("no") or ob.get("no_dollars") or []

    def _top(levels: Any) -> float | None:
        if not levels or not isinstance(levels, list):
            return None
        first = levels[0]
        if isinstance(first, (list, tuple)) and first:
            try:
                return float(first[0])
            except (TypeError, ValueError):
                return None
        return None

    yes_bid = _top(yes_levels)
    no_bid = _top(no_levels)
    yes_ask: float | None = None
    if no_bid is not None:
        if no_bid <= 1.0:
            yes_ask = round(1.0 - no_bid, 4)
        else:
            yes_ask = round((100.0 - no_bid) / 100.0, 4)
    out: dict[str, Any] = {
        "yes_bid_dollars": yes_bid,
        "yes_ask_dollars": yes_ask,
    }
    if yes_bid is not None and yes_ask is not None:
        out["spread_dollars"] = round(yes_ask - yes_bid, 4)
    return out


def _rest_live_snapshot(market_ticker: str) -> dict[str, Any]:
    raw = kalshi_get_orderbook(market_ticker)
    try:
        data = json.loads(raw)
    except json.JSONDecodeError as exc:
        return {
            "market_ticker": market_ticker,
            "source": "rest_orderbook",
            "error": f"invalid orderbook JSON: {exc}",
        }
    if isinstance(data, dict) and data.get("error"):
        return {
            "market_ticker": market_ticker,
            "source": "rest_orderbook",
            **data,
        }
    quote = _best_from_orderbook_payload(data if isinstance(data, dict) else {})
    return {
        "market_ticker": market_ticker,
        "source": "rest_orderbook",
        "updates_collected": 1,
        **quote,
    }


async def _ws_live_snapshot(
    market_ticker: str,
    *,
    max_wait_seconds: float,
    max_updates: int,
) -> dict[str, Any]:
    headers = _ws_auth_headers()
    if not headers:
        return {
            "market_ticker": market_ticker,
            "source": "websocket",
            "error": "Kalshi API credentials not configured for WebSocket",
            "hint": (
                "Set KALSHI_API_KEY_ID and KALSHI_PRIVATE_KEY_PATH; "
                "falls back to REST orderbook when WS is unavailable."
            ),
        }

    if websockets is None:
        return {
            "market_ticker": market_ticker,
            "source": "websocket",
            "error": "websockets package not installed",
        }

    ticker = market_ticker.strip()
    ws_url = kalshi_ws_url()
    deadline = time.monotonic() + max_wait_seconds
    latest: dict[str, Any] | None = None
    updates = 0
    errors: list[str] = []

    async with websockets.connect(
        ws_url,
        additional_headers=headers,
        open_timeout=min(3.0, max_wait_seconds),
        close_timeout=1.0,
    ) as websocket:
        sub = {
            "id": 1,
            "cmd": "subscribe",
            "params": {
                "channels": ["ticker"],
                "market_ticker": ticker,
                "send_initial_snapshot": True,
            },
        }
        await websocket.send(json.dumps(sub))

        while time.monotonic() < deadline and updates < max_updates:
            remaining = deadline - time.monotonic()
            if remaining <= 0:
                break
            try:
                raw = await asyncio.wait_for(websocket.recv(), timeout=remaining)
            except asyncio.TimeoutError:
                break
            try:
                data = json.loads(raw)
            except json.JSONDecodeError:
                continue
            msg_type = data.get("type")
            if msg_type == "error":
                err = data.get("msg") or data
                errors.append(str(err))
                continue
            if msg_type != "ticker":
                continue
            msg = data.get("msg") or {}
            if msg.get("market_ticker") != ticker:
                continue
            latest = {
                "market_ticker": ticker,
                "source": "websocket_ticker",
                "yes_bid_dollars": msg.get("yes_bid_dollars"),
                "yes_ask_dollars": msg.get("yes_ask_dollars"),
                "price_dollars": msg.get("price_dollars"),
                "volume": msg.get("volume"),
                "open_interest": msg.get("open_interest"),
            }
            updates += 1

    if latest is None:
        out: dict[str, Any] = {
            "market_ticker": ticker,
            "source": "websocket_ticker",
            "updates_collected": 0,
            "error": "no ticker updates received before timeout",
        }
        if errors:
            out["ws_errors"] = errors[:3]
        return out
    latest["updates_collected"] = updates
    if errors:
        latest["ws_errors"] = errors[:3]
    return latest


def kalshi_get_live_quote(
    market_ticker: str,
    max_wait_seconds: float = DEFAULT_MAX_WAIT_SECONDS,
    max_updates: int = DEFAULT_MAX_UPDATES,
    prefer_websocket: bool = True,
) -> str:
    """
    Collect a short-lived live quote for a Kalshi market.

    Connects to the Kalshi WebSocket ``ticker`` channel when credentials exist,
    collects up to ``max_updates`` messages or until ``max_wait_seconds`` elapses,
    then returns the latest best bid/ask fields. Without credentials (or on WS
    failure), returns a one-shot REST orderbook top-of-book snapshot.

    Parameters
    ----------
    market_ticker
        Market ticker (e.g. from ``kalshi_search_markets``).
    max_wait_seconds
        Hard cap on wait time (default 2.5s).
    max_updates
        Stop after this many ticker updates (default 3).
    prefer_websocket
        When False, skip WS and use REST orderbook only.

    Returns
    -------
    str
        JSON with ``source``, ``market_ticker``, bid/ask fields, and metadata.
    """
    if not market_ticker or not market_ticker.strip():
        return json.dumps({"error": "market_ticker is required"})
    ticker = market_ticker.strip()
    wait = max(0.5, min(float(max_wait_seconds), 10.0))
    updates = max(1, min(int(max_updates), 20))

    if prefer_websocket and _ws_auth_headers():
        try:
            result = asyncio.run(
                _ws_live_snapshot(
                    ticker,
                    max_wait_seconds=wait,
                    max_updates=updates,
                )
            )
        except Exception as exc:
            logger.warning("Kalshi WS live quote failed: {}", exc)
            result = {
                "market_ticker": ticker,
                "source": "websocket_ticker",
                "error": str(exc),
            }
        if result.get("updates_collected", 0) > 0 and not result.get("error"):
            return json.dumps(result)
        rest = _rest_live_snapshot(ticker)
        rest["ws_fallback"] = result
        return json.dumps(rest)

    return json.dumps(_rest_live_snapshot(ticker))
