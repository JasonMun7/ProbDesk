#!/usr/bin/env python3
"""Train tactical Q-policy on KalshiExecEnv; write models/tactical_policy.pt + config YAML."""

from __future__ import annotations

import argparse
import random
from collections import deque
from pathlib import Path

import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
import yaml

from prob_desk.execution.env import KalshiExecEnv, N_ACTIONS
from prob_desk.execution.policy_net import QNetwork
from prob_desk.execution.schemas import ExecutionEpisodeConfig


def sample_config(args: argparse.Namespace, rng: np.random.Generator) -> ExecutionEpisodeConfig:
    lo, hi = args.target_min, args.target_max
    target = int(rng.integers(lo, hi + 1))
    if target == 0:
        target = 1
    spread = float(rng.uniform(args.spread_min, args.spread_max))
    vol = float(rng.uniform(args.vol_min, args.vol_max))
    return ExecutionEpisodeConfig(
        horizon_steps=args.horizon,
        target_net_contracts=target,
        mid0_cents=float(rng.uniform(40.0, 60.0)),
        spread_cents=spread,
        vol_shock=vol,
        seed=int(rng.integers(0, 2**31 - 1)),
    )


def train_dqn(args: argparse.Namespace) -> None:
    rng = np.random.default_rng(args.seed)
    torch.manual_seed(args.seed)
    device = torch.device("cpu")

    q = QNetwork(obs_dim=6, n_actions=N_ACTIONS).to(device)
    target_q = QNetwork(obs_dim=6, n_actions=N_ACTIONS).to(device)
    target_q.load_state_dict(q.state_dict())
    opt = optim.Adam(q.parameters(), lr=args.lr)
    replay: deque[tuple] = deque(maxlen=args.replay_size)

    for ep in range(args.episodes):
        cfg = sample_config(args, rng)
        env = KalshiExecEnv(cfg)
        obs, _ = env.reset()
        eps = max(
            args.epsilon_end,
            args.epsilon_start
            - (args.epsilon_start - args.epsilon_end)
            * min(1.0, ep / max(1, args.epsilon_decay_episodes)),
        )
        done = False
        while not done:
            if random.random() < eps:
                a = int(rng.integers(0, N_ACTIONS))
            else:
                with torch.no_grad():
                    qv = q(torch.tensor(obs, device=device).unsqueeze(0))
                    a = int(qv.argmax(dim=-1).item())
            step = env.step(a)
            next_obs = step.observation
            replay.append((obs, a, step.reward, next_obs, step.terminated))
            obs = next_obs
            done = step.terminated or step.truncated

            if len(replay) >= args.batch_size:
                batch = random.sample(replay, args.batch_size)
                o = torch.tensor(np.stack([b[0] for b in batch]), device=device)
                a = torch.tensor([b[1] for b in batch], device=device, dtype=torch.long)
                r = torch.tensor([b[2] for b in batch], device=device)
                on = torch.tensor(np.stack([b[3] for b in batch]), device=device)
                d = torch.tensor([float(b[4]) for b in batch], device=device)

                with torch.no_grad():
                    q_next = target_q(on).max(dim=-1).values
                    y = r + args.gamma * q_next * (1.0 - d)

                pred = q(o).gather(1, a.unsqueeze(1)).squeeze(1)
                loss = nn.functional.mse_loss(pred, y)
                opt.zero_grad()
                loss.backward()
                opt.step()

        if ep % args.target_update_every == 0:
            target_q.load_state_dict(q.state_dict())

    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    pt_path = out_dir / "tactical_policy.pt"
    torch.save(
        {
            "state_dict": q.state_dict(),
            "obs_dim": 6,
            "n_actions": N_ACTIONS,
        },
        pt_path,
    )
    cfg_dump = {
        "algo": "dqn",
        "episodes": args.episodes,
        "horizon": args.horizon,
        "lr": args.lr,
        "gamma": args.gamma,
        "seed": args.seed,
    }
    yaml_path = out_dir / "tactical_policy_config.yaml"
    yaml_path.write_text(yaml.safe_dump(cfg_dump), encoding="utf-8")
    print(f"Wrote {pt_path} and {yaml_path}")


def main() -> None:
    p = argparse.ArgumentParser(description="Train tactical Q-network for KalshiExecEnv.")
    p.add_argument("--out-dir", type=str, default="models")
    p.add_argument("--episodes", type=int, default=400)
    p.add_argument("--horizon", type=int, default=40)
    p.add_argument("--lr", type=float, default=1e-3)
    p.add_argument("--gamma", type=float, default=0.99)
    p.add_argument("--epsilon-start", type=float, default=0.3)
    p.add_argument("--epsilon-end", type=float, default=0.05)
    p.add_argument("--epsilon-decay-episodes", type=int, default=300)
    p.add_argument("--batch-size", type=int, default=64)
    p.add_argument("--replay-size", type=int, default=10_000)
    p.add_argument("--target-update-every", type=int, default=50)
    p.add_argument("--target-min", type=int, default=-20)
    p.add_argument("--target-max", type=int, default=20)
    p.add_argument("--spread-min", type=float, default=1.0)
    p.add_argument("--spread-max", type=float, default=8.0)
    p.add_argument("--vol-min", type=float, default=0.2)
    p.add_argument("--vol-max", type=float, default=2.0)
    p.add_argument("--seed", type=int, default=42)
    args = p.parse_args()
    train_dqn(args)


if __name__ == "__main__":
    main()
