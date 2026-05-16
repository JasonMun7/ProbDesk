"""Optional AgentPhone MCP tools (voice/SMS) for the trading director."""

from __future__ import annotations

import os

from google.adk.tools.mcp_tool import McpToolset, StreamableHTTPConnectionParams

AGENTPHONE_MCP_URL = "https://mcp.agentphone.to/mcp"
AGENTPHONE_CONNECT_TIMEOUT_S = 30.0


def _agentphone_api_key() -> str | None:
    key = (os.getenv("AGENTPHONE_API_KEY") or "").strip()
    return key or None


def get_agentphone_toolset() -> McpToolset | None:
    """Return AgentPhone ``McpToolset`` when ``AGENTPHONE_API_KEY`` is set; else ``None``."""
    api_key = _agentphone_api_key()
    if not api_key:
        return None
    return McpToolset(
        connection_params=StreamableHTTPConnectionParams(
            url=AGENTPHONE_MCP_URL,
            headers={"Authorization": f"Bearer {api_key}"},
            timeout=AGENTPHONE_CONNECT_TIMEOUT_S,
        ),
    )
