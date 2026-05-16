"use client";

import { DeskChatToolCard } from "@/components/DeskChatToolCard";
import { COPILOT_AGENT_ID } from "@/lib/constants";
import { useDeskToolState } from "@/lib/desk-tool-state";
import {
  isDeskToolComplete,
  normalizeDeskToolStatus,
  type DeskToolStatus,
} from "@/lib/desk-tool-status";
import {
  KALSHI_RENDER_TOOL_NAMES,
  KALSHI_TOOL_PARAMETER_SCHEMAS,
  type KalshiRenderToolName,
} from "@/lib/kalshi-render-tools";
import { normalizeToolResult } from "@/lib/parse-tool-result";
import { useDefaultRenderTool, useRenderTool } from "@copilotkit/react-core/v2";
import { useRef } from "react";

function useScheduleDeskToolPublish() {
  const { schedulePublish } = useDeskToolState();
  return schedulePublish;
}

function resultForDesk(
  status: unknown,
  result: unknown,
): unknown | undefined {
  if (!isDeskToolComplete(status)) return undefined;
  if (result == null) return undefined;
  return normalizeToolResult(result);
}

function publishKey(
  tool: string,
  status: DeskToolStatus,
  result: unknown | undefined,
): string {
  const r =
    result == null
      ? ""
      : typeof result === "string"
        ? result.slice(0, 120)
        : JSON.stringify(result)?.slice(0, 120) ?? "";
  return `${tool}:${status}:${r}`;
}

function useKalshiToolRenderer(name: KalshiRenderToolName) {
  const schedulePublish = useScheduleDeskToolPublish();
  const lastPublishKeyRef = useRef<string>("");
  const parameters = KALSHI_TOOL_PARAMETER_SCHEMAS[name];

  useRenderTool(
    {
      name,
      parameters,
      agentId: COPILOT_AGENT_ID,
      render: ({ parameters: args, result, status, toolCallId }) => {
        const normalized = normalizeDeskToolStatus(status);
        const parsed = resultForDesk(normalized, result);
        const key = publishKey(name, normalized, parsed);
        if (
          parsed != null &&
          key !== lastPublishKeyRef.current
        ) {
          lastPublishKeyRef.current = key;
          schedulePublish({
            tool: name,
            args: args as Record<string, unknown>,
            result: parsed,
            status: normalized,
          });
        }
        return (
          <DeskChatToolCard
            name={name}
            status={normalized}
            args={args as Record<string, unknown>}
            result={result}
            toolCallId={toolCallId}
          />
        );
      },
    },
    [schedulePublish, name],
  );
}

function KalshiNamedToolRenderers() {
  useKalshiToolRenderer("kalshi_search_markets");
  useKalshiToolRenderer("kalshi_get_markets");
  useKalshiToolRenderer("kalshi_get_market");
  useKalshiToolRenderer("kalshi_get_orderbook");
  useKalshiToolRenderer("kalshi_get_series");
  useKalshiToolRenderer("kalshi_get_event");
  useKalshiToolRenderer("kalshi_get_live_quote");
  useKalshiToolRenderer("kalshi_sdk_get_balance");
  useKalshiToolRenderer("kalshi_sdk_get_positions");
  useKalshiToolRenderer("kalshi_sdk_get_orders");
  useKalshiToolRenderer("kalshi_sdk_get_markets");
  useKalshiToolRenderer("kalshi_sdk_get_market");
  useKalshiToolRenderer("kalshi_sdk_get_market_orderbook");
  useKalshiToolRenderer("kalshi_sdk_get_series");
  useKalshiToolRenderer("kalshi_sdk_get_event");
  useKalshiToolRenderer("kalshi_sdk_create_order");
  useKalshiToolRenderer("kalshi_sdk_cancel_order");
  return null;
}

/** v2 tool rendering for Kalshi ADK backend tools + default fallback for MCP tools. */
export function KalshiToolRendering() {
  const schedulePublish = useScheduleDeskToolPublish();
  const lastWildcardKeyRef = useRef<string>("");

  useDefaultRenderTool({
    render: (props) => {
      const { name, parameters, status, result } = props;
      const toolCallId =
        "toolCallId" in props && typeof props.toolCallId === "string"
          ? props.toolCallId
          : undefined;
      const normalized = normalizeDeskToolStatus(status);
      const parsed = resultForDesk(normalized, result);
      const key = publishKey(name, normalized, parsed);

      if (parsed != null && key !== lastWildcardKeyRef.current) {
        lastWildcardKeyRef.current = key;
        schedulePublish({
          tool: name,
          args:
            parameters && typeof parameters === "object"
              ? (parameters as Record<string, unknown>)
              : undefined,
          result: parsed,
          status: normalized,
        });
      }

      const cardArgs =
        parameters && typeof parameters === "object"
          ? (parameters as Record<string, unknown>)
          : undefined;

      return (
        <DeskChatToolCard
          name={name}
          status={normalized}
          args={cardArgs}
          result={result}
          toolCallId={toolCallId}
        />
      );
    },
  });

  return <KalshiNamedToolRenderers />;
}
