"use client";

import {
  deleteThreadMessages,
  threadHasCachedMessages,
} from "@/lib/desk-chat-thread-messages-storage";
import {
  defaultThreadTitle,
  loadDeskChatThreads,
  saveDeskChatThreads,
  sortThreadsByRecent,
  titleFromMessage,
  type DeskChatThreadMeta,
  type DeskChatThreadsSnapshot,
} from "@/lib/desk-chat-threads-storage";
import { randomUUID } from "@copilotkit/shared";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

function upsertThread(
  snapshot: DeskChatThreadsSnapshot,
  meta: DeskChatThreadMeta,
): DeskChatThreadsSnapshot {
  const idx = snapshot.threads.findIndex((t) => t.id === meta.id);
  const threads =
    idx === -1
      ? [meta, ...snapshot.threads]
      : snapshot.threads.map((t, i) => (i === idx ? meta : t));
  return {
    ...snapshot,
    threads: sortThreadsByRecent(threads),
    activeThreadId: meta.id,
  };
}

function newThreadMeta(id: string, now: string): DeskChatThreadMeta {
  return {
    id,
    title: defaultThreadTitle(now),
    createdAt: now,
    updatedAt: now,
    hasMessages: false,
  };
}

function ensureActiveThread(
  snapshot: DeskChatThreadsSnapshot,
): DeskChatThreadsSnapshot {
  const activeExists =
    snapshot.activeThreadId &&
    snapshot.threads.some((t) => t.id === snapshot.activeThreadId);

  if (activeExists) return snapshot;

  const fallback = sortThreadsByRecent(snapshot.threads)[0]?.id;
  if (fallback) {
    return { ...snapshot, activeThreadId: fallback };
  }

  const id = randomUUID();
  const now = new Date().toISOString();
  return upsertThread(
    { version: 1, activeThreadId: "", threads: [] },
    newThreadMeta(id, now),
  );
}

type DeskChatThreadsContextValue = {
  threadId: string;
  /** When true, CopilotKit resumes the thread via /connect instead of showing welcome. */
  hasExplicitThreadId: boolean;
  threads: DeskChatThreadMeta[];
  createThread: () => string;
  selectThread: (id: string) => void;
  deleteThread: (id: string) => void;
  touchThreadFromMessage: (content: string) => void;
  /** Clears hasMessages when the agent transcript is empty for this thread. */
  clearThreadHasMessages: (id: string) => void;
};

const DeskChatThreadsContext = createContext<DeskChatThreadsContextValue | null>(
  null,
);

function useDeskChatThreadsState(): DeskChatThreadsContextValue {
  const [snapshot, setSnapshot] = useState<DeskChatThreadsSnapshot>(() =>
    ensureActiveThread(loadDeskChatThreads()),
  );
  const hydratedRef = useRef(false);

  const persist = useCallback((next: DeskChatThreadsSnapshot) => {
    const normalized = ensureActiveThread(next);
    setSnapshot(normalized);
    saveDeskChatThreads(normalized);
  }, []);

  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    persist(ensureActiveThread(loadDeskChatThreads()));
  }, [persist]);

  const threadId = snapshot.activeThreadId;

  const activeThread = useMemo(
    () => snapshot.threads.find((t) => t.id === threadId),
    [snapshot.threads, threadId],
  );

  // Resume via /connect only when metadata says the thread has history but we
  // have no local transcript (e.g. cleared cache). Cached transcripts restore
  // instantly on switch without wiping the UI.
  const hasExplicitThreadId = useMemo(() => {
    if (!activeThread?.hasMessages || !threadId) return false;
    return !threadHasCachedMessages(threadId);
  }, [activeThread?.hasMessages, threadId]);

  const threads = useMemo(
    () => sortThreadsByRecent(snapshot.threads),
    [snapshot.threads],
  );

  const createThread = useCallback(() => {
    const id = randomUUID();
    const now = new Date().toISOString();
    const meta = newThreadMeta(id, now);
    const next = upsertThread(
      { version: 1, activeThreadId: id, threads: snapshot.threads },
      meta,
    );
    persist(next);
    return id;
  }, [persist, snapshot.threads]);

  const selectThread = useCallback(
    (id: string) => {
      if (id === threadId) return;
      setSnapshot((prev) => {
        if (!prev.threads.some((t) => t.id === id)) return prev;
        const next = { ...prev, activeThreadId: id };
        saveDeskChatThreads(next);
        return next;
      });
    },
    [threadId],
  );

  const deleteThread = useCallback(
    (id: string) => {
      const prev = loadDeskChatThreads();
      const remaining = prev.threads.filter((t) => t.id !== id);
      if (remaining.length === prev.threads.length) return;

      let activeThreadId = prev.activeThreadId;
      if (activeThreadId === id) {
        activeThreadId = sortThreadsByRecent(remaining)[0]?.id ?? "";
      }

      let next: DeskChatThreadsSnapshot = {
        version: 1,
        activeThreadId,
        threads: remaining,
      };

      if (id === threadId && !activeThreadId) {
        const newId = randomUUID();
        const now = new Date().toISOString();
        next = upsertThread(
          { version: 1, activeThreadId: newId, threads: [] },
          newThreadMeta(newId, now),
        );
      }

      deleteThreadMessages(id);
      persist(next);
    },
    [persist, threadId],
  );

  const clearThreadHasMessages = useCallback((id: string) => {
    setSnapshot((prev) => {
      const existing = prev.threads.find((t) => t.id === id);
      if (!existing?.hasMessages) return prev;
      const now = new Date().toISOString();
      const meta: DeskChatThreadMeta = {
        ...existing,
        hasMessages: false,
        updatedAt: now,
      };
      const next = upsertThread(prev, meta);
      saveDeskChatThreads(next);
      return next;
    });
  }, []);

  const touchThreadFromMessage = useCallback(
    (content: string) => {
      if (!threadId) return;
      const trimmed = content.trim();
      if (!trimmed) return;

      setSnapshot((prev) => {
        const existing = prev.threads.find((t) => t.id === threadId);
        const now = new Date().toISOString();
        const autoTitle = existing
          ? defaultThreadTitle(existing.createdAt)
          : defaultThreadTitle(now);
        const title =
          existing?.title && existing.title !== autoTitle
            ? existing.title
            : titleFromMessage(trimmed);

        const meta: DeskChatThreadMeta = {
          id: threadId,
          title,
          createdAt: existing?.createdAt ?? now,
          updatedAt: now,
          hasMessages: true,
        };
        const next = upsertThread(prev, meta);
        saveDeskChatThreads(next);
        return next;
      });
    },
    [threadId],
  );

  return {
    threadId,
    hasExplicitThreadId,
    threads,
    createThread,
    selectThread,
    deleteThread,
    touchThreadFromMessage,
    clearThreadHasMessages,
  };
}

export function DeskChatThreadsProvider({ children }: { children: ReactNode }) {
  const value = useDeskChatThreadsState();
  return (
    <DeskChatThreadsContext.Provider value={value}>
      {children}
    </DeskChatThreadsContext.Provider>
  );
}

export function useDeskChatThreads(): DeskChatThreadsContextValue {
  const ctx = useContext(DeskChatThreadsContext);
  if (!ctx) {
    throw new Error(
      "useDeskChatThreads must be used within DeskChatThreadsProvider",
    );
  }
  return ctx;
}
