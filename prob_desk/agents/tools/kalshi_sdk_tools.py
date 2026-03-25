"""
ADK tools wrapping the official Kalshi sync SDK (portfolio, markets, orders).

Each tool returns a JSON string. On missing credentials or API errors, returns a
JSON object with ``error`` (and optional ``body`` / ``status``).
"""

from __future__ import annotations

import json
import traceback
from typing import Any

from loguru import logger

from prob_desk.agents.tools.kalshi_sdk_client import get_kalshi_client

from kalshi_python_sync.exceptions import ApiException


def _auth_error_json() -> str:
    return json.dumps(
        {
            "error": "Kalshi API credentials not configured",
            "hint": (
                "Set KALSHI_API_KEY_ID and KALSHI_PRIVATE_KEY_PATH "
                "(or KALSHI_PRIVATE_KEY_PEM). Default base is demo; see .env.example."
            ),
        }
    )


def _dump(obj: Any) -> Any:
    if obj is None:
        return None
    if hasattr(obj, "model_dump"):
        return obj.model_dump(by_alias=True, exclude_none=False)
    if isinstance(obj, (list, tuple)):
        return [_dump(x) for x in obj]
    if isinstance(obj, dict):
        return {k: _dump(v) for k, v in obj.items()}
    if isinstance(obj, (str, int, float, bool)):
        return obj
    return str(obj)


def _ok(data: Any) -> str:
    return json.dumps(_dump(data))


def _api_err(exc: BaseException) -> str:
    out: dict[str, Any] = {"error": str(exc)}
    if isinstance(exc, ApiException):
        status = getattr(exc, "status", None)
        body = getattr(exc, "body", None)
        if status is not None:
            out["status"] = status
        if body is not None:
            out["body"] = body
    logger.error("Kalshi SDK error: {}\n{}", exc, traceback.format_exc())
    return json.dumps(out)


def kalshi_sdk_get_balance() -> str:
    """Return account balance and portfolio value (cents) via authenticated API."""
    client = get_kalshi_client()
    if client is None:
        return _auth_error_json()
    try:
        return _ok(client.get_balance())
    except Exception as e:  # noqa: BLE001
        return _api_err(e)


def kalshi_sdk_get_positions(
    ticker: str = "",
    event_ticker: str = "",
    count_limit: int = 100,
    cursor: str = "",
) -> str:
    """
    List portfolio positions (paginated). Omit filters to list broadly.

    Parameters
    ----------
    ticker
        Filter by market ticker (optional).
    event_ticker
        Filter by event ticker (optional).
    count_limit
        Page size (SDK default 100).
    cursor
        Pagination cursor from a previous response.
    """
    client = get_kalshi_client()
    if client is None:
        return _auth_error_json()
    try:
        kwargs: dict[str, Any] = {}
        if ticker.strip():
            kwargs["ticker"] = ticker.strip()
        if event_ticker.strip():
            kwargs["event_ticker"] = event_ticker.strip()
        if count_limit and count_limit > 0:
            kwargs["limit"] = min(count_limit, 1000)
        if cursor.strip():
            kwargs["cursor"] = cursor.strip()
        return _ok(client.get_positions(**kwargs))
    except Exception as e:  # noqa: BLE001
        return _api_err(e)


def kalshi_sdk_get_orders(
    ticker: str = "",
    event_ticker: str = "",
    status: str = "",
    count_limit: int = 100,
    cursor: str = "",
) -> str:
    """List orders (resting / canceled / executed filters per API)."""
    client = get_kalshi_client()
    if client is None:
        return _auth_error_json()
    try:
        kwargs: dict[str, Any] = {}
        if ticker.strip():
            kwargs["ticker"] = ticker.strip()
        if event_ticker.strip():
            kwargs["event_ticker"] = event_ticker.strip()
        if status.strip():
            kwargs["status"] = status.strip()
        if count_limit and count_limit > 0:
            kwargs["limit"] = min(count_limit, 200)
        if cursor.strip():
            kwargs["cursor"] = cursor.strip()
        return _ok(client.get_orders(**kwargs))
    except Exception as e:  # noqa: BLE001
        return _api_err(e)


def kalshi_sdk_get_markets(
    series_ticker: str = "",
    status: str = "open",
    limit: int = 50,
    cursor: str = "",
) -> str:
    """List markets via SDK (authenticated). Same general use as public ``kalshi_get_markets``."""
    client = get_kalshi_client()
    if client is None:
        return _auth_error_json()
    try:
        kwargs: dict[str, Any] = {}
        if series_ticker.strip():
            kwargs["series_ticker"] = series_ticker.strip()
        if status.strip():
            kwargs["status"] = status.strip()
        if limit and limit > 0:
            kwargs["limit"] = min(limit, 1000)
        if cursor.strip():
            kwargs["cursor"] = cursor.strip()
        return _ok(client.get_markets(**kwargs))
    except Exception as e:  # noqa: BLE001
        return _api_err(e)


