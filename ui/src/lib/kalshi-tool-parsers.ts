import { parseToolJson } from "@/lib/parse-tool-result";
import type { KalshiMarketSummary, MarketSearchResult } from "@/lib/types";

export const SEARCH_TOOLS = new Set(["kalshi_search_markets"]);

export const ORDERBOOK_TOOLS = new Set([
  "kalshi_get_orderbook",
  "kalshi_sdk_get_market_orderbook",
]);

export const ORDER_EXECUTION_TOOLS = new Set([
  "kalshi_sdk_create_order",
  "kalshi_sdk_cancel_order",
  "approve_kalshi_order",
]);

/** Tools that drive the center-panel trade receipt (not HITL approval). */
export const EXECUTION_DESK_TOOLS = new Set([
  "kalshi_sdk_create_order",
  "kalshi_sdk_cancel_order",
]);

export const PORTFOLIO_TOOLS = new Set([
  "kalshi_sdk_get_balance",
  "kalshi_sdk_get_positions",
]);

export type SearchPanelData = {
  markets: KalshiMarketSummary[];
  query?: string;
  error?: string;
  hint?: string;
  apiError?: string;
  ok?: boolean;
};

export function parseSearchResult(result: unknown): SearchPanelData {
  const data = parseToolJson(result) as MarketSearchResult | null;
  if (!data) {
    return { markets: [] };
  }

  const rawList = data.matches ?? data.markets ?? [];
  const markets = (Array.isArray(rawList) ? rawList : []).map(normalizeMarket);

  return {
    markets,
    query: data.query,
    error: data.error,
    hint: data.hint,
    apiError:
      typeof data.api_error === "string" ? data.api_error : undefined,
    ok: data.ok,
  };
}

export function marketsFromResult(result: unknown): KalshiMarketSummary[] {
  return parseSearchResult(result).markets;
}

function normalizeMarket(row: KalshiMarketSummary): KalshiMarketSummary {
  const score =
    row.score ??
    (typeof (row as Record<string, unknown>).match_score === "number"
      ? (row as Record<string, unknown>).match_score
      : undefined);

  return { ...row, score: score as number | undefined };
}

export type OrderbookLevel = [price: number, quantity: number];

export type ParsedOrderbook = {
  ticker?: string;
  yes: OrderbookLevel[];
  no: OrderbookLevel[];
};

export type OrderbookMetrics = {
  yesBid?: number;
  yesAsk?: number;
  mid?: number;
  spreadDollars?: number;
  spreadPct?: number;
};

function orderbookLevelsSource(
  data: Record<string, unknown>,
): Record<string, unknown> {
  if (data.orderbook_fp && typeof data.orderbook_fp === "object") {
    return data.orderbook_fp as Record<string, unknown>;
  }
  if (data.orderbook && typeof data.orderbook === "object") {
    return data.orderbook as Record<string, unknown>;
  }
  if (data.market && typeof data.market === "object") {
    return data.market as Record<string, unknown>;
  }
  return data;
}

export function parseOrderbook(result: unknown): ParsedOrderbook | null {
  const data = parseToolJson(result);
  if (!data) return null;

  const levels = orderbookLevelsSource(data);

  const yes = normalizeLevels(
    levels.yes ??
      levels.yes_dollars ??
      data.yes ??
      data.yes_dollars,
  );
  const no = normalizeLevels(
    levels.no ??
      levels.no_dollars ??
      data.no ??
      data.no_dollars,
  );

  const ticker =
    pickString(data, "ticker", "market_ticker") ??
    pickString(levels, "ticker", "market_ticker");

  if (yes.length === 0 && no.length === 0) return null;
  return { ticker, yes, no };
}

/** Fast check for Kalshi orderbook_fp payloads (before full parse). */
export function hasOrderbookPayload(result: unknown): boolean {
  const data = parseToolJson(result);
  if (!data) return false;
  if (data.error) return true;
  const levels = orderbookLevelsSource(data);
  return (
    Array.isArray(levels.yes) ||
    Array.isArray(levels.yes_dollars) ||
    Array.isArray(levels.no) ||
    Array.isArray(levels.no_dollars) ||
    Array.isArray(data.yes) ||
    Array.isArray(data.no)
  );
}

