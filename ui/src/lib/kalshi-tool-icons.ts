import type { LucideIcon } from "lucide-react";
import {
  ArrowLeftRight,
  Ban,
  BarChart2,
  Briefcase,
  Calendar,
  CircleDollarSign,
  ClipboardList,
  Layers,
  LayoutDashboard,
  ListFilter,
  Search,
  ShieldCheck,
  TrendingUp,
  Trophy,
  Wallet,
} from "lucide-react";
import type { KalshiRenderToolName } from "@/lib/kalshi-render-tools";

const KALSHI_TOOL_ICONS: Record<string, LucideIcon> = {
  kalshi_search_markets: Search,
  kalshi_get_markets: ListFilter,
  kalshi_sdk_get_markets: ListFilter,

  kalshi_get_orderbook: Layers,
  kalshi_sdk_get_market_orderbook: Layers,

  kalshi_sdk_get_balance: CircleDollarSign,
  kalshi_sdk_get_positions: Briefcase,
  kalshi_sdk_get_orders: ClipboardList,

  kalshi_sdk_create_order: ArrowLeftRight,
  kalshi_sdk_cancel_order: Ban,
  approve_kalshi_order: ShieldCheck,

  kalshi_get_market: BarChart2,
  kalshi_sdk_get_market: BarChart2,

  kalshi_get_series: Trophy,
  kalshi_sdk_get_series: Trophy,
  kalshi_get_event: Calendar,
  kalshi_sdk_get_event: Calendar,

  kalshi_get_live_quote: TrendingUp,
};

const DEFAULT_TOOL_ICON = LayoutDashboard;

/** Lucide icon for a Kalshi ADK tool name (chat cards, panel headers). */
export function getKalshiToolIcon(name: string): LucideIcon {
  return KALSHI_TOOL_ICONS[name] ?? DEFAULT_TOOL_ICON;
}

/**
 * Icon for the center desk portfolio section (balance + positions combined).
 * Uses the active tool when known; otherwise a portfolio umbrella icon.
 */
export function getKalshiPortfolioPanelIcon(tool: string): LucideIcon {
  if (tool === "kalshi_sdk_get_balance") return CircleDollarSign;
  if (tool === "kalshi_sdk_get_positions") return Briefcase;
  return Wallet;
}

/** Icons keyed by render tool name (for docs / tests). */
export const KALSHI_TOOL_ICON_BY_NAME = KALSHI_TOOL_ICONS satisfies Partial<
  Record<KalshiRenderToolName | "approve_kalshi_order", LucideIcon>
>;
