"""ADK ``App`` wrapper for Prob Desk (``adk web`` and programmatic ``Runner``)."""

from __future__ import annotations

from google.adk.apps.app import App

from prob_desk.agents.root_agent import APP_NAME, root_agent
from prob_desk.agents.runner_plugins import default_runner_plugins

app = App(
    name=APP_NAME,
    root_agent=root_agent,
    plugins=default_runner_plugins(),
)

__all__ = ["app"]
