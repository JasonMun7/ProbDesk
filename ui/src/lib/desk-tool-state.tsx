"use client";

import type { DeskToolStatus } from "@/lib/desk-tool-status";
import { isDeskToolComplete } from "@/lib/desk-tool-status";
import { EXECUTION_DESK_TOOLS } from "@/lib/kalshi-tool-parsers";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type { DeskToolStatus } from "@/lib/desk-tool-status";

export type DeskSnapshot = {
  tool: string;
  args?: Record<string, unknown>;
  result?: unknown;
  status: DeskToolStatus;
  at: number;
};

type DeskToolStateValue = {
  latest: DeskSnapshot | null;
  balance: DeskSnapshot | null;
  positions: DeskSnapshot | null;
  execution: DeskSnapshot | null;
  publish: (snap: Omit<DeskSnapshot, "at">) => void;
  schedulePublish: (snap: Omit<DeskSnapshot, "at">) => void;
  reset: () => void;
};

const DeskToolStateContext = createContext<DeskToolStateValue | null>(null);

function mergeSnapshot(
  prev: DeskSnapshot | null,
  next: DeskSnapshot,
): DeskSnapshot {
  if (!prev) return next;
  const keepPriorResult =
    next.result === undefined || next.result === null;
  const status =
    isDeskToolComplete(next.status) || !isDeskToolComplete(prev.status)
      ? next.status
      : prev.status;
  return {
    ...next,
    status,
    result: keepPriorResult ? prev.result : next.result,
    args: next.args ?? prev.args,
  };
}

export function DeskToolStateProvider({ children }: { children: ReactNode }) {
  const [latest, setLatest] = useState<DeskSnapshot | null>(null);
  const [balance, setBalance] = useState<DeskSnapshot | null>(null);
  const [positions, setPositions] = useState<DeskSnapshot | null>(null);
  const [execution, setExecution] = useState<DeskSnapshot | null>(null);
  const pendingRef = useRef<Omit<DeskSnapshot, "at">[]>([]);
  const flushScheduledRef = useRef(false);

  const publish = useCallback((snap: Omit<DeskSnapshot, "at">) => {
    const full: DeskSnapshot = { ...snap, at: Date.now() };
    setLatest((prev) => mergeSnapshot(prev, full));
    if (snap.tool === "kalshi_sdk_get_balance") {
      setBalance((prev) => mergeSnapshot(prev, full));
    }
    if (snap.tool === "kalshi_sdk_get_positions") {
      setPositions((prev) => mergeSnapshot(prev, full));
    }
    if (EXECUTION_DESK_TOOLS.has(snap.tool)) {
      setExecution((prev) => mergeSnapshot(prev, full));
    }
  }, []);

  const flushPending = useCallback(() => {
    flushScheduledRef.current = false;
    const batch = pendingRef.current;
    pendingRef.current = [];
    for (const snap of batch) {
      publish(snap);
    }
  }, [publish]);

  const schedulePublish = useCallback(
    (snap: Omit<DeskSnapshot, "at">) => {
      pendingRef.current.push(snap);
      if (flushScheduledRef.current) return;
      flushScheduledRef.current = true;
      queueMicrotask(flushPending);
    },
    [flushPending],
  );

  const reset = useCallback(() => {
    pendingRef.current = [];
    flushScheduledRef.current = false;
    setLatest(null);
    setBalance(null);
    setPositions(null);
    setExecution(null);
  }, []);

  const value = useMemo(
    () => ({
      latest,
      balance,
      positions,
      execution,
      publish,
      schedulePublish,
      reset,
    }),
    [latest, balance, positions, execution, publish, schedulePublish, reset],
  );

  return (
    <DeskToolStateContext.Provider value={value}>
      {children}
    </DeskToolStateContext.Provider>
  );
}

export function useDeskToolState(): DeskToolStateValue {
  const ctx = useContext(DeskToolStateContext);
  if (!ctx) {
    throw new Error("useDeskToolState must be used within DeskToolStateProvider");
  }
  return ctx;
}
