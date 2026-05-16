"use client";

import { DESK_STARTER_ACTIONS, useDeskPrompt } from "@/lib/desk-prompt";

export function DeskSuggestionChips() {
  const { sendPrompt, isRunning, isAgentReady } = useDeskPrompt();

  return (
    <ul className="flex flex-wrap gap-2">
      {DESK_STARTER_ACTIONS.map(({ id, label, prompt, icon: Icon }) => (
        <li key={id}>
          <button
            type="button"
            onClick={() => void sendPrompt(prompt)}
            disabled={isRunning || !isAgentReady}
            className="inline-flex items-center gap-2 rounded-full border border-pd-border bg-pd-white px-3.5 py-1.5 text-sm font-medium text-pd-ink shadow-sm transition hover:border-pd-accent hover:bg-pd-bg disabled:opacity-50"
          >
            <Icon className="h-3.5 w-3.5 text-pd-accent" aria-hidden />
            {label}
          </button>
        </li>
      ))}
    </ul>
  );
}
