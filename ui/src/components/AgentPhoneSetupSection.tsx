"use client";

import {
  CheckCircle2,
  CircleDashed,
  ExternalLink,
  Loader2,
  Sparkles,
} from "lucide-react";
import { useState } from "react";

const AGENTPHONE_DASHBOARD_URL = "https://agentphone.ai/settings";
const AGENTPHONE_DOCS_URL = "https://agentphone.to";

export type AgentPhoneConfigSlice = {
  apiKeyConfigured: boolean;
  agentId: string | null;
  agentIdConfigured: boolean;
  agentIdSource: "env" | "file" | null;
  smsReady?: boolean;
  agentName?: string | null;
};

type AgentPhoneSetupSectionProps = {
  status: AgentPhoneConfigSlice | undefined;
  loading: boolean;
  agentIdInput: string;
  agentNameInput: string;
  onAgentIdChange: (value: string) => void;
  onAgentNameChange: (value: string) => void;
  onSaved: (agentId: string | null, agentName: string | null) => void;
};

export function AgentPhoneSetupSection({
  status,
  loading,
  agentIdInput,
  agentNameInput,
  onAgentIdChange,
  onAgentNameChange,
  onSaved,
}: AgentPhoneSetupSectionProps) {
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const apiKeyOk =
    status?.apiKeyConfigured ?? (status as { configured?: boolean })?.configured ?? false;
  const agentIdOk = status?.agentIdConfigured ?? false;
  const smsReady = status?.smsReady ?? (apiKeyOk && agentIdOk);
  const fromEnv = status?.agentIdSource === "env";

  const handleSave = async () => {
    const id = agentIdInput.trim();
    if (!id) {
      setSaveError("Agent ID is required.");
      return;
    }
    setSaving(true);
    setSaveError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/desk-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentphoneAgentId: id,
          agentphoneAgentName: agentNameInput.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as {
        agentphone?: { agentId?: string | null; agentName?: string | null };
      };
      setSaved(true);
      onSaved(data.agentphone?.agentId ?? id, data.agentphone?.agentName ?? null);
    } catch {
      setSaveError("Could not save AgentPhone settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateAgent = async () => {
    setCreating(true);
    setSaveError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/agentphone/create-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: agentNameInput.trim() || "ProbDesk",
        }),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const data = (await res.json()) as { agentId: string; agentName?: string };
      onAgentIdChange(data.agentId);
      if (data.agentName) onAgentNameChange(data.agentName);
      setSaved(true);
      onSaved(data.agentId, data.agentName ?? null);
    } catch (e) {
      setSaveError(
        e instanceof Error ? e.message : "Could not create AgentPhone agent.",
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-3">
      {smsReady ? (
        <p className="flex items-center gap-2 rounded-xl border border-pd-accent/35 bg-pd-accent/10 px-3 py-2 text-sm text-pd-ink">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-pd-accent" aria-hidden />
          SMS ready — API key and AgentPhone agent ID are configured.
        </p>
      ) : (
        <p className="rounded-xl border border-dashed border-pd-border bg-pd-bg/60 px-3 py-2 text-sm text-pd-ink/70">
          {!apiKeyOk
            ? "Step 1: add your AgentPhone API key to the repo .env and restart the ADK agent. Step 2: set an AgentPhone agent ID below (not the ProbDesk trading_director id)."
            : "API key detected. Add an AgentPhone agent ID below — this is the id from agentphone.ai (e.g. agt_…), used by MCP SMS tools."}
        </p>
      )}

      <div className="rounded-xl border border-pd-border/80 bg-pd-bg/40 px-4 py-3">
        <StatusLine label="AGENTPHONE_API_KEY" configured={apiKeyOk} loading={loading} />
        <p className="mt-1.5 text-xs leading-relaxed text-pd-ink/55">
          Required for the trading director to load AgentPhone MCP tools. Must live
          in the repo root{" "}
          <code className="font-mono text-[11px]">.env</code> — the browser cannot
          write secrets there. After adding the key, restart{" "}
          <code className="font-mono text-[11px]">npm run dev</code> (or your ADK
          agent process).
        </p>
        {!apiKeyOk && !loading ? (
          <pre className="mt-2 overflow-x-auto rounded-lg border border-pd-border bg-pd-white px-3 py-2 font-mono text-[11px] text-pd-ink/80">
            AGENTPHONE_API_KEY=ap_your_key_here
          </pre>
        ) : null}
        <p className="mt-2 text-xs text-pd-ink/55">
          Get a key from{" "}
          <a
            href={AGENTPHONE_DASHBOARD_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 font-medium text-pd-accent hover:underline"
          >
            AgentPhone settings
            <ExternalLink className="h-3 w-3" aria-hidden />
          </a>
          .
        </p>
      </div>

      <p className="px-1 text-xs leading-relaxed text-pd-ink/55">
        <StatusLine
          label="AgentPhone agent ID"
          configured={agentIdOk}
          loading={loading}
          inline
        />{" "}
        Identifies your voice/SMS agent on AgentPhone — separate from Copilot&apos;s{" "}
        <code className="font-mono text-[11px]">trading_director</code>. MCP SMS tools
        require this id once the API key is set.
      </p>

      {fromEnv ? (
        <p className="rounded-xl border border-pd-border/80 bg-pd-bg/40 px-4 py-3 text-xs text-pd-ink/65">
          Agent ID is set via{" "}
          <code className="font-mono text-pd-accent">AGENTPHONE_AGENT_ID</code> in{" "}
          <code className="font-mono">.env</code>
          {status?.agentId ? (
            <>
              {" "}
              (<span className="font-mono">{status.agentId}</span>).
            </>
          ) : (
            "."
          )}{" "}
          To edit from the UI, remove that variable and save the ID here instead.
        </p>
      ) : (
        <div className="rounded-xl border border-pd-border/80 bg-pd-bg/40 px-4 py-3">
          <p className="text-xs leading-relaxed text-pd-ink/55">
            Saved to{" "}
            <code className="font-mono text-[11px]">.prob-desk/desk-settings.json</code>{" "}
            (gitignored). The ADK agent reads this on startup when{" "}
            <code className="font-mono text-[11px]">AGENTPHONE_AGENT_ID</code> is not in{" "}
            <code className="font-mono text-[11px]">.env</code>.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="block text-left sm:col-span-2">
              <span className="text-xs font-medium text-pd-ink/70">
                AgentPhone agent ID
              </span>
              <input
                type="text"
                value={agentIdInput}
                onChange={(e) => onAgentIdChange(e.target.value)}
                placeholder="agt_…"
                disabled={!apiKeyOk || saving || creating}
                className="mt-1 w-full rounded-lg border border-pd-border bg-pd-white px-3 py-2 font-mono text-sm text-pd-ink outline-none focus:border-pd-accent focus:ring-1 focus:ring-pd-accent/40 disabled:opacity-50"
              />
            </label>
            <label className="block text-left sm:col-span-2">
              <span className="text-xs font-medium text-pd-ink/70">
                Display name (optional)
              </span>
              <input
                type="text"
                value={agentNameInput}
                onChange={(e) => onAgentNameChange(e.target.value)}
                placeholder="Desk alerts"
                disabled={!apiKeyOk || saving || creating}
                className="mt-1 w-full rounded-lg border border-pd-border bg-pd-white px-3 py-2 text-sm text-pd-ink outline-none focus:border-pd-accent focus:ring-1 focus:ring-pd-accent/40 disabled:opacity-50"
              />
            </label>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!apiKeyOk || saving || creating || !agentIdInput.trim()}
              onClick={() => void handleSave()}
              className="rounded-xl bg-pd-accent px-4 py-2 text-sm font-medium text-pd-ink shadow-sm transition hover:brightness-105 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              disabled={!apiKeyOk || saving || creating}
              onClick={() => void handleCreateAgent()}
              className="inline-flex items-center gap-2 rounded-xl border border-pd-accent/40 bg-pd-white px-4 py-2 text-sm font-medium text-pd-ink shadow-sm transition hover:border-pd-accent disabled:opacity-50"
            >
              {creating ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Sparkles className="h-4 w-4 text-pd-accent" aria-hidden />
              )}
              {creating ? "Creating…" : "Create agent"}
            </button>
            <a
              href={AGENTPHONE_DOCS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-xl border border-pd-border px-4 py-2 text-sm font-medium text-pd-ink/75 hover:border-pd-accent/30"
            >
              Dashboard
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </a>
          </div>
          {!apiKeyOk ? (
            <p className="mt-2 text-xs text-pd-ink/50">
              Set <code className="font-mono">AGENTPHONE_API_KEY</code> in .env before
              saving or creating an agent.
            </p>
          ) : null}
          {saved ? (
            <p className="mt-2 text-xs text-pd-accent" role="status">
              Saved. Restart the ADK agent if SMS tools do not pick up changes
              immediately.
            </p>
          ) : null}
          {saveError ? (
            <p className="mt-2 text-xs text-red-600/90" role="alert">
              {saveError}
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}

function StatusLine({
  label,
  configured,
  loading,
  inline,
}: {
  label: string;
  configured?: boolean;
  loading?: boolean;
  inline?: boolean;
}) {
  const badge = loading ? (
    <span className="inline-flex items-center gap-1 text-[11px] text-pd-ink/55">
      <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
      Checking…
    </span>
  ) : configured ? (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-pd-accent">
      <CheckCircle2 className="h-3 w-3" aria-hidden />
      Configured
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-900/90">
      <CircleDashed className="h-3 w-3" aria-hidden />
      Missing
    </span>
  );

  if (inline) {
    return (
      <span className="inline-flex flex-wrap items-center gap-2">
        <code className="font-mono text-[11px] font-medium text-pd-ink">{label}</code>
        {badge}
      </span>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <code className="font-mono text-xs font-medium text-pd-ink">{label}</code>
      {badge}
    </div>
  );
}
