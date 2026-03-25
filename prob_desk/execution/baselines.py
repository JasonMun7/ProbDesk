"""Schedule baselines: TWAP, VWAP-style, heuristics — same env API as policy."""

from __future__ import annotations

from typing import Callable

import numpy as np

from prob_desk.execution.env import ACTION_NAMES, KalshiExecEnv, N_ACTIONS


def action_wait() -> int:
    return 0


def _action_for_delta(desired: int) -> int:
    """Map integer delta to closest discrete action index."""
    if desired == 0:
        return 0
    sign = 1 if desired > 0 else -1
    mag = min(abs(desired), 5)
    if mag >= 5:
        return 2 if sign > 0 else 4
    if mag >= 1:
        return 1 if sign > 0 else 3
    return 0


def run_twap(env: KalshiExecEnv) -> tuple[float, list[dict]]:
    """Equal size each step toward target."""
    env.reset()
    total_r = 0.0
    logs: list[dict] = []
    T = env.horizon
    target = env.target
    for t in range(T):
        rem = target - env.inventory
        steps_left = T - t
        chunk = int(np.sign(rem) * min(abs(rem), max(1, abs(rem) // max(1, steps_left))))
        if chunk == 0 and rem != 0:
            chunk = int(np.sign(rem)) * min(abs(rem), 5)
        a = _action_for_delta(chunk) if chunk != 0 else 0
        step = env.step(a)
        total_r += step.reward
        logs.append({"t": t, "action": ACTION_NAMES[a], **step.info})
        if step.terminated:
            break
    return total_r, logs


def run_vwap_style(
    env: KalshiExecEnv,
    participation: float = 0.25,
) -> tuple[float, list[dict]]:
    """Fixed participation of remaining volume proxy each step."""
    env.reset()
    total_r = 0.0
    logs: list[dict] = []
    T = env.horizon
    target = env.target
    for t in range(T):
        rem = target - env.inventory
        if rem == 0:
            a = 0
        else:
            want = int(np.sign(rem) * max(1, round(abs(rem) * participation)))
            want = int(np.sign(rem) * min(abs(want), min(abs(rem), 5)))
            a = _action_for_delta(want)
        step = env.step(a)
        total_r += step.reward
        logs.append({"t": t, "action": ACTION_NAMES[a], **step.info})
        if step.terminated:
            break
    return total_r, logs


def run_heuristic_passive(env: KalshiExecEnv) -> tuple[float, list[dict]]:
    """Wait when spread wide vs vol; else small passive child."""
    env.reset()
    total_r = 0.0
    logs: list[dict] = []
    T = env.horizon
    target = env.target
    for t in range(T):
        rem = target - env.inventory
        wide = env.spread_cents > 2.5 * env.vol_shock
        if rem == 0:
            a = 0
        elif wide:
            a = 0
        else:
            chunk = int(np.sign(rem) * min(1, abs(rem)))
            a = _action_for_delta(chunk)
        step = env.step(a)
        total_r += step.reward
        logs.append({"t": t, "action": ACTION_NAMES[a], **step.info})
        if step.terminated:
            break
    return total_r, logs


def run_heuristic_aggressive(env: KalshiExecEnv) -> tuple[float, list[dict]]:
    """Cross when inventory error large; else TWAP-like."""
    env.reset()
    total_r = 0.0
    logs: list[dict] = []
    T = env.horizon
    target = env.target
    for t in range(T):
        rem = target - env.inventory
        if rem == 0:
            a = 0
        elif abs(rem) > max(3, abs(target) // 4):
            a = 5 if rem > 0 else 6
        else:
            chunk = int(np.sign(rem) * min(5, abs(rem)))
            a = _action_for_delta(chunk)
        if a >= N_ACTIONS:
            a = 0
        step = env.step(a)
        total_r += step.reward
        logs.append({"t": t, "action": ACTION_NAMES[a], **step.info})
        if step.terminated:
            break
    return total_r, logs


BaselineFn = Callable[[KalshiExecEnv], tuple[float, list[dict]]]

BASELINES: dict[str, BaselineFn] = {
    "twap": run_twap,
    "vwap_style": run_vwap_style,
    "heuristic_passive": run_heuristic_passive,
    "heuristic_aggressive": run_heuristic_aggressive,
}
