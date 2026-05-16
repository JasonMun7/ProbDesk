from google.adk.agents import LlmAgent

from prob_desk.agents.tools import KALSHI_PUBLIC_TOOLS, KALSHI_SDK_PORTFOLIO_TOOLS
from prob_desk.agents.runtime_settings import GEMINI_MODEL, SYSTEM_CONTEXT_SUFFIX
from prob_desk.agents.prompts import RISK_PROMPT

risk_agent = LlmAgent(
    name="risk_manager",
    model=GEMINI_MODEL,
    description=(
        "Desk/portfolio risk from live Kalshi balance and positions, or trade-level "
        "sizing, drawdown, exposure, and resolution risk."
    ),
    instruction=RISK_PROMPT.strip()
    + "\n\nFor desk/portfolio summaries, use live Kalshi portfolio tools and report "
    "exposure, concentration, and event risks. For trade requests with thesis/quant "
    "context, also include: recommended position size, max drawdown, market risk "
    "exposure, and overall risk score.\n"
    + "\nFor Kalshi contracts, include resolution/settlement and liquidity risk.\n"
    + SYSTEM_CONTEXT_SUFFIX,
    tools=list(KALSHI_PUBLIC_TOOLS) + list(KALSHI_SDK_PORTFOLIO_TOOLS),
)
