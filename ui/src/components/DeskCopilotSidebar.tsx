"use client";

import { DeskCopilotSidebarHeader } from "@/components/DeskCopilotSidebarHeader";
import { DeskCopilotWelcome } from "@/components/DeskCopilotWelcome";
import { COPILOT_AGENT_ID } from "@/lib/constants";
import { useDeskAgentPhoneFlow } from "@/lib/desk-agentphone-flow";
import type { Suggestion } from "@copilotkit/core";
import {
  CopilotChat,
  CopilotChatView,
  CopilotSidebarView,
  type CopilotChatViewProps,
  type CopilotSidebarViewProps,
} from "@copilotkit/react-core/v2";
import { useMemo } from "react";

/** Copilot sidebar with AgentPhone SMS suggestion interception. */
export function DeskCopilotSidebar() {
  const { handleSelectSuggestion } = useDeskAgentPhoneFlow();

  const sidebarView = useMemo(() => {
    const Component = (viewProps: CopilotChatViewProps) => {
      const {
        onSelectSuggestion: defaultOnSelect,
        ...rest
      } = viewProps;

      const onSelectSuggestion = (
        suggestion: Suggestion,
        index: number,
      ) => {
        handleSelectSuggestion(suggestion, index, (s, i) => {
          defaultOnSelect?.(s, i);
        });
      };

      return (
        <CopilotSidebarView
          {...(rest as CopilotSidebarViewProps)}
          onSelectSuggestion={onSelectSuggestion}
          header={{
            title: "Prob Desk",
            children: () => <DeskCopilotSidebarHeader title="Prob Desk" />,
          }}
          defaultOpen
          toggleButton="cpk:z-[1250]"
        />
      );
    };

    return Object.assign(Component, CopilotChatView);
  }, [handleSelectSuggestion]);

  return (
    <CopilotChat
      agentId={COPILOT_AGENT_ID}
      isModalDefaultOpen
      chatView={sidebarView}
      welcomeScreen={{
        welcomeMessage: DeskCopilotWelcome,
      }}
      suggestionView="cpk:justify-start cpk:px-2 cpk:pb-1"
      labels={{
        modalHeaderTitle: "Prob Desk",
        welcomeMessageText: "Prob Desk is ready",
      }}
    />
  );
}