def kalshi_sdk_get_market(market_ticker: str) -> str:
    """Single market by ticker (SDK)."""
    client = get_kalshi_client()
    if client is None:
        return _auth_error_json()
    if not market_ticker.strip():
        return json.dumps({"error": "market_ticker is empty"})
    try:
        return _ok(client.get_market(market_ticker.strip()))
    except Exception as e:  # noqa: BLE001
        return _api_err(e)


def kalshi_sdk_get_market_orderbook(market_ticker: str) -> str:
    """Order book for a market (SDK)."""
    client = get_kalshi_client()
    if client is None:
        return _auth_error_json()
    if not market_ticker.strip():
        return json.dumps({"error": "market_ticker is empty"})
    try:
        return _ok(client.get_market_orderbook(market_ticker.strip()))
    except Exception as e:  # noqa: BLE001
        return _api_err(e)


def kalshi_sdk_get_series(series_ticker: str) -> str:
    """Series metadata (SDK)."""
    client = get_kalshi_client()
    if client is None:
        return _auth_error_json()
    if not series_ticker.strip():
        return json.dumps({"error": "series_ticker is empty"})
    try:
        return _ok(client.get_series(series_ticker.strip()))
    except Exception as e:  # noqa: BLE001
        return _api_err(e)


def kalshi_sdk_get_event(event_ticker: str) -> str:
    """Single event by ticker (SDK)."""
    client = get_kalshi_client()
    if client is None:
        return _auth_error_json()
    if not event_ticker.strip():
        return json.dumps({"error": "event_ticker is empty"})
    try:
        return _ok(client.get_event(event_ticker.strip()))
    except Exception as e:  # noqa: BLE001
        return _api_err(e)


def kalshi_sdk_create_order(
    ticker: str,
    side: str,
    action: str,
    count: int,
    order_type: str = "limit",
    yes_price: int = 0,
    no_price: int = 0,
    time_in_force: str = "",
    client_order_id: str = "",
) -> str:
    """
    Create an order (authenticated). Prices are in cents where applicable.

    Parameters
    ----------
    ticker
        Market ticker.
    side
        ``yes`` or ``no``.
    action
        ``buy`` or ``sell``.
    count
        Number of contracts (>= 1).
    order_type
        ``limit`` or ``market``.
    yes_price / no_price
        For limits, set the relevant price 1–99; use 0 to omit.
    time_in_force
        Optional: ``fill_or_kill``, ``good_till_canceled``, ``immediate_or_cancel``.
    client_order_id
        Optional idempotency / tracking string.
    """
    client = get_kalshi_client()
    if client is None:
        return _auth_error_json()
    try:
        kwargs: dict[str, Any] = {
            "ticker": ticker.strip(),
            "side": side.strip().lower(),
            "action": action.strip().lower(),
            "count": int(count),
            "type": order_type.strip().lower() or "limit",
        }
        if yes_price and yes_price > 0:
            kwargs["yes_price"] = yes_price
        if no_price and no_price > 0:
            kwargs["no_price"] = no_price
        if time_in_force.strip():
            kwargs["time_in_force"] = time_in_force.strip()
        if client_order_id.strip():
            kwargs["client_order_id"] = client_order_id.strip()
        return _ok(client.create_order(**kwargs))
    except Exception as e:  # noqa: BLE001
        return _api_err(e)


def kalshi_sdk_cancel_order(order_id: str) -> str:
    """Cancel an order by exchange order id."""
    client = get_kalshi_client()
    if client is None:
        return _auth_error_json()
    if not order_id.strip():
        return json.dumps({"error": "order_id is empty"})
    try:
        return _ok(client.cancel_order(order_id.strip()))
    except Exception as e:  # noqa: BLE001
        return _api_err(e)


KALSHI_SDK_PORTFOLIO_TOOLS = [
    kalshi_sdk_get_balance,
    kalshi_sdk_get_positions,
    kalshi_sdk_get_orders,
]

KALSHI_SDK_MARKET_TOOLS = [
    kalshi_sdk_get_markets,
    kalshi_sdk_get_market,
    kalshi_sdk_get_market_orderbook,
    kalshi_sdk_get_series,
    kalshi_sdk_get_event,
]

KALSHI_SDK_ORDER_TOOLS = [
    kalshi_sdk_create_order,
    kalshi_sdk_cancel_order,
]

KALSHI_SDK_TOOLS = (
    KALSHI_SDK_PORTFOLIO_TOOLS
    + KALSHI_SDK_MARKET_TOOLS
    + KALSHI_SDK_ORDER_TOOLS
)

__all__ = [
    "KALSHI_SDK_MARKET_TOOLS",
    "KALSHI_SDK_ORDER_TOOLS",
    "KALSHI_SDK_PORTFOLIO_TOOLS",
    "KALSHI_SDK_TOOLS",
    "kalshi_sdk_cancel_order",
    "kalshi_sdk_create_order",
    "kalshi_sdk_get_balance",
    "kalshi_sdk_get_event",
    "kalshi_sdk_get_market",
    "kalshi_sdk_get_market_orderbook",
    "kalshi_sdk_get_markets",
    "kalshi_sdk_get_orders",
    "kalshi_sdk_get_positions",
    "kalshi_sdk_get_series",
]
