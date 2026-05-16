import type { DeskSnapshot } from "@/lib/desk-tool-state";
import {
  marketsFromResult,
  ORDERBOOK_TOOLS,
  parseOrderbook,
  PORTFOLIO_TOOLS,
  SEARCH_TOOLS,
} from "@/lib/kalshi-tool-parsers";

export type DeskFollowUp = {
  title: string;
  message: string;
};

const PORTFOLIO: DeskFollowUp[] = [
  {
    title: "Open positions",
    message: "Show my open positions with kalshi_sdk_get_positions.",
  },
  {
    title: "Cash balance",
    message: "What's my cash balance? Use kalshi_sdk_get_balance.",
  },
  {
    title: "Search to trade",
    message: "Search Kalshi for a market I can trade.",
  },
];

const SEARCH: DeskFollowUp[] = [
  {
    title: "Top match orderbook",
    message:
      "Show the orderbook for the top search match (use its ticker).",
  },
  {
    title: "Summarize risk",
    message: "Summarize risk and liquidity for these search results.",
  },
  {
    title: "My portfolio",
    message:
      "Call kalshi_sdk_get_balance and kalshi_sdk_get_positions for my portfolio.",
  },
];

const ORDERBOOK: DeskFollowUp[] = [
  {
    title: "Spread & liquidity",
    message: "Summarize spread and liquidity on this orderbook.",
  },
  {
    title: "My position",
    message: "Do I have a position in this market? Check my portfolio.",
  },
  {
    title: "Related markets",
    message: "Search for related Kalshi markets to compare.",
  },
];

const ORDERS: DeskFollowUp[] = [
  {
    title: "Open positions",
    message: "Show my open positions.",
  },
  {
    title: "Recent fills",
    message: "Summarize my recent orders and fills.",
  },
  {
    title: "Search markets",
    message: "Search Kalshi for Scottie Scheffler PGA.",
  },
];

const DEFAULT: DeskFollowUp[] = [
  {
    title: "My portfolio",
    message:
      "Call kalshi_sdk_get_balance and kalshi_sdk_get_positions for my portfolio.",
  },
  {
    title: "PGA search",
    message: "Search Kalshi for Scottie Scheffler PGA",
  },
  {
    title: "Summarize risk",
    message: "Summarize my desk risk given what you know so far.",
  },
];

function tickerFromSnapshot(latest: DeskSnapshot): string | undefined {
  const fromArgs = latest.args?.ticker ?? latest.args?.market_ticker;
  if (typeof fromArgs === "string" && fromArgs.trim()) {
    return fromArgs.trim();
  }
  const book = parseOrderbook(latest.result);
  if (book?.ticker?.trim()) return book.ticker.trim();
  const markets = marketsFromResult(latest.result);
  const top = markets[0]?.ticker;
  return typeof top === "string" && top.trim() ? top.trim() : undefined;
}

/** Contextual follow-ups from the latest desk tool snapshot (post-response strip). */
export function deskFollowUpsForContext(
  latest: DeskSnapshot | null,
): DeskFollowUp[] {
  if (!latest?.tool) {
    return DEFAULT;
  }

  const tool = latest.tool;

  if (SEARCH_TOOLS.has(tool)) {
    const markets = marketsFromResult(latest.result);
    const top = markets[0];
    const query =
      typeof latest.args?.query === "string"
        ? latest.args.query.trim()
        : undefined;

    if (top?.ticker) {
      const label = top.title?.trim() || top.ticker;
      return [
        {
          title: "Orderbook",
          message: `Show the orderbook for ${top.ticker}.`,
        },
        {
          title: "Compare matches",
          message: `Compare liquidity and prices for ${label} vs the other search results.`,
        },
        {
          title: "My portfolio",
          message:
            "Call kalshi_sdk_get_balance and kalshi_sdk_get_positions for my portfolio.",
        },
      ];
    }

    if (query) {
      return [
        {
          title: "Refine search",
          message: `Search Kalshi again for "${query}" with status open.`,
        },
        ...SEARCH.slice(1),
      ];
    }

    return SEARCH;
  }

  if (ORDERBOOK_TOOLS.has(tool)) {
    const ticker = tickerFromSnapshot(latest);
    if (ticker) {
      return [
        {
          title: "Spread & liquidity",
          message: `Summarize spread and liquidity on the orderbook for ${ticker}.`,
        },
        {
          title: "My position",
          message: `Do I have a position in ${ticker}? Check my portfolio.`,
        },
        {
          title: "Related markets",
          message: `Search Kalshi for markets related to ${ticker}.`,
        },
      ];
    }
    return ORDERBOOK;
  }

  if (PORTFOLIO_TOOLS.has(tool)) {
    if (tool === "kalshi_sdk_get_balance") {
      return [
        {
          title: "Open positions",
          message: "Show my open positions with kalshi_sdk_get_positions.",
        },
        {
          title: "Risk summary",
          message:
            "Summarize my desk risk using my balance and positions.",
        },
        {
          title: "Search to trade",
          message: "Search Kalshi for a market I can trade.",
        },
      ];
    }
    if (tool === "kalshi_sdk_get_positions") {
      return [
        {
          title: "Cash balance",
          message: "What's my cash balance? Use kalshi_sdk_get_balance.",
        },
        {
          title: "Risk summary",
          message:
            "Summarize exposure and risk across my open positions.",
        },
        {
          title: "Search to trade",
          message: "Search Kalshi for a market I can trade.",
        },
      ];
    }
    return PORTFOLIO;
  }

  if (tool === "kalshi_sdk_get_orders") {
    return ORDERS;
  }

  const ticker = tickerFromSnapshot(latest);
  if (ticker) {
    return [
      {
        title: "Orderbook",
        message: `Show the orderbook for ${ticker}.`,
      },
      {
        title: "My portfolio",
        message:
          "Call kalshi_sdk_get_balance and kalshi_sdk_get_positions for my portfolio.",
      },
      {
        title: "Summarize risk",
        message: "Summarize my desk risk given what you know so far.",
      },
    ];
  }

  return DEFAULT;
}

/** @deprecated Use {@link deskFollowUpsForContext} */
export function deskFollowUpsForTool(tool: string | undefined): DeskFollowUp[] {
  return deskFollowUpsForContext(tool ? { tool, status: "complete", at: 0 } : null);
}
