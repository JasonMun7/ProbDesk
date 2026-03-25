#!/usr/bin/env python3
"""Compare tactical policy vs baselines on synthetic episodes; write CSV/JSON under outputs/."""

from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path

import numpy as np
import torch

from prob_desk.execution.baselines import BASELINES
from prob_desk.execution.env import KalshiExecEnv
from prob_desk.execution.metrics import episode_shortfall_from_logs, summarize_shortfalls
from prob_desk.execution.rollout import load_q_network
from prob_desk.execution.schemas import ExecutionEpisodeConfig


def sample_cfg(
    rng: np.random.Generator,
    horizon: int,
    target_range: tuple[int, int],
    spread_range: tuple[float, float],
    vol_range: tuple[float, float],
) -> ExecutionEpisodeConfig:
    lo, hi = target_range
    target = int(rng.integers(lo, hi + 1))
    if target == 0:
        target = 1
    return ExecutionEpisodeConfig(
        horizon_steps=horizon,
        target_net_contracts=target,
        mid0_cents=float(rng.uniform(40.0, 60.0)),
        spread_cents=float(rng.uniform(spread_range[0], spread_range[1])),
        vol_shock=float(rng.uniform(vol_range[0], vol_range[1])),
        seed=int(rng.integers(0, 2**31 - 1)),
    )


def run_policy_episode(cfg: ExecutionEpisodeConfig, weights: Path) -> tuple[float, list[dict]]:
    env = KalshiExecEnv(cfg)
    obs, _ = env.reset()
    device = torch.device("cpu")
    q = load_q_network(weights, device=device)
    total_r = 0.0
    logs: list[dict] = []
    t = 0
    done = False
    while not done:
        with torch.no_grad():
            a = int(q(torch.tensor(obs, device=device).unsqueeze(0)).argmax(dim=-1).item())
        step = env.step(a)
        total_r += step.reward
        logs.append({"t": t, **step.info})
        obs = step.observation
        done = step.terminated or step.truncated
        t += 1
    return total_r, logs


def main() -> None:
    p = argparse.ArgumentParser(description="Eval tactical policy vs baselines.")
    p.add_argument("--synthetic", action="store_true", help="Run synthetic sweep (default).")
    p.add_argument("--episodes", type=int, default=100)
    p.add_argument("--horizon", type=int, default=40)
    p.add_argument("--seed", type=int, default=0)
    p.add_argument("--weights", type=Path, default=Path("models/tactical_policy.pt"))
    p.add_argument("--out-dir", type=Path, default=Path("outputs/kalshi_eval"))
    p.add_argument("--train-fraction", type=float, default=0.7, help="Regime split for reporting.")
    args = p.parse_args()

    rng = np.random.default_rng(args.seed)
    args.out_dir.mkdir(parents=True, exist_ok=True)

    if not args.weights.is_file():
        print(
            f"Missing weights at {args.weights}; "
            "train with: python scripts/execution/train_tactical_policy.py"
        )
        return

    rows: list[dict] = []
    shortfalls_policy: list[float] = []
    shortfalls_baseline: dict[str, list[float]] = {k: [] for k in BASELINES}

    for i in range(args.episodes):
        cfg = sample_cfg(
            rng,
            args.horizon,
            (-20, 20),
            (1.0, 8.0),
            (0.2, 2.0),
        )
        tag = "train" if i < int(args.train_fraction * args.episodes) else "test"

        _, logs_p = run_policy_episode(cfg, args.weights)
        sf_p = episode_shortfall_from_logs(logs_p, cfg.target_net_contracts)
        shortfalls_policy.append(sf_p)
        rows.append(
            {
                "episode": i,
                "regime": tag,
                "method": "policy",
                "shortfall_cents": sf_p,
                "target": cfg.target_net_contracts,
            }
        )

        for name, fn in BASELINES.items():
            _, logs_b = fn(KalshiExecEnv(cfg.model_copy()))
            sf_b = episode_shortfall_from_logs(logs_b, cfg.target_net_contracts)
            shortfalls_baseline[name].append(sf_b)
            rows.append(
                {
                    "episode": i,
                    "regime": tag,
                    "method": name,
                    "shortfall_cents": sf_b,
                    "target": cfg.target_net_contracts,
                }
            )

    csv_path = args.out_dir / "episodes.csv"
    with csv_path.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys()) if rows else [])
        w.writeheader()
        w.writerows(rows)

    summary = {
        "policy": summarize_shortfalls(shortfalls_policy).model_dump(),
        "baselines": {
            k: summarize_shortfalls(v).model_dump() for k, v in shortfalls_baseline.items()
        },
    }
    (args.out_dir / "summary.json").write_text(
        json.dumps(summary, indent=2),
        encoding="utf-8",
    )
    print(f"Wrote {csv_path} and {args.out_dir / 'summary.json'}")


if __name__ == "__main__":
    main()
