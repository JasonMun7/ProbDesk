"use client";

import { DeskAgentPhoneSetupCard } from "@/components/DeskAgentPhoneSetupCard";
import { DeskAgentPhoneSmsForm } from "@/components/DeskAgentPhoneSmsForm";
import { useDeskAgentPrompt } from "@/hooks/use-desk-agent-prompt";
import { useDeskAgentPhoneConfig } from "@/hooks/use-desk-agentphone-config";
import { buildAgentPhoneSmsPrompt } from "@/lib/desk-agentphone";
import { useDeskAgentPhoneFlow } from "@/lib/desk-agentphone-flow";
import { useCopilotChatConfiguration } from "@copilotkit/react-core/v2";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

type DeskAgentPhoneChatPanelProps = {
  onOpenSettings?: () => void;
};

/** Renders setup / SMS cards in the Copilot sidebar above the input. */
export function DeskAgentPhoneChatPanel({ onOpenSettings }: DeskAgentPhoneChatPanelProps) {
  const { panelMode, closePanel, openSmsForm } = useDeskAgentPhoneFlow();
  const { config, saveAgentId } = useDeskAgentPhoneConfig();
  const { runPrompt, isRunning } = useDeskAgentPrompt();
  const chatConfig = useCopilotChatConfiguration();
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!panelMode) {
      return;
    }
    chatConfig?.setModalOpen(true);

    const findTarget = () =>
      document.querySelector<HTMLElement>(
        ".copilotKitSidebar [data-testid='copilot-chat-input']",
      )?.parentElement ?? null;

    setPortalTarget(findTarget());

    const observer = new MutationObserver(() => {
      setPortalTarget(findTarget());
    });
    const sidebar = document.querySelector(".copilotKitSidebar");
    if (sidebar) {
      observer.observe(sidebar, { childList: true, subtree: true });
    }
    return () => observer.disconnect();
  }, [panelMode, chatConfig]);

  const handleSaveAgent = useCallback(
    async (agentId: string, agentName?: string) => {
      setSaving(true);
      try {
        await saveAgentId(agentId, agentName);
        if (config.apiKeyConfigured) {
          openSmsForm();
        } else {
          closePanel();
        }
      } finally {
        setSaving(false);
      }
    },
    [saveAgentId, config.apiKeyConfigured, openSmsForm, closePanel],
  );

  const handleSendSms = useCallback(
    (phone: string, body: string) => {
      const agentId = config.agentId;
      if (!agentId) return;
      closePanel();
      void runPrompt(
        buildAgentPhoneSmsPrompt(phone, body, agentId, config.agentName),
      );
    },
    [config.agentId, config.agentName, closePanel, runPrompt],
  );

  if (!panelMode || !portalTarget) {
    return null;
  }

  const card =
    panelMode === "setup" ? (
      <DeskAgentPhoneSetupCard
        apiKeyConfigured={config.apiKeyConfigured}
        agentIdSource={config.agentIdSource}
        initialAgentId={config.agentId ?? ""}
        initialAgentName={config.agentName}
        saving={saving}
        onSave={handleSaveAgent}
        onContinue={openSmsForm}
        onCancel={closePanel}
        onOpenSettings={onOpenSettings}
      />
    ) : config.agentId ? (
      <DeskAgentPhoneSmsForm
        agentId={config.agentId}
        agentName={config.agentName}
        sending={isRunning}
        onSend={handleSendSms}
        onCancel={closePanel}
      />
    ) : null;

  if (!card) {
    return null;
  }

  return createPortal(
    <div className="border-t border-pd-border/60 bg-pd-bg/30 px-3 py-2">
      {card}
    </div>,
    portalTarget,
    "desk-agentphone-panel",
  );
}
