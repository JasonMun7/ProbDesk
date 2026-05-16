"use client";

import { parseBalance } from "@/lib/kalshi-tool-parsers";
import { formatCents } from "@/lib/parse-tool-result";
import { DollarSign, PieChart } from "lucide-react";

type Props = {
  result?: unknown;
  loading?: boolean;
};

export function PortfolioSummary({ result, loading }: Props) {
  const parsed = parseBalance(result);

  if (loading) {
    return (
      <div className="animate-pulse rounded-2xl border border-pd-border bg-pd-white p-5">
        <div className="h-4 w-28 rounded bg-pd-border" />
        <div className="mt-5 grid grid-cols-2 gap-4">
          <div className="h-14 rounded-xl bg-pd-bg" />
          <div className="h-14 rounded-xl bg-pd-bg" />
        </div>
      </div>
    );
  }

  if (parsed?.isAuthError || (parsed?.error && parsed.cash == null)) {
    const err = parsed.error ?? "Balance unavailable.";
    const short =
      err.length > 160 ? `${err.slice(0, 160).trim()}…` : err;
    return (
      <p className="rounded-2xl border border-dashed border-pd-border bg-pd-white/80 p-5 text-sm text-pd-ink/70">
        {short}
        {parsed.hint ? (
          <span className="mt-2 block text-xs text-pd-ink/55">{parsed.hint}</span>
        ) : null}
      </p>
    );
  }

  if (!parsed || (parsed.cash == null && parsed.portfolioValue == null)) {
    return (
      <p className="rounded-2xl border border-dashed border-pd-border bg-pd-white/80 p-5 text-sm text-pd-ink/70">
        Waiting for balance data…
      </p>
    );
  }

  const cash = parsed.cash;
  const portfolioValue = parsed.portfolioValue;

  return (
    <section className="rounded-2xl border border-pd-border bg-pd-white p-5 shadow-sm">
      <header className="flex items-center gap-2">
        <PieChart className="h-4 w-4 text-pd-accent" aria-hidden />
        <h3 className="text-sm font-semibold uppercase tracking-wide text-pd-ink/55">
          Cash & value
        </h3>
      </header>
      <dl className="mt-4 grid grid-cols-2 gap-4">
        <div className="rounded-xl bg-pd-bg/80 p-3">
          <dt className="flex items-center gap-1 text-xs text-pd-ink/50">
            <DollarSign className="h-3 w-3" aria-hidden />
            Cash
          </dt>
          <dd className="mt-1 font-mono text-2xl font-bold text-pd-accent">
            {formatCents(cash)}
          </dd>
        </div>
        <div className="rounded-xl bg-pd-bg/50 p-3">
          <dt className="text-xs text-pd-ink/50">Portfolio</dt>
          <dd className="mt-1 font-mono text-2xl font-bold text-pd-ink">
            {formatCents(portfolioValue)}
          </dd>
        </div>
      </dl>
    </section>
  );
}
