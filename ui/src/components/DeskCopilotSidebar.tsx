"use client";

import { DeskChatAgentWorkingMessage } from "@/components/DeskChatAgentWorkingMessage";
import { DeskCopilotSidebarHeader } from "@/components/DeskCopilotSidebarHeader";
import { DeskCopilotWelcomeScreen } from "@/components/DeskCopilotWelcomeScreen";
import { COPILOT_AGENT_ID } from "@/lib/constants";
import { useDeskAgentPhoneFlow } from "@/lib/desk-agentphone-flow";
import type { Suggestion } from "@copilotkit/core";
import { useDeskChatThreads } from "@/hooks/use-desk-chat-threads";
import {
  CopilotChat,
  CopilotChatConfigurationProvider,
  CopilotChatView,
  CopilotSidebarView,
  type CopilotChatViewProps,
  type CopilotSidebarViewProps,
} from "@copilotkit/react-core/v2";
import { useMemo } from "react";

/** Copilot sidebar with AgentPhone SMS suggestion interception. */
export function DeskCopilotSidebar() {
  const { threadId, hasExplicitThreadId } = useDeskChatThreads();
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
    <CopilotChatConfigurationProvider
      threadId={threadId}
      hasExplicitThreadId={hasExplicitThreadId}
    >
      <CopilotChat
        key={threadId}
        agentId={COPILOT_AGENT_ID}
        isModalDefaultOpen
        chatView={sidebarView}
        welcomeScreen={DeskCopilotWelcomeScreen}
        messageView={{ cursor: DeskChatAgentWorkingMessage }}
        suggestionView="cpk:justify-start cpk:px-2 cpk:pb-1"
        labels={{
          modalHeaderTitle: "Prob Desk",
          welcomeMessageText: "Prob Desk is ready",
        }}
      />
    </CopilotChatConfigurationProvider>
  );
}
