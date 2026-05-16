"use client";

import { useDeskPrompt } from "@/lib/desk-prompt";
import { MessageSquare, Phone } from "lucide-react";
import { useEffect, useState } from "react";

type AgentPhoneConfig = {
  configured: boolean;
};

function buildAgentPhonePrompt(phone: string, body: string): string {
  return [
    "I explicitly request an SMS via AgentPhone MCP.",
    `Send a text message to ${phone}.`,
    `Message body: ${body}`,
    "Confirm in chat before sending if your policy requires it, then use AgentPhone tools.",
  ].join(" ");
}

/** Desk UI to request an AgentPhone SMS through the trading director agent. */
export function DeskAgentPhoneMessage() {
  const { sendPrompt, isRunning, isAgentReady } = useDeskPrompt();
  const [phone, setPhone] = useState("");
  const [body, setBody] = useState("");
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [sentHint, setSentHint] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/config-status");
        if (!res.ok) return;
        const data = (await res.json()) as { agentphone?: AgentPhoneConfig };
        if (!cancelled) {
          setConfigured(data.agentphone?.configured ?? false);
        }
      } catch {
        if (!cancelled) setConfigured(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const canSend =
    configured === true &&
    isAgentReady &&
    !isRunning &&
    phone.trim().length > 0 &&
    body.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSend) return;
    setSentHint(null);
    void sendPrompt(buildAgentPhonePrompt(phone.trim(), body.trim()));
    setSentHint("Sent to the desk agent — check chat for confirmation.");
    setBody("");
  };

  return (
    <section
      className="rounded-2xl border border-pd-border bg-pd-white/90 p-4 shadow-sm"
      aria-labelledby="desk-agentphone-heading"
    >
      <header className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-pd-accent/15 text-pd-accent">
          <Phone className="h-4 w-4" aria-hidden />
        </span>
        <div>
          <h3
            id="desk-agentphone-heading"
            className="text-sm font-semibold text-pd-ink"
          >
            AgentPhone message
          </h3>
          <p className="mt-0.5 text-xs text-pd-ink/55">
            Routes through chat so the director can send SMS with your consent.
          </p>
        </div>
      </header>
      {configured === false && (
        <p className="mt-3 text-sm text-pd-ink/65">
          Set{" "}
          <code className="font-mono text-xs text-pd-accent">AGENTPHONE_API_KEY</code>{" "}
          in the repo <code className="font-mono text-xs">.env</code> and restart the
          ADK agent to enable SMS via AgentPhone.
        </p>
      )}
      {configured === true && (
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
          <label className="block text-left">
            <span className="text-xs font-medium text-pd-ink/70">Phone (E.164)</span>
            <input
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+14155551234"
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
              className="mt-1 w-full resize-y rounded-lg border border-pd-border bg-pd-bg/40 px-3 py-2 text-sm text-pd-ink outline-none focus:border-pd-accent focus:ring-1 focus:ring-pd-accent/40"
            />
          </label>
          <button
            type="submit"
            disabled={!canSend}
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-pd-accent px-4 py-2 text-sm font-medium text-pd-ink shadow-sm transition hover:brightness-105 disabled:opacity-50"
          >
            <MessageSquare className="h-4 w-4" aria-hidden />
            Send via agent
          </button>
          {!isAgentReady && (
            <p className="text-xs text-pd-ink/55">Connecting to the desk agent…</p>
          )}
          {sentHint && (
            <p className="text-xs text-pd-ink/60" role="status">
              {sentHint}
            </p>
          )}
        </form>
      )}
      {configured === null && (
        <p className="mt-3 text-sm text-pd-ink/55">Checking AgentPhone configuration…</p>
      )}
    </section>
  );
}
