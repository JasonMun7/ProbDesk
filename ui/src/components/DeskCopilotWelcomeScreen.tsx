"use client";

import { DeskCopilotWelcome } from "@/components/DeskCopilotWelcome";
import { CopilotSidebarView } from "@copilotkit/react-core/v2";
import type { ComponentProps } from "react";

type WelcomeScreenProps = ComponentProps<typeof CopilotSidebarView.WelcomeScreen>;

/** Sidebar welcome layout with Prob Desk branding (input pinned to bottom). */
export function DeskCopilotWelcomeScreen({
  className,
  welcomeMessage: _welcomeMessage,
  ...props
}: WelcomeScreenProps) {
  const mergedClassName = ["pd-desk-welcome-screen", className]
    .filter(Boolean)
    .join(" ");

  return (
    <CopilotSidebarView.WelcomeScreen
      {...props}
      data-testid="copilot-welcome-screen"
      className={mergedClassName}
      welcomeMessage={DeskCopilotWelcome}
    />
  );
}
