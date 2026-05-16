"use client";

import { COPILOT_AGENT_ID } from "@/lib/constants";
import { DESK_CHAT_STARTERS } from "@/lib/desk-demo-prompts";
import { useConfigureSuggestions } from "@copilotkit/react-core/v2";

/** In-chat welcome starters (before the first user message). */
export function DeskStarterSuggestions() {
  useConfigureSuggestions({
    suggestions: DESK_CHAT_STARTERS.map(({ title, message }) => ({
      title,
      message,
    })),
    available: "before-first-message",
    consumerAgentId: COPILOT_AGENT_ID,
  });

  return null;
}
