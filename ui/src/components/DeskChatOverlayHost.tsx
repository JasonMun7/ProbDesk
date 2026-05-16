"use client";

import { useDeskChatOverlay } from "@/lib/desk-chat-overlay";
import { Trash2, X } from "lucide-react";
import { useEffect } from "react";

/** Bottom-right confirm dialogs for chat actions (e.g. delete thread). */
export function DeskChatOverlayHost() {
  const { pendingDelete, cancelDelete, confirmDelete } = useDeskChatOverlay();

  useEffect(() => {
    if (!pendingDelete) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") cancelDelete();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pendingDelete, cancelDelete]);

  if (!pendingDelete) return null;

  return (
    <div
      className="pd-desk-chat-overlay"
      role="region"
      aria-label="Chat notifications"
      data-testid="pd-desk-chat-overlay"
    >
      <div
        className="pd-desk-chat-overlay-card pd-desk-chat-overlay-delete"
        role="dialog"
        aria-labelledby="pd-delete-dialog-title"
        aria-describedby="pd-delete-dialog-desc"
        data-testid="pd-desk-delete-dialog"
      >
        <div className="flex items-start gap-3">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-700"
            aria-hidden
          >
            <Trash2 className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p
              id="pd-delete-dialog-title"
              className="text-sm font-semibold text-pd-ink"
            >
              Delete conversation?
            </p>
            <p
              id="pd-delete-dialog-desc"
              className="mt-1 truncate text-sm text-pd-ink/65"
              title={pendingDelete.title}
            >
              {pendingDelete.title}
            </p>
          </div>
          <button
            type="button"
            onClick={cancelDelete}
            className="pd-desk-chat-overlay-icon-btn"
            aria-label="Cancel delete"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={cancelDelete}
            className="rounded-lg border border-pd-border px-3 py-1.5 text-sm font-medium text-pd-ink/80 transition hover:border-pd-accent/40"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={confirmDelete}
            className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
