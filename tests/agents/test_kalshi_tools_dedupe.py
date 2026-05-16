"""Kalshi ADK tool lists must not register duplicate Gemini function names."""

from prob_desk.agents.tools import KALSHI_TOOLS, KALSHI_TOOLS_READ


def _tool_names(tools: list) -> list[str]:
    return [getattr(t, "__name__", repr(t)) for t in tools]


def test_kalshi_tools_read_has_unique_names():
    names = _tool_names(KALSHI_TOOLS_READ)
    assert len(names) == len(set(names))


def test_kalshi_search_markets_once_in_read_tools():
    names = _tool_names(KALSHI_TOOLS_READ)
    assert names.count("kalshi_search_markets") == 1


def test_kalshi_tools_has_unique_names():
    names = _tool_names(KALSHI_TOOLS)
    assert len(names) == len(set(names))
