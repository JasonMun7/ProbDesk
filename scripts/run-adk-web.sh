#!/usr/bin/env bash
# Official Google ADK Web UI (dev only). Use port 8501 to avoid clashing with AG-UI on 8000.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

if ! command -v adk >/dev/null 2>&1; then
  echo "adk CLI not found. Run: pip install -e .  (includes google-adk)" >&2
  exit 1
fi

PORT="${ADK_WEB_PORT:-8501}"
HOST="${ADK_WEB_HOST:-127.0.0.1}"

echo "ADK Web → http://${HOST}:${PORT}  (agent package: prob_desk)"
echo "Stop CopilotKit AG-UI on 8000 first if both UIs are needed at once."
exec adk web prob_desk --host "$HOST" --port "$PORT"
