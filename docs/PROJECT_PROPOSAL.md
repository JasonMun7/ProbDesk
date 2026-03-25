# Project proposal (Kalshi + ADK + tactical RL)

This document aligns the original course proposal (portfolio optimization + RL optimal execution in an LOB / HFT setting) with the current implementation without changing the **core narrative**: a **two-tier system** (strategic targets + tactical execution quality) and **rigorous evaluation**.

## What stays the same

- **Hierarchical architecture:** A strategic layer sets **targets** under risk-style constraints; a tactical layer **learns** to reach those targets with low **implementation shortfall** vs reference prices.
- **Evaluation:** Mean/median and **tail** outcomes (p90/p95/p99) for cost and shortfall; comparison to **TWAP/VWAP-style** schedules and **heuristic** baselines; **regime** splits and **train vs test** parameterizations for generalization.
- **Systems angle:** Mean and **p99** inference latency, throughput, and memory for the **learned tactical policy** (PyTorch and optional ONNX Runtime), plus analysis of **latency vs execution quality** when quantizing or shrinking the policy.

## What changed (venue and stack)

- **Venue:** Primary focus is **Kalshi** (US event / prediction markets) via the **Trade API** for market data and a **synthetic / replay** execution simulator (`prob_desk.execution`), instead of equity LOBSTER/Databento nanosecond LOB data.
- **Strategic layer:** Implemented as **Google ADK** multi-agent graph (`trading_director` + subagents) with **Kalshi tools** (`kalshi-python-sync` SDK for authenticated portfolio + market + order paths; **public** HTTP helpers for keyless market reads).
- **Tactical layer:** A small **PyTorch** policy (DQN or contextual bandit) trained in the simulator; exposed to agents as **ADK function tools** (e.g. `suggest_execution_plan`) so the LLM **orchestrates and explains** tactical outputs rather than replacing the RL module in the course write-up.

## Kalshi API surface (implementation)

| SDK class (sync) | Role in Prob Desk |
|------------------|-------------------|
| `MarketApi` | Market list, single market, order book, series metadata (SDK tools mirror public endpoints; authenticated when keys are set). |
| `PortfolioApi` | Balance, positions, fills, settlements — **risk** and **execution** agents use portfolio reads for sizing and grounding. |
| `OrdersApi` | List orders, **create** and **cancel** — **`execution_agent`** only for writes. |

Environment: **`KALSHI_TRADE_API_BASE`** (default **demo** in `.env.example`), **`KALSHI_API_KEY_ID`**, **`KALSHI_PRIVATE_KEY_PATH`** or **`KALSHI_PRIVATE_KEY_PEM`**. No hand-rolled RSA signing in application code; the SDK handles request signing.

## Latency claims (important)

- **Sub-millisecond end-to-end** decision-making is **not** claimed for the full **ADK + Gemini + HTTP** stack; that path is **milliseconds to seconds** depending on model and tool rounds.
- **Sub-millisecond** (or low-ms) targets apply to the **tactical policy forward pass** (and ONNX Runtime where used), consistent with the original “inference path” emphasis.

## Metrics mapping (proposal text)

| Original intent | Kalshi / sim realization |
|-----------------|----------------------------|
| Avg execution vs reference | Volume-weighted average price vs **mid path** in the simulator |
| Fill rate / time-to-fill | **v1 synthetic:** simplified fill model where applicable; **v2:** optional JSONL replay from stored snapshots |
| Effective spread | Signed `(exec_price - mid) / mid` summaries |
| Baselines | TWAP, VWAP-style participation, passive/aggressive heuristics |
| Regimes / generalization | Env parameters (spread/vol buckets); train A / evaluate B with frozen weights |

## Artifacts

- Trained weights: `models/tactical_policy.pt` (gitignored); example training hyperparameters: [`prob_desk/execution/tactical_policy.example.yaml`](../../prob_desk/execution/tactical_policy.example.yaml).
- Batch eval output: `outputs/kalshi_eval/` (gitignored).
