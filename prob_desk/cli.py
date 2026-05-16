"""
Prob Desk CLI — welcome screen, interactive REPL, and dev server helpers.
"""

import argparse
import os
import subprocess
import sys
from pathlib import Path

from rich.console import Console
from rich.markdown import Markdown
from rich.panel import Panel
from rich.text import Text
from rich.columns import Columns
from rich import box

from prob_desk.env_loader import load_env, require_google_api_key

load_env()
if not require_google_api_key():
    Console().print(
        f"[{PD_ACCENT}]Warning: GOOGLE_API_KEY not set. "
        "Set it in .env (see https://aistudio.google.com/app/apikey).[/]"
    )

try:
    from importlib.metadata import version as _version

    VERSION = _version("prob-desk")
except Exception:
    VERSION = "0.1.5"

# Brand palette — see DESIGN.md
PD_WHITE = "#FFFFFF"
PD_INK = "#115166"
PD_ACCENT = "#3CC7E8"
PD_BORDER = "#BDF1FF"
PD_MUTED = "dim #115166"

console = Console()
REPO_ROOT = Path(__file__).resolve().parents[1]

# Braille / block chart art (accent in _banner_art)
BANNER_BRAILLE_ART = """
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⣀⣤⣤⣴⣶⡆⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢤⣴⣶⣶⣿⣿⣿⣿⣿⣿⣿⣿⡇⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠻⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⣿⣿⣿⣿⣿⣿⣿⣿⣿⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣰⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡇
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣰⣿⣿⣿⣿⣿⣿⠟⠁⠈⠙⠻⢇
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣴⣿⣿⣿⣿⣿⡿⠋⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣰⣷⣄⡀⠀⠀⠀⠀⠀⣼⣿⣿⣿⣿⣿⠏⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣰⣿⣿⣿⣿⣦⣀⠀⢀⣼⣿⣿⣿⣿⠟⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣰⣿⣿⣿⢿⣿⣿⣿⣷⣾⣿⣿⣿⡿⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣰⣿⣿⡿⠃⠀⠙⢿⣿⣿⣿⣿⣿⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⢀⣤⣄⠀⠀⠀⠀⠀⠀⢰⣿⣿⡿⠁⠀⠀⠀⠀⠙⠻⣿⠟⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⢀⣾⣿⣿⣿⣦⣄⠀⠀⢰⣿⣿⡟⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⢀⣾⣿⠛⠿⣿⣿⣿⣿⣦⣿⣿⠟⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⢠⣿⡟⠁⠀⠀⠀⠈⠙⠻⢿⣿⠏⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⣠⡿⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⣰⠟⠁⠀⠀⠀⠀⠀⠀⣤⠶⢤⠄⠶⢶⠶⠦⢠⡴⢦⣄⠀⣶⡀⠀⢰⠀⢰⠀⢀⡴⠂⢠⡴⠦⡄⠀⠀⠀⠀⠀⠀
⠀⡰⠃⠀⠀⠀⠀⠀⠀⠀⠀⢧⣤⣄⠀⠀⢸⠀⠀⣿⠀⠀⣿⠀⣿⠳⡄⢸⠀⢸⣠⢾⠁⠀⠻⣤⣤⡀⠀⠀⠀⠀⠀⠀
⠜⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣄⣀⣸⠇⠀⢸⠀⠀⢿⣀⣀⡿⠀⣿⠀⠹⣾⠀⢸⠁⠈⢧⡀⣄⣀⣀⡿⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠉⠁⠀⠀⠈⠀⠀⠀⠉⠉⠀⠀⠉⠀⠀⠈⠀⠈⠀⠀⠈⠁⠀⠉⠉⠀⠀⠀⠀⠀⠀⠀
""".strip()


def _banner_art() -> Text:
    """Render welcome Braille chart art in brand accent."""
    t = Text()
    for line in BANNER_BRAILLE_ART.splitlines():
        t.append(line + "\n", style=f"bold {PD_ACCENT}")
    return t


TIPS = [
    "Enter a task about Kalshi markets (e.g. 'Show orderbook for KXPGATOUR-PGC26-SSCH')",
    "Run the web desk: prob-desk web  (or cd ui && npm run dev)",
    "Type 'quit' or 'exit' to leave",
    "Type 'help' or '?' for commands",
]

