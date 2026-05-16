"""User desk settings persisted under ``.prob-desk/`` (gitignored)."""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any

_SETTINGS_DIR = ".prob-desk"
_SETTINGS_FILE = "desk-settings.json"


def _repo_root() -> Path:
    cwd = Path(os.getcwd()).resolve()
    for parent in [cwd, *cwd.parents]:
        if (parent / ".env").is_file() or (parent / "pyproject.toml").is_file():
            return parent
    return cwd


def _settings_path() -> Path:
    return _repo_root() / _SETTINGS_DIR / _SETTINGS_FILE


def load_desk_settings() -> dict[str, Any]:
    path = _settings_path()
    if not path.is_file():
        return {}
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        return data if isinstance(data, dict) else {}
    except (OSError, json.JSONDecodeError):
        return {}


def resolve_agentphone_agent_id() -> str | None:
    """``AGENTPHONE_AGENT_ID`` env wins over ``.prob-desk/desk-settings.json``."""
    from_env = (os.getenv("AGENTPHONE_AGENT_ID") or "").strip()
    if from_env:
        return from_env
    from_file = (load_desk_settings().get("agentphoneAgentId") or "").strip()
    return from_file or None


def apply_desk_settings_to_env() -> None:
    """Mirror UI-persisted agent ID into env when not set in ``.env``."""
    if (os.getenv("AGENTPHONE_AGENT_ID") or "").strip():
        return
    agent_id = resolve_agentphone_agent_id()
    if agent_id:
        os.environ.setdefault("AGENTPHONE_AGENT_ID", agent_id)
