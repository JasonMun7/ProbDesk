"""trading_director tool list — must not mix google_search with Kalshi tools."""

from google.adk.tools import google_search
from google.adk.tools.mcp_tool import McpToolset

from prob_desk.agents.root_agent import root_agent
from prob_desk.agents.tools import KALSHI_TOOLS_READ


def test_director_has_no_google_search():
    tools = root_agent.tools or []
    assert google_search not in tools
    assert len(tools) >= len(KALSHI_TOOLS_READ)


def test_director_kalshi_read_tools_present():
    tools = root_agent.tools or []
    for kalshi_tool in KALSHI_TOOLS_READ:
        assert kalshi_tool in tools


def test_director_agentphone_only_when_configured(monkeypatch):
    monkeypatch.delenv("AGENTPHONE_API_KEY", raising=False)
    # Re-import would cache root_agent; inspect built list via same logic as root_agent.py
    from prob_desk.agents.tools.agentphone_mcp import get_agentphone_toolset

    tools = list(KALSHI_TOOLS_READ)
    agentphone = get_agentphone_toolset()
    if agentphone is not None:
        tools.append(agentphone)
    assert not any(isinstance(t, McpToolset) for t in tools)
