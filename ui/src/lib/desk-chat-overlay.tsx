"use client";

import { useDeskChatThreads } from "@/hooks/use-desk-chat-threads";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type PendingThreadDelete = {
  id: string;
  title: string;
};

type DeskChatOverlayContextValue = {
  pendingDelete: PendingThreadDelete | null;
  requestDeleteThread: (id: string, title: string) => void;
  cancelDelete: () => void;
  confirmDelete: () => void;
};

const DeskChatOverlayContext = createContext<DeskChatOverlayContextValue | null>(
  null,
);

export function DeskChatOverlayProvider({ children }: { children: ReactNode }) {
  const { deleteThread } = useDeskChatThreads();
  const [pendingDelete, setPendingDelete] =
    useState<PendingThreadDelete | null>(null);

  const requestDeleteThread = useCallback((id: string, title: string) => {
    setPendingDelete({ id, title });
  }, []);

  const cancelDelete = useCallback(() => {
    setPendingDelete(null);
  }, []);

  const confirmDelete = useCallback(() => {
    if (!pendingDelete) return;
    deleteThread(pendingDelete.id);
    setPendingDelete(null);
  }, [deleteThread, pendingDelete]);

  const value = useMemo(
    () => ({
      pendingDelete,
      requestDeleteThread,
      cancelDelete,
      confirmDelete,
    }),
    [pendingDelete, requestDeleteThread, cancelDelete, confirmDelete],
  );

  return (
    <DeskChatOverlayContext.Provider value={value}>
      {children}
    </DeskChatOverlayContext.Provider>
  );
}

export function useDeskChatOverlay(): DeskChatOverlayContextValue {
  const ctx = useContext(DeskChatOverlayContext);
  if (!ctx) {
    throw new Error(
      "useDeskChatOverlay must be used within DeskChatOverlayProvider",
    );
  }
  return ctx;
}
