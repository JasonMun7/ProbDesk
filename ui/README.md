# Prob Desk web UI

Next.js + [CopilotKit](https://docs.copilotkit.ai/adk/quickstart) front end for the **`trading_director`** ADK agent. Design tokens: [`../DESIGN.md`](../DESIGN.md).

## Setup

From the **repo root** (not only this folder):

```bash
./scripts/setup.sh
# Edit ../.env — GOOGLE_API_KEY required
```

## Run

```bash
npm run dev
```

| Service | URL |
|---------|-----|
| Web desk | http://localhost:3000 |
| AG-UI agent | http://127.0.0.1:8000 |

Or from the repo root: `prob-desk web`.

`npm run dev` starts the UI and AG-UI backend together (`concurrently`). Split processes:

```bash
npm run dev:ui      # Next.js only
npm run dev:agent   # uvicorn prob_desk.agui_server (from repo root .env)
```

## Features

- Center panel: search results, order book, portfolio, **executed trade receipt**
- Chat sidebar: agent + **Approve / Deny** for Kalshi orders (`approve_kalshi_order`)
- Settings: config status (reads repo-root `.env`)

## ADK Web (optional)

Official ADK browser UI for agent debugging (port **8501**):

```bash
prob-desk adk
# or: ../scripts/run-adk-web.sh
```

Do not bind ADK Web and AG-UI to the same port.

## Troubleshooting

Clear a broken Next cache:

```bash
rm -rf .next node_modules/.cache
npm run dev:ui
```
