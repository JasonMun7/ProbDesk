"""
Root ADK ``LlmAgent`` for Prob Desk.

- **Runner / code** uses the Python name ``root_agent`` (what you pass to ``Runner``).
- **ADK agent name** is ``trading_director`` (``LlmAgent.name``); subagents use
  ``transfer_to_agent(agent_name=...)`` with that tree.

See ``docs/adk-agents-architecture.md`` for hierarchy and agent roles.
"""

from google.adk.agents import LlmAgent

from prob_desk.agents.prompts import (
    DELEGATION_MARKDOWN,
    DIRECTOR_PROMPT,
    GLOBAL_INSTRUCTION,
)
from prob_desk.agents.runtime_settings import (
    APP_NAME,
    DEFAULT_USER_ID,
    GEMINI_MODEL,
    SYSTEM_CONTEXT_SUFFIX,
)
from prob_desk.agents.subagents import (
    execution_agent,
    quant_agent,
    risk_agent,
    sentiment_agent,
)
from prob_desk.agents.tools import KALSHI_TOOLS_READ

_DIRECTOR_INSTRUCTION = (
    DIRECTOR_PROMPT + SYSTEM_CONTEXT_SUFFIX + "\n\n" + DELEGATION_MARKDOWN
)

root_agent = LlmAgent(
    name="trading_director",
    model=GEMINI_MODEL,
    description=(
        "Orchestrates Kalshi event-market analysis: delegates to quant, risk, "
        "execution, and sentiment sub-agents via ADK transfer; uses Kalshi tools."
    ),
    instruction=_DIRECTOR_INSTRUCTION,
    global_instruction=GLOBAL_INSTRUCTION,
    sub_agents=[
        quant_agent,
        risk_agent,
        execution_agent,
        sentiment_agent,
    ],
    tools=list(KALSHI_TOOLS_READ),
)

__all__ = [
    "APP_NAME",
    "DEFAULT_USER_ID",
    "GEMINI_MODEL",
    "execution_agent",
    "quant_agent",
    "risk_agent",
    "root_agent",
    "sentiment_agent",
]
