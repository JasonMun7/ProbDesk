"use client";

import { CopilotStyles } from "@/components/CopilotStyles";
import { DeskCopilotFloatingLayout } from "@/components/DeskCopilotFloatingLayout";
import { DeskAgentState } from "@/components/DeskAgentState";
import { DeskAgentToolBridge } from "@/components/DeskAgentToolBridge";
import { DeskHitl } from "@/components/DeskHitl";
import { KalshiDisplayComponents } from "@/components/KalshiDisplayComponents";
import { KalshiToolRendering } from "@/components/KalshiToolRendering";
import { PageLoadingShell } from "@/components/PageLoadingShell";
import { probDeskA2UICatalog } from "@/lib/a2ui/catalog";
import { DeskToolStateProvider } from "@/lib/desk-tool-state";
import { COPILOT_AGENT_ID } from "@/lib/constants";
import { CopilotKit } from "@copilotkit/react-core/v2";
import { type ReactNode, useEffect, useState } from "react";

export function CopilotRoot({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <PageLoadingShell />;
  }

  return (
    <CopilotKit
      runtimeUrl="/api/copilotkit"
      agent={COPILOT_AGENT_ID}
      a2ui={{ catalog: probDeskA2UICatalog, includeSchema: true }}
      inspectorDefaultAnchor={{ horizontal: "left", vertical: "bottom" }}
    >
      <DeskCopilotFloatingLayout />
      <CopilotStyles />
      <DeskToolStateProvider>
        <KalshiToolRendering />
        <DeskAgentToolBridge />
        <KalshiDisplayComponents />
        <DeskHitl />
        <DeskAgentState />
        {children}
      </DeskToolStateProvider>
    </CopilotKit>
  );
}
