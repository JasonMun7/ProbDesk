"use client";

import { KalshiMarketCard } from "@/components/KalshiMarketCard";
import { OrderbookView } from "@/components/OrderbookView";
import { PortfolioSummary } from "@/components/PortfolioSummary";
import type { DeskToolStatus } from "@/lib/desk-tool-status";
import { isDeskToolComplete, isDeskToolRunning } from "@/lib/desk-tool-status";
import {
  chatToolHintMessage,
  humanToolName,
  ORDERBOOK_TOOLS,
  ORDER_EXECUTION_TOOLS,
  parseBalance,
  hasOrderbookPayload,
  parseOrderbook,
  parseOrderExecution,
  parsePositions,
  parseSearchResult,
  PORTFOLIO_TOOLS,
  SEARCH_TOOLS,
} from "@/lib/kalshi-tool-parsers";
import { formatCents, parseToolJson } from "@/lib/parse-tool-result";
import { useDeskToolState } from "@/lib/desk-tool-state";
import { useResolvedToolResult } from "@/lib/use-resolved-tool-result";
import { getKalshiToolIcon } from "@/lib/kalshi-tool-icons";
import { useEffect, useMemo } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import type { ReactNode } from "react";

export type DeskChatToolCardProps = {
  name: string;
  status?: DeskToolStatus | string;
  args?: Record<string, unknown>;
  result?: unknown;
  toolCallId?: string;
};

function runningSubtitle(
  name: string,
  args?: Record<string, unknown>,
): string {
  if (SEARCH_TOOLS.has(name)) {
    const q = args?.query;
    return typeof q === "string" && q.trim()
      ? `Searching “${q.trim()}”…`
      : "Scanning open markets…";
  }
  if (ORDERBOOK_TOOLS.has(name)) {
    const ticker =
      args?.ticker ?? args?.market_ticker ?? args?.marketTicker;
    return typeof ticker === "string" && ticker.trim()
      ? `Loading depth for ${ticker.trim()}…`
      : "Fetching order book…";
  }
  if (name === "kalshi_sdk_get_balance") {
    return "Reading account balance…";
  }
  if (name === "kalshi_sdk_get_positions") {
    return "Loading open positions…";
  }
  if (name === "kalshi_sdk_get_orders") {
    return "Loading orders…";
  }
  if (name === "kalshi_sdk_create_order") {
    return "Placing order on Kalshi…";
  }
  if (name === "kalshi_sdk_cancel_order") {
    return "Cancelling order…";
  }
  const ticker = args?.ticker ?? args?.market_ticker ?? args?.series_ticker;
  if (typeof ticker === "string" && ticker.trim()) {
    return `Fetching ${ticker.trim()}…`;
  }
  return chatToolHintMessage(name, "executing");
}

function StatusPill({
  running,
  complete,
}: {
  running: boolean;
  complete: boolean;
}) {
  if (running) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-pd-border bg-pd-white px-2.5 py-1 text-[11px] font-medium text-pd-ink/70">
        <Loader2 className="h-3 w-3 animate-spin text-pd-accent" aria-hidden />
        Running
      </span>
    );
  }
  if (complete) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-pd-accent/40 bg-pd-accent/10 px-2.5 py-1 text-[11px] font-medium text-pd-ink">
        <CheckCircle2 className="h-3 w-3 text-pd-accent" aria-hidden />
        Done
      </span>
    );
  }
  return (
    <span className="rounded-full border border-pd-border bg-pd-white px-2.5 py-1 text-[11px] text-pd-ink/55">
      Preparing
    </span>
  );
}

