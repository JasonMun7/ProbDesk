"use client";

import { KalshiMarketCard } from "@/components/KalshiMarketCard";
import { OrderbookView } from "@/components/OrderbookView";
import { PortfolioSummary } from "@/components/PortfolioSummary";
import { COPILOT_AGENT_ID } from "@/lib/constants";
import { useDeskToolState } from "@/lib/desk-tool-state";
import { marketsFromResult, parseOrderbook } from "@/lib/kalshi-tool-parsers";
import type { KalshiMarketSummary } from "@/lib/types";
import { useComponent } from "@copilotkit/react-core/v2";
import { Search } from "lucide-react";
import { useEffect } from "react";
import { z } from "zod";

const marketRowSchema = z.object({
  ticker: z.string().optional(),
  title: z.string().optional(),
  yes_sub_title: z.string().optional(),
  status: z.string().optional(),
  yes_ask_dollars: z.union([z.string(), z.number()]).optional(),
  yes_bid_dollars: z.union([z.string(), z.number()]).optional(),
  no_ask_dollars: z.union([z.string(), z.number()]).optional(),
  no_bid_dollars: z.union([z.string(), z.number()]).optional(),
  last_price_dollars: z.union([z.string(), z.number()]).optional(),
  score: z.number().optional(),
});

const showMarketSearchSchema = z.object({
  query: z.string().optional(),
  markets: z.array(marketRowSchema).optional(),
  matches: z.array(marketRowSchema).optional(),
});

const showPortfolioSchema = z.object({
  balance_cents: z.number().optional(),
  portfolio_value_cents: z.number().optional(),
  cash_label: z.string().optional(),
  value_label: z.string().optional(),
  note: z.string().optional(),
});

const showOrderbookSchema = z.object({
  ticker: z.string(),
  yes: z.array(z.tuple([z.number(), z.number()])).optional(),
  no: z.array(z.tuple([z.number(), z.number()])).optional(),
});

function ShowMarketSearch(props: z.infer<typeof showMarketSearchSchema>) {
  const { schedulePublish } = useDeskToolState();
  const raw = props.markets ?? props.matches ?? [];

  useEffect(() => {
    if (raw.length === 0 && !props.query) return;
    schedulePublish({
      tool: "kalshi_search_markets",
      args: props.query ? { query: props.query } : undefined,
      result: {
        matches: props.markets ?? props.matches ?? [],
        query: props.query,
        ok: true,
      },
      status: "complete",
    });
  }, [props.query, props.markets, props.matches, schedulePublish]);
  const markets: KalshiMarketSummary[] = raw.length
    ? raw
    : marketsFromResult({ matches: raw, query: props.query });

  return (
    <section className="pd-desk-fade-in rounded-2xl border border-pd-border bg-pd-white/95 p-4 shadow-sm">
      <header className="mb-3 flex items-center gap-2">
        <Search className="h-4 w-4 text-pd-accent" aria-hidden />
        <h3 className="text-sm font-semibold text-pd-ink">
          {props.query ? `Markets — “${props.query}”` : "Market results"}
        </h3>
      </header>
      <div className="grid gap-3 sm:grid-cols-2">
        {markets.slice(0, 6).map((m, i) => (
          <KalshiMarketCard
            key={m.ticker ?? m.title ?? i}
            market={m}
            compact
            bestMatch={i === 0}
          />
        ))}
      </div>
      {markets.length === 0 ? (
        <p className="text-sm text-pd-ink/60">No markets to display.</p>
      ) : null}
    </section>
  );
}

function ShowPortfolio(props: z.infer<typeof showPortfolioSchema>) {
  const { schedulePublish } = useDeskToolState();

  useEffect(() => {
    if (props.balance_cents == null && props.portfolio_value_cents == null) {
      return;
    }
    schedulePublish({
      tool: "kalshi_sdk_get_balance",
      args: {},
      result: {
        balance: props.balance_cents,
        portfolio_value: props.portfolio_value_cents,
      },
      status: "complete",
    });
  }, [props.balance_cents, props.portfolio_value_cents, schedulePublish]);

  const syntheticResult =
    props.balance_cents != null || props.portfolio_value_cents != null
      ? {
          balance: { balance: props.balance_cents, portfolio_value: props.portfolio_value_cents },
          ok: true,
        }
      : undefined;

  return (
    <div className="space-y-3">
      {props.note ? (
        <p className="text-xs text-pd-ink/55">{props.note}</p>
      ) : null}
      <PortfolioSummary result={syntheticResult} />
      {(props.cash_label || props.value_label) && (
        <p className="text-xs text-pd-ink/50">
          {[props.cash_label, props.value_label].filter(Boolean).join(" · ")}
        </p>
      )}
    </div>
  );
}

function ShowOrderbook(props: z.infer<typeof showOrderbookSchema>) {
  const { schedulePublish } = useDeskToolState();

  useEffect(() => {
    schedulePublish({
      tool: "kalshi_sdk_get_market_orderbook",
      args: { market_ticker: props.ticker },
      result: {
        orderbook: { yes: props.yes ?? [], no: props.no ?? [] },
        ticker: props.ticker,
      },
      status: "complete",
    });
  }, [props.ticker, schedulePublish]);

  const book = parseOrderbook({
    orderbook: { yes: props.yes ?? [], no: props.no ?? [] },
    ticker: props.ticker,
  });

  return (
    <OrderbookView
      book={book ?? { yes: props.yes ?? [], no: props.no ?? [], ticker: props.ticker }}
      ticker={props.ticker}
    />
  );
}

/**
 * Frontend display tools (useComponent). The trading director can invoke these when
 * CopilotKit exposes frontend tools to the agent; Kalshi ADK tools still use useRenderTool.
 */
export function KalshiDisplayComponents() {
  useComponent({
    name: "show_market_search",
    description:
      "Show Kalshi market search results as branded cards in chat (use after search or when summarizing matches).",
    parameters: showMarketSearchSchema,
    render: ShowMarketSearch,
    agentId: COPILOT_AGENT_ID,
  });

  useComponent({
    name: "show_portfolio",
    description: "Show a portfolio / balance summary card in chat.",
    parameters: showPortfolioSchema,
    render: ShowPortfolio,
    agentId: COPILOT_AGENT_ID,
  });

  useComponent({
    name: "show_orderbook",
    description: "Show an order book depth view for a market ticker.",
    parameters: showOrderbookSchema,
    render: ShowOrderbook,
    agentId: COPILOT_AGENT_ID,
  });

  return null;
}
