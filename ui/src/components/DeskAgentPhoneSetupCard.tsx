"use client";

import { ExternalLink, Phone, Save, Settings } from "lucide-react";
import { useState } from "react";

const AGENTPHONE_DOCS_URL = "https://agentphone.to";

type DeskAgentPhoneSetupCardProps = {
  apiKeyConfigured: boolean;
  agentIdSource: "env" | "file" | null;
  initialAgentId?: string;
  initialAgentName?: string | null;
  saving?: boolean;
  onSave: (agentId: string, agentName?: string) => Promise<void>;
  onContinue?: () => void;
  onCancel: () => void;
  onOpenSettings?: () => void;
};

/** In-chat AgentPhone setup when API key or agent ID is missing. */
export function DeskAgentPhoneSetupCard({
  apiKeyConfigured,
  agentIdSource,
  initialAgentId = "",
  initialAgentName = "",
  saving = false,
  onSave,
  onContinue,
  onCancel,
  onOpenSettings,
}: DeskAgentPhoneSetupCardProps) {
  const [agentId, setAgentId] = useState(initialAgentId);
  const [agentName, setAgentName] = useState(initialAgentName ?? "");
  const [error, setError] = useState<string | null>(null);

  const fromEnv = agentIdSource === "env";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = agentId.trim();
    if (!trimmed) {
      setError("Agent ID is required.");
      return;
    }
    setError(null);
    try {
      await onSave(trimmed, agentName.trim() || undefined);
    } catch {
      setError("Could not save. Try Settings.");
    }
  };

  return (
    <section className="pd-desk-fade-in my-2 rounded-2xl border border-pd-border bg-pd-white p-4 shadow-sm">
      <header className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-pd-accent/15 text-pd-accent">
          <Phone className="h-4 w-4" aria-hidden />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-pd-ink">Configure AgentPhone</h3>
          <p className="mt-0.5 text-xs text-pd-ink/55">
            SMS uses AgentPhone MCP on your trading director.
          </p>
        </div>
      </header>

      {!apiKeyConfigured ? (
        <div className="mt-3 space-y-3 text-sm text-pd-ink/70">
          <p>
            Add your AgentPhone API key in{" "}
            <strong className="font-medium text-pd-ink">Settings</strong> (repo{" "}
            <code className="font-mono text-xs">.env</code>, then restart the ADK
            agent). The chat cannot store API keys.
          </p>
          <div className="flex flex-wrap gap-2">
            {onOpenSettings ? (
              <button
                type="button"
                onClick={onOpenSettings}
                className="pd-gradient-chip inline-flex items-center gap-2 rounded-xl border border-pd-accent/40 px-4 py-2 text-sm font-medium text-pd-ink shadow-sm"
              >
                <Settings className="h-4 w-4 text-pd-accent" aria-hidden />
                Open Settings
              </button>
            ) : null}
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl border border-pd-border bg-pd-white px-4 py-2 text-sm font-medium text-pd-ink/75"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : fromEnv ? (
        <div className="mt-3 space-y-3">
          <p className="rounded-lg bg-pd-bg/80 px-3 py-2 text-xs text-pd-ink/65">
            AgentPhone agent ID is set via{" "}
            <code className="font-mono text-pd-accent">AGENTPHONE_AGENT_ID</code> in{" "}
            <code className="font-mono">.env</code>.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onContinue}
              className="pd-gradient-chip inline-flex items-center gap-2 rounded-xl border border-pd-accent/40 px-4 py-2 text-sm font-medium text-pd-ink shadow-sm"
            >
              Continue to SMS
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl border border-pd-border bg-pd-white px-4 py-2 text-sm font-medium text-pd-ink/75"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={(e) => void handleSubmit(e)} className="mt-4 flex flex-col gap-3">
          <p className="text-xs leading-relaxed text-pd-ink/60">
            Paste your AgentPhone agent ID (from{" "}
            <a
              href={AGENTPHONE_DOCS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 font-medium text-pd-accent hover:underline"
            >
              agentphone.ai
              <ExternalLink className="h-3 w-3" aria-hidden />
            </a>
            ) — not ProbDesk&apos;s <code className="font-mono">trading_director</code>.
            You can also create an agent in Settings.
          </p>
          <label className="block text-left">
            <span className="text-xs font-medium text-pd-ink/70">AgentPhone agent ID</span>
            <input
              type="text"
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
              placeholder="agt_…"
              disabled={saving}
              className="mt-1 w-full rounded-lg border border-pd-border bg-pd-bg/40 px-3 py-2 font-mono text-sm text-pd-ink outline-none focus:border-pd-accent focus:ring-1 focus:ring-pd-accent/40 disabled:opacity-60"
            />
          </label>
          <label className="block text-left">
            <span className="text-xs font-medium text-pd-ink/70">
              Display name (optional)
            </span>
            <input
              type="text"
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              placeholder="Desk alerts"
              disabled={saving}
              className="mt-1 w-full rounded-lg border border-pd-border bg-pd-bg/40 px-3 py-2 text-sm text-pd-ink outline-none focus:border-pd-accent focus:ring-1 focus:ring-pd-accent/40"
            />
          </label>
          {error ? (
            <p className="text-xs text-red-600/90" role="alert">
              {error}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={saving || !agentId.trim()}
              className="pd-gradient-chip inline-flex items-center gap-2 rounded-xl border border-pd-accent/40 px-4 py-2 text-sm font-medium text-pd-ink shadow-sm disabled:opacity-50"
            >
              <Save className="h-4 w-4 text-pd-accent" aria-hidden />
              {saving ? "Saving…" : "Save & continue"}
            </button>
            {onOpenSettings ? (
              <button
                type="button"
                onClick={onOpenSettings}
                className="inline-flex items-center gap-2 rounded-xl border border-pd-border bg-pd-white px-4 py-2 text-sm font-medium text-pd-ink/75 hover:border-pd-accent/30"
              >
                <Settings className="h-4 w-4" aria-hidden />
                Settings
              </button>
            ) : null}
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl border border-pd-border bg-pd-white px-4 py-2 text-sm font-medium text-pd-ink/75 hover:border-pd-accent/30"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
