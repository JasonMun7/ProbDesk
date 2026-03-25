"""Optional JSONL replay loader for mid/spread paths (v2)."""

from __future__ import annotations

import json
from pathlib import Path

from prob_desk.execution.schemas import ReplayRecord


def load_replay_records(path: Path) -> list[ReplayRecord]:
    """Load one JSONL file: one JSON object per line with t, mid_cents, spread_cents."""
    rows: list[ReplayRecord] = []
    text = path.read_text(encoding="utf-8").strip()
    if not text:
        return rows
    for line in text.splitlines():
        line = line.strip()
        if not line:
            continue
        obj = json.loads(line)
        rows.append(ReplayRecord.model_validate(obj))
    return rows
