"use client";

import { DeskFollowUpSuggestions } from "@/components/DeskFollowUpSuggestions";
import { DeskStarterSuggestions } from "@/components/DeskStarterSuggestions";
import { DeskView } from "@/components/DeskView";
import { ProbDeskCopilotHeaderTitle } from "@/components/ProbDeskCopilotHeaderTitle";
import { ProbDeskLayout } from "@/components/ProbDeskLayout";
import { SettingsPanel } from "@/components/SettingsPanel";
import { COPILOT_AGENT_ID } from "@/lib/constants";
import {
  isProbDeskViewId,
  type ProbDeskViewId,
} from "@/lib/prob-desk-nav";
import { CopilotSidebar } from "@copilotkit/react-core/v2";
import { useCallback, useState } from "react";

export default function ProbDeskShell() {
  const [activeView, setActiveView] = useState<ProbDeskViewId>("desk");

  const handleNavSelect = useCallback((id: string) => {
    if (isProbDeskViewId(id)) {
      setActiveView(id);
    }
  }, []);

  return (
    <ProbDeskLayout active={activeView} onNavSelect={handleNavSelect}>
      <div className="flex flex-1 flex-col">
        {activeView === "desk" && <DeskView />}
        {activeView === "settings" && <SettingsPanel />}

        <DeskStarterSuggestions />
        <DeskFollowUpSuggestions />
        <CopilotSidebar
          agentId={COPILOT_AGENT_ID}
          defaultOpen
          toggleButton="cpk:z-[1250]"
          suggestionView="cpk:justify-start cpk:px-2 cpk:pb-1"
          header={{
            title: "Prob Desk",
            titleContent: ProbDeskCopilotHeaderTitle,
          }}
          labels={{
            modalHeaderTitle: "Prob Desk",
            welcomeMessageText: `You're connected to ${COPILOT_AGENT_ID}. Ask about Kalshi markets, portfolio, or risk.`,
          }}
        />
      </div>
    </ProbDeskLayout>
  );
}
