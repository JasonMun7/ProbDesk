"use client";

import type { ConfigStatus } from "@/lib/config-status-types";
import {
  CheckCircle2,
  CircleDashed,
  Copy,
  ExternalLink,
  Loader2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const GOOGLE_API_KEY_URL = "https://aistudio.google.com/app/apikey";
const KALSHI_DEMO_SLIDES_URL =
  "https://docs.google.com/presentation/d/e/2PACX-1vRvhUAqRBYzJmt7JCinMXmu6KVWkj-cc7ikDXGConmqjcv4mnlJacgHPcZJ20fWWnrYdubn-oczclKP/pub?start=false&loop=false&delayms=3000&slide=id.g359756fc63c_5_25";
const AGENTPHONE_URL = "https://agentphone.to";

type DeskGetStartedModalProps = {
  open: boolean;
  status: ConfigStatus | null;
  loadError: string | null;
  onDismiss: () => void;
  onOpenSettings: () => void;
};

export function DeskGetStartedModal({
  open,
  status,
  loadError,
  onDismiss,
  onOpenSettings,
}: DeskGetStartedModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onDismiss]);

  if (!open) return null;

  const googleOk = status?.agent.googleApiKey ?? false;
  const kalshiOk = status?.kalshi.configured ?? false;
  const agentphoneKeyOk = status?.agentphone.apiKeyConfigured ?? false;
  const agentphoneIdOk = status?.agentphone.agentIdConfigured ?? false;
  const agentphoneOk = status?.agentphone.smsReady ?? false;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-pd-ink/45 backdrop-blur-[2px]"
        aria-label="Close setup"
        onClick={onDismiss}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pd-get-started-title"
        data-testid="pd-get-started-modal"
        className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-pd-border bg-pd-white shadow-xl"
      >
        <div className="pd-accent-bar h-1 w-full shrink-0" aria-hidden />
        <div className="max-h-[min(85vh,640px)] overflow-y-auto p-6">
          <header className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-pd-accent">
                First-time setup
              </p>
              <h2
                id="pd-get-started-title"
                className="mt-1 text-xl font-semibold text-pd-ink"
              >
                Get started with Prob Desk
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-pd-ink/60">
                Configure server-side credentials in the repo root{" "}
                <code className="font-mono text-xs text-pd-accent">.env</code>. The
                desk still loads if you skip optional items.
              </p>
            </div>
            <button
              type="button"
              onClick={onDismiss}
              className="shrink-0 rounded-lg p-1.5 text-pd-ink/50 transition hover:bg-pd-bg hover:text-pd-ink"
              aria-label="Close"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </header>

          {loadError ? (
            <p className="mt-4 rounded-xl border border-pd-border bg-pd-bg/60 px-3 py-2 text-sm text-pd-ink/70">
              {loadError}
            </p>
          ) : null}

          <ol className="mt-5 space-y-4" role="list">
            <ChecklistItem
              title="Google API key"
              required
              configured={googleOk}
              loading={!status && !loadError}
            >
              <p className="text-xs leading-relaxed text-pd-ink/60">
                Required for ADK agents and chat. Create a key in{" "}
                <a
                  href={GOOGLE_API_KEY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-0.5 font-medium text-pd-accent hover:underline"
                >
                  Google AI Studio
                  <ExternalLink className="h-3 w-3" aria-hidden />
                </a>
                , add it to <code className="font-mono text-[11px]">.env</code> at
                the repo root, then restart{" "}
                <code className="font-mono text-[11px]">npm run dev</code>.
              </p>
              {!googleOk ? (
                <CopyEnvBlock
                  lines={["GOOGLE_API_KEY=your_key_here"]}
                  className="mt-3"
                />
              ) : null}
            </ChecklistItem>

            <ChecklistItem
              title="Kalshi credentials"
              optional
              configured={kalshiOk}
              loading={!status && !loadError}
            >
              <p className="text-xs leading-relaxed text-pd-ink/60">
                Optional but recommended for portfolio, balance, and order tools.
                Public market search works without keys on the demo API. Follow the{" "}
                <a
                  href={KALSHI_DEMO_SLIDES_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-0.5 font-medium text-pd-accent hover:underline"
                >
                  Kalshi demo setup walkthrough
                  <ExternalLink className="h-3 w-3" aria-hidden />
                </a>{" "}
                and place your PEM under{" "}
                <code className="font-mono text-[11px]">secrets/kalshi/</code>.
              </p>
              {!kalshiOk && status ? (
                <CopyEnvBlock
                  lines={[
                    "KALSHI_API_KEY_ID=your_key_id",
                    "KALSHI_PRIVATE_KEY_PATH=secrets/kalshi/private_key.pem",
                    "KALSHI_TRADE_API_BASE=https://demo-api.kalshi.co/trade-api/v2",
                  ]}
                  className="mt-3"
                />
              ) : null}
            </ChecklistItem>

            <ChecklistItem
              title="AgentPhone (SMS)"
              optional
              configured={agentphoneOk}
              loading={!status && !loadError}
            >
              <p className="text-xs leading-relaxed text-pd-ink/60">
                Optional voice/SMS via{" "}
                <a
                  href={AGENTPHONE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-0.5 font-medium text-pd-accent hover:underline"
                >
                  AgentPhone
                  <ExternalLink className="h-3 w-3" aria-hidden />
                </a>
                . API key goes in <code className="font-mono text-[11px]">.env</code>;
                agent ID can be saved in Settings.
              </p>
              {status && !agentphoneKeyOk ? (
                <CopyEnvBlock
                  lines={["AGENTPHONE_API_KEY=your_key_here"]}
                  className="mt-3"
                />
              ) : null}
              {status && agentphoneKeyOk && !agentphoneIdOk ? (
                <p className="mt-3 text-xs text-pd-ink/65">
                  API key is set. Add an agent ID in Settings (saved to{" "}
                  <code className="font-mono text-[11px]">
                    .prob-desk/desk-settings.json
                  </code>
                  ) or set{" "}
                  <code className="font-mono text-[11px]">AGENTPHONE_AGENT_ID</code>{" "}
                  in <code className="font-mono text-[11px]">.env</code>.
                </p>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  onDismiss();
                  onOpenSettings();
                }}
                className="mt-3 text-sm font-medium text-pd-accent hover:underline"
              >
                Open Settings →
              </button>
            </ChecklistItem>
          </ol>

          <footer className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onDismiss}
              className="rounded-xl border border-pd-border bg-pd-white px-4 py-2.5 text-sm font-medium text-pd-ink/75 transition hover:border-pd-accent/35"
            >
              Remind me later
            </button>
            <button
              type="button"
              onClick={onDismiss}
              className="rounded-xl bg-pd-accent px-4 py-2.5 text-sm font-semibold text-pd-ink shadow-sm transition hover:brightness-105"
            >
              Continue to desk
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
}

function ChecklistItem({
  title,
  required,
  optional,
  configured,
  loading,
  children,
}: {
  title: string;
  required?: boolean;
  optional?: boolean;
  configured: boolean;
  loading: boolean;
  children: React.ReactNode;
}) {
  return (
    <li className="rounded-xl border border-pd-border/80 bg-pd-bg/30 px-4 py-3">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 shrink-0" aria-hidden>
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin text-pd-accent/70" />
          ) : configured ? (
            <CheckCircle2 className="h-5 w-5 text-pd-accent" />
          ) : (
            <CircleDashed className="h-5 w-5 text-pd-ink/35" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-pd-ink">
            {title}
            {required ? (
              <span className="ml-1.5 text-[10px] font-semibold uppercase tracking-wide text-pd-accent">
                Required
              </span>
            ) : null}
            {optional ? (
              <span className="ml-1.5 text-[10px] font-semibold uppercase tracking-wide text-pd-ink/45">
                Optional
              </span>
            ) : null}
          </p>
          <div className="mt-2">{children}</div>
        </div>
      </div>
    </li>
  );
}

function CopyEnvBlock({
  lines,
  className,
}: {
  lines: string[];
  className?: string;
}) {
  const text = lines.join("\n");
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked */
    }
  }, [text]);

  return (
    <div className={className}>
      <pre className="overflow-x-auto rounded-lg border border-pd-border bg-pd-white px-3 py-2 font-mono text-[11px] leading-relaxed text-pd-ink/80">
        {lines.map((line) => (
          <div key={line}>{line}</div>
        ))}
      </pre>
      <button
        type="button"
        onClick={() => void copy()}
        className="pd-clickable mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-pd-accent hover:underline"
      >
        {copied ? (
          <>
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
            Copied
          </>
        ) : (
          <>
            <Copy className="h-3.5 w-3.5" aria-hidden />
            Copy to clipboard
          </>
        )}
      </button>
    </div>
  );
}
