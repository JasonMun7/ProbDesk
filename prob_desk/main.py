from __future__ import annotations

import asyncio
import logging
from pathlib import Path
from google.adk.artifacts.in_memory_artifact_service import (
    InMemoryArtifactService,
)
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types
from loguru import logger

from prob_desk.agents import APP_NAME, DEFAULT_USER_ID
from prob_desk.agents.adk_app import app as prob_desk_app


def _suppress_genai_mixed_part_warning() -> None:
    """Avoid noisy warning when the model returns tool calls + text in one turn."""

    class _Filter(logging.Filter):
        def filter(self, record: logging.LogRecord) -> bool:
            msg = record.getMessage()
            return "non-text parts in the response" not in msg

    logging.getLogger("google_genai.types").addFilter(_Filter())


_suppress_genai_mixed_part_warning()


def _parts_to_text(content: types.Content | None) -> str:
    if content is None or not content.parts:
        return ""
    lines: list[str] = []
    for p in content.parts:
        if getattr(p, "text", None):
            lines.append(p.text)
    return "\n".join(lines).strip()


async def run_adk_task_async(task: str) -> str:
    """
    Run the root ADK agent on a user task; return the final model text.
    """
    session_service = InMemorySessionService()
    artifact_service = InMemoryArtifactService()
    session = await session_service.create_session(
        app_name=APP_NAME,
        user_id=DEFAULT_USER_ID,
        state={},
    )
    runner = Runner(
        app=prob_desk_app,
        session_service=session_service,
        artifact_service=artifact_service,
    )
    content = types.Content(
        role="user",
        parts=[types.Part(text=task)],
    )
    last_text = ""
    last_any_text = ""
    async for event in runner.run_async(
        session_id=session.id,
        user_id=session.user_id,
        new_message=content,
    ):
        if not event.content:
            continue
        t = _parts_to_text(event.content)
        if not t:
            continue
        last_any_text = t
        if event.is_final_response():
            last_text = t
    await runner.close()
    return last_text or last_any_text


class ProbDesk:
    """
    Kalshi-focused agent system using Google ADK + Gemini (Prob Desk).
    """

    def __init__(
        self,
        name: str = "prob_desk",
        description: str = "Kalshi event-market analysis and execution planning",
        output_dir: str = "outputs",
        output_file_path: str = None,
        output_type: str = "list",
        *,
        verbose: bool = False,
    ):
        self.name = name
        self.description = description
        self.output_type = output_type
        self.output_file_path = output_file_path
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        self._verbose = verbose

        log = logger.info if self._verbose else logger.debug
        log("Initializing Prob Desk (ADK + Gemini)")

    def run(self, task: str, *args, **kwargs):
        """
        Execute one agent run and return conversation-shaped output.
        """
        log = logger.info if self._verbose else logger.debug
        log("Starting ADK trading cycle")
        try:
            output_text = asyncio.run(run_adk_task_async(task))
            if self.output_type == "list":
                return [
                    {"role": "user", "content": task},
                    {"role": "assistant", "content": output_text},
                ]
            if self.output_type == "dict":
                return {
                    "user": task,
                    "assistant": output_text,
                }
            if self.output_type == "str":
                return f"User: {task}\n\nAssistant:\n{output_text}"
            return [
                {"role": "user", "content": task},
                {"role": "assistant", "content": output_text},
            ]
        except Exception as e:
            logger.error(f"Error in trading cycle: {str(e)}")
            raise
