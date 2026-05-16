"use client";

import { COPILOT_AGENT_ID } from "@/lib/constants";
import { useDeskToolState } from "@/lib/desk-tool-state";
import { previewValue } from "@/lib/preview-value";
import {
  EXECUTION_DESK_TOOLS,
  PORTFOLIO_TOOLS,
} from "@/lib/kalshi-tool-parsers";
import { completedSnapshotsFromAgentMessages } from "@/lib/sync-tool-snapshots-from-messages";
import {
  useAgent,
  useCopilotKit,
  UseAgentUpdate,
} from "@copilotkit/react-core/v2";
import { useCallback, useEffect, useRef } from "react";

function resultSignature(result: unknown): string {
  if (result == null) return "";
  if (typeof result === "string") return result;
  try {
    return JSON.stringify(result);
  } catch {
    return String(result);
  }
}

/**
 * Syncs completed Kalshi tool results from the agent message log into desk-tool-state.
 */
export function DeskAgentToolBridge() {
  const { schedulePublish } = useDeskToolState();
  const { copilotkit } = useCopilotKit();
  const { agent } = useAgent({
    agentId: COPILOT_AGENT_ID,
    updates: [UseAgentUpdate.OnMessagesChanged],
    throttleMs: 0,
  });

  const publishedSigRef = useRef<Map<string, string>>(new Map());
  const lastSyncSigRef = useRef<string>("");

  const syncFromMessages = useCallback(() => {
    const messages = agent.messages ?? [];
    const snapshots = completedSnapshotsFromAgentMessages(messages);
    const syncSig = JSON.stringify(
      snapshots.map((s) => ({
        tool: s.tool,
        toolCallId: s.toolCallId,
        result: previewValue(s.result, 80),
      })),
    );
    if (syncSig === lastSyncSigRef.current) {
      return;
    }
    lastSyncSigRef.current = syncSig;

    for (const snap of snapshots) {
      const sig = resultSignature(snap.result);
      if (!sig) continue;
      const dedupeKey =
        PORTFOLIO_TOOLS.has(snap.tool) || EXECUTION_DESK_TOOLS.has(snap.tool)
          ? `tool:${snap.tool}`
          : `call:${snap.toolCallId}`;
      if (publishedSigRef.current.get(dedupeKey) === sig) continue;
      publishedSigRef.current.set(dedupeKey, sig);

      schedulePublish({
        tool: snap.tool,
        args: snap.args,
        result: snap.result,
        status: snap.status,
      });
    }
  }, [agent.messages, schedulePublish]);

  useEffect(() => {
    syncFromMessages();
  }, [syncFromMessages]);

  useEffect(() => {
    const subscription = copilotkit.subscribe({
      onToolExecutionEnd: () => {
        syncFromMessages();
      },
    });
    return () => subscription.unsubscribe();
  }, [copilotkit, syncFromMessages]);

  return null;
}
