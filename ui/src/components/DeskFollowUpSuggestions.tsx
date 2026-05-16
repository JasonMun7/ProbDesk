"use client";

import { deskFollowUpsForContext } from "@/lib/desk-follow-up-suggestions";
import { useDeskToolState } from "@/lib/desk-tool-state";
import { COPILOT_AGENT_ID } from "@/lib/constants";
import { useConfigureSuggestions } from "@copilotkit/react-core/v2";

/**
 * Registers in-chat follow-up pills (CopilotKit v2 suggestion strip).
 * Shown after the assistant finishes; hidden while the agent is running.
 */
export function DeskFollowUpSuggestions() {
  const { latest } = useDeskToolState();

  useConfigureSuggestions(
    {
      suggestions: deskFollowUpsForContext(latest),
      available: "after-first-message",
      consumerAgentId: COPILOT_AGENT_ID,
    },
    [latest?.tool, latest?.at, latest?.result, latest?.args],
  );

  return null;
}
