#!/usr/bin/env bash
# One-shot local setup for ProbDesk (Python agent + Next.js web UI).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

info() { printf '\033[36m→\033[0m %s\n' "$*"; }
warn() { printf '\033[33m!\033[0m %s\n' "$*"; }
die() { printf '\033[31m✗\033[0m %s\n' "$*" >&2; exit 1; }

info "ProbDesk setup (repo: $ROOT)"

# --- Python ---
if command -v python3 >/dev/null 2>&1; then
  PY=python3
elif command -v python >/dev/null 2>&1; then
  PY=python
else
  die "Python 3.10+ is required."
fi

$PY -c 'import sys; sys.exit(0 if sys.version_info >= (3, 10) else 1)' \
  || die "Python 3.10+ is required (found $($PY --version 2>&1))."

info "Installing Python package with UI extras…"
if [[ -d .venv ]]; then
  # shellcheck disable=SC1091
  source .venv/bin/activate
elif [[ -n "${VIRTUAL_ENV:-}" ]]; then
  :
else
  warn "No .venv found — installing into the active interpreter."
  warn "Tip: python3 -m venv .venv && source .venv/bin/activate"
fi

pip install -e ".[ui]" -q

# --- Environment ---
if [[ ! -f .env ]]; then
  cp .env.example .env
  info "Created .env from .env.example — set GOOGLE_API_KEY before running."
else
  info ".env already exists (skipped copy)."
fi

mkdir -p secrets/kalshi
if [[ ! -f secrets/kalshi/private_key.pem ]] && [[ -f secrets/kalshi/private_key.pem.example ]]; then
  cp secrets/kalshi/private_key.pem.example secrets/kalshi/private_key.pem
  warn "Copied secrets/kalshi/private_key.pem.example → private_key.pem (replace with your Kalshi key)."
fi

# --- Node / UI ---
if ! command -v node >/dev/null 2>&1; then
  warn "Node.js 20+ not found — skip UI install. Install Node to use the web desk."
else
  NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
  if [[ "$NODE_MAJOR" -lt 20 ]]; then
    warn "Node $(node -v) detected; Node 20+ is recommended."
  fi
  info "Installing UI dependencies…"
  (cd ui && npm install --no-fund --no-audit)
fi

printf '\n\033[32m✓\033[0m Setup complete.\n\n'
echo "Next steps:"
echo "  1. Edit .env — set GOOGLE_API_KEY (required): https://aistudio.google.com/app/apikey"
echo "  2. Optional — Kalshi demo keys for portfolio / trading:"
echo "     https://docs.google.com/presentation/d/e/2PACX-1vRvhUAqRBYzJmt7JCinMXmu6KVWkj-cc7ikDXGConmqjcv4mnlJacgHPcZJ20fWWnrYdubn-oczclKP/pub?start=false&loop=false&delayms=3000&slide=id.g359756fc63c_5_25"
echo ""
echo "Run the web desk (recommended):"
echo "  cd ui && npm run dev"
echo "  → http://localhost:3000  (agent AG-UI on http://127.0.0.1:8000)"
echo ""
echo "Other entry points:"
echo "  prob-desk              Interactive terminal REPL"
echo "  prob-desk serve        AG-UI backend only (port 8000)"
echo "  prob-desk adk          Official ADK Web UI (port 8501)"
echo ""
