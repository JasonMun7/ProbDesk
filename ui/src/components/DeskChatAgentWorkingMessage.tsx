"use client";

import { Bot, Loader2 } from "lucide-react";

/**
 * In-chat status row while the agent run is active (CopilotKit messageView cursor slot).
 */
export function DeskChatAgentWorkingMessage({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <article
      className={`pd-desk-agent-working-inchat pd-desk-fade-in my-2 overflow-hidden rounded-2xl border border-pd-border bg-pd-white shadow-sm${className ? ` ${className}` : ""}`}
      data-testid="pd-desk-agent-working"
      role="status"
      aria-live="polite"
      aria-busy="true"
      {...props}
    >
      <div className="pd-accent-bar h-0.5 w-full shrink-0" aria-hidden />
      <div className="flex items-start gap-2.5 px-4 py-3">
        <span
          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-pd-accent/20 text-pd-accent"
          aria-hidden
        >
          <Bot className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-sm font-semibold text-pd-ink">Trading director</h4>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-pd-accent/35 bg-pd-accent/10 px-2.5 py-1 text-[11px] font-medium text-pd-accent">
              <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
              Working
            </span>
          </div>
          <p className="mt-0.5 text-xs leading-snug text-pd-ink/65">
            Agent is working… tool results and replies appear below when ready.
          </p>
        </div>
      </div>
    </article>
  );
}