RECENT_FILE = Path.home() / ".prob_desk" / "recent_tasks.txt"
MAX_RECENT = 5


def _get_recent_tasks() -> list[str]:
    if not RECENT_FILE.exists():
        return []
    try:
        lines = RECENT_FILE.read_text().strip().splitlines()
        return [
            ln.strip() for ln in lines[-MAX_RECENT:] if ln.strip()
        ]
    except Exception:
        return []


def _extract_assistant_text(result: object) -> str:
    """Best-effort assistant string from ProbDesk.run() return value."""
    if isinstance(result, list):
        for msg in reversed(result):
            if isinstance(msg, dict) and msg.get("role") == "assistant":
                c = msg.get("content")
                if c is not None and str(c).strip():
                    return str(c)
        if result and isinstance(result[-1], dict):
            c = result[-1].get("content")
            if c is not None:
                return str(c)
    if isinstance(result, dict):
        if "assistant" in result and result["assistant"] is not None:
            return str(result["assistant"])
        if "content" in result:
            return str(result["content"])
    return str(result)


def _print_assistant_reply(text: str, *, max_chars: int = 12000) -> None:
    """Render reply as Markdown in a calm panel (readable lists, bold, no raw list repr)."""
    t = text.strip()
    if len(t) > max_chars:
        t = t[:max_chars].rstrip() + "\n\n…"
    body: Markdown | Text
    try:
        body = Markdown(t)
    except Exception:
        body = Text(t)
    console.print(
        Panel(
            body,
            title=f"[bold {PD_INK}]Reply[/]",
            title_align="left",
            border_style=PD_ACCENT,
            padding=(1, 2),
        )
    )


def _env_verbose() -> bool:
    return os.environ.get("PROB_DESK_VERBOSE", "").strip().lower() in (
        "1",
        "true",
        "yes",
    )


def _append_recent(task: str) -> None:
    try:
        RECENT_FILE.parent.mkdir(parents=True, exist_ok=True)
        recent = _get_recent_tasks()
        if task in recent:
            recent.remove(task)
        recent.append(task)
        RECENT_FILE.write_text("\n".join(recent[-MAX_RECENT:]))
    except Exception:
        pass


def _welcome() -> None:
    cwd = Path.cwd()
    try:
        cwd_str = cwd.relative_to(Path.home())
        cwd_display = f"~/{cwd_str}"
    except ValueError:
        cwd_display = str(cwd)

    welcome = Text()
    welcome.append("Welcome to ", style="bold bright_white")
    welcome.append("Prob Desk", style=f"bold {PD_ACCENT}")
    subtitle = Text(
        f"v{VERSION} · {cwd_display}",
        style=PD_MUTED,
    )

    tips_text = Text("Tips for getting started\n", style=f"bold {PD_ACCENT}")
    tips_text.append(" — ".join(TIPS), style=PD_MUTED)

    recent = _get_recent_tasks()
    recent_heading = Text("Recent activity\n", style=f"bold {PD_ACCENT}")
    if recent:
        recent_body = Text("\n".join(recent[-3:]), style=PD_MUTED)
    else:
        recent_body = Text("No recent activity", style=PD_MUTED)

    left = Text()
    left.append(welcome)
    left.append("\n\n")
    left.append(_banner_art())
    left.append("\n")
    left.append(subtitle)

    right = Text()
    right.append(tips_text)
    right.append("\n")
    right.append("─" * 50 + "\n", style="dim")
    right.append(recent_heading)
    right.append(recent_body)

    left_panel = Panel(
        left,
        box=box.MINIMAL,
        padding=(0, 1),
        border_style="dim",
        expand=False,
    )
    right_panel = Panel(
        right,
        box=box.MINIMAL,
        padding=(0, 1),
        border_style="dim",
        expand=True,
    )
    cols = Columns(
        [left_panel, right_panel], expand=True, equal=False
    )
    console.print(
        Panel(
            cols,
            title=f"[bold {PD_WHITE}]Prob Desk[/] [bold {PD_ACCENT}]v{VERSION}[/]",
            title_align="left",
            border_style=PD_ACCENT,
            padding=(0, 1),
        )
    )


