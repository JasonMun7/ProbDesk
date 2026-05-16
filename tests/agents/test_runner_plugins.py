"""Tests for Prob Desk ADK reflect-and-retry plugin."""

from __future__ import annotations

import json

import pytest

from prob_desk.agents.runner_plugins import (
    ProbDeskReflectAndRetryPlugin,
    _is_transient_kalshi_error,
    _parse_tool_payload,
)


@pytest.mark.parametrize(
    ("raw", "expect_error"),
    [
        ('{"error": "timeout", "path": "/markets"}', True),
        ('{"error": "bad request", "status": 400}', False),
        ('{"error": "upstream", "status": 503}', True),
        ("not json", False),
    ],
)
def test_transient_kalshi_errors(raw: str, expect_error: bool) -> None:
    payload = _parse_tool_payload(raw)
    if payload is None:
        assert expect_error is False
        return
    assert _is_transient_kalshi_error(payload) is expect_error


@pytest.mark.asyncio
async def test_plugin_extracts_json_error() -> None:
    plugin = ProbDeskReflectAndRetryPlugin(max_retries=1)

    class _Tool:
        name = "kalshi_get_markets"

    result = await plugin.extract_error_from_result(
        tool=_Tool(),
        tool_args={},
        tool_context=None,  # type: ignore[arg-type]
        result=json.dumps({"error": "503 Service Unavailable", "status": 503}),
    )
    assert result is not None
    assert result["status"] == 503
