"use client";

import { ProbDeskCopilotHeaderTitle } from "@/components/ProbDeskCopilotHeaderTitle";
import { useDeskChatThreads } from "@/hooks/use-desk-chat-threads";
import { useDeskChatOverlay } from "@/lib/desk-chat-overlay";
import { defaultThreadTitle } from "@/lib/desk-chat-threads-storage";
import {
  CopilotModalHeader,
  useCopilotChatConfiguration,
} from "@copilotkit/react-core/v2";
import { ChevronDown, History, MessageSquarePlus, Trash2 } from "lucide-react";
import { useCallback, useState, type MouseEvent } from "react";

export function DeskCopilotSidebarHeader({
  title = "Prob Desk",
}: {
  title?: string;
}) {
  const configuration = useCopilotChatConfiguration();
  const { threads, threadId, createThread, selectThread } = useDeskChatThreads();
  const { requestDeleteThread, cancelDelete } = useDeskChatOverlay();
  const [historyOpen, setHistoryOpen] = useState(false);

  const handleClose = useCallback(() => {
    configuration?.setModalOpen(false);
  }, [configuration]);

  const toggleHistory = useCallback(() => {
    setHistoryOpen((open) => !open);
    cancelDelete();
  }, [cancelDelete]);

  const handleNewChat = useCallback(() => {
    createThread();
    setHistoryOpen(false);
    cancelDelete();
  }, [createThread, cancelDelete]);

  const handleSelect = useCallback(
    (id: string) => {
      selectThread(id);
      setHistoryOpen(false);
      cancelDelete();
    },
    [selectThread, cancelDelete],
  );

  const handleDeleteClick = useCallback(
    (id: string, label: string, event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      requestDeleteThread(id, label);
    },
    [requestDeleteThread],
  );

  return (
    <header
      data-testid="copilot-modal-header"
      className="cpk:flex cpk:flex-col cpk:border-b cpk:border-pd-border cpk:bg-white/95 cpk:backdrop-blur"
    >
      <div className="cpk:flex cpk:items-center cpk:gap-1 cpk:px-2 cpk:py-3">
        <div className="cpk:flex cpk:min-w-0 cpk:flex-1 cpk:items-center cpk:gap-0.5">
          <button
            type="button"
            onClick={toggleHistory}
            className="pd-chat-thread-btn"
            aria-expanded={historyOpen}
            aria-controls="pd-chat-thread-list"
            title={historyOpen ? "Hide conversations" : "Conversation history"}
          >
            <History className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={handleNewChat}
            className="pd-chat-thread-btn"
            title="New conversation"
          >
            <MessageSquarePlus className="h-4 w-4" aria-hidden />
          </button>
        </div>
        <div className="cpk:flex cpk:min-w-0 cpk:flex-[2] cpk:justify-center">
          <ProbDeskCopilotHeaderTitle>{title}</ProbDeskCopilotHeaderTitle>
        </div>
        <div className="cpk:flex cpk:flex-1 cpk:justify-end">
          <CopilotModalHeader.CloseButton onClick={handleClose} />
        </div>
      </div>

      {historyOpen ? (
        <div
          id="pd-chat-thread-list"
          className="pd-chat-thread-panel"
          data-testid="pd-chat-thread-list"
        >
          {threads.length === 0 ? (
            <p className="px-3 py-2 text-xs text-pd-ink/70">No conversations yet.</p>
          ) : (
            <ul className="max-h-44 overflow-y-auto py-1" role="listbox">
              {threads.map((thread) => {
                const isActive = thread.id === threadId;
                const label =
                  thread.title || defaultThreadTitle(thread.createdAt);
                return (
                  <li key={thread.id}>
                    <div
                      role="option"
                      aria-selected={isActive}
                      tabIndex={0}
                      onClick={() => handleSelect(thread.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleSelect(thread.id);
                        }
                      }}
                      className={`pd-chat-thread-item${isActive ? " pd-chat-thread-item-active" : ""}`}
                    >
                      <span className="min-w-0 flex-1 truncate text-left text-sm font-medium">
                        {label}
                      </span>
                      <span className="shrink-0 text-[10px] text-pd-ink/55">
                        {formatShortDate(thread.updatedAt)}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteClick(thread.id, label, e)}
                        className="pd-chat-thread-delete"
                        title="Delete conversation"
                        aria-label="Delete conversation"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}

      <button
        type="button"
        onClick={toggleHistory}
        className="cpk:flex cpk:w-full cpk:items-center cpk:justify-center cpk:gap-1 cpk:border-t cpk:border-pd-border/60 cpk:py-0.5 cpk:text-[10px] cpk:font-medium cpk:uppercase cpk:tracking-wide cpk:text-pd-ink/50 hover:cpk:text-pd-accent"
      >
        <ChevronDown
          className={`h-3 w-3 transition-transform${historyOpen ? " rotate-180" : ""}`}
          aria-hidden
        />
        <span className="cpk:sr-only">
          {historyOpen ? "Hide conversation history" : "Show conversation history"}
        </span>
      </button>
    </header>
  );
}

function formatShortDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}
