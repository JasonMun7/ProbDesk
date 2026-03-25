"""Aggregate episode metrics: shortfall, tails, regime stratification."""

from __future__ import annotations

import numpy as np

from prob_desk.execution.schemas import EpisodeMetrics


def percentile(sorted_arr: np.ndarray, q: float) -> float:
    if sorted_arr.size == 0:
        return 0.0
    return float(np.percentile(sorted_arr, q))


def summarize_shortfalls(shortfalls: list[float]) -> EpisodeMetrics:
    arr = np.array(shortfalls, dtype=np.float64)
    arr.sort()
    return EpisodeMetrics(
        n_episodes=int(arr.size),
        mean_shortfall_cents=float(arr.mean()) if arr.size else 0.0,
        median_shortfall_cents=float(np.median(arr)) if arr.size else 0.0,
        p90_shortfall_cents=percentile(arr, 90),
        p95_shortfall_cents=percentile(arr, 95),
        p99_shortfall_cents=percentile(arr, 99),
        mean_reward=0.0,
    )


def episode_shortfall_from_logs(logs: list[dict], target: int) -> float:
    """Sum per-step shortfall_component from env info; add terminal inventory penalty."""
    total = sum(float(x.get("shortfall_component", 0.0)) for x in logs)
    if logs:
        inv = int(logs[-1].get("inventory", 0))
        total += 0.1 * abs(target - inv)
    return total


def effective_spread_bps(exec_price: float, mid: float, side_sign: float) -> float:
    if mid <= 0:
        return 0.0
    return 10_000.0 * side_sign * (exec_price - mid) / mid
