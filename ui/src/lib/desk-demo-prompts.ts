/** Demo prompts for header chips, sidebar nav, and chat suggestion strips. */

export type DeskDemoPrompt = {
  id: string;
  title: string;
  message: string;
};

export const DESK_CHAT_STARTERS: DeskDemoPrompt[] = [
  {
    id: "portfolio",
    title: "Portfolio summary",
    message:
      "Call kalshi_sdk_get_balance and kalshi_sdk_get_positions for my portfolio.",
  },
  {
    id: "search",
    title: "Search Scottie Scheffler PGA",
    message: "Search Kalshi for Scottie Scheffler PGA",
  },
  {
    id: "orderbook",
    title: "Show orderbook",
    message: "Show the orderbook for KXPGATOUR-PGC26-SSCH",
  },
  {
    id: "risk",
    title: "Risk summary",
    message:
      "Summarize my desk risk from live Kalshi portfolio data: call kalshi_sdk_get_balance and kalshi_sdk_get_positions, then transfer_to_agent(agent_name='risk_manager') for a portfolio-level risk summary. Ignore unrelated market searches.",
  },
];

export const DESK_HEADER_CHIPS = DESK_CHAT_STARTERS;

/** @deprecated Nav switches center panels; use desk chips / Markets search instead. */
export const DESK_NAV_PROMPTS: Record<string, string | undefined> = {
  desk: undefined,
  markets: undefined,
  settings: undefined,
};
