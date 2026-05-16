"use client";

import { ExecutedTradeDeskView } from "@/components/ExecutedTradeDeskView";
import { KalshiMarketCard } from "@/components/KalshiMarketCard";
import { OrderbookView } from "@/components/OrderbookView";
import { PortfolioDeskView } from "@/components/PortfolioDeskView";
import { useDeskToolState } from "@/lib/desk-tool-state";
import { DESK_STARTER_ACTIONS, useDeskPrompt } from "@/lib/desk-prompt";
import { isDeskToolRunning } from "@/lib/desk-tool-status";
import {
  EXECUTION_DESK_TOOLS,
  formatDeskTime,
  humanToolName,
  ORDERBOOK_TOOLS,
  parseOrderbook,
  parseSearchResult,
  PORTFOLIO_TOOLS,
  SEARCH_TOOLS,
  shouldShowExecutionDeskPanel,
} from "@/lib/kalshi-tool-parsers";
import {
  AlertCircle,
  ArrowLeftRight,
  BookOpen,
  LayoutDashboard,
  Search,
  Wallet,
} from "lucide-react";

export function DeskGenerativePanel() {
  const { latest, balance, positions, execution } = useDeskToolState();

  if (!latest && !balance && !positions && !execution) {
    return <DeskIdleState />;
  }

  const tool = latest?.tool ?? "";
  const status = latest?.status ?? "complete";
  const running = isDeskToolRunning(status);
  const updatedAt = latest?.at ?? balance?.at ?? positions?.at ?? execution?.at;
  const panelKey = `${tool}-${updatedAt ?? 0}`;

  const execSnap = execution ?? (EXECUTION_DESK_TOOLS.has(tool) ? latest : null);
  if (execSnap && shouldShowExecutionDeskPanel(execSnap, latest)) {
    const execRunning = isDeskToolRunning(execSnap.status);
    const isCancel = execSnap.tool === "kalshi_sdk_cancel_order";

    return (
      <DeskSection
        key={`execution-${execSnap.at}`}
        icon={<ArrowLeftRight className="h-5 w-5" />}
        title={isCancel ? "Order cancellation" : "Executed trade"}
        subtitle={
          String(execSnap.args?.ticker ?? "") || undefined
        }
        tool={execSnap.tool}
        updatedAt={execSnap.at}
        running={execRunning}
      >
        <ExecutedTradeDeskView
          tool={execSnap.tool}
          args={execSnap.args}
          result={execSnap.result}
          loading={execRunning}
          cancelled={isCancel}
        />
      </DeskSection>
    );
  }

  if (SEARCH_TOOLS.has(tool)) {
    const search = parseSearchResult(latest?.result);
    const query = String(latest?.args?.query ?? search.query ?? "");

    return (
      <DeskSection
        key={panelKey}
        icon={<Search className="h-5 w-5" />}
        title="Market search"
        subtitle={query ? `“${query}”` : undefined}
        tool={tool}
        updatedAt={updatedAt}
        running={running}
      >
        {running ? (
          <MarketGridSkeleton />
        ) : search.error && search.markets.length === 0 ? (
          <SearchEmptyState search={search} />
        ) : search.markets.length === 0 ? (
          <SearchEmptyState search={search} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {search.markets.slice(0, 9).map((m, i) => (
              <KalshiMarketCard
                key={m.ticker ?? m.title ?? i}
                market={m}
                bestMatch={i === 0}
              />
            ))}
          </div>
        )}
      </DeskSection>
    );
  }

  if (ORDERBOOK_TOOLS.has(tool)) {
    const ticker = String(
      latest?.args?.ticker ??
        latest?.args?.market_ticker ??
        parseOrderbook(latest?.result)?.ticker ??
        "—",
    );
    const book = parseOrderbook(latest?.result);

    return (
      <DeskSection
        key={panelKey}
        icon={<BookOpen className="h-5 w-5" />}
        title="Order book"
        subtitle={ticker}
        tool={tool}
        updatedAt={updatedAt}
        running={running}
      >
        {running || !book ? (
          <OrderbookView
            book={{ yes: [], no: [], ticker }}
            ticker={ticker}
            loading
          />
        ) : (
          <OrderbookView book={book} ticker={ticker} />
        )}
      </DeskSection>
    );
  }

  if (PORTFOLIO_TOOLS.has(tool) || balance || positions) {
    const balRunning = balance ? isDeskToolRunning(balance.status) : false;
    const posRunning = positions ? isDeskToolRunning(positions.status) : false;
    const balanceResult =
      balance?.result ??
      (latest?.tool === "kalshi_sdk_get_balance" ? latest?.result : undefined);
    const positionsResult =
      positions?.result ??
      (latest?.tool === "kalshi_sdk_get_positions" ? latest?.result : undefined);

    return (
      <DeskSection
        key={panelKey}
        icon={<Wallet className="h-5 w-5" />}
        title="Portfolio"
        subtitle="Balance & positions"
        tool={tool || "kalshi_sdk_get_balance"}
        updatedAt={updatedAt}
        running={balRunning || posRunning || running}
      >
        <PortfolioDeskView
          balanceResult={balanceResult}
          positionsResult={positionsResult}
          balanceLoading={balRunning || (running && tool === "kalshi_sdk_get_balance")}
          positionsLoading={
            posRunning || (running && tool === "kalshi_sdk_get_positions")
          }
        />
      </DeskSection>
    );
  }

  return (
    <DeskSection
      key={panelKey}
      icon={<LayoutDashboard className="h-5 w-5" />}
      title="Agent activity"
      tool={tool}
      updatedAt={updatedAt}
      running={running}
    >
      <p className="text-sm text-pd-ink/70">
        Tool <span className="font-mono text-pd-accent">{humanToolName(tool)}</span>{" "}
        completed. Ask for markets, depth, or portfolio in chat.
      </p>
    </DeskSection>
  );
}

