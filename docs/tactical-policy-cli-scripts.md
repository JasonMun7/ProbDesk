# Execution scripts (tactical RL)

CLI entry points for the **`prob_desk.execution`** simulator and trained Q-policy. They live under [`scripts/execution/`](../scripts/execution/) so **ADK** code stays under [`prob_desk/agents/`](../prob_desk/agents/) and [`prob_desk/main.py`](../prob_desk/main.py), while **train/eval/benchmark** tooling is grouped by domain.

| Script | Purpose |
|--------|---------|
| [`train_tactical_policy.py`](../scripts/execution/train_tactical_policy.py) | Train DQN; write `models/tactical_policy.pt` |
| [`eval_execution.py`](../scripts/execution/eval_execution.py) | Policy vs TWAP/VWAP-style baselines → `outputs/kalshi_eval/` |
| [`benchmark_policy_inference.py`](../scripts/execution/benchmark_policy_inference.py) | Mean/p99 forward latency (PyTorch; optional ONNX) |

Example hyperparameters: [`prob_desk/execution/tactical_policy.example.yaml`](../prob_desk/execution/tactical_policy.example.yaml).

Simulator package overview: [`docs/execution-simulator-package.md`](execution-simulator-package.md).
