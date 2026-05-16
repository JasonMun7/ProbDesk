"use client";

import { marketSpreadHint } from "@/lib/kalshi-tool-parsers";
import { formatPriceDollars } from "@/lib/parse-tool-result";
import type { KalshiMarketSummary } from "@/lib/types";
import { Check, Copy, Sparkles, TrendingUp } from "lucide-react";
import { useCallback, useState } from "react";

type Props = {
  market: KalshiMarketSummary;
  compact?: boolean;
  bestMatch?: boolean;
  onTickerClick?: (ticker: string) => void;
};

export function KalshiMarketCard({
  market,
  compact,
  bestMatch,
  onTickerClick,
}: Props) {
  const ticker = market.ticker ?? "—";
  const title = market.title ?? market.yes_sub_title ?? ticker;
  const spread = marketSpreadHint(market);
  const status = market.status ?? "unknown";
  const [copied, setCopied] = useState(false);

  const copyTicker = useCallback(async () => {
    if (!market.ticker) return;
    try {
      await navigator.clipboard.writeText(market.ticker);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked */
    }
  }, [market.ticker]);

  const handleClick = () => {
    if (onTickerClick && market.ticker) {
      onTickerClick(market.ticker);
      return;
    }
    void copyTicker();
  };

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
      className={`group relative cursor-pointer rounded-xl border bg-pd-white shadow-sm transition hover:border-pd-accent/50 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-pd-accent focus-visible:ring-offset-2 focus-visible:ring-offset-pd-bg ${
        bestMatch
          ? "border-pd-accent ring-1 ring-pd-accent/30"
          : "border-pd-border"
      } ${compact ? "p-3" : "p-4"}`}
    >
      {bestMatch && (
        <span className="absolute -top-2.5 left-3 inline-flex items-center gap-1 rounded-full bg-pd-accent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-pd-ink">
          <Sparkles className="h-3 w-3" aria-hidden />
          Best match
        </span>
      )}

      <header className="flex items-start justify-between gap-2">
        <span className="font-mono text-xs font-semibold uppercase tracking-wide text-pd-accent">
          {ticker}
        </span>
        <div className="flex items-center gap-1.5">
          <StatusBadge status={status} />
          {market.score != null && (
            <span className="inline-flex items-center gap-1 rounded-full bg-pd-bg px-2 py-0.5 text-xs text-pd-ink/70">
              <TrendingUp className="h-3 w-3 text-pd-accent" aria-hidden />
              {Math.round(market.score * 100)}%
            </span>
          )}
        </div>
      </header>

      <h3
        className={`mt-1.5 font-medium leading-snug text-pd-ink ${compact ? "text-sm" : "text-base"}`}
      >
        {title}
      </h3>

      {market.event_ticker && (
        <p className="mt-1 font-mono text-xs text-pd-ink/55">{market.event_ticker}</p>
      )}

      <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <PriceCell label="YES bid" value={market.yes_bid_dollars} side="yes" />
        <PriceCell label="YES ask" value={market.yes_ask_dollars} side="yes" accent />
        <PriceCell
          label="NO bid"
          value={market.no_bid_dollars ?? inferNoBid(market)}
          side="no"
        />
        <PriceCell
          label="NO ask"
          value={market.no_ask_dollars ?? inferNoAsk(market)}
          side="no"
        />
      </dl>

      {spread && (
        <p className="mt-2 text-xs text-pd-ink/55">
          Spread <span className="font-mono text-pd-ink/75">{spread}</span>
        </p>
      )}

      <p className="mt-3 flex items-center gap-1 text-[11px] text-pd-ink/45 opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
        {copied ? (
          <>
            <Check className="h-3 w-3 text-pd-accent" aria-hidden />
            Copied ticker
          </>
        ) : (
          <>
            <Copy className="h-3 w-3" aria-hidden />
            Click to copy ticker
          </>
        )}
      </p>
    </article>
  );
}

function inferNoBid(market: KalshiMarketSummary): string | number | undefined {
  const yesAsk = Number(market.yes_ask_dollars);
  if (!Number.isNaN(yesAsk) && yesAsk > 0) return round4(1 - yesAsk);
  return undefined;
}

function inferNoAsk(market: KalshiMarketSummary): string | number | undefined {
  const yesBid = Number(market.yes_bid_dollars);
  if (!Number.isNaN(yesBid) && yesBid >= 0) return round4(1 - yesBid);
  return undefined;
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

function StatusBadge({ status }: { status: string }) {
  const open = status === "open";
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
        open
          ? "bg-pd-accent/20 text-pd-ink"
          : "bg-pd-bg text-pd-ink/55"
      }`}
    >
      {status}
    </span>
  );
}

function PriceCell({
  label,
  value,
  side,
  accent,
}: {
  label: string;
  value?: string | number;
  side: "yes" | "no";
  accent?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs text-pd-ink/50">{label}</dt>
      <dd
        className={`font-mono font-semibold ${
          accent ? "text-pd-accent" : side === "yes" ? "text-pd-ink" : "text-pd-ink/75"
        }`}
      >
        {formatPriceDollars(value)}
      </dd>
    </div>
  );
}