export function orderbookMetrics(book: ParsedOrderbook): OrderbookMetrics {
  const yesBid = topPrice(book.yes);
  const noBid = topPrice(book.no);
  let yesAsk: number | undefined;

  if (noBid != null) {
    yesAsk = noBid <= 1 ? round4(1 - noBid) : round4((100 - noBid) / 100);
  }

  if (yesBid == null || yesAsk == null) {
    return { yesBid, yesAsk };
  }

  const spreadDollars = round4(yesAsk - yesBid);
  const mid = round4((yesBid + yesAsk) / 2);
  const spreadPct =
    mid > 0 ? round4((spreadDollars / mid) * 100) : undefined;

  return { yesBid, yesAsk, mid, spreadDollars, spreadPct };
}

function topPrice(levels: OrderbookLevel[]): number | undefined {
  if (!levels.length) return undefined;
  const sorted = [...levels].sort((a, b) => b[0] - a[0]);
  const p = sorted[0]?.[0];
  return p == null || Number.isNaN(p) ? undefined : p;
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

function pickString(
  obj: Record<string, unknown>,
  ...keys: string[]
): string | undefined {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.trim()) return v;
  }
  return undefined;
}

function normalizeLevels(value: unknown): OrderbookLevel[] {
  if (!Array.isArray(value)) return [];
  const out: OrderbookLevel[] = [];
  for (const row of value) {
    if (!Array.isArray(row) || row.length < 2) continue;
    const p = Number(row[0]);
    const q = Number(row[1]);
    if (!Number.isNaN(p) && !Number.isNaN(q)) out.push([p, q]);
  }
  return out;
}

export type ParsedBalance = {
  cash?: number;
  portfolioValue?: number;
  error?: string;
  hint?: string;
  isAuthError?: boolean;
};

export function parseBalance(result: unknown): ParsedBalance | null {
  const data = parseToolJson(result);
  if (!data) return null;

  if (data.error) {
    const err = String(data.error);
    return {
      error: err,
      hint: data.hint ? String(data.hint) : undefined,
      isAuthError: /credential|not configured|auth/i.test(err),
    };
  }

  const balanceObj =
    data.balance && typeof data.balance === "object" && !Array.isArray(data.balance)
      ? (data.balance as Record<string, unknown>)
      : undefined;

  const cash = numberish(
    balanceObj?.balance ??
      balanceObj?.available_balance ??
      (typeof data.balance === "number" ? data.balance : undefined) ??
      data.available_balance ??
      data.available_balance_cents,
  );
  const portfolioValue = numberish(
    balanceObj?.portfolio_value ??
      balanceObj?.portfolio_value_cents ??
      data.portfolio_value ??
      data.portfolio_value_cents,
  );

  return { cash, portfolioValue };
}

export type ParsedPosition = {
  ticker: string;
  side?: "yes" | "no";
  quantity?: number;
  pnl?: number;
  exposure?: number;
};

export function parsePositions(result: unknown): {
  positions: ParsedPosition[];
  error?: string;
  hint?: string;
  isAuthError?: boolean;
} {
  const data = parseToolJson(result);
  if (!data) return { positions: [] };

  if (data.error) {
    const err = String(data.error);
    return {
      positions: [],
      error: err,
      hint: data.hint ? String(data.hint) : undefined,
      isAuthError: /credential|not configured|auth/i.test(err),
    };
  }

  const market = data.market_positions;
  const events = data.event_positions;
  const legacy = data.positions ?? (data.position ? [data.position] : []);

  const list: Record<string, unknown>[] = [];
  if (Array.isArray(market)) {
    for (const row of market) {
      if (row && typeof row === "object") list.push(row as Record<string, unknown>);
    }
  }
  if (Array.isArray(events)) {
    for (const row of events) {
      if (row && typeof row === "object") {
        const e = row as Record<string, unknown>;
        list.push({
          ticker: e.event_ticker ?? e.ticker,
          market_exposure_dollars: e.event_exposure_dollars ?? e.event_exposure,
          realized_pnl_dollars: e.realized_pnl_dollars,
          fees_paid_dollars: e.fees_paid_dollars,
          total_traded_dollars: e.total_cost_dollars,
          position_fp: e.total_cost_shares_fp ?? e.total_cost_shares,
        });
      }
    }
  }
  if (list.length === 0 && Array.isArray(legacy)) {
    for (const row of legacy) {
      if (row && typeof row === "object") list.push(row as Record<string, unknown>);
    }
  }

  const positions = list.map((row, i) => normalizePosition(row, i));

  return { positions };
}

