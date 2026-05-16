"""
ADK Web entry point.

From the repo root (after ``pip install -e .`` and ``.env`` with ``GOOGLE_API_KEY``):

    adk web prob_desk --port 8501

Use a port other than **8000** when the CopilotKit AG-UI backend is running.
"""

from prob_desk.agents.adk_app import app
from prob_desk.agents.root_agent import root_agent

__all__ = ["app", "root_agent"]
