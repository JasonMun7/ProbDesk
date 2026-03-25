"""
ADK tools: load trained tactical Q-policy and return JSON execution plan.

Set ``TACTICAL_POLICY_PATH`` to override ``models/tactical_policy.pt``.
"""

from __future__ import annotations

import json
from pathlib import Path

from loguru import logger

from prob_desk.execution.rollout import default_weights_path, greedy_rollout, load_q_network
from prob_desk.execution.schemas import PolicyPlanResult, TargetIntent

_q_cache: dict[str, object] = {}


def _get_q(path: Path):
    key = str(path.resolve())
    if key not in _q_cache:
        _q_cache[key] = load_q_network(path)
    return _q_cache[key]


def suggest_execution_plan(intent_json: str) -> str:
    """
    Run greedy tactical policy on a ``TargetIntent`` JSON string.

    Parameters
    ----------
    intent_json
        JSON object with fields: market_ticker, side, target_net_contracts,
        horizon_steps (optional), risk_budget_cents (optional), regime_tag (optional).

    Returns
    -------
    str
        JSON string: ``PolicyPlanResult`` with steps, rewards, and shortfall metrics;
        or ``ok: false`` with error message if validation or weights fail.
    """
    try:
        intent = TargetIntent.model_validate_json(intent_json)
    except Exception as e:
        out = PolicyPlanResult(
            ok=False,
            error=f"Invalid TargetIntent JSON: {e}",
        )
        return out.model_dump_json()

    path = default_weights_path()
    if not path.is_file():
        msg = (
            f"No tactical policy weights at {path}. "
            "Run: python scripts/execution/train_tactical_policy.py"
        )
        logger.warning(msg)
        out = PolicyPlanResult(ok=False, error=msg, intent=intent)
        return out.model_dump_json()

    try:
        q = _get_q(path)
        result = greedy_rollout(intent, q)
        return result.model_dump_json()
    except Exception as e:
        logger.exception("suggest_execution_plan failed")
        out = PolicyPlanResult(ok=False, error=str(e), intent=intent)
        return out.model_dump_json()


def suggest_execution_plan_status() -> str:
    """Return whether weights are loaded and path (for debugging)."""
    path = default_weights_path()
    ok = path.is_file()
    return json.dumps(
        {
            "weights_path": str(path),
            "weights_present": ok,
        }
    )


TACTICAL_POLICY_TOOLS = [
    suggest_execution_plan,
    suggest_execution_plan_status,
]

__all__ = [
    "TACTICAL_POLICY_TOOLS",
    "suggest_execution_plan",
    "suggest_execution_plan_status",
]
