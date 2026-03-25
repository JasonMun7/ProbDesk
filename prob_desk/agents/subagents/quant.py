from google.adk.agents import LlmAgent

from prob_desk.agents.tools import KALSHI_TOOLS_READ
from prob_desk.agents.runtime_settings import GEMINI_MODEL, SYSTEM_CONTEXT_SUFFIX
from prob_desk.agents.prompts import QUANT_PROMPT

quant_agent = LlmAgent(
    name="quant_analyst",
    model=GEMINI_MODEL,
    description=(
        "Quantitative analysis and Kalshi market data (order books, markets, series). "
        "Route here for scores, levels, and probability-style reasoning with tools."
    ),
    instruction=QUANT_PROMPT.strip()
    + "\n\nWhen you receive a message, it will contain:\nStock and Thesis from your Director.\n\nGenerate quantitative analysis with: ticker, technical_score (0-1), volume_score (0-1), trend_strength (0-1), volatility, probability_score (0-1), key_levels (support, resistance, pivot)."
    + SYSTEM_CONTEXT_SUFFIX,
    tools=list(KALSHI_TOOLS_READ),
)
