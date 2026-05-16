"use client";

import { isAgentPhoneSmsSuggestion } from "@/lib/desk-agentphone";
import type { Suggestion } from "@copilotkit/core";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type AgentPhonePanelMode = "setup" | "sms" | null;

type DeskAgentPhoneFlowContextValue = {
  panelMode: AgentPhonePanelMode;
  startSmsFlow: () => void;
  openSetup: () => void;
  openSmsForm: () => void;
  closePanel: () => void;
  handleSelectSuggestion: (
    suggestion: Suggestion,
    index: number,
    defaultHandler: (suggestion: Suggestion, index: number) => void,
  ) => void;
};

const DeskAgentPhoneFlowContext =
  createContext<DeskAgentPhoneFlowContextValue | null>(null);

export function DeskAgentPhoneFlowProvider({
  children,
  isAgentIdConfigured,
  apiKeyConfigured,
}: {
  children: ReactNode;
  isAgentIdConfigured: boolean;
  apiKeyConfigured: boolean;
}) {
  const [panelMode, setPanelMode] = useState<AgentPhonePanelMode>(null);

  const startSmsFlow = useCallback(() => {
    if (!apiKeyConfigured || !isAgentIdConfigured) {
      setPanelMode("setup");
      return;
    }
    setPanelMode("sms");
  }, [apiKeyConfigured, isAgentIdConfigured]);

  const openSetup = useCallback(() => {
    setPanelMode("setup");
  }, []);

  const openSmsForm = useCallback(() => {
    setPanelMode("sms");
  }, []);

  const closePanel = useCallback(() => {
    setPanelMode(null);
  }, []);

  const handleSelectSuggestion = useCallback(
    (
      suggestion: Suggestion,
      index: number,
      defaultHandler: (suggestion: Suggestion, index: number) => void,
    ) => {
      if (isAgentPhoneSmsSuggestion(suggestion.message)) {
        startSmsFlow();
        return;
      }
      defaultHandler(suggestion, index);
    },
    [startSmsFlow],
  );

  const value = useMemo(
    () => ({
      panelMode,
      startSmsFlow,
      openSetup,
      openSmsForm,
      closePanel,
      handleSelectSuggestion,
    }),
    [
      panelMode,
      startSmsFlow,
      openSetup,
      openSmsForm,
      closePanel,
      handleSelectSuggestion,
    ],
  );

  return (
    <DeskAgentPhoneFlowContext.Provider value={value}>
      {children}
    </DeskAgentPhoneFlowContext.Provider>
  );
}

export function useDeskAgentPhoneFlow() {
  const ctx = useContext(DeskAgentPhoneFlowContext);
  if (!ctx) {
    throw new Error(
      "useDeskAgentPhoneFlow must be used within DeskAgentPhoneFlowProvider",
    );
  }
  return ctx;
}