def run_repl(*, verbose: bool = False) -> None:
    _welcome()

    while True:
        try:
            prompt = Text("> ", style=f"bold {PD_ACCENT}")
            console.print(prompt, end="")
            line = input().strip()
        except (EOFError, KeyboardInterrupt):
            console.print("\n[dim]Goodbye.[/]")
            break

        if not line:
            continue

        lower = line.lower()
        if lower in ("quit", "exit", "q"):
            console.print("[dim]Goodbye.[/]")
            break

        if lower in ("help", "?", "h"):
            for t in TIPS:
                console.print(f"  [dim]·[/] {t}")
            continue

        task = line
        _append_recent(task)
        try:
            from prob_desk import ProbDesk

            system = ProbDesk(verbose=verbose)
            if verbose:
                console.print("[dim]Running...[/]")
                result = system.run(task=task)
            else:
                with console.status(
                    f"[bold {PD_ACCENT}]Running agent…[/]", spinner="dots"
                ):
                    result = system.run(task=task)
            _print_assistant_reply(_extract_assistant_text(result))
        except Exception as e:
            console.print(f"[red]Error: {e}[/]")


def cmd_serve() -> None:
    """Start the AG-UI backend (CopilotKit agent API on port 8000)."""
    script = REPO_ROOT / "ui" / "scripts" / "run-agent.sh"
    if not script.is_file():
        console.print("[red]Missing ui/scripts/run-agent.sh[/]")
        sys.exit(1)
    os.execv("/bin/bash", ["bash", str(script)])


def cmd_web() -> None:
    """Start the Next.js + AG-UI web desk (recommended UI)."""
    ui_dir = REPO_ROOT / "ui"
    if not (ui_dir / "package.json").is_file():
        console.print("[red]UI not found at ui/[/]")
        sys.exit(1)
    if not shutil_which("npm"):
        console.print(
            "[red]npm not found.[/] Install Node 20+, run ./scripts/setup.sh, "
            "then: cd ui && npm run dev"
        )
        sys.exit(1)
    console.print(
        f"[{PD_ACCENT}]Starting web desk…[/] "
        "[dim]http://localhost:3000 · AG-UI http://127.0.0.1:8000[/]"
    )
    subprocess.run(["npm", "run", "dev"], cwd=ui_dir, check=True)


def cmd_adk() -> None:
    """Start official ADK Web (dev UI on port 8501)."""
    script = REPO_ROOT / "scripts" / "run-adk-web.sh"
    if not script.is_file():
        console.print("[red]Missing scripts/run-adk-web.sh[/]")
        sys.exit(1)
    os.execv("/bin/bash", ["bash", str(script)])


def shutil_which(cmd: str) -> str | None:
    from shutil import which

    return which(cmd)


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="prob-desk",
        description="Prob Desk — Kalshi multi-agent desk (CLI, web UI, ADK Web).",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  prob-desk              Interactive terminal REPL (default)
  prob-desk web          CopilotKit web desk (Next.js + AG-UI)
  prob-desk serve        AG-UI backend only (port 8000)
  prob-desk adk          Official ADK Web UI (port 8501)
  prob-desk --verbose    REPL with INFO logs

First-time setup: ./scripts/setup.sh
""",
    )
    parser.add_argument(
        "--version",
        "-v",
        action="version",
        version=f"%(prog)s {VERSION}",
    )
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Log INFO from prob_desk during REPL runs.",
    )

    sub = parser.add_subparsers(dest="command", metavar="command")

    sub.add_parser(
        "repl",
        help="Interactive terminal REPL (default)",
    )
    sub.add_parser(
        "web",
        help="Start CopilotKit web desk (cd ui && npm run dev)",
    )
    sub.add_parser(
        "serve",
        help="Start AG-UI backend only (uvicorn on port 8000)",
    )
    sub.add_parser(
        "adk",
        help="Start official ADK Web UI (port 8501)",
    )

    return parser


def main() -> None:
    """Entry point for the Prob Desk CLI."""
    parser = _build_parser()
    if len(sys.argv) == 2 and sys.argv[1].lower() == "help":
        parser.print_help()
        sys.exit(0)

    args = parser.parse_args()
    verbose = bool(getattr(args, "verbose", False)) or _env_verbose()
    command = getattr(args, "command", None) or "repl"

    if command == "web":
        cmd_web()
    elif command == "serve":
        cmd_serve()
    elif command == "adk":
        cmd_adk()
    else:
        run_repl(verbose=verbose)

    sys.exit(0)


if __name__ == "__main__":
    main()
