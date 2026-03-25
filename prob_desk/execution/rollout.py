"""Greedy policy rollout for tool and eval."""

from __future__ import annotations

from pathlib import Path

import numpy as np
import torch

from prob_desk.execution.env import ACTION_NAMES, KalshiExecEnv, N_ACTIONS
from prob_desk.execution.policy_net import QNetwork
from prob_desk.execution.schemas import (
    ExecutionEpisodeConfig,
    PolicyPlanResult,
    PolicyPlanStep,
    TargetIntent,
)


def load_q_network(weights_path: Path, device: torch.device | None = None) -> QNetwork:
    dev = device or torch.device("cpu")
    try:
        ckpt = torch.load(weights_path, map_location=dev, weights_only=False)
    except TypeError:
        ckpt = torch.load(weights_path, map_location=dev)
    obs_dim = int(ckpt.get("obs_dim", 6))
    n_actions = int(ckpt.get("n_actions", N_ACTIONS))
    q = QNetwork(obs_dim=obs_dim, n_actions=n_actions).to(dev)
    q.load_state_dict(ckpt["state_dict"])
    q.eval()
    return q


def intent_to_config(intent: TargetIntent, seed: int | None = None) -> ExecutionEpisodeConfig:
    tgt = int(intent.target_net_contracts)
    if intent.side == "no":
        tgt = -tgt
    return ExecutionEpisodeConfig(
        horizon_steps=intent.horizon_steps,
        target_net_contracts=tgt,
        seed=seed,
    )


def greedy_rollout(
    intent: TargetIntent,
    q: QNetwork,
    *,
    seed: int | None = None,
) -> PolicyPlanResult:
    cfg = intent_to_config(intent, seed=seed)
    env = KalshiExecEnv(cfg)
    obs, info = env.reset()
    device = next(q.parameters()).device
    steps: list[PolicyPlanStep] = []
    total_r = 0.0
    shortfalls: list[float] = []
    eff_spreads: list[float] = []

    t = 0
    done = False
    while not done:
        with torch.no_grad():
            a = int(q(torch.tensor(obs, device=device).unsqueeze(0)).argmax(dim=-1).item())
        step = env.step(a)
        total_r += step.reward
        mid = float(step.info.get("mid_cents", info.get("mid_cents", 50.0)))
        ep = float(step.info.get("exec_price", mid))
        delta = int(step.info.get("delta", 0))
        inv = int(step.info.get("inventory", 0))
        sf = float(step.info.get("shortfall_component", 0.0))
        shortfalls.append(sf)
        if delta != 0 and mid > 0:
            eff_spreads.append(10_000.0 * (ep - mid) / mid)

        steps.append(
            PolicyPlanStep(
                t=t,
                action_name=ACTION_NAMES[a],
                mid_cents=mid,
                inventory=inv,
            )
        )
        obs = step.observation
        done = step.terminated or step.truncated
        t += 1
        info = {"mid_cents": mid}

    vwap_sf = float(np.sum(shortfalls)) if shortfalls else 0.0
    mean_bps = float(np.mean(eff_spreads)) if eff_spreads else 0.0

    return PolicyPlanResult(
        ok=True,
        error=None,
        intent=intent,
        steps=steps,
        total_reward=total_r,
        vwap_shortfall_cents=vwap_sf,
        mean_effective_spread_bps=mean_bps,
    )


def default_weights_path() -> Path:
    import os

    raw = os.getenv("TACTICAL_POLICY_PATH", "")
    if raw.strip():
        return Path(raw).expanduser().resolve()
    return Path("models") / "tactical_policy.pt"
