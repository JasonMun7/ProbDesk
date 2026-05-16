#!/usr/bin/env bash
# Verify Prob Desk CopilotKit ↔ AG-UI wiring (matches CopilotKit ADK quickstart).
set -euo pipefail

AGUI_URL="${PROB_DESK_AGUI_URL:-http://127.0.0.1:8000}"
UI_URL="${PROB_DESK_UI_URL:-http://localhost:3000}"
AGENT_ID="${COPILOT_AGENT_ID:-trading_director}"

echo "=== Prob Desk CopilotKit connection check ==="
echo "AG-UI:  $AGUI_URL"
echo "UI:     $UI_URL"
echo "Agent:  $AGENT_ID"
echo

check() {
  local label="$1" url="$2" method="${3:-GET}"
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "$url" || echo "000")
  if [[ "$code" =~ ^(200|204|400|415|422)$ ]]; then
    echo "OK   $label ($code) $url"
  else
    echo "FAIL $label ($code) $url"
    return 1
  fi
}

fail=0
check "AG-UI health" "${AGUI_URL%/}/health" || fail=1
check "AG-UI capabilities" "${AGUI_URL%/}/capabilities" || fail=1
check "AG-UI docs" "${AGUI_URL%/}/docs" || fail=1
check "Next.js home" "$UI_URL/" || fail=1
check "CopilotKit runtime POST" "${UI_URL%/}/api/copilotkit" POST || fail=1

check "CopilotKit threads list" "${UI_URL%/}/api/copilotkit/threads?agentId=${AGENT_ID}" || fail=1

echo
if [[ "$fail" -eq 0 ]]; then
  echo "All required endpoints reachable."
  exit 0
fi
echo "One or more checks failed. Run: cd ui && npm run dev"
exit 1
