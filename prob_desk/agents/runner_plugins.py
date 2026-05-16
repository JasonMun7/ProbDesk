"""ADK Runner plugins for Prob Desk (tool retry / reflection)."""

from __future__ import annotations

import json
import re
from typing import Any, Optional

from google.adk.plugins.reflect_retry_tool_plugin import ReflectAndRetryToolPlugin
from google.adk.tools.base_tool import BaseTool
from google.adk.tools.tool_context import ToolContext

_HTTP_STATUS_RE = re.compile(r"\bstatus['\"]?\s*[:=]\s*(\d{3})\b", re.I)
_TRANSIENT_HTTP_CODES = frozenset({408, 429, 500, 502, 503, 504})


def _parse_tool_payload(result: Any) -> dict[str, Any] | None:
    if isinstance(result, dict):
        return result
    if isinstance(result, str):
        text = result.strip()
        if not text or text[0] not in "{[":
            return None
        try:
            parsed = json.loads(text)
        except json.JSONDecodeError:
            return None
        return parsed if isinstance(parsed, dict) else None
    return None


def _is_transient_kalshi_error(payload: dict[str, Any]) -> bool:
    if not payload.get("error"):
        return False
    status = payload.get("status")
    if isinstance(status, int) and status in _TRANSIENT_HTTP_CODES:
        return True
    err = str(payload.get("error", "")).lower()
    if any(
        token in err
        for token in (
            "timeout",
            "timed out",
            "connection",
            "temporarily",
            "503",
            "502",
            "500",
            "504",
        )
    ):
        return True
    match = _HTTP_STATUS_RE.search(str(payload))
    if match and int(match.group(1)) in _TRANSIENT_HTTP_CODES:
        return True
    return False


class ProbDeskReflectAndRetryPlugin(ReflectAndRetryToolPlugin):
    """Retry Kalshi tool failures (HTTP timeouts, 5xx, JSON ``error`` payloads)."""

    async def extract_error_from_result(
        self,
        *,
        tool: BaseTool,
        tool_args: dict[str, Any],
        tool_context: ToolContext,
        result: Any,
    ) -> Optional[dict[str, Any]]:
        del tool_args, tool_context
        if not tool.name.startswith("kalshi"):
            return None
        payload = _parse_tool_payload(result)
        if payload and _is_transient_kalshi_error(payload):
            return payload
        return None


def default_runner_plugins() -> list[ReflectAndRetryToolPlugin]:
    """Plugins wired into :class:`google.adk.runners.Runner` / ``App``."""
    return [ProbDeskReflectAndRetryPlugin(max_retries=3)]
