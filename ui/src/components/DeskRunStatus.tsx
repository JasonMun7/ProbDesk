"use client";

import { COPILOT_AGENT_ID } from "@/lib/constants";
import { useAgent, UseAgentUpdate } from "@copilotkit/react-core/v2";
import { Loader2 } from "lucide-react";

/** Subtle desk banner while the agent run is in progress. */
export function DeskRunStatus() {
  const { agent } = useAgent({
    agentId: COPILOT_AGENT_ID,
    updates: [UseAgentUpdate.OnRunStatusChanged],
    throttleMs: 100,
  });

  if (!agent.isRunning) return null;

  return (
    <div
      className="flex shrink-0 items-center gap-2 border-b border-pd-accent/25 bg-pd-accent/8 px-6 py-2 text-sm text-pd-ink/75"
      role="status"
      aria-live="polite"
    >
      <Loader2 className="h-4 w-4 shrink-0 animate-spin text-pd-accent" aria-hidden />
      Agent is working…
    </div>
  );
}
