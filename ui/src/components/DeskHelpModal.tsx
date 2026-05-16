"use client";

import { DESK_CHAT_STARTERS } from "@/lib/desk-demo-prompts";
import { ExternalLink, X } from "lucide-react";
import { useEffect } from "react";

const KALSHI_DEMO_SLIDES_URL =
  "https://docs.google.com/presentation/d/e/2PACX-1vRvhUAqRBYzJmt7JCinMXmu6KVWkj-cc7ikDXGConmqjcv4mnlJacgHPcZJ20fWWnrYdubn-oczclKP/pub?start=false&loop=false&delayms=3000&slide=id.g359756fc63c_5_25";

const EXAMPLE_TICKER = "KXPGATOUR-PGC26-SSCH";

type DeskHelpModalProps = {
  open: boolean;
  onClose: () => void;
};

export function DeskHelpModal({ open, onClose }: DeskHelpModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-pd-ink/45 backdrop-blur-[2px]"
        aria-label="Close desk help"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pd-desk-help-title"
        data-testid="pd-desk-help-modal"
        className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-pd-border bg-pd-white shadow-xl"
      >
        <div className="pd-accent-bar h-1 w-full shrink-0" aria-hidden />
        <div className="max-h-[min(85vh,640px)] overflow-y-auto p-6">
          <header className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-pd-accent">
                Desk guide
              </p>
              <h2
                id="pd-desk-help-title"
                className="mt-1 text-xl font-semibold text-pd-ink"
              >
                Using Prob Desk
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-pd-ink/60">
                Search markets in chat, watch tool results in the center panel,
                and approve trades from the sidebar.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-lg p-1.5 text-pd-ink/50 transition hover:bg-pd-bg hover:text-pd-ink"
              aria-label="Close"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </header>

          <div className="mt-5 space-y-4">
            <HelpSection title="Finding market tickers">
              <p className="text-xs leading-relaxed text-pd-ink/60">
                Ask in chat to search Kalshi — for example{" "}
                <q className="text-pd-ink/75">Scottie Scheffler PGA</q>. The
                agent returns search cards; copy the ticker from a card title or
                from the order book subtitle in the center panel.
              </p>
              <p className="mt-2 text-xs leading-relaxed text-pd-ink/60">
                Demo example:{" "}
                <code className="font-mono text-[11px] text-pd-accent">
                  {EXAMPLE_TICKER}
                </code>{" "}
                (Scottie Scheffler PGA). Then try{" "}
                <q className="text-pd-ink/75">
                  Show the orderbook for {EXAMPLE_TICKER}
                </q>
                .
              </p>
            </HelpSection>

            <HelpSection title="Kalshi demo account">
              <p className="text-xs leading-relaxed text-pd-ink/60">
                Public search and order books work on the demo API without keys.
                For portfolio, orders, and live execution, create demo API
                credentials and add them to{" "}
                <code className="font-mono text-[11px]">.env</code> at the repo
                root.
              </p>
              <p className="mt-2 text-xs leading-relaxed text-pd-ink/60">
                Follow the{" "}
                <a
                  href={KALSHI_DEMO_SLIDES_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-0.5 font-medium text-pd-accent hover:underline"
                >
                  Kalshi demo setup walkthrough
                  <ExternalLink className="h-3 w-3" aria-hidden />
                </a>
                , save your PEM under{" "}
                <code className="font-mono text-[11px]">secrets/kalshi/</code>,
                then confirm{" "}
                <strong className="font-medium">
                  Settings → Kalshi API → Connected
                </strong>{" "}
                after restart.
              </p>
            </HelpSection>

            <HelpSection title="Using the desk">
              <ul className="list-inside list-disc space-y-1.5 text-xs leading-relaxed text-pd-ink/60">
                <li>
                  <strong className="font-medium text-pd-ink/75">
                    Center panel
                  </strong>{" "}
                  — live views from agent tools (search, order book, portfolio,
                  trade receipts).
                </li>
                <li>
                  <strong className="font-medium text-pd-ink/75">
                    Chat (right)
                  </strong>{" "}
                  — talk to the multi-agent desk; use starter chips for quick
                  prompts.
                </li>
                <li>
                  <strong className="font-medium text-pd-ink/75">Sidebar</strong>{" "}
                  — approve or deny Kalshi orders when the agent requests{" "}
                  <code className="font-mono text-[10px]">
                    approve_kalshi_order
                  </code>
                  .
                </li>
              </ul>
              <p className="mt-2 text-xs leading-relaxed text-pd-ink/60">
                Trade flow: request in chat → Approve / Deny in the sidebar →
                executed trade receipt in the center panel.
              </p>
            </HelpSection>

            <HelpSection title="Starter prompts">
              <ul className="space-y-2">
                {DESK_CHAT_STARTERS.map((prompt) => (
                  <li
                    key={prompt.id}
                    className="rounded-lg border border-pd-border/70 bg-pd-bg/40 px-3 py-2"
                  >
                    <p className="text-xs font-medium text-pd-ink">
                      {prompt.title}
                    </p>
                    <p className="mt-0.5 font-mono text-[10px] leading-relaxed text-pd-ink/55">
                      {prompt.message}
                    </p>
                  </li>
                ))}
              </ul>
            </HelpSection>
          </div>

          <footer className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-pd-accent px-4 py-2.5 text-sm font-semibold text-pd-ink shadow-sm transition hover:brightness-105"
            >
              Close
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
}

function HelpSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-pd-border/80 bg-pd-bg/35 p-4">
      <h3 className="text-sm font-semibold text-pd-ink">{title}</h3>
      <div className="mt-2">{children}</div>
    </section>
  );
}
