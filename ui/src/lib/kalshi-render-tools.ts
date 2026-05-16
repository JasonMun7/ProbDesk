import { z } from "zod";

/** ADK tool names — must match `prob_desk.agents.tools` exactly. */
export const KALSHI_RENDER_TOOL_NAMES = [
  "kalshi_search_markets",
  "kalshi_get_markets",
  "kalshi_get_market",
  "kalshi_get_orderbook",
  "kalshi_get_series",
  "kalshi_get_event",
  "kalshi_get_live_quote",
  "kalshi_sdk_get_balance",
  "kalshi_sdk_get_positions",
  "kalshi_sdk_get_orders",
  "kalshi_sdk_get_markets",
  "kalshi_sdk_get_market",
  "kalshi_sdk_get_market_orderbook",
  "kalshi_sdk_get_series",
  "kalshi_sdk_get_event",
  "kalshi_sdk_create_order",
  "kalshi_sdk_cancel_order",
] as const;

export type KalshiRenderToolName = (typeof KALSHI_RENDER_TOOL_NAMES)[number];

const marketTicker = z.object({
  market_ticker: z.string().describe("Kalshi market ticker"),
});

export const KALSHI_TOOL_PARAMETER_SCHEMAS: Record<
  KalshiRenderToolName,
  z.ZodTypeAny
> = {
  kalshi_search_markets: z.object({
    query: z.string().describe("Natural language market search query"),
    limit: z.number().optional(),
    status: z.string().optional(),
  }),
  kalshi_get_markets: z.object({
    series_ticker: z.string().optional(),
    event_ticker: z.string().optional(),
    limit: z.number().optional(),
    status: z.string().optional(),
  }),
  kalshi_get_market: marketTicker,
  kalshi_get_orderbook: marketTicker,
  kalshi_get_series: z.object({
    series_ticker: z.string(),
  }),
  kalshi_get_event: z.object({
    event_ticker: z.string(),
  }),
  kalshi_get_live_quote: marketTicker,
  kalshi_sdk_get_balance: z.object({}),
  kalshi_sdk_get_positions: z.object({
    limit: z.number().optional(),
    cursor: z.string().optional(),
  }),
  kalshi_sdk_get_orders: z.object({
    limit: z.number().optional(),
    cursor: z.string().optional(),
  }),
  kalshi_sdk_get_markets: z.object({
    series_ticker: z.string().optional(),
    event_ticker: z.string().optional(),
    limit: z.number().optional(),
    status: z.string().optional(),
  }),
  kalshi_sdk_get_market: marketTicker,
  kalshi_sdk_get_market_orderbook: marketTicker,
  kalshi_sdk_get_series: z.object({
    series_ticker: z.string(),
  }),
  kalshi_sdk_get_event: z.object({
    event_ticker: z.string(),
  }),
  kalshi_sdk_create_order: z.object({
    ticker: z.string(),
    side: z.string(),
    action: z.string(),
    count: z.number().int().positive(),
    order_type: z.string().optional(),
    yes_price: z.number().int().optional(),
    no_price: z.number().int().optional(),
    time_in_force: z.string().optional(),
    client_order_id: z.string().optional(),
  }),
  kalshi_sdk_cancel_order: z.object({
    order_id: z.string(),
  }),
};