function DeskSection({
  icon,
  title,
  subtitle,
  tool,
  updatedAt,
  running,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  tool?: string;
  updatedAt?: number;
  running?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="pd-desk-fade-in flex h-full flex-col">
      <header className="mb-5">
        <div className="pd-accent-bar mb-4 w-16 rounded-full" aria-hidden />
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-pd-accent/15 text-pd-accent">
              {icon}
            </span>
            <div>
              <h2 className="text-lg font-semibold text-pd-ink">{title}</h2>
              {subtitle && (
                <p className="text-sm text-pd-ink/60">{subtitle}</p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {tool && (
              <span className="rounded-full border border-pd-border bg-pd-white px-2.5 py-1 font-mono text-[11px] text-pd-ink/70">
                {humanToolName(tool)}
              </span>
            )}
            {updatedAt != null && (
              <time
                className="text-xs text-pd-ink/45"
                dateTime={new Date(updatedAt).toISOString()}
              >
                {running ? "Updating…" : `Updated ${formatDeskTime(updatedAt)}`}
              </time>
            )}
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}

function SearchEmptyState({
  search,
}: {
  search: ReturnType<typeof parseSearchResult>;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-pd-border bg-pd-white/90 p-6 text-center">
      <AlertCircle className="mx-auto h-8 w-8 text-pd-accent/80" aria-hidden />
      <h3 className="mt-3 font-semibold text-pd-ink">No markets found</h3>
      <p className="mt-2 text-sm text-pd-ink/65">
        {search.error ?? "Try a shorter query with player and event name."}
      </p>
      {search.hint && (
        <p className="mt-3 text-xs leading-relaxed text-pd-ink/55">{search.hint}</p>
      )}
      {search.apiError && (
        <p className="mt-2 font-mono text-xs text-red-600/90">{search.apiError}</p>
      )}
      <ul className="mt-4 space-y-1 text-left text-sm text-pd-ink/60">
        <li>· Add an event ticker if the series is large</li>
        <li>· Try “Scottie Scheffler PGA” or a specific market ticker</li>
        <li>· Ask for closed markets if the event already finished</li>
      </ul>
    </div>
  );
}

function DeskIdleState() {
  const { sendPrompt, isRunning, isAgentReady } = useDeskPrompt();
  const startersDisabled = isRunning || !isAgentReady;

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-pd-accent/15 text-pd-accent">
        <LayoutDashboard className="h-8 w-8" aria-hidden />
      </span>
      <h3 className="mt-5 text-xl font-semibold text-pd-ink">Trading desk</h3>
      <p className="mt-2 max-w-md text-sm text-pd-ink/65">
        Rich market cards, portfolio breakdown, and order-book depth appear here
        as the agent calls Kalshi tools. To trade, ask in chat — you&apos;ll
        approve in the sidebar; the fill receipt appears here after execution.
      </p>
      <ul className="mt-8 flex w-full max-w-lg flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-center">
        {DESK_STARTER_ACTIONS.map(({ id, label, prompt, icon: Icon }) => (
          <li key={id}>
            <button
              type="button"
              disabled={startersDisabled}
              title={
                !isAgentReady
                  ? "Connecting to the desk agent…"
                  : isRunning
                    ? "Agent is running"
                    : undefined
              }
              onClick={() => void sendPrompt(prompt)}
              className="pd-gradient-chip inline-flex w-full items-center justify-center gap-2 rounded-xl border border-pd-border px-4 py-2.5 text-sm font-medium text-pd-ink shadow-sm transition hover:border-pd-accent disabled:opacity-50 sm:w-auto"
            >
              <Icon className="h-4 w-4 text-pd-accent" aria-hidden />
              {label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MarketGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-xl border border-pd-border bg-pd-white p-4"
        >
          <div className="h-3 w-24 rounded bg-pd-border" />
          <div className="mt-3 h-4 w-full rounded bg-pd-bg" />
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="h-8 rounded bg-pd-bg" />
            <div className="h-8 rounded bg-pd-bg" />
          </div>
        </div>
      ))}
    </div>
  );
}
