from google.adk.agents import LlmAgent

from prob_desk.agents.tools import KALSHI_TOOLS, TACTICAL_POLICY_TOOLS
from prob_desk.agents.runtime_settings import GEMINI_MODEL, SYSTEM_CONTEXT_SUFFIX
from prob_desk.agents.prompts import EXECUTION_PROMPT

execution_agent = LlmAgent(
    name="execution_agent",
    model=GEMINI_MODEL,
    description=(
        "Concrete Kalshi order parameters using suggest_execution_plan (RL) + Kalshi public "
        "HTTP tools + authenticated SDK (portfolio, markets, create/cancel orders), "
        "then grounded explanation. Use for actionable execution-style output."
    ),
    instruction=EXECUTION_PROMPT.strip()
    + "\n\nUpstream context may include thesis and risk; still call tools for numbers.\n"
    + SYSTEM_CONTEXT_SUFFIX,
    tools=list(KALSHI_TOOLS) + list(TACTICAL_POLICY_TOOLS),
)
