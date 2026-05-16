#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

PYTHON="${PYTHON:-python}"
if ! "$PYTHON" -c "import ag_ui_adk" 2>/dev/null; then
  echo "ag-ui-adk is not installed (PyPI package for prob_desk.agui_server)." >&2
  echo "From repo root: pip install -e \".[ui]\"" >&2
  exit 1
fi

if command -v uvicorn >/dev/null 2>&1; then
  exec uvicorn prob_desk.agui_server:app --host "${HOST:-127.0.0.1}" --port "${PORT:-8000}" --reload
fi

exec python -m uvicorn prob_desk.agui_server:app --host "${HOST:-127.0.0.1}" --port "${PORT:-8000}" --reload
