from google.adk.agents import LlmAgent

from prob_desk.agents.tools import KALSHI_PUBLIC_TOOLS, KALSHI_SDK_PORTFOLIO_TOOLS
from prob_desk.agents.runtime_settings import GEMINI_MODEL, SYSTEM_CONTEXT_SUFFIX
from prob_desk.agents.prompts import RISK_PROMPT

risk_agent = LlmAgent(
    name="risk_manager",
    model=GEMINI_MODEL,
    description=(
        "Risk sizing, drawdown, exposure, and event-resolution risk for Kalshi "
        "contracts. Route here after thesis and quant context exist."
    ),
    instruction=RISK_PROMPT.strip()
    + "\n\nWhen you receive a message, it will contain:\nStock, Thesis, Quant Analysis.\n\nProvide risk assessment including:\n1. Recommended position size\n2. Maximum drawdown risk\n3. Market risk exposure\n4. Overall risk score\n"
    + "\nFor Kalshi contracts, include resolution/settlement and liquidity risk.\n"
    + SYSTEM_CONTEXT_SUFFIX,
    tools=list(KALSHI_PUBLIC_TOOLS) + list(KALSHI_SDK_PORTFOLIO_TOOLS),
)
