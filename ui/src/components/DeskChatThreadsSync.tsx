"use client";

import { COPILOT_AGENT_ID } from "@/lib/constants";
import {
  loadThreadMessages,
  saveThreadMessages,
} from "@/lib/desk-chat-thread-messages-storage";
import { useDeskChatThreads } from "@/hooks/use-desk-chat-threads";
import { useDeskToolState } from "@/lib/desk-tool-state";
import { useAgent, UseAgentUpdate } from "@copilotkit/react-core/v2";
import { useEffect, useRef } from "react";

/**
 * Persists each thread's transcript in localStorage, restores on switch, and
 * keeps thread titles in sync with the active agent.
 */
export function DeskChatThreadsSync() {
  const { threadId, threads, touchThreadFromMessage, clearThreadHasMessages } =
    useDeskChatThreads();
  const { reset: resetDeskToolState } = useDeskToolState();
  const { agent } = useAgent({
    agentId: COPILOT_AGENT_ID,
    updates: [UseAgentUpdate.OnMessagesChanged],
    throttleMs: 400,
  });

  const prevThreadRef = useRef<string | null>(null);
  const persistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!threadId) return;

    const prev = prevThreadRef.current;
    const switched = prev !== null && prev !== threadId;
    const isFirstBind = prev === null;

    if (switched && prev) {
      if (persistTimerRef.current) {
        clearTimeout(persistTimerRef.current);
        persistTimerRef.current = null;
      }
      const outgoing = agent.messages ?? [];
      if (agent.threadId === prev && outgoing.length > 0) {
        saveThreadMessages(prev, [...outgoing]);
      }
    }

    if (switched) {
      resetDeskToolState();
    }

    if (isFirstBind || switched) {
      void agent.detachActiveRun().catch(() => {});
      agent.threadId = threadId;

      const cached = loadThreadMessages(threadId);
      const meta = threads.find((t) => t.id === threadId);

      if (cached && cached.length > 0) {
        agent.messages = cached;
      } else if (meta?.hasMessages) {
        agent.messages = [];
      } else {
        agent.messages = [];
      }
    } else if (agent.threadId !== threadId) {
      agent.threadId = threadId;
    }

    prevThreadRef.current = threadId;
  }, [threadId, threads, agent, resetDeskToolState]);

  useEffect(() => {
    if (!threadId || agent.threadId !== threadId) return;

    const msgs = agent.messages ?? [];
    if (msgs.length > 0) {
      if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
      persistTimerRef.current = setTimeout(() => {
        saveThreadMessages(threadId, [...(agent.messages ?? [])]);
      }, 250);
    }

    const firstUser = msgs.find((m) => m.role === "user");
    const text =
      typeof firstUser?.content === "string" ? firstUser.content : "";
    if (text) {
      touchThreadFromMessage(text);
      return;
    }

    const meta = threads.find((t) => t.id === threadId);
    if (msgs.length === 0 && !meta?.hasMessages) {
      clearThreadHasMessages(threadId);
    }

    return () => {
      if (persistTimerRef.current) {
        clearTimeout(persistTimerRef.current);
        persistTimerRef.current = null;
      }
    };
  }, [
    agent.messages,
    agent.threadId,
    threadId,
    threads,
    touchThreadFromMessage,
    clearThreadHasMessages,
    agent,
  ]);

  return null;
}
