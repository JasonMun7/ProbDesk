"""
AG-UI FastAPI bridge for Prob Desk (CopilotKit frontend on :3000).

Run from repo root (with ``pip install -e ".[ui]"`` and ``GOOGLE_API_KEY`` in ``.env``):

    uvicorn prob_desk.agui_server:app --host 127.0.0.1 --port 8000 --reload
"""

from __future__ import annotations

import os

from ag_ui_adk import ADKAgent, add_adk_fastapi_endpoint
from fastapi import FastAPI

from prob_desk.agents import APP_NAME, DEFAULT_USER_ID, root_agent
from prob_desk.env_loader import load_env

load_env()

adk_agent = ADKAgent(
    adk_agent=root_agent,
    app_name=APP_NAME,
    user_id=DEFAULT_USER_ID,
    session_timeout_seconds=3600,
    use_in_memory_services=True,
)

app = FastAPI(title="Prob Desk AG-UI", description="Kalshi multi-agent desk (trading_director)")


@app.get("/health")
def health() -> dict[str, str]:
    """Liveness check for CopilotKit / dev scripts (see ui/scripts/verify-copilotkit-connection.sh)."""
    return {"status": "ok", "agent": root_agent.name}


add_adk_fastapi_endpoint(app, adk_agent, path="/")


def main() -> None:
    import uvicorn

    if not os.getenv("GOOGLE_API_KEY"):
        print("Warning: GOOGLE_API_KEY is not set. Add it to .env at the repo root.")
        print("https://aistudio.google.com/app/apikey")

    port = int(os.getenv("PORT", "8000"))
    host = os.getenv("HOST", "127.0.0.1")
    uvicorn.run(
        "prob_desk.agui_server:app",
        host=host,
        port=port,
        reload=os.getenv("PROB_DESK_AGUI_RELOAD", "1") == "1",
    )


if __name__ == "__main__":
    main()
