import type { DeskToolStatus } from "@/lib/desk-tool-status";
import { KALSHI_RENDER_TOOL_NAMES } from "@/lib/kalshi-render-tools";
import {
  extractToolResultContent,
  normalizeToolResult,
} from "@/lib/parse-tool-result";

export type ToolSnapshotInput = {
  toolCallId: string;
  tool: string;
  args?: Record<string, unknown>;
  result?: unknown;
  status: DeskToolStatus;
};

const KALSHI_TOOLS = new Set<string>(KALSHI_RENDER_TOOL_NAMES);

function toolNameFromMessage(msg: Record<string, unknown>): string | undefined {
  const name = msg.name ?? msg.toolName;
  return typeof name === "string" ? name : undefined;
}

function toolContent(msg: Record<string, unknown>): unknown {
  if (msg.content != null) return msg.content;
  if (typeof msg.result === "string" || Array.isArray(msg.result)) {
    return msg.result;
  }
  if (msg.output != null) return msg.output;
  return undefined;
}

/**
 * Completed Kalshi tool results from the agent message log (one row per tool call).
 */
export function completedSnapshotsFromAgentMessages(
  messages: readonly unknown[],
): ToolSnapshotInput[] {
  const byCallId = new Map<
    string,
    {
      name: string;
      args?: Record<string, unknown>;
      result?: unknown;
    }
  >();

  for (const raw of messages) {
    if (!raw || typeof raw !== "object") continue;
    const msg = raw as Record<string, unknown>;
    const role = msg.role;

    if (role === "assistant") {
      const content = msg.content;
      if (Array.isArray(content)) {
        for (const part of content) {
          if (!part || typeof part !== "object") continue;
          const row = part as Record<string, unknown>;
          const partType = typeof row.type === "string" ? row.type : "";
          if (partType !== "tool-result" && partType !== "tool_result") {
            continue;
          }
          const toolCallId =
            typeof row.toolCallId === "string"
              ? row.toolCallId
              : typeof row.tool_call_id === "string"
                ? row.tool_call_id
                : undefined;
          const name =
            typeof row.toolName === "string"
              ? row.toolName
              : typeof row.name === "string"
                ? row.name
                : undefined;
          if (!toolCallId || !name || !KALSHI_TOOLS.has(name)) continue;
          const result = normalizeToolResult(
            extractToolResultContent(row.output ?? row.result ?? row.content),
          );
          if (result == null) continue;
          byCallId.set(toolCallId, {
            name,
            args: byCallId.get(toolCallId)?.args,
            result,
          });
        }
      }

      const toolCalls = msg.toolCalls ?? msg.tool_calls;
      if (!Array.isArray(toolCalls)) continue;
      for (const tc of toolCalls) {
        if (!tc || typeof tc !== "object") continue;
        const row = tc as Record<string, unknown>;
        const id = typeof row.id === "string" ? row.id : undefined;
        const fn =
          row.function && typeof row.function === "object"
            ? (row.function as Record<string, unknown>)
            : null;
        const name = fn && typeof fn.name === "string" ? fn.name : undefined;
        if (!id || !name || !KALSHI_TOOLS.has(name)) continue;

        let args: Record<string, unknown> | undefined;
        if (fn && typeof fn.arguments === "string") {
          try {
            args = JSON.parse(fn.arguments) as Record<string, unknown>;
          } catch {
            args = undefined;
          }
        } else if (fn && fn.arguments && typeof fn.arguments === "object") {
          args = fn.arguments as Record<string, unknown>;
        }

        if (!byCallId.has(id)) {
          byCallId.set(id, { name, args });
        }
      }
    }

    if (role === "tool") {
      const toolCallId =
        typeof msg.toolCallId === "string"
          ? msg.toolCallId
          : typeof msg.tool_call_id === "string"
            ? msg.tool_call_id
            : typeof msg.id === "string"
              ? msg.id
              : undefined;
      const nameFromMsg = toolNameFromMessage(msg);
      const existing = toolCallId ? byCallId.get(toolCallId) : undefined;
      const name = existing?.name ?? nameFromMsg ?? "";
      if (!name || !KALSHI_TOOLS.has(name)) continue;

      const content = toolContent(msg);
      const result = normalizeToolResult(content);
      if (result == null) continue;

      const key =
        toolCallId ??
        `name:${name}:${typeof content === "string" ? content.slice(0, 64) : JSON.stringify(content).slice(0, 64)}`;

      byCallId.set(key, {
        name,
        args: existing?.args,
        result,
      });
    }
  }

  const out: ToolSnapshotInput[] = [];
  for (const [toolCallId, row] of byCallId) {
    if (row.result == null) continue;
    out.push({
      toolCallId: toolCallId.startsWith("name:") ? row.name : toolCallId,
      tool: row.name,
      args: row.args,
      result: row.result,
      status: "complete",
    });
  }

  return out;
}
