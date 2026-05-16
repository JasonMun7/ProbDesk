"use client";

import { AgentPhoneSetupSection } from "@/components/AgentPhoneSetupSection";
import { ProbDeskViewHeader } from "@/components/ProbDeskViewHeader";
import { COPILOT_AGENT_ID } from "@/lib/constants";
import type { ConfigStatus } from "@/lib/config-status-types";
import { requestShowOnboarding } from "@/lib/onboarding-storage";
import {
  CheckCircle2,
  CircleDashed,
  ExternalLink,
  Loader2,
  Settings,
} from "lucide-react";
import { useEffect, useState } from "react";

export function SettingsPanel() {
  const [status, setStatus] = useState<ConfigStatus | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [agentIdInput, setAgentIdInput] = useState("");
  const [agentNameInput, setAgentNameInput] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/config-status");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as ConfigStatus;
        if (!cancelled) {
          setStatus(data);
          const fromFile =
            data.agentphone.agentIdSource === "file"
              ? data.agentphone.agentId ?? ""
              : "";
          setAgentIdInput(fromFile);
          if (data.agentphone.agentName) {
            setAgentNameInput(data.agentphone.agentName);
          }
        }
      } catch {
        if (!cancelled) {
          setLoadError("Could not load server config status.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <ProbDeskViewHeader
        title="Settings"
        subtitle="Environment and runtime · secrets stay on the server"
      />

      <section className="flex flex-1 flex-col gap-6 overflow-auto p-6">
        {loadError && (
          <p className="rounded-xl border border-pd-border bg-pd-white px-4 py-3 text-sm text-pd-ink/70">
            {loadError} Copy variables from{" "}
            <code className="font-mono text-xs text-pd-accent">.env.example</code>{" "}
            at the repo root into <code className="font-mono text-xs">.env</code>.
          </p>
        )}

        <SettingsSection
          icon={<Settings className="h-5 w-5" />}
          title="Kalshi API"
          description="Authenticated SDK tools (balance, positions, orders). Public search works without keys on the demo API."
        >
          {status?.kalshi.configured ? (
            <p className="mb-3 flex items-center gap-2 rounded-xl border border-pd-accent/35 bg-pd-accent/10 px-3 py-2 text-sm text-pd-ink">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-pd-accent" aria-hidden />
              Connected — credentials loaded from repo{" "}
              <code className="font-mono text-xs">.env</code>
            </p>
          ) : status && !status.kalshi.configured ? (
            <p className="mb-3 rounded-xl border border-dashed border-pd-border bg-pd-bg/60 px-3 py-2 text-sm text-pd-ink/70">
              Not connected — set API key id and a valid private key path (or PEM)
              in the repo root <code className="font-mono text-xs">.env</code>,
              then restart <code className="font-mono text-xs">npm run dev</code>.
            </p>
          ) : null}
          <ConfigRow
            label="KALSHI_API_KEY_ID"
            hint="Key ID from your Kalshi account dashboard (demo or prod)."
            configured={status?.kalshi.apiKeyId}
            loading={!status && !loadError}
          />
          <ConfigRow
            label="KALSHI_PRIVATE_KEY_PATH"
            hint="Path to RSA PEM, e.g. secrets/kalshi/private_key.pem. Or set KALSHI_PRIVATE_KEY_PEM."
            configured={status?.kalshi.privateKey}
            loading={!status && !loadError}
          />
          <ConfigRow
            label="KALSHI_TRADE_API_BASE"
            hint="Optional. Defaults to demo-api.kalshi.co — match demo vs prod keys."
            configured={undefined}
            loading={false}
            staticNote="Set in .env (see .env.example)"
          />
        </SettingsSection>

        <SettingsSection
          title="Agent / runtime"
          description="ADK agent served over AG-UI; started with npm run dev:agent."
        >
          <ConfigRow
            label="GOOGLE_API_KEY"
            hint="Gemini developer API key from Google AI Studio — required for agents."
            configured={status?.agent.googleApiKey}
            loading={!status && !loadError}
          />
          <EnvValueRow
            label="PROB_DESK_AGUI_URL"
            value={status?.agent.aguiUrl ?? "http://127.0.0.1:8000/"}
            hint="HttpAgent URL for CopilotKit runtime (default local AG-UI)."
          />
        </SettingsSection>

        <SettingsSection
          title="AgentPhone"
          description="Optional SMS via AgentPhone MCP on the trading director. API key in .env; agent ID here or in .env."
        >
          <AgentPhoneSetupSection
            status={status?.agentphone}
            loading={!status && !loadError}
            agentIdInput={agentIdInput}
            agentNameInput={agentNameInput}
            onAgentIdChange={setAgentIdInput}
            onAgentNameChange={setAgentNameInput}
            onSaved={(agentId, agentName) => {
              if (agentName) setAgentNameInput(agentName);
              setStatus((prev) =>
                prev
                  ? {
                      ...prev,
                      agentphone: {
                        ...prev.agentphone,
                        agentId,
                        agentIdConfigured: !!agentId,
                        agentIdSource: agentId ? "file" : null,
                        agentName: agentName ?? prev.agentphone.agentName,
                        smsReady:
                          (prev.agentphone.apiKeyConfigured ??
                            prev.agentphone.configured) &&
                          !!agentId,
                      },
                    }
                  : prev,
              );
            }}
          />
        </SettingsSection>

        <SettingsSection
          title="Copilot"
          description="Next.js CopilotKit runtime proxies chat to the ADK agent."
        >
          <EnvValueRow
            label="Runtime URL"
            value={status?.copilot.runtimeUrl ?? "/api/copilotkit"}
            hint="Browser → Next route → AG-UI agent."
          />
          <EnvValueRow
            label="Agent id"
            value={status?.copilot.agentId ?? COPILOT_AGENT_ID}
            hint="Must match agents key in api/copilotkit/route.ts."
          />
          <ConfigRow
            label="PROB_DESK_MCP_APPS_URL"
            hint="Optional MCP Apps server for in-chat UI widgets."
            configured={status?.copilot.mcpApps}
            loading={!status && !loadError}
            optional
          />
        </SettingsSection>

        <SettingsSection title="Setup" description="First-time configuration checklist">
          <p className="text-sm text-pd-ink/70">
            Re-open the Get Started modal to review required and optional credentials.
          </p>
          <button
            type="button"
            onClick={() => requestShowOnboarding()}
            className="mt-3 text-sm font-medium text-pd-accent hover:underline"
          >
            Run setup checklist again
          </button>
        </SettingsSection>

        <SettingsSection title="About" description="ProbDesk web UI">
          <p className="text-sm text-pd-ink/70">
            Version{" "}
            <span className="font-mono text-pd-ink">
              {status?.version ?? "0.1.0"}
            </span>
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            <AboutLink
              href="https://kalshi.com"
              label="Kalshi"
            />
            <AboutLink
              href="https://docs.copilotkit.ai"
              label="CopilotKit docs"
            />
            <AboutLink
              href="https://google.github.io/adk-docs/"
              label="Google ADK docs"
            />
          </ul>
        </SettingsSection>
      </section>
    </>
  );
}

function SettingsSection({
  icon,
  title,
  description,
  children,
}: {
  icon?: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <article className="rounded-2xl border border-pd-border bg-pd-white/95 p-5 shadow-sm">
      <header className="mb-4 flex items-start gap-3">
        {icon && (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pd-accent/15 text-pd-accent">
            {icon}
          </span>
        )}
        <div>
          <h3 className="text-base font-semibold text-pd-ink">{title}</h3>
          <p className="mt-0.5 text-sm text-pd-ink/60">{description}</p>
        </div>
      </header>
      <div className="space-y-3">{children}</div>
    </article>
  );
}

function ConfigRow({
  label,
  hint,
  configured,
  loading,
  optional,
  staticNote,
}: {
  label: string;
  hint: string;
  configured?: boolean;
  loading?: boolean;
  optional?: boolean;
  staticNote?: string;
}) {
  return (
    <div className="rounded-xl border border-pd-border/80 bg-pd-bg/40 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <code className="font-mono text-xs font-medium text-pd-ink">{label}</code>
        <StatusBadge
          configured={configured}
          loading={loading}
          optional={optional}
          staticNote={staticNote}
        />
      </div>
      <p className="mt-1.5 text-xs leading-relaxed text-pd-ink/55">{hint}</p>
    </div>
  );
}

function EnvValueRow({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-xl border border-pd-border/80 bg-pd-bg/40 px-4 py-3">
      <p className="font-mono text-xs font-medium text-pd-ink">{label}</p>
      <p className="mt-1 break-all font-mono text-sm text-pd-accent">{value}</p>
      <p className="mt-1.5 text-xs leading-relaxed text-pd-ink/55">{hint}</p>
    </div>
  );
}

function StatusBadge({
  configured,
  loading,
  optional,
  staticNote,
}: {
  configured?: boolean;
  loading?: boolean;
  optional?: boolean;
  staticNote?: string;
}) {
  if (staticNote) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-pd-border bg-pd-white px-2.5 py-0.5 text-[11px] font-medium text-pd-ink/65">
        {staticNote}
      </span>
    );
  }

  if (loading) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-pd-border bg-pd-white px-2.5 py-0.5 text-[11px] font-medium text-pd-ink/55">
        <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
        Checking…
      </span>
    );
  }

  if (optional && configured === false) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-pd-border bg-pd-white px-2.5 py-0.5 text-[11px] font-medium text-pd-ink/55">
        <CircleDashed className="h-3 w-3" aria-hidden />
        Not set
      </span>
    );
  }

  if (configured) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-pd-accent/40 bg-pd-accent/10 px-2.5 py-0.5 text-[11px] font-medium text-pd-ink">
        <CheckCircle2 className="h-3 w-3 text-pd-accent" aria-hidden />
        Configured
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-200/80 bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium text-amber-900/90">
      <CircleDashed className="h-3 w-3" aria-hidden />
      Missing
    </span>
  );
}

function AboutLink({ href, label }: { href: string; label: string }) {
  return (
    <li>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-pd-accent hover:underline"
      >
        {label}
        <ExternalLink className="h-3.5 w-3.5" aria-hidden />
      </a>
    </li>
  );
}
