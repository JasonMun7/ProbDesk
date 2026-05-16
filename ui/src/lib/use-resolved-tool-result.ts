"use client";

import { COPILOT_AGENT_ID } from "@/lib/constants";
import { useDeskToolState } from "@/lib/desk-tool-state";
import { isDeskToolComplete } from "@/lib/desk-tool-status";
import { normalizeToolResult } from "@/lib/parse-tool-result";
import { completedSnapshotsFromAgentMessages } from "@/lib/sync-tool-snapshots-from-messages";
import { useAgent, UseAgentUpdate } from "@copilotkit/react-core/v2";
import { useMemo } from "react";

/**
 * Tool UI often renders "complete" before `toolMessage.content` is populated.
 * Resolve from render props, desk-tool-state, then the agent message log.
 */
export function useResolvedToolResult(
  tool: string,
  toolCallId: string | undefined,
  status: unknown,
  resultProp: unknown,
): unknown {
  const complete = isDeskToolComplete(status);
  const { balance, positions, latest } = useDeskToolState();
  const { agent } = useAgent({
    agentId: COPILOT_AGENT_ID,
    updates: [UseAgentUpdate.OnMessagesChanged],
    throttleMs: 0,
  });

  const fromProp = useMemo(() => {
    if (!complete || resultProp == null) return undefined;
    return normalizeToolResult(resultProp);
  }, [complete, resultProp]);

  const fromDesk = useMemo(() => {
    if (tool === "kalshi_sdk_get_balance" && balance?.result != null) {
      return balance.result;
    }
    if (tool === "kalshi_sdk_get_positions" && positions?.result != null) {
      return positions.result;
    }
    if (latest?.tool === tool && latest.result != null) {
      return latest.result;
    }
    return undefined;
  }, [tool, balance?.result, positions?.result, latest?.tool, latest?.result]);

  const fromMessages = useMemo(() => {
    if (!complete) return undefined;
    const snaps = completedSnapshotsFromAgentMessages(agent.messages ?? []);
    if (toolCallId) {
      const match = snaps.find((s) => s.toolCallId === toolCallId);
      if (match?.result != null) return match.result;
    }
    const byTool = snaps.filter((s) => s.tool === tool);
    return byTool.length > 0 ? byTool[byTool.length - 1]?.result : undefined;
  }, [agent.messages, complete, tool, toolCallId]);

  return fromProp ?? fromMessages ?? fromDesk;
}
