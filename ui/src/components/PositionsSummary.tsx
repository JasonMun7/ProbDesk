"use client";

import { parseToolJson } from "@/lib/parse-tool-result";
import { Layers } from "lucide-react";

type Props = {
  result?: unknown;
  loading?: boolean;
};

type PositionRow = {
  ticker?: string;
  market_ticker?: string;
  position?: number;
  total_traded?: number;
};

export function PositionsSummary({ result, loading }: Props) {
  const data = parseToolJson(result);

  if (loading) {
    return (
      <div className="animate-pulse rounded-2xl border border-pd-border bg-pd-white p-5">
        <div className="h-4 w-36 rounded bg-pd-border" />
        <div className="mt-4 space-y-2">
          <div className="h-10 rounded-lg bg-pd-bg" />
          <div className="h-10 rounded-lg bg-pd-bg" />
        </div>
      </div>
    );
  }

  if (!data || data.error) {
    return (
      <p className="rounded-2xl border border-dashed border-pd-border bg-pd-white/80 p-5 text-sm text-pd-ink/70">
        {data?.error ? String(data.error) : "Positions unavailable."}
      </p>
    );
  }

  const raw = data.market_positions ?? data.positions;
  const list = Array.isArray(raw) ? raw : raw ? [raw] : [];

  if (list.length === 0) {
    return (
      <p className="rounded-2xl border border-pd-border bg-pd-white p-5 text-sm text-pd-ink/70">
        No open positions.
      </p>
    );
  }

  return (
    <section className="rounded-2xl border border-pd-border bg-pd-white p-5 shadow-sm">
      <header className="flex items-center gap-2">
        <Layers className="h-4 w-4 text-pd-accent" aria-hidden />
        <h3 className="text-sm font-semibold uppercase tracking-wide text-pd-ink/55">
          Positions ({list.length})
        </h3>
      </header>
      <ul className="mt-3 divide-y divide-pd-border">
        {(list as PositionRow[]).slice(0, 12).map((row, i) => {
          const ticker = row.ticker ?? row.market_ticker ?? `position-${i}`;
          const qty = row.position ?? row.total_traded;
          return (
            <li
              key={String(ticker)}
              className="flex items-center justify-between py-2.5 text-sm"
            >
              <span className="font-mono font-medium text-pd-ink">{ticker}</span>
              {qty != null && (
                <span className="rounded-full bg-pd-bg px-2 py-0.5 font-mono text-xs text-pd-ink/70">
                  {String(qty)}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
