"""Pydantic schemas for tactical execution (TargetIntent, episodes, results)."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class TargetIntent(BaseModel):
    """Structured intent from the strategic layer; consumed by policy tool and sim."""

    market_ticker: str = Field(..., description="Kalshi market ticker.")
    side: Literal["yes", "no"] = Field(
        ...,
        description="Contract side for binary framing (yes/no).",
    )
    target_net_contracts: int = Field(
        ...,
        description="Desired net position change by horizon (signed contracts).",
    )
    horizon_steps: int = Field(
        20,
        ge=1,
        le=256,
        description="Episode length T; aligns with KalshiExecEnv.",
    )
    risk_budget_cents: float | None = Field(
        None,
        description="Optional cap on worst-case loss proxy for logging.",
    )
    regime_tag: str | None = Field(
        None,
        description="Optional bucket label e.g. wide_spread, for metrics stratification.",
    )


class ExecutionEpisodeConfig(BaseModel):
    """Environment parameters for one episode (training or eval)."""

    horizon_steps: int = Field(40, ge=5, le=256)
    target_net_contracts: int = Field(..., description="Signed inventory target at T.")
    mid0_cents: float = Field(
        50.0,
        ge=1.0,
        le=99.0,
        description="Initial mid price in cents.",
    )
    spread_cents: float = Field(
        2.0,
        ge=0.5,
        le=20.0,
        description="Half-spread proxy (bid-ask) in cents.",
    )
    vol_shock: float = Field(
        0.5,
        ge=0.0,
        le=5.0,
        description="Per-step mid noise scale (cents).",
    )
    impact_per_contract_cents: float = Field(
        0.02,
        ge=0.0,
        le=1.0,
        description="Temporary impact per contract traded (cents).",
    )
    seed: int | None = None


class ReplayRecord(BaseModel):
    """One row of optional JSONL replay (mid/spread over time)."""

    t: int
    mid_cents: float
    spread_cents: float


class PolicyPlanStep(BaseModel):
    """One step in a suggested execution plan."""

    t: int
    action_name: str
    mid_cents: float
    inventory: int


class PolicyPlanResult(BaseModel):
    """JSON-safe result from suggest_execution_plan tool."""

    ok: bool
    error: str | None = None
    intent: TargetIntent | None = None
    steps: list[PolicyPlanStep] = Field(default_factory=list)
    total_reward: float = 0.0
    vwap_shortfall_cents: float = 0.0
    mean_effective_spread_bps: float = 0.0


class EpisodeMetrics(BaseModel):
    """Aggregated metrics for one or many episodes."""

    n_episodes: int = 0
    mean_shortfall_cents: float = 0.0
    median_shortfall_cents: float = 0.0
    p90_shortfall_cents: float = 0.0
    p95_shortfall_cents: float = 0.0
    p99_shortfall_cents: float = 0.0
    mean_reward: float = 0.0