function ToolCardShell({
  name,
  status,
  args,
  awaitingResult,
  children,
}: DeskChatToolCardProps & {
  awaitingResult?: boolean;
  children: ReactNode;
}) {
  const running = isDeskToolRunning(status) || Boolean(awaitingResult);
  const complete =
    isDeskToolComplete(status) && !awaitingResult;
  const Icon = getKalshiToolIcon(name);
  const subtitle = running
    ? runningSubtitle(name, args)
    : complete
      ? chatToolHintMessage(name, "complete")
      : chatToolHintMessage(name, status);

  return (
    <article
      className="pd-desk-fade-in my-2 overflow-hidden rounded-2xl border border-pd-border bg-pd-white shadow-sm"
      role="status"
      aria-live="polite"
      aria-busy={running}
    >
      <div className="pd-accent-bar h-0.5 w-full shrink-0" aria-hidden />
      <header className="flex flex-wrap items-start justify-between gap-2 border-b border-pd-border/80 bg-pd-bg/40 px-4 py-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <span
            className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
              running
                ? "bg-pd-accent/20 text-pd-accent"
                : "bg-pd-accent/15 text-pd-accent"
            }`}
          >
            <Icon className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-pd-ink">
              {humanToolName(name)}
            </h4>
            <p
              className={`mt-0.5 text-xs leading-snug ${
                running ? "text-pd-ink/65" : "text-pd-ink/50"
              }`}
            >
              {subtitle}
            </p>
          </div>
        </div>
        <StatusPill running={running} complete={complete} />
      </header>
      <div className="px-4 py-3">{children}</div>
    </article>
  );
}

function SearchToolBody({ status, args, result }: DeskChatToolCardProps) {
  const running = isDeskToolRunning(status);
  const search = parseSearchResult(result);
  const query = String(args?.query ?? search.query ?? "");

  if (running) {
    return (
      <div className="space-y-3">
        <SearchSkeleton />
        <p className="text-center text-[11px] text-pd-ink/45">
          Full results appear in the desk center panel
        </p>
      </div>
    );
  }

  if (search.error && search.markets.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-pd-border bg-pd-bg/50 px-3 py-2 text-sm text-pd-ink/70">
        {search.error}
      </p>
    );
  }

  if (search.markets.length === 0) {
    return (
      <p className="text-sm text-pd-ink/60">
        {query ? `No markets matched “${query}”.` : "No markets in this response."}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {query ? (
        <p className="text-xs font-medium text-pd-ink/55">
          Top matches for “{query}”
        </p>
      ) : null}
      <div className="grid gap-2 sm:grid-cols-2">
        {search.markets.slice(0, 4).map((m, i) => (
          <KalshiMarketCard
            key={m.ticker ?? m.title ?? i}
            market={m}
            compact
            bestMatch={i === 0}
          />
        ))}
      </div>
    </div>
  );
}

function PortfolioBalanceBody({ status, result }: DeskChatToolCardProps) {
  const running = isDeskToolRunning(status);
  return (
    <PortfolioSummary
      result={running ? undefined : result}
      loading={running}
    />
  );
}

function PortfolioPositionsBody({ status, result }: DeskChatToolCardProps) {
  const running = isDeskToolRunning(status);

  if (running) {
    return <PositionsSkeleton />;
  }

  const { positions, error } = parsePositions(result);

  if (error && positions.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-pd-border bg-pd-bg/50 px-3 py-2 text-sm text-pd-ink/70">
        {error}
      </p>
    );
  }

  if (positions.length === 0) {
    return (
      <p className="text-sm text-pd-ink/60">No open positions in this account.</p>
    );
  }

  return (
    <ul className="divide-y divide-pd-border rounded-xl border border-pd-border bg-pd-bg/30">
      {positions.slice(0, 5).map((row) => (
        <li
          key={row.ticker}
          className="flex items-center justify-between gap-2 px-3 py-2.5 text-sm"
        >
          <div className="min-w-0">
            <p className="truncate font-mono text-xs font-semibold text-pd-accent">
              {row.ticker}
            </p>
            <p className="text-[11px] text-pd-ink/55">
              {row.side ? row.side.toUpperCase() : "—"}
              {row.quantity != null ? ` · qty ${row.quantity}` : ""}
            </p>
          </div>
          {row.pnl != null && (
            <span className="shrink-0 font-mono text-xs font-semibold text-pd-ink">
              {formatCents(row.pnl)}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

const CHAT_ORDERBOOK_LEVEL_CAP = 12;

function OrderbookToolBody({ status, args, result }: DeskChatToolCardProps) {
  const running = isDeskToolRunning(status);
  const book = useMemo(() => {
    const parsed = parseOrderbook(result);
    if (!parsed) return null;
    return {
      ...parsed,
      yes: parsed.yes.slice(0, CHAT_ORDERBOOK_LEVEL_CAP),
      no: parsed.no.slice(0, CHAT_ORDERBOOK_LEVEL_CAP),
    };
  }, [result]);

  const ticker = String(
    args?.ticker ??
      args?.market_ticker ??
      book?.ticker ??
      "—",
  );

  return (
    <OrderbookView
      book={book ?? { yes: [], no: [], ticker }}
      ticker={ticker}
      loading={running || !book}
    />
  );
}

function GenericToolBody({ name, status, args, result }: DeskChatToolCardProps) {
  const running = isDeskToolRunning(status);
  const complete = isDeskToolComplete(status);
  const argEntries = args ? Object.entries(args).filter(([, v]) => v != null) : [];

  if (running) {
    return (
      <div className="space-y-2">
        {argEntries.length > 0 && <ArgChips entries={argEntries} />}
        <GenericSkeleton />
      </div>
    );
  }

  if (complete && result != null) {
    const bal = parseBalance(result);
    if (bal?.cash != null || bal?.portfolioValue != null) {
      return <PortfolioSummary result={result} />;
    }
    return (
      <div className="space-y-2">
        {argEntries.length > 0 && <ArgChips entries={argEntries} />}
        <p className="flex items-center gap-2 text-sm text-pd-ink/70">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-pd-accent" aria-hidden />
          {chatToolHintMessage(name, "complete")}
        </p>
      </div>
    );
  }

  return (
    <p className="text-sm text-pd-ink/60">{chatToolHintMessage(name, status)}</p>
  );
}

function ArgChips({ entries }: { entries: [string, unknown][] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {entries.slice(0, 6).map(([key, value]) => (
        <span
          key={key}
          className="rounded-md border border-pd-border bg-pd-bg/80 px-2 py-0.5 font-mono text-[10px] text-pd-ink/75"
        >
          {key}={formatArgValue(value)}
        </span>
      ))}
    </div>
  );
}

function formatArgValue(value: unknown): string {
  if (typeof value === "string") {
    return value.length > 24 ? `${value.slice(0, 24)}…` : value;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  try {
    const s = JSON.stringify(value);
    return s.length > 28 ? `${s.slice(0, 28)}…` : s;
  } catch {
    return "…";
  }
}

function SearchSkeleton() {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {[0, 1].map((i) => (
        <div
          key={i}
          className="animate-pulse rounded-xl border border-pd-border bg-pd-bg/60 p-3"
        >
          <div className="h-3 w-20 rounded bg-pd-border" />
          <div className="mt-3 h-4 w-full rounded bg-pd-border/80" />
          <div className="mt-2 h-3 w-2/3 rounded bg-pd-border/60" />
        </div>
      ))}
    </div>
  );
}

function PositionsSkeleton() {
  return (
    <div className="animate-pulse space-y-2 rounded-xl border border-pd-border bg-pd-bg/40 p-3">
      <div className="h-3 w-32 rounded bg-pd-border" />
      <div className="h-8 rounded-lg bg-pd-border/80" />
      <div className="h-8 rounded-lg bg-pd-border/60" />
    </div>
  );
}

function OrderExecutionToolBody({ status, args, result }: DeskChatToolCardProps) {
  const running = isDeskToolRunning(status);
  const parsed = parseOrderExecution(result, args);
  const ticker = String(args?.ticker ?? parsed.ticker ?? "—");
  const side = String(args?.side ?? "—");
  const action = String(args?.action ?? "—");
  const count = args?.count != null ? String(args.count) : "—";

  if (running) {
    return <GenericSkeleton />;
  }

  if (parsed.isAuthError || parsed.error) {
    return (
      <p className="rounded-xl border border-dashed border-pd-border bg-pd-bg/50 px-3 py-2 text-sm text-pd-ink/70">
        {parsed.error}
        {parsed.hint ? (
          <span className="mt-1 block text-xs text-pd-ink/55">{parsed.hint}</span>
        ) : null}
      </p>
    );
  }

  return (
    <dl className="grid gap-2 text-sm text-pd-ink/85">
      <div className="flex justify-between gap-4">
        <dt className="text-pd-ink/55">Ticker</dt>
        <dd className="font-mono text-pd-accent">{ticker}</dd>
      </div>
      <div className="flex justify-between gap-4">
        <dt className="text-pd-ink/55">Intent</dt>
        <dd className="font-medium capitalize">
          {action} {count} {side}
        </dd>
      </div>
      {parsed.orderId ? (
        <div className="flex justify-between gap-4">
          <dt className="text-pd-ink/55">Order id</dt>
          <dd className="font-mono text-xs">{parsed.orderId}</dd>
        </div>
      ) : null}
      {parsed.status ? (
        <div className="flex justify-between gap-4">
          <dt className="text-pd-ink/55">Status</dt>
          <dd className="capitalize">{parsed.status}</dd>
        </div>
      ) : (
        <p className="text-xs text-pd-ink/55">Exchange accepted the request.</p>
      )}
    </dl>
  );
}

function GenericSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-pd-border bg-pd-bg/50 p-4">
      <div className="h-3 w-40 rounded bg-pd-border" />
      <div className="mt-3 h-2 w-full rounded bg-pd-border/70" />
      <div className="mt-2 h-2 w-4/5 rounded bg-pd-border/50" />
    </div>
  );
}

/** True when normalized tool JSON is ready for desk/chat parsers. */
export function isToolPayloadReady(name: string, resolved: unknown): boolean {
  if (resolved == null) return false;
  if (name === "kalshi_sdk_get_balance") {
    const bal = parseBalance(resolved);
    return Boolean(
      bal && (bal.cash != null || bal.portfolioValue != null || bal.error),
    );
  }
  if (name === "kalshi_sdk_get_positions") {
    const data = parseToolJson(resolved);
    if (!data) return false;
    if (data.error) return true;
    return (
      Array.isArray(data.market_positions) ||
      Array.isArray(data.event_positions)
    );
  }
  if (SEARCH_TOOLS.has(name)) {
    return parseSearchResult(resolved).markets.length > 0;
  }
  if (ORDERBOOK_TOOLS.has(name)) {
    return hasOrderbookPayload(resolved) || parseOrderbook(resolved) != null;
  }
  if (ORDER_EXECUTION_TOOLS.has(name)) {
    const parsed = parseOrderExecution(resolved);
    return Boolean(parsed.orderId || parsed.status || parsed.error);
  }
  return parseToolJson(resolved) != null;
}

function ToolBody(props: DeskChatToolCardProps) {
  const { name } = props;

  if (SEARCH_TOOLS.has(name)) {
    return <SearchToolBody {...props} />;
  }
  if (name === "kalshi_sdk_get_balance") {
    return <PortfolioBalanceBody {...props} />;
  }
  if (name === "kalshi_sdk_get_positions") {
    return <PortfolioPositionsBody {...props} />;
  }
  if (ORDERBOOK_TOOLS.has(name)) {
    return <OrderbookToolBody {...props} />;
  }
  if (
    name === "kalshi_sdk_create_order" ||
    name === "kalshi_sdk_cancel_order"
  ) {
    return <OrderExecutionToolBody {...props} />;
  }
  return <GenericToolBody {...props} />;
}

/** Branded generative UI for Kalshi / MCP tool calls in chat (CopilotKit useRenderTool). */
export function DeskChatToolCard(props: DeskChatToolCardProps) {
  const { schedulePublish } = useDeskToolState();
  const resolved = useResolvedToolResult(
    props.name,
    props.toolCallId,
    props.status,
    props.result,
  );
  const payloadReady = isToolPayloadReady(props.name, resolved);
  const awaitingResult =
    isDeskToolComplete(props.status) && !payloadReady;

  useEffect(() => {
    if (!isDeskToolComplete(props.status) || !payloadReady || resolved == null) {
      return;
    }
    schedulePublish({
      tool: props.name,
      args: props.args,
      result: resolved,
      status: "complete",
    });
  }, [props.name, props.status, props.args, payloadReady, resolved, schedulePublish]);

  return (
    <ToolCardShell {...props} awaitingResult={awaitingResult}>
      <ToolBody {...props} result={resolved} />
    </ToolCardShell>
  );
}
