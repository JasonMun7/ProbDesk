# `prob_desk.execution` (simulator package)

Synthetic Kalshi-style **execution** simulator, **baselines** (TWAP / VWAP-style / heuristics), **metrics**, and **Q-network** + **rollout** helpers used by:

- **ADK tools:** [`prob_desk/agents/tools/tactical_policy.py`](../prob_desk/agents/tools/tactical_policy.py) (`suggest_execution_plan`)
- **CLI (repo root):** [`scripts/execution/`](../scripts/execution/) — train, eval, benchmark (see [`docs/tactical-policy-cli-scripts.md`](../tactical-policy-cli-scripts.md))
- **Config template:** [`prob_desk/execution/tactical_policy.example.yaml`](../prob_desk/execution/tactical_policy.example.yaml)
- **Course notes:** [`docs/execution/PROJECT_PROPOSAL.md`](execution/PROJECT_PROPOSAL.md)

Trained weights (`models/tactical_policy.pt`) and eval outputs (`outputs/`) stay at the **repository root** and are gitignored.
