"""Small Q-network for discrete actions (DQN-style)."""

from __future__ import annotations

import torch
import torch.nn as nn

from prob_desk.execution.env import N_ACTIONS


class QNetwork(nn.Module):
    def __init__(self, obs_dim: int = 6, n_actions: int = N_ACTIONS) -> None:
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(obs_dim, 64),
            nn.ReLU(),
            nn.Linear(64, 64),
            nn.ReLU(),
            nn.Linear(64, n_actions),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.net(x)