function normalizePosition(
  row: Record<string, unknown>,
  index: number,
): ParsedPosition {
  const ticker =
    pickString(row, "ticker", "market_ticker") ?? `position-${index}`;
  const qty = numberish(
    row.position_fp ??
      row.position ??
      row.total_traded ??
      row.count ??
      row.quantity,
  );
  let side: "yes" | "no" | undefined;
  if (typeof row.side === "string") {
    const s = row.side.toLowerCase();
    if (s === "yes" || s === "no") side = s;
  } else if (qty != null && qty !== 0) {
    side = qty > 0 ? "yes" : "no";
  }

  const pnl = numberish(
    row.realized_pnl ??
      row.pnl ??
      row.unrealized_pnl ??
      row.total_pnl,
  );
  const exposure =
    kalshiCentsFromDollarsField(row.market_exposure_dollars) ??
    numberish(row.market_exposure ?? row.exposure);

  const pnlResolved =
    kalshiCentsFromDollarsField(row.realized_pnl_dollars) ?? pnl;

  return {
    ticker,
    side,
    quantity: qty != null ? Math.abs(qty) : undefined,
    pnl: pnlResolved,
    exposure,
  };
}

/** Kalshi `*_dollars` fields are decimal strings; balance ints are already cents. */
function kalshiCentsFromDollarsField(value: unknown): number | undefined {
  if (value == null || value === "") return undefined;
  const n = Number(value);
  if (Number.isNaN(n)) return undefined;
  return Math.round(n * 100);
}

function numberish(value: unknown): number | undefined {
  if (value == null || value === "") return undefined;
  const n = Number(value);
  return Number.isNaN(n) ? undefined : n;
}

export function marketSpreadHint(market: KalshiMarketSummary): string | null {
  const bid = dollarNumber(market.yes_bid_dollars);
  const ask = dollarNumber(market.yes_ask_dollars);
  if (bid == null || ask == null || ask <= bid) return null;
  const spread = ask - bid;
  const mid = (bid + ask) / 2;
  const pct = mid > 0 ? (spread / mid) * 100 : 0;
  return `${(spread * 100).toFixed(1)}¢ · ${pct.toFixed(1)}%`;
}

function dollarNumber(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

export function formatDeskTime(at: number): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(at));
}

const TOOL_DISPLAY_NAMES: Record<string, string> = {
  kalshi_sdk_create_order: "Place Kalshi order",
  kalshi_sdk_cancel_order: "Cancel Kalshi order",
  approve_kalshi_order: "Order approval",
};

export function humanToolName(tool: string): string {
  if (TOOL_DISPLAY_NAMES[tool]) return TOOL_DISPLAY_NAMES[tool];
  return tool.replace(/^kalshi_(sdk_)?/, "").replaceAll("_", " ");
}

export type ParsedOrderExecution = {
  orderId?: string;
  status?: string;
  ticker?: string;
  side?: string;
  action?: string;
  count?: number;
  orderType?: string;
  yesPrice?: number;
  noPrice?: number;
  error?: string;
  hint?: string;
  isAuthError?: boolean;
  cancelled?: boolean;
};

function readOrderNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

