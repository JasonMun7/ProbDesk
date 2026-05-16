"""Desk settings file resolution for AgentPhone agent ID."""

from __future__ import annotations

import json

from prob_desk.desk_settings import (
    load_desk_settings,
    resolve_agentphone_agent_id,
)


def test_resolve_agentphone_agent_id_from_file(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    settings_dir = tmp_path / ".prob-desk"
    settings_dir.mkdir()
    (settings_dir / "desk-settings.json").write_text(
        json.dumps({"agentphoneAgentId": "agt_test_123"}),
        encoding="utf-8",
    )
    monkeypatch.delenv("AGENTPHONE_AGENT_ID", raising=False)

    assert resolve_agentphone_agent_id() == "agt_test_123"
    assert load_desk_settings()["agentphoneAgentId"] == "agt_test_123"


def test_resolve_agentphone_agent_id_env_wins(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    settings_dir = tmp_path / ".prob-desk"
    settings_dir.mkdir()
    (settings_dir / "desk-settings.json").write_text(
        json.dumps({"agentphoneAgentId": "agt_file"}),
        encoding="utf-8",
    )
    monkeypatch.setenv("AGENTPHONE_AGENT_ID", "agt_env")

    assert resolve_agentphone_agent_id() == "agt_env"
