"use client";

import {
  parseOrderExecution,
  type ParsedOrderExecution,
} from "@/lib/kalshi-tool-parsers";
import { formatCents } from "@/lib/parse-tool-result";
import { AlertCircle, ArrowLeftRight, CheckCircle2 } from "lucide-react";

type Props = {
  tool: string;
  args?: Record<string, unknown>;
  result?: unknown;
  loading?: boolean;
  cancelled?: boolean;
};

function limitLabel(parsed: ParsedOrderExecution): string | null {
  if (parsed.yesPrice != null && parsed.yesPrice > 0) {
    return `${parsed.yesPrice}¢ yes`;
  }
  if (parsed.noPrice != null && parsed.noPrice > 0) {
    return `${parsed.noPrice}¢ no`;
  }
  return null;
}

export function ExecutedTradeDeskView({
  tool,
  args,
  result,
  loading,
  cancelled: cancelledTool,
}: Props) {
  const parsed = parseOrderExecution(result, args);
  const isCancel = tool === "kalshi_sdk_cancel_order" || parsed.cancelled;
  const limit = limitLabel(parsed);

  if (loading) {
    return (
      <div className="animate-pulse rounded-2xl border border-pd-border bg-pd-white p-6 shadow-sm">
        <div className="h-4 w-48 rounded bg-pd-border" />
        <div className="mt-4 h-8 w-full rounded bg-pd-bg" />
        <div className="mt-3 h-8 w-2/3 rounded bg-pd-bg/80" />
      </div>
    );
  }

  if (parsed.error) {
    return (
      <div className="rounded-2xl border border-red-200/80 bg-red-50/50 p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-6 w-6 shrink-0 text-red-600/80" aria-hidden />
          <div>
            <h3 className="font-semibold text-pd-ink">
              {isCancel ? "Cancel failed" : "Order failed"}
            </h3>
            <p className="mt-2 text-sm text-pd-ink/75">{parsed.error}</p>
            {parsed.hint ? (
              <p className="mt-2 text-xs text-pd-ink/55">{parsed.hint}</p>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-pd-accent/30 bg-pd-white p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pd-accent/15 text-pd-accent">
          {isCancel ? (
            <ArrowLeftRight className="h-5 w-5" aria-hidden />
          ) : (
            <CheckCircle2 className="h-5 w-5" aria-hidden />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-pd-ink/50">
            {isCancel || cancelledTool ? "Order cancelled" : "Trade executed"}
          </p>
          <h3 className="mt-1 font-mono text-lg font-semibold text-pd-accent">
            {parsed.ticker ?? "—"}
          </h3>
        </div>
      </div>

      <dl className="mt-6 grid gap-3 border-t border-pd-border/80 pt-5 text-sm sm:grid-cols-2">
        {!isCancel && parsed.action && parsed.side ? (
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-pd-ink/50">
              Intent
            </dt>
            <dd className="mt-1 font-medium capitalize text-pd-ink">
              {parsed.action} {parsed.count ?? "—"} {parsed.side}
            </dd>
          </div>
        ) : null}
        {parsed.orderType ? (
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-pd-ink/50">
              Type
            </dt>
            <dd className="mt-1 capitalize text-pd-ink">{parsed.orderType}</dd>
          </div>
        ) : null}
        {limit ? (
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-pd-ink/50">
              Limit
            </dt>
            <dd className="mt-1 font-mono text-pd-ink">{limit}</dd>
          </div>
        ) : null}
        {parsed.orderId ? (
          <div className="sm:col-span-2">
            <dt className="text-xs font-medium uppercase tracking-wide text-pd-ink/50">
              Order id
            </dt>
            <dd className="mt-1 break-all font-mono text-xs text-pd-ink/80">
              {parsed.orderId}
            </dd>
          </div>
        ) : null}
        {parsed.status ? (
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-pd-ink/50">
              Status
            </dt>
            <dd className="mt-1 capitalize text-pd-ink">{parsed.status}</dd>
          </div>
        ) : null}
      </dl>

      {!isCancel && parsed.count != null && (parsed.yesPrice ?? parsed.noPrice) ? (
        <p className="mt-4 text-xs text-pd-ink/55">
          Notional hint: ~
          {formatCents((parsed.yesPrice ?? parsed.noPrice ?? 0) * parsed.count)} (price
          × contracts, approximate)
        </p>
      ) : null}
    </div>
  );
}
