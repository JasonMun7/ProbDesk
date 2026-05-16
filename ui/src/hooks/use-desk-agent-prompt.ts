"use client";

import { COPILOT_AGENT_ID } from "@/lib/constants";
import { CopilotKitCoreRuntimeConnectionStatus } from "@copilotkit/core";
import type { AbstractAgent } from "@ag-ui/client";
import {
  useAgent,
  useCopilotChatConfiguration,
  useCopilotKit,
  UseAgentUpdate,
} from "@copilotkit/react-core/v2";
import { randomUUID } from "@copilotkit/shared";
import { useCallback, useEffect, useRef } from "react";

const AGENT_WAIT_MS = 20_000;
const AGENT_POLL_MS = 50;

function isRuntimeReady(
  status: CopilotKitCoreRuntimeConnectionStatus,
): boolean {
  return status === CopilotKitCoreRuntimeConnectionStatus.Connected;
}

async function waitForRegisteredAgent(
  copilotkit: ReturnType<typeof useCopilotKit>["copilotkit"],
  agentId: string,
): Promise<AbstractAgent | null> {
  const existing = copilotkit.getAgent(agentId);
  if (existing) return existing;

  return new Promise((resolve) => {
    const deadline = Date.now() + AGENT_WAIT_MS;
    let timer: ReturnType<typeof setInterval>;
    let subscription: { unsubscribe: () => void };

    const cleanup = () => {
      clearInterval(timer);
      subscription?.unsubscribe();
    };

    const tryResolve = () => {
      const agent = copilotkit.getAgent(agentId);
      if (agent) {
        cleanup();
        resolve(agent);
        return;
      }
      if (Date.now() >= deadline) {
        cleanup();
        resolve(null);
      }
    };

    timer = setInterval(tryResolve, AGENT_POLL_MS);
    subscription = copilotkit.subscribe({
      onAgentsChanged: tryResolve,
      onRuntimeConnectionStatusChanged: tryResolve,
    });
    tryResolve();
  });
}

/**
 * Sends a user message through the shared CopilotKit agent (same path as
 * in-sidebar suggestions) and opens the chat sidebar when triggered externally.
 */
export function useDeskAgentPrompt() {
  const { agent: hookAgent } = useAgent({
    agentId: COPILOT_AGENT_ID,
    updates: [UseAgentUpdate.OnRunStatusChanged],
  });
  const { copilotkit } = useCopilotKit();
  const chatConfig = useCopilotChatConfiguration();
  const runInFlightRef = useRef(false);
  const pendingPromptsRef = useRef<string[]>([]);
  const flushPendingRef = useRef<(() => void) | null>(null);

  const sendOnAgent = useCallback(
    async (target: AbstractAgent, trimmed: string) => {
      chatConfig?.setModalOpen(true);

      if (chatConfig?.threadId) {
        target.threadId = chatConfig.threadId;
      }

      runInFlightRef.current = true;
      target.addMessage({
        id: randomUUID(),
        role: "user",
        content: trimmed,
      });

      try {
        await copilotkit.runAgent({ agent: target });
      } catch {
        // Agent errors surface in the CopilotKit sidebar UI.
      } finally {
        runInFlightRef.current = false;
        flushPendingRef.current?.();
      }
    },
    [chatConfig, copilotkit],
  );

  const runPrompt = useCallback(
    async (message: string) => {
      const trimmed = message.trim();
      if (!trimmed) {
        return;
      }
      if (runInFlightRef.current) {
        pendingPromptsRef.current.push(trimmed);
        return;
      }

      chatConfig?.setModalOpen(true);

      let target = copilotkit.getAgent(COPILOT_AGENT_ID);
      if (!target) {
        const registered = await waitForRegisteredAgent(
          copilotkit,
          COPILOT_AGENT_ID,
        );
        if (registered) target = registered;
      }

      if (!target) {
        pendingPromptsRef.current.push(trimmed);
        return;
      }

      await sendOnAgent(target, trimmed);
    },
    [chatConfig, copilotkit, sendOnAgent],
  );

  const flushPending = useCallback(() => {
    if (runInFlightRef.current || pendingPromptsRef.current.length === 0) {
      return;
    }
    const target = copilotkit.getAgent(COPILOT_AGENT_ID);
    if (!target || !isRuntimeReady(copilotkit.runtimeConnectionStatus)) {
      return;
    }

    const next = pendingPromptsRef.current.shift();
    if (!next) return;

    void sendOnAgent(target, next);
  }, [copilotkit, sendOnAgent]);

  flushPendingRef.current = flushPending;

  useEffect(() => {
    if (!isRuntimeReady(copilotkit.runtimeConnectionStatus)) {
      return;
    }
    flushPending();
  }, [
    copilotkit.agents,
    copilotkit.runtimeConnectionStatus,
    flushPending,
  ]);

  useEffect(() => {
    const subscription = copilotkit.subscribe({
      onAgentsChanged: flushPending,
      onRuntimeConnectionStatusChanged: flushPending,
    });
    return () => subscription.unsubscribe();
  }, [copilotkit, flushPending]);

  const registered = copilotkit.getAgent(COPILOT_AGENT_ID);
  const isAgentReady =
    !!registered && isRuntimeReady(copilotkit.runtimeConnectionStatus);

  return {
    runPrompt,
    isRunning: (registered ?? hookAgent).isRunning,
    isAgentReady,
  };
}
