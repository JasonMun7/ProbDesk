"""Smoke tests for KalshiExecEnv and baselines."""

from __future__ import annotations

from prob_desk.execution.baselines import run_twap
from prob_desk.execution.env import KalshiExecEnv, N_ACTIONS
from prob_desk.execution.schemas import ExecutionEpisodeConfig


def test_env_step_and_horizon():
    cfg = ExecutionEpisodeConfig(
        horizon_steps=5,
        target_net_contracts=3,
        seed=123,
    )
    env = KalshiExecEnv(cfg)
    obs, _ = env.reset()
    assert obs.shape[0] == 6
    terminated = False
    for _ in range(10):
        step = env.step(0)
        if step.terminated or step.truncated:
            terminated = True
            break
    assert terminated


def test_baseline_twap_runs():
    cfg = ExecutionEpisodeConfig(
        horizon_steps=10,
        target_net_contracts=5,
        seed=1,
    )
    env = KalshiExecEnv(cfg)
    r, logs = run_twap(env)
    assert len(logs) <= 10
    assert isinstance(r, float)


def test_action_space():
    assert N_ACTIONS == 7
