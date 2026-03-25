"""ADK session and model defaults for Prob Desk."""

from __future__ import annotations

import os
from datetime import datetime

GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

APP_NAME = "prob_desk"
DEFAULT_USER_ID = "local_user"

_NOW = datetime.now()
_DATE_TIME_LINE = _NOW.strftime("%A, %B %d, %Y at %H:%M")
if _NOW.tzinfo:
    _DATE_TIME_LINE += f" {_NOW.tzname() or ''}"

SYSTEM_CONTEXT_SUFFIX = (
    f"\n\nCurrent date and time (use this as now): "
    f"{_DATE_TIME_LINE.strip()}"
)
