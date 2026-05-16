from google.adk.agents import LlmAgent
from google.adk.tools import google_search

from prob_desk.agents.runtime_settings import GEMINI_MODEL, SYSTEM_CONTEXT_SUFFIX
from prob_desk.agents.prompts import SENTIMENT_PROMPT

sentiment_agent = LlmAgent(
    name="sentiment_agent",
    model=GEMINI_MODEL,
    description=(
        "Qualitative sentiment and recent news via Google Search (Gemini grounding). "
        "Route here for narrative / perception analysis on an event or market."
    ),
    instruction=SENTIMENT_PROMPT + SYSTEM_CONTEXT_SUFFIX,
    tools=[google_search],
)
