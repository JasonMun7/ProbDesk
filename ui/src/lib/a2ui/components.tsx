"use client";

import type { RendererProps } from "@copilotkit/a2ui-renderer";
import { formatPriceDollars } from "@/lib/parse-tool-result";
import type { z } from "zod";
import type {
  probDeskA2UIKalshiMarketCardProps,
  probDeskA2UIMetricProps,
  probDeskA2UIStatusBadgeProps,
} from "@/lib/a2ui/schemas";

export function A2UIMetric({
  props,
}: RendererProps<z.infer<typeof probDeskA2UIMetricProps>>) {
  return (
    <div className="rounded-xl border border-pd-border bg-pd-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-pd-ink/50">
        {props.label}
      </p>
      <p className="mt-1 text-2xl font-semibold text-pd-ink">{props.value}</p>
      {props.hint ? (
        <p className="mt-1 text-xs text-pd-ink/55">{props.hint}</p>
      ) : null}
    </div>
  );
}

export function A2UIStatusBadge({
  props,
}: RendererProps<z.infer<typeof probDeskA2UIStatusBadgeProps>>) {
  const tone =
    props.status === "open" || props.status === "active"
      ? "bg-pd-accent/15 text-pd-accent"
      : props.status === "closed"
        ? "bg-pd-border/60 text-pd-ink/60"
        : "bg-pd-bg text-pd-ink/70";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${tone}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {props.label}
    </span>
  );
}

export function A2UIKalshiMarketCard({
  props,
}: RendererProps<z.infer<typeof probDeskA2UIKalshiMarketCardProps>>) {
  const yesBid = props.yesBid ? formatPriceDollars(props.yesBid) : "—";
  const yesAsk = props.yesAsk ? formatPriceDollars(props.yesAsk) : "—";

  return (
    <article className="rounded-xl border border-pd-border bg-pd-white p-4 shadow-sm">
      <div className="pd-accent-bar mb-3 h-0.5 w-12 rounded-full" aria-hidden />
      <p className="font-mono text-xs text-pd-accent">{props.ticker}</p>
      <h3 className="mt-1 text-sm font-semibold leading-snug text-pd-ink">
        {props.title}
      </h3>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg bg-pd-bg/80 px-2 py-1.5">
          <dt className="text-pd-ink/50">Yes bid</dt>
          <dd className="font-mono font-medium text-pd-ink">{yesBid}</dd>
        </div>
        <div className="rounded-lg bg-pd-bg/80 px-2 py-1.5">
          <dt className="text-pd-ink/50">Yes ask</dt>
          <dd className="font-mono font-medium text-pd-ink">{yesAsk}</dd>
        </div>
      </dl>
      {props.status ? (
        <p className="mt-2 text-[11px] uppercase tracking-wide text-pd-ink/45">
          {props.status}
        </p>
      ) : null}
    </article>
  );
}
