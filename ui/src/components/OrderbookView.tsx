"use client";

import {
  orderbookMetrics,
  type OrderbookLevel,
  type ParsedOrderbook,
} from "@/lib/kalshi-tool-parsers";
import { formatPriceDollars } from "@/lib/parse-tool-result";
import { BookOpen } from "lucide-react";

type Props = {
  book: ParsedOrderbook;
  ticker?: string;
  loading?: boolean;
};

export function OrderbookView({ book, ticker, loading }: Props) {
  const label = ticker ?? book.ticker ?? "Market";

  if (loading) {
    return <OrderbookSkeleton ticker={label} />;
  }

  const metrics = orderbookMetrics(book);

  return (
    <section className="pd-desk-fade-in rounded-2xl border border-pd-border bg-pd-white p-5 shadow-sm">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-pd-border pb-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-pd-bg text-pd-accent">
            <BookOpen className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-pd-ink/50">
              Order book
            </p>
            <h3 className="font-mono text-lg font-semibold text-pd-ink">{label}</h3>
          </div>
        </div>

        {(metrics.mid != null || metrics.spreadPct != null) && (
          <dl className="flex flex-wrap gap-4 text-sm">
            {metrics.mid != null && (
              <div>
                <dt className="text-xs text-pd-ink/50">Mid</dt>
                <dd className="font-mono font-bold text-pd-ink">
                  {formatPriceDollars(metrics.mid)}
                </dd>
              </div>
            )}
            {metrics.spreadDollars != null && (
              <div>
                <dt className="text-xs text-pd-ink/50">Spread</dt>
                <dd className="font-mono font-semibold text-pd-accent">
                  {formatPriceDollars(metrics.spreadDollars)}
                  {metrics.spreadPct != null && (
                    <span className="ml-1 text-pd-ink/55">
                      ({metrics.spreadPct.toFixed(2)}%)
                    </span>
                  )}
                </dd>
              </div>
            )}
          </dl>
        )}
      </header>

      <div className="mt-4 grid gap-6 lg:grid-cols-2">
        <DepthColumn title="YES bids" side="yes" levels={book.yes} />
        <DepthColumn title="NO bids" side="no" levels={book.no} />
      </div>

      {metrics.yesBid != null && metrics.yesAsk != null && (
        <p className="mt-4 text-xs text-pd-ink/55">
          Top of book: YES bid {formatPriceDollars(metrics.yesBid)} · implied YES
          ask {formatPriceDollars(metrics.yesAsk)} (from NO bid)
        </p>
      )}
    </section>
  );
}

function DepthColumn({
  title,
  side,
  levels,
}: {
  title: string;
  side: "yes" | "no";
  levels: OrderbookLevel[];
}) {
  const sorted = [...levels].sort((a, b) => b[0] - a[0]).slice(0, 10);
  const maxQty = Math.max(...sorted.map(([, q]) => q), 1);
  const accent = side === "yes";

  return (
    <div>
      <h4
        className={`mb-3 text-sm font-semibold ${accent ? "text-pd-accent" : "text-pd-ink"}`}
      >
        {title}
      </h4>
      {sorted.length === 0 ? (
        <p className="text-sm text-pd-ink/50">No levels</p>
      ) : (
        <ul className="space-y-1.5">
          {sorted.map(([price, qty], i) => (
            <li key={`${side}-${i}`} className="relative overflow-hidden rounded-md">
              <div
                className={`absolute inset-y-0 left-0 rounded-md ${
                  accent ? "bg-pd-accent/25" : "bg-pd-ink/10"
                }`}
                style={{ width: `${Math.min(100, (qty / maxQty) * 100)}%` }}
                aria-hidden
              />
              <div className="relative flex items-center justify-between px-2 py-1.5 font-mono text-sm">
                <span className={accent ? "font-semibold text-pd-accent" : "text-pd-ink"}>
                  {formatPriceDollars(price)}
                </span>
                <span className="text-pd-ink/60">{qty.toLocaleString()}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function OrderbookSkeleton({ ticker }: { ticker: string }) {
  return (
    <section className="animate-pulse rounded-2xl border border-pd-border bg-pd-white p-5">
      <div className="flex gap-3">
        <div className="h-10 w-10 rounded-xl bg-pd-bg" />
        <div className="flex-1">
          <div className="h-3 w-24 rounded bg-pd-border" />
          <div className="mt-2 h-6 w-48 rounded bg-pd-bg" />
        </div>
      </div>
      <p className="mt-2 font-mono text-xs text-pd-ink/40">{ticker}</p>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-7 rounded bg-pd-bg" />
          ))}
        </div>
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-7 rounded bg-pd-bg" />
          ))}
        </div>
      </div>
    </section>
  );
}
