"""Synthetic Kalshi-flavored execution environment for RL and baselines."""

from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Any

import numpy as np

from prob_desk.execution.schemas import ExecutionEpisodeConfig

# Discrete actions: name -> delta contracts (signed) and aggressiveness.
ACTION_NAMES: tuple[str, ...] = (
    "wait",
    "buy_1",
    "buy_5",
    "sell_1",
    "sell_5",
    "cross_buy",
    "cross_sell",
)
N_ACTIONS: int = len(ACTION_NAMES)

# Maps action index to (delta_contracts, cross_fraction_of_spread) where cross uses half-spread.
_ACTION_DELTA: list[tuple[int, float]] = [
    (0, 0.0),
    (1, 0.0),
    (5, 0.0),
    (-1, 0.0),
    (-5, 0.0),
    (1, 1.0),  # cross: pay half spread
    (-1, 1.0),
]


@dataclass
class StepResult:
    observation: np.ndarray
    reward: float
    terminated: bool
    truncated: bool
    info: dict[str, Any]


class KalshiExecEnv:
    """
    Minimal single-market execution sim: binary yes-side inventory toward target.

    Observation (float32 vector): [
        mid_cents / 100,
        spread_cents / 100,
        inventory / scale,
        remaining_target / scale,
        t / T,
        vol_shock / 5.0,
    ]
    """

    INV_SCALE: float = 50.0

    def __init__(self, config: ExecutionEpisodeConfig) -> None:
        self._cfg = config
        self._rng = np.random.default_rng(config.seed)
        self._t: int = 0
        self._mid: float = config.mid0_cents
        self._spread: float = config.spread_cents
        self._inventory: int = 0
        self._prev_mid: float = config.mid0_cents

    @property
    def horizon(self) -> int:
        return self._cfg.horizon_steps

    @property
    def target(self) -> int:
        return self._cfg.target_net_contracts

    @property
    def inventory(self) -> int:
        return self._inventory

    @property
    def spread_cents(self) -> float:
        return self._spread

    @property
    def vol_shock(self) -> float:
        return self._cfg.vol_shock

    def reset(self) -> tuple[np.ndarray, dict[str, Any]]:
        self._t = 0
        self._mid = float(self._cfg.mid0_cents)
        self._spread = float(self._cfg.spread_cents)
        self._inventory = 0
        self._prev_mid = self._mid
        return self._obs(), {"mid_cents": self._mid}

    def _remaining_target(self) -> int:
        return self.target - self._inventory

    def _obs(self) -> np.ndarray:
        rem = float(self._remaining_target()) / self.INV_SCALE
        inv = float(self._inventory) / self.INV_SCALE
        return np.array(
            [
                self._mid / 100.0,
                self._spread / 100.0,
                inv,
                rem,
                self._t / max(1, self.horizon - 1),
                self._cfg.vol_shock / 5.0,
            ],
            dtype=np.float32,
        )

    def step(self, action: int) -> StepResult:
        if action < 0 or action >= N_ACTIONS:
            raise ValueError(f"action must be in [0, {N_ACTIONS - 1}], got {action}")
        delta, cross = _ACTION_DELTA[action]
        # Side: buying yes increases inventory toward positive target
        exec_price = self._exec_price_for_delta(delta, cross)
        if delta != 0:
            self._inventory += delta
            # Temporary impact on mid
            self._mid += math.copysign(
                self._cfg.impact_per_contract_cents * abs(delta),
                float(delta),
            )
        # Stochastic mid move
        noise = self._rng.normal(0.0, self._cfg.vol_shock)
        self._mid = float(np.clip(self._mid + noise, 1.0, 99.0))

        ref_mid = 0.5 * (self._prev_mid + self._mid)
        shortfall = (exec_price - ref_mid) * delta if delta != 0 else 0.0
        impact_penalty = self._cfg.impact_per_contract_cents * abs(delta)
        rem_after = abs(self._remaining_target())
        terminal = self._t + 1 >= self.horizon
        inv_penalty = 0.0
        if terminal:
            inv_penalty = 0.1 * abs(rem_after)

        reward = -shortfall - impact_penalty - inv_penalty

        self._prev_mid = self._mid
        self._t += 1

        terminated = terminal
        truncated = False
        info = {
            "exec_price": exec_price if delta != 0 else self._mid,
            "delta": delta,
            "mid_cents": self._mid,
            "inventory": self._inventory,
            "shortfall_component": shortfall,
        }
        return StepResult(self._obs(), float(reward), terminated, truncated, info)

    def _exec_price_for_delta(self, delta: int, cross: float) -> float:
        if delta == 0:
            return self._mid
        # Buy yes: pay ask = mid + half spread (more if cross)
        half = self._spread / 2.0
        if delta > 0:
            return self._mid + half * (1.0 if cross > 0 else 0.5)
        # Sell yes: receive bid
        return self._mid - half * (1.0 if cross > 0 else 0.5)
