"use client";

import { COPILOT_AGENT_ID } from "@/lib/constants";
import { useDeskChatThreads } from "@/hooks/use-desk-chat-threads";
import { useDeskToolState } from "@/lib/desk-tool-state";
import { useAgent, UseAgentUpdate } from "@copilotkit/react-core/v2";
import { useEffect, useRef } from "react";

/**
 * Keeps local thread titles in sync with the active agent transcript and
 * clears desk tool snapshots when the CopilotKit thread changes.
 */
export function DeskChatThreadsSync() {
  const { threadId, touchThreadFromMessage } = useDeskChatThreads();
  const { reset: resetDeskToolState } = useDeskToolState();
  const { agent } = useAgent({
    agentId: COPILOT_AGENT_ID,
    updates: [UseAgentUpdate.OnMessagesChanged],
    throttleMs: 400,
  });

  const prevThreadRef = useRef<string | null>(null);

  useEffect(() => {
    if (!threadId) return;
    if (prevThreadRef.current !== null && prevThreadRef.current !== threadId) {
      resetDeskToolState();
    }
    prevThreadRef.current = threadId;
  }, [threadId, resetDeskToolState]);

  useEffect(() => {
    const firstUser = agent.messages?.find((m) => m.role === "user");
    const text =
      typeof firstUser?.content === "string" ? firstUser.content : "";
    if (text) {
      touchThreadFromMessage(text);
    }
  }, [agent.messages, touchThreadFromMessage]);

  return null;
}
