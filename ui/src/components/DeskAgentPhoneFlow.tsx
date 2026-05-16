"use client";

import { DeskAgentPhoneChatPanel } from "@/components/DeskAgentPhoneChatPanel";
import { useDeskAgentPhoneConfig } from "@/hooks/use-desk-agentphone-config";
import { DeskAgentPhoneFlowProvider } from "@/lib/desk-agentphone-flow";
import type { ReactNode } from "react";

type DeskAgentPhoneFlowProps = {
  children: ReactNode;
  onOpenSettings?: () => void;
};

export function DeskAgentPhoneFlow({
  children,
  onOpenSettings,
}: DeskAgentPhoneFlowProps) {
  const { config, isAgentIdConfigured } = useDeskAgentPhoneConfig();

  return (
    <DeskAgentPhoneFlowProvider
      isAgentIdConfigured={isAgentIdConfigured}
      apiKeyConfigured={config.apiKeyConfigured}
    >
      {children}
      <DeskAgentPhoneChatPanel onOpenSettings={onOpenSettings} />
    </DeskAgentPhoneFlowProvider>
  );
}
