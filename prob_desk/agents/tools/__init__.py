"""Kalshi HTTP helpers, official SDK tools, and ADK tool lists."""

from prob_desk.agents.tools.kalshi_api import (
    kalshi_get_event,
    kalshi_get_market,
    kalshi_get_markets,
    kalshi_get_orderbook,
    kalshi_get_series,
)
from prob_desk.agents.tools.kalshi_sdk_tools import (
    KALSHI_SDK_MARKET_TOOLS,
    KALSHI_SDK_ORDER_TOOLS,
    KALSHI_SDK_PORTFOLIO_TOOLS,
    KALSHI_SDK_TOOLS,
    kalshi_sdk_cancel_order,
    kalshi_sdk_create_order,
    kalshi_sdk_get_balance,
    kalshi_sdk_get_event,
    kalshi_sdk_get_market,
    kalshi_sdk_get_market_orderbook,
    kalshi_sdk_get_markets,
    kalshi_sdk_get_orders,
    kalshi_sdk_get_positions,
    kalshi_sdk_get_series,
)
from prob_desk.agents.tools.tactical_policy import TACTICAL_POLICY_TOOLS

# Public (httpx) — no API key required.
KALSHI_PUBLIC_TOOLS = [
    kalshi_get_markets,
    kalshi_get_market,
    kalshi_get_orderbook,
    kalshi_get_series,
    kalshi_get_event,
]

# Authenticated reads (portfolio + markets) + public HTTP — for director / quant / risk.
KALSHI_SDK_READ_TOOLS = list(KALSHI_SDK_PORTFOLIO_TOOLS) + list(KALSHI_SDK_MARKET_TOOLS)

KALSHI_TOOLS_READ = list(KALSHI_PUBLIC_TOOLS) + KALSHI_SDK_READ_TOOLS

# Adds create/cancel — for ``execution_agent`` only.
KALSHI_TOOLS = KALSHI_TOOLS_READ + list(KALSHI_SDK_ORDER_TOOLS)

__all__ = [
    "KALSHI_PUBLIC_TOOLS",
    "KALSHI_SDK_MARKET_TOOLS",
    "KALSHI_SDK_ORDER_TOOLS",
    "KALSHI_SDK_PORTFOLIO_TOOLS",
    "KALSHI_SDK_READ_TOOLS",
    "KALSHI_SDK_TOOLS",
    "KALSHI_TOOLS",
    "KALSHI_TOOLS_READ",
    "TACTICAL_POLICY_TOOLS",
    "kalshi_get_event",
    "kalshi_get_market",
    "kalshi_get_markets",
    "kalshi_get_orderbook",
    "kalshi_get_series",
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
