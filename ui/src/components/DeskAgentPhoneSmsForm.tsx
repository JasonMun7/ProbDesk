"use client";

import { MessageSquare, Phone } from "lucide-react";
import { useState } from "react";

type DeskAgentPhoneSmsFormProps = {
  agentId: string;
  agentName?: string | null;
  sending?: boolean;
  onSend: (phone: string, body: string) => void;
  onCancel: () => void;
};

/** In-chat SMS compose form after AgentPhone is configured. */
export function DeskAgentPhoneSmsForm({
  agentId,
  agentName,
  sending = false,
  onSend,
  onCancel,
}: DeskAgentPhoneSmsFormProps) {
  const [phone, setPhone] = useState("");
  const [body, setBody] = useState("");

  const canSend =
    !sending && phone.trim().length > 0 && body.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSend) return;
    onSend(phone.trim(), body.trim());
  };

  return (
    <section className="pd-desk-fade-in my-2 rounded-2xl border border-pd-border bg-pd-white p-4 shadow-sm">
      <header className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-pd-accent/15 text-pd-accent">
          <Phone className="h-4 w-4" aria-hidden />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-pd-ink">Send SMS alert</h3>
          <p className="mt-0.5 font-mono text-xs text-pd-ink/55">
            Agent {agentName?.trim() || agentId}
          </p>
        </div>
      </header>
      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
        <label className="block text-left">
          <span className="text-xs font-medium text-pd-ink/70">Phone (E.164)</span>
          <input
            type="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+14155551234"
            disabled={sending}
            className="mt-1 w-full rounded-lg border border-pd-border bg-pd-bg/40 px-3 py-2 text-sm text-pd-ink outline-none focus:border-pd-accent focus:ring-1 focus:ring-pd-accent/40"
          />
        </label>
        <label className="block text-left">
          <span className="text-xs font-medium text-pd-ink/70">Message</span>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={2}
            placeholder="Short desk alert or reminder"
            disabled={sending}
            className="mt-1 w-full resize-y rounded-lg border border-pd-border bg-pd-bg/40 px-3 py-2 text-sm text-pd-ink outline-none focus:border-pd-accent focus:ring-1 focus:ring-pd-accent/40"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={!canSend}
            className="pd-gradient-chip inline-flex items-center gap-2 rounded-xl border border-pd-accent/40 px-4 py-2 text-sm font-medium text-pd-ink shadow-sm disabled:opacity-50"
          >
            <MessageSquare className="h-4 w-4 text-pd-accent" aria-hidden />
            {sending ? "Sending…" : "Send via agent"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={sending}
            className="rounded-xl border border-pd-border bg-pd-white px-4 py-2 text-sm font-medium text-pd-ink/75 hover:border-pd-accent/30"
          >
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}
