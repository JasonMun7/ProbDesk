from google.adk.agents import LlmAgent

from prob_desk.agents.runtime_settings import GEMINI_MODEL, SYSTEM_CONTEXT_SUFFIX
from prob_desk.agents.prompts import SENTIMENT_PROMPT

sentiment_agent = LlmAgent(
    name="sentiment_agent",
    model=GEMINI_MODEL,
    description=(
        "Qualitative sentiment and themes from the given task only (no web). "
        "Route here for narrative / perception analysis without market data APIs."
    ),
    instruction=SENTIMENT_PROMPT + SYSTEM_CONTEXT_SUFFIX,
    tools=[],
)
