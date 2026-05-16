"""AgentPhone MCP wiring — graceful when AGENTPHONE_API_KEY is unset."""

import os

import pytest


def test_get_agentphone_toolset_without_key(monkeypatch):
    monkeypatch.delenv("AGENTPHONE_API_KEY", raising=False)
    from prob_desk.agents.tools.agentphone_mcp import get_agentphone_toolset

    assert get_agentphone_toolset() is None


def test_get_agentphone_toolset_with_key(monkeypatch):
    monkeypatch.setenv("AGENTPHONE_API_KEY", "sk_live_test_placeholder")
    from prob_desk.agents.tools.agentphone_mcp import (
        AGENTPHONE_MCP_URL,
        get_agentphone_toolset,
    )
    from google.adk.tools.mcp_tool import McpToolset, StreamableHTTPConnectionParams

    toolset = get_agentphone_toolset()
    assert isinstance(toolset, McpToolset)
    params = toolset._mcp_session_manager._connection_params  # noqa: SLF001 — test wiring
    assert isinstance(params, StreamableHTTPConnectionParams)
    assert params.url == AGENTPHONE_MCP_URL
    assert params.headers["Authorization"] == "Bearer sk_live_test_placeholder"
    assert params.timeout == 30.0


def test_director_tools_build_without_agentphone(monkeypatch):
    """Mirrors ``root_agent.py`` tool list when AGENTPHONE_API_KEY is unset."""
    monkeypatch.delenv("AGENTPHONE_API_KEY", raising=False)

    from google.adk.tools.mcp_tool import McpToolset

    from prob_desk.agents.tools import KALSHI_TOOLS_READ
    from prob_desk.agents.tools.agentphone_mcp import get_agentphone_toolset

    tools: list = list(KALSHI_TOOLS_READ)
    agentphone = get_agentphone_toolset()
    if agentphone is not None:
        tools.append(agentphone)

    assert get_agentphone_toolset() is None
    assert not any(isinstance(t, McpToolset) for t in tools)
    assert len(tools) == len(KALSHI_TOOLS_READ)
