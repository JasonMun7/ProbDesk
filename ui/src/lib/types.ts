export type KalshiMarketSummary = {
  ticker?: string;
  title?: string;
  event_ticker?: string;
  status?: string;
  yes_sub_title?: string;
  yes_ask_dollars?: string | number;
  yes_bid_dollars?: string | number;
  no_ask_dollars?: string | number;
  no_bid_dollars?: string | number;
  last_price_dollars?: string | number;
  score?: number;
  match_score?: number;
};

export type MarketSearchResult = {
  ok?: boolean;
  query?: string;
  matches?: KalshiMarketSummary[];
  markets?: KalshiMarketSummary[];
  error?: string;
  hint?: string;
  api_error?: string;
};
