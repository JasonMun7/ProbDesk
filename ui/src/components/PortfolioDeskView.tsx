"use client";

import {
  parseBalance,
  parsePositions,
  type ParsedPosition,
} from "@/lib/kalshi-tool-parsers";
import { formatCents } from "@/lib/parse-tool-result";
import { AlertCircle, KeyRound, Layers, TrendingDown, TrendingUp } from "lucide-react";

type Props = {
  balanceResult?: unknown;
  positionsResult?: unknown;
  balanceLoading?: boolean;
  positionsLoading?: boolean;
};

export function PortfolioDeskView({
  balanceResult,
  positionsResult,
  balanceLoading,
  positionsLoading,
}: Props) {
  const balance = parseBalance(balanceResult);
  const { positions, error: posError, hint: posHint, isAuthError: posAuth } =
    parsePositions(positionsResult);

  const hasBalanceData =
    balance != null && (balance.cash != null || balance.portfolioValue != null);
  const hasPositionData = positions.length > 0;

  const waitingForData =
    (balanceLoading && !hasBalanceData) || (positionsLoading && !hasPositionData);

  if (waitingForData && !hasBalanceData && !hasPositionData && !posError) {
    return <PortfolioSkeleton />;
  }

  const authError = balance?.isAuthError || posAuth;
  const errorMsg = balance?.error ?? posError;

  if (authError || (errorMsg && !balance?.cash && !balance?.portfolioValue)) {
    return (
      <AuthCallout
        message={errorMsg ?? "Kalshi credentials not configured"}
        hint={balance?.hint ?? posHint}
      />
    );
  }

  const cash = balance?.cash;
  const portfolioValue = balance?.portfolioValue;
  const positionsValue =
    cash != null && portfolioValue != null
      ? Math.max(0, portfolioValue - cash)
      : undefined;
  const total = portfolioValue ?? cash;

  return (
    <div className="pd-desk-fade-in space-y-4">
      <div className="rounded-2xl border border-pd-border bg-pd-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-pd-ink/50">
          Total portfolio value
        </p>
        <p className="mt-1 font-mono text-4xl font-bold tracking-tight text-pd-ink">
          {formatCents(total)}
        </p>
        {(cash != null || positionsValue != null) && (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <BreakdownCell label="Cash" value={formatCents(cash)} accent />
            <BreakdownCell
              label="In positions"
              value={formatCents(positionsValue)}
            />
          </div>
        )}
      </div>

      <section className="rounded-2xl border border-pd-border bg-pd-white p-5 shadow-sm">
        <header className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-pd-accent" aria-hidden />
          <h3 className="text-sm font-semibold uppercase tracking-wide text-pd-ink/55">
            Open positions
            {positions.length > 0 ? ` (${positions.length})` : ""}
          </h3>
        </header>

        {posError && positions.length === 0 ? (
          <p className="mt-3 text-sm text-pd-ink/65">{posError}</p>
        ) : positions.length === 0 ? (
          <p className="mt-3 text-sm text-pd-ink/60">
            No open positions. Search markets in chat to find contracts.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-pd-border">
            {positions.slice(0, 15).map((row) => (
              <PositionRow key={row.ticker} row={row} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function PositionRow({ row }: { row: ParsedPosition }) {
  const pnl = row.pnl;
  const pnlUp = pnl != null && pnl >= 0;

  return (
    <li className="flex items-center gap-3 py-3 text-sm">
      <div className="min-w-0 flex-1">
        <p className="truncate font-mono font-medium text-pd-ink">{row.ticker}</p>
        <p className="mt-0.5 text-xs text-pd-ink/50">
          {row.side ? (
            <span
              className={
                row.side === "yes" ? "text-pd-accent" : "text-pd-ink/70"
              }
            >
              {row.side.toUpperCase()}
            </span>
          ) : (
            "—"
          )}
          {row.quantity != null && (
            <span className="text-pd-ink/55"> · qty {row.quantity}</span>
          )}
        </p>
      </div>
      {pnl != null && (
        <span
          className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 font-mono text-xs font-semibold ${
            pnlUp
              ? "bg-pd-accent/15 text-pd-accent"
              : "bg-red-50 text-red-700"
          }`}
        >
          {pnlUp ? (
            <TrendingUp className="h-3 w-3" aria-hidden />
          ) : (
            <TrendingDown className="h-3 w-3" aria-hidden />
          )}
          {formatCents(pnl)}
        </span>
      )}
    </li>
  );
}

function BreakdownCell({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl bg-pd-bg/70 p-3">
      <p className="text-xs text-pd-ink/50">{label}</p>
      <p
        className={`mt-1 font-mono text-xl font-bold ${
          accent ? "text-pd-accent" : "text-pd-ink"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function AuthCallout({ message, hint }: { message: string; hint?: string }) {
  return (
    <div className="pd-desk-fade-in rounded-2xl border border-pd-border bg-pd-white p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pd-accent/15 text-pd-accent">
          <KeyRound className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <h3 className="font-semibold text-pd-ink">Connect Kalshi API</h3>
          <p className="mt-1 text-sm text-pd-ink/70">{message}</p>
          <ul className="mt-3 space-y-1.5 font-mono text-xs text-pd-ink/80">
            <li>KALSHI_API_KEY_ID</li>
            <li>KALSHI_PRIVATE_KEY_PATH or KALSHI_PRIVATE_KEY_PEM</li>
          </ul>
          <p className="mt-3 text-xs text-pd-ink/55">
            Copy from <span className="font-mono">.env.example</span> into your
            project <span className="font-mono">.env</span>, then restart the
            agent.
          </p>
          {hint && (
            <p className="mt-2 flex items-start gap-1.5 text-xs text-pd-ink/60">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              {hint}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function PortfolioSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="rounded-2xl border border-pd-border bg-pd-white p-6">
        <div className="h-3 w-36 rounded bg-pd-border" />
        <div className="mt-4 h-10 w-48 rounded bg-pd-bg" />
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="h-16 rounded-xl bg-pd-bg" />
          <div className="h-16 rounded-xl bg-pd-bg" />
        </div>
      </div>
      <div className="rounded-2xl border border-pd-border bg-pd-white p-5">
        <div className="h-3 w-28 rounded bg-pd-border" />
        <div className="mt-4 space-y-2">
          <div className="h-12 rounded-lg bg-pd-bg" />
          <div className="h-12 rounded-lg bg-pd-bg" />
        </div>
      </div>
    </div>
  );
}
