"use client";

import Image from "next/image";
import { COPILOT_AGENT_ID } from "@/lib/constants";
import { DESK_WELCOME_STARTERS } from "@/lib/desk-demo-prompts";
import { useDeskPrompt } from "@/lib/desk-prompt";
import { useCallback } from "react";

/** Custom CopilotKit welcome slot — branded empty state with starter chips. */
export function DeskCopilotWelcome({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { sendPrompt, isRunning } = useDeskPrompt();

  const handleChip = useCallback(
    (message: string) => {
      if (isRunning) return;
      void sendPrompt(message);
    },
    [isRunning, sendPrompt],
  );

  return (
    <div
      className={`pd-desk-copilot-welcome text-center ${className ?? ""}`}
      data-testid="pd-desk-copilot-welcome"
      {...props}
    >
      <Image
        src="/brand/logo-sm.png"
        alt="Prob Desk"
        width={27}
        height={40}
        className="mx-auto mb-4 h-12 w-auto"
        priority
      />
      <div className="pd-accent-bar mx-auto mb-5 w-14 rounded-full" aria-hidden />
      <p className="text-xs font-medium uppercase tracking-wide text-pd-accent">
        Prob Desk is ready
      </p>
      <h1 className="mt-2 text-xl font-semibold text-pd-ink sm:text-2xl">
        Trading director is online
      </h1>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-pd-ink/60">
        Ask about Kalshi markets, your portfolio, or desk risk—or pick a starter below.
      </p>
      <ul className="mt-6 flex flex-wrap justify-center gap-2" role="list">
        {DESK_WELCOME_STARTERS.map(({ id, title, message }) => (
          <li key={id}>
            <button
              type="button"
              disabled={isRunning}
              onClick={() => handleChip(message)}
              className="pd-gradient-chip rounded-full border border-pd-border px-3.5 py-1.5 text-sm font-medium text-pd-ink shadow-sm transition-colors hover:border-pd-accent disabled:cursor-not-allowed disabled:opacity-50"
            >
              {title}
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-5 font-mono text-[10px] text-pd-ink/35" title="Agent id (dev)">
        {COPILOT_AGENT_ID}
      </p>
    </div>
  );
}
