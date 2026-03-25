"""
Prob Desk CLI — welcome screen and interactive REPL.
"""

import argparse
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
        "[yellow]Warning: GOOGLE_API_KEY not set. "
        "Set it in .env (see https://aistudio.google.com/app/apikey).[/]"
    )

try:
    from importlib.metadata import version as _version

    VERSION = _version("prob-desk")
except Exception:
    VERSION = "0.1.2"

console = Console()

# Braille / block chart art (green in _banner_art)
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
    """Render welcome Braille chart art in green."""
    t = Text()
    for line in BANNER_BRAILLE_ART.splitlines():
        t.append(line + "\n", style="bold green")
    return t

TIPS = [
    "Enter a task about Kalshi markets (e.g. 'Summarize KXHIGHNY open markets and risks')",
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
            title="[bold green]Reply[/]",
            title_align="left",
            border_style="green",
            padding=(1, 2),
        )
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
    welcome.append("Prob Desk", style="bold green")
    subtitle = Text(
        f"v{VERSION} · {cwd_display}",
        style="dim white",
    )

    tips_text = Text("Tips for getting started\n", style="bold green")
    tips_text.append(" — ".join(TIPS), style="dim white")

    recent = _get_recent_tasks()
    recent_heading = Text("Recent activity\n", style="bold green")
    if recent:
        recent_body = Text("\n".join(recent[-3:]), style="dim white")
    else:
        recent_body = Text("No recent activity", style="dim white")

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

    # Two-column layout inside one panel (Claude Code style)
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
            title=f"[bold bright_white]Prob Desk[/] [bold green]v{VERSION}[/]",
            title_align="left",
            border_style="green",
            padding=(0, 1),
        )
    )


def run_repl() -> None:
    _welcome()

    while True:
        try:
            prompt = Text("> ", style="bold green")
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

        # Treat as task prompt
        task = line
        _append_recent(task)
        try:
            from prob_desk import ProbDesk

            system = ProbDesk()
            console.print("[dim]Running...[/]")
            result = system.run(task=task)
            _print_assistant_reply(_extract_assistant_text(result))
        except Exception as e:
            console.print(f"[red]Error: {e}[/]")


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="prob-desk",
        description="Prob Desk — interactive REPL for Kalshi / prediction-market tasks.",
        epilog="""
Commands (when running the REPL):
  <task>     Run a task (e.g. 'Analyze NVDA for 50k allocation')
  help, ?, h Show in-REPL tips
  quit, exit, q  Exit the REPL

Examples:
  prob-desk              Start the interactive REPL
  prob-desk help         Show this help
  prob-desk --help       Show this help
  prob-desk --version    Show version
""",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "--version",
        "-v",
        action="version",
        version=f"%(prog)s {VERSION}",
        help="Show program version and exit.",
    )
    return parser


def main() -> None:
    """Entry point for the Prob Desk CLI."""
    parser = _build_parser()
    # Treat bare "help" as --help (e.g. "prob-desk help")
    if len(sys.argv) == 2 and sys.argv[1].lower() == "help":
        parser.print_help()
        sys.exit(0)
    parser.parse_args()  # exits on --help / --version
    run_repl()
    sys.exit(0)


if __name__ == "__main__":
    main()
