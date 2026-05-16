import { z } from "zod";

export const probDeskA2UIMetricProps = z.object({
  label: z.string().describe("Metric label, e.g. Cash balance"),
  value: z.string().describe("Formatted display value"),
  hint: z.string().optional().describe("Secondary line under the value"),
});

export const probDeskA2UIStatusBadgeProps = z.object({
  label: z.string().describe("Badge text"),
  status: z
    .enum(["open", "closed", "active", "unknown"])
    .describe("Market or session status"),
});

export const probDeskA2UIKalshiMarketCardProps = z.object({
  ticker: z.string(),
  title: z.string(),
  yesBid: z.string().optional(),
  yesAsk: z.string().optional(),
  status: z.string().optional(),
});

export const probDeskA2UIDefinitions = {
  Metric: {
    props: probDeskA2UIMetricProps,
    description: "Single KPI for balance, portfolio value, or P&L",
  },
  StatusBadge: {
    props: probDeskA2UIStatusBadgeProps,
    description: "Compact status pill for market or workflow state",
  },
  KalshiMarketCard: {
    props: probDeskA2UIKalshiMarketCardProps,
    description: "Kalshi market summary card with yes bid/ask",
  },
} as const;