export function parseOrderExecution(
  result: unknown,
  args?: Record<string, unknown>,
): ParsedOrderExecution {
  const data = parseToolJson(result);
  if (!data) return {};
  const err = data.error;
  if (typeof err === "string" && err.trim()) {
    const lower = err.toLowerCase();
    return {
      error: err,
      ticker:
        typeof args?.ticker === "string" ? args.ticker : undefined,
      side: typeof args?.side === "string" ? args.side : undefined,
      action: typeof args?.action === "string" ? args.action : undefined,
      count: readOrderNumber(args?.count),
      hint:
        typeof data.hint === "string"
          ? data.hint
          : lower.includes("credential") || lower.includes("auth")
            ? "Set Kalshi keys in the repo root .env and restart the ADK agent."
            : undefined,
      isAuthError:
        lower.includes("credential") ||
        lower.includes("auth") ||
        lower.includes("401"),
    };
  }
  const order =
    data.order && typeof data.order === "object"
      ? (data.order as Record<string, unknown>)
      : data;
  const orderId = order.order_id ?? order.id;
  const status = order.status;
  const ticker =
    order.ticker ?? order.market_ticker ?? args?.ticker ?? args?.market_ticker;
  const side = order.side ?? args?.side;
  const action = order.action ?? args?.action;
  const count = readOrderNumber(order.count ?? order.remaining_count ?? args?.count);
  const orderType = order.type ?? order.order_type ?? args?.order_type;
  const yesPrice = readOrderNumber(order.yes_price ?? args?.yes_price);
  const noPrice = readOrderNumber(order.no_price ?? args?.no_price);
  return {
    orderId: orderId != null ? String(orderId) : undefined,
    status: status != null ? String(status) : undefined,
    ticker: ticker != null ? String(ticker) : undefined,
    side: side != null ? String(side) : undefined,
    action: action != null ? String(action) : undefined,
    count,
    orderType: orderType != null ? String(orderType) : undefined,
    yesPrice,
    noPrice,
    cancelled: data.cancelled === true || order.status === "canceled",
  };
}

export function shouldShowExecutionDeskPanel(
  execution: { tool: string; at: number; status: string } | null,
  latest: { tool: string; at: number } | null,
): boolean {
  if (!execution || !EXECUTION_DESK_TOOLS.has(execution.tool)) return false;
  if (!latest) return true;
  if (EXECUTION_DESK_TOOLS.has(latest.tool)) return true;
  const panelTools = new Set([
    ...SEARCH_TOOLS,
    ...ORDERBOOK_TOOLS,
    ...PORTFOLIO_TOOLS,
  ]);
  if (panelTools.has(latest.tool) && latest.at > execution.at) return false;
  return true;
}

/** CopilotKit / AG-UI session keys — not user-facing desk state. */
export function isInternalAgentStateKey(key: string): boolean {
  return key.startsWith("_");
}

export function filterMeaningfulAgentState(
  state: Record<string, unknown>,
): Record<string, unknown> | null {
  const entries = Object.entries(state).filter(
    ([k, v]) => !isInternalAgentStateKey(k) && v != null && v !== "",
  );
  if (entries.length === 0) return null;
  return Object.fromEntries(entries);
}

function toolRunning(status?: string): boolean {
  return status !== "complete" && status !== "error";
}

/** Short copy for inline chat hints (no raw tool ids). */
export function chatToolHintMessage(tool: string, status?: string): string {
  const running = toolRunning(status);

  if (PORTFOLIO_TOOLS.has(tool)) {
    return running ? "Updating portfolio on the desk…" : "Portfolio updated on the desk";
  }
  if (SEARCH_TOOLS.has(tool)) {
    return running ? "Searching markets…" : "Markets ready on the desk";
  }
  if (ORDERBOOK_TOOLS.has(tool)) {
    return running ? "Loading order book…" : "Order book updated on the desk";
  }
  if (ORDER_EXECUTION_TOOLS.has(tool)) {
    if (tool === "kalshi_sdk_cancel_order") {
      return running ? "Cancelling order…" : "Cancel request finished";
    }
    if (tool === "approve_kalshi_order") {
      return running ? "Awaiting your approval…" : "Approval recorded";
    }
    return running ? "Submitting order to Kalshi…" : "Order response ready";
  }

  const label = humanToolName(tool);
  return running ? `Running ${label}…` : `${label} updated on the desk`;
}

