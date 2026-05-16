/**
 * CopilotKit / ADK tool payloads may be a JSON string or AG-UI content parts
 * (`[{ type: "text", text: "..." }]`).
 */
export function extractToolResultContent(raw: unknown): unknown {
  if (raw == null) return undefined;
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    return trimmed || undefined;
  }
  if (Array.isArray(raw)) {
    const parts: string[] = [];
    for (const item of raw) {
      if (typeof item === "string") {
        parts.push(item);
        continue;
      }
      if (!item || typeof item !== "object") continue;
      const row = item as Record<string, unknown>;
      const type = typeof row.type === "string" ? row.type : "";
      if (type === "tool-result" || type === "tool_result") {
        const nested = extractToolResultContent(row.output ?? row.result ?? row.content);
        if (typeof nested === "string") parts.push(nested);
        else if (nested != null) {
          try {
            parts.push(JSON.stringify(nested));
          } catch {
            /* skip */
          }
        }
        continue;
      }
      const output = row.output;
      if (output && typeof output === "object") {
        const out = output as Record<string, unknown>;
        if (typeof out.value === "string") parts.push(out.value);
        else if (typeof out.text === "string") parts.push(out.text);
      }
      if (typeof row.text === "string") parts.push(row.text);
      else if (typeof row.content === "string") parts.push(row.content);
      else if (typeof row.value === "string") parts.push(row.value);
    }
    const joined = parts.join("").trim();
    return joined || undefined;
  }
  if (typeof raw === "object") {
    const row = raw as Record<string, unknown>;
    if (row.output != null) return extractToolResultContent(row.output);
    if (row.value != null && typeof row.value === "string") return row.value;
  }
  return raw;
}

const KALSHI_PAYLOAD_KEYS = [
  "balance",
  "portfolio_value",
  "market_positions",
  "event_positions",
  "positions",
  "matches",
  "markets",
  "orderbook",
  "orderbook_fp",
  "error",
] as const;

function looksLikeKalshiPayload(obj: Record<string, unknown>): boolean {
  return KALSHI_PAYLOAD_KEYS.some((key) => key in obj);
}

/**
 * ADK / ag_ui_adk often wraps tool JSON as `{ "result": "<stringified json>" }`.
 * Unwrap so desk parsers see `balance`, `market_positions`, etc. at the top level.
 */
export function unwrapAdkToolEnvelope(
  data: Record<string, unknown>,
  depth = 0,
): Record<string, unknown> {
  if (depth > 5) return data;

  const onlyResult =
    "result" in data &&
    Object.keys(data).every((k) => k === "result" || k === "ok");

  if (onlyResult && data.result != null) {
    const inner = data.result;
    if (typeof inner === "string") {
      const parsed = parseToolJson(inner);
      if (parsed) {
        return unwrapAdkToolEnvelope(parsed, depth + 1);
      }
    } else if (typeof inner === "object" && !Array.isArray(inner)) {
      return unwrapAdkToolEnvelope(inner as Record<string, unknown>, depth + 1);
    }
  }

  if (looksLikeKalshiPayload(data)) {
    return data;
  }

  return data;
}

/** Normalize CopilotKit / ADK tool output for desk parsers. */
export function normalizeToolResult(raw: unknown): unknown {
  const content = extractToolResultContent(raw);
  if (content == null) {
    return undefined;
  }

  let record: Record<string, unknown> | null = null;
  if (typeof content === "object" && !Array.isArray(content)) {
    record = content as Record<string, unknown>;
  } else if (typeof content === "string") {
    record = parseToolJson(content);
    if (!record) return content;
  } else {
    return content;
  }

  return unwrapAdkToolEnvelope(record);
}

/** Best-effort JSON parse for ADK tool return strings. */
export function parseToolJson(raw: unknown): Record<string, unknown> | null {
  if (raw == null) return null;
  if (typeof raw === "object" && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  if (typeof raw !== "string") return null;
  let trimmed = raw.trim();
  if (trimmed.startsWith("```")) {
    trimmed = trimmed
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();
  }
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return null;
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return { data: parsed };
  } catch {
    return null;
  }
}

export function formatCents(cents: unknown): string {
  const n = Number(cents);
  if (Number.isNaN(n)) return "—";
  return `$${(n / 100).toFixed(2)}`;
}

export function formatPriceDollars(value: unknown): string {
  if (value == null || value === "") return "—";
  const n = Number(value);
  if (!Number.isNaN(n)) return `$${n.toFixed(2)}`;
  return String(value);
}
