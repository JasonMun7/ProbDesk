"use client";

import {
  defaultThreadTitle,
  loadDeskChatThreads,
  saveDeskChatThreads,
  sortThreadsByRecent,
  titleFromMessage,
  type DeskChatThreadMeta,
  type DeskChatThreadsSnapshot,
} from "@/lib/desk-chat-threads-storage";
import { useCopilotContext } from "@copilotkit/react-core";
import { randomUUID } from "@copilotkit/shared";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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

export function useDeskChatThreads() {
  const { threadId, setThreadId } = useCopilotContext();
  const [snapshot, setSnapshot] = useState<DeskChatThreadsSnapshot>(() =>
    loadDeskChatThreads(),
  );
  const hydratedRef = useRef(false);

  const persist = useCallback((next: DeskChatThreadsSnapshot) => {
    setSnapshot(next);
    saveDeskChatThreads(next);
  }, []);

  const ensureThreadRegistered = useCallback(
    (id: string) => {
      const now = new Date().toISOString();
      setSnapshot((prev) => {
        if (prev.threads.some((t) => t.id === id)) {
          if (prev.activeThreadId === id) return prev;
          const next = { ...prev, activeThreadId: id };
          saveDeskChatThreads(next);
          return next;
        }
        const meta: DeskChatThreadMeta = {
          id,
          title: defaultThreadTitle(now),
          createdAt: now,
          updatedAt: now,
        };
        const next = upsertThread(prev, meta);
        saveDeskChatThreads(next);
        return next;
      });
    },
    [],
  );

  useEffect(() => {
    if (hydratedRef.current || !threadId) return;
    hydratedRef.current = true;

    const stored = loadDeskChatThreads();
    const active =
      stored.activeThreadId &&
      stored.threads.some((t) => t.id === stored.activeThreadId)
        ? stored.activeThreadId
        : stored.threads[0]?.id;

    if (active && active !== threadId) {
      setThreadId(active);
      setSnapshot({ ...stored, activeThreadId: active });
      return;
    }

    if (stored.threads.length === 0) {
      const now = new Date().toISOString();
      const meta: DeskChatThreadMeta = {
        id: threadId,
        title: defaultThreadTitle(now),
        createdAt: now,
        updatedAt: now,
      };
      const next: DeskChatThreadsSnapshot = {
        version: 1,
        activeThreadId: threadId,
        threads: [meta],
      };
      persist(next);
      return;
    }

    ensureThreadRegistered(threadId);
    if (stored.activeThreadId !== threadId) {
      persist({ ...stored, activeThreadId: threadId });
    } else {
      setSnapshot(stored);
    }
  }, [threadId, setThreadId, persist, ensureThreadRegistered]);

  useEffect(() => {
    if (!threadId || !hydratedRef.current) return;
    ensureThreadRegistered(threadId);
  }, [threadId, ensureThreadRegistered]);

  const threads = useMemo(
    () => sortThreadsByRecent(snapshot.threads),
    [snapshot.threads],
  );

  const createThread = useCallback(() => {
    const id = randomUUID();
    const now = new Date().toISOString();
    const meta: DeskChatThreadMeta = {
      id,
      title: defaultThreadTitle(now),
      createdAt: now,
      updatedAt: now,
    };
    const next = upsertThread(
      { version: 1, activeThreadId: id, threads: snapshot.threads },
      meta,
    );
    persist(next);
    setThreadId(id);
    return id;
  }, [persist, setThreadId, snapshot.threads]);

  const selectThread = useCallback(
    (id: string) => {
      if (id === threadId) return;
      setSnapshot((prev) => {
        if (!prev.threads.some((t) => t.id === id)) return prev;
        const next = { ...prev, activeThreadId: id };
        saveDeskChatThreads(next);
        return next;
      });
      setThreadId(id);
    },
    [setThreadId, threadId],
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

      if (id === threadId) {
        if (activeThreadId) {
          setThreadId(activeThreadId);
        } else {
          const newId = randomUUID();
          const now = new Date().toISOString();
          const meta: DeskChatThreadMeta = {
            id: newId,
            title: defaultThreadTitle(now),
            createdAt: now,
            updatedAt: now,
          };
          next = upsertThread(
            { version: 1, activeThreadId: newId, threads: [] },
            meta,
          );
          setThreadId(newId);
        }
      }

      persist(next);
    },
    [persist, setThreadId, threadId],
  );

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
    threads,
    createThread,
    selectThread,
    deleteThread,
    touchThreadFromMessage,
  };
}
