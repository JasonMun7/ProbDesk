"use client";

import { applyDeskInspectorFloatingLayout } from "@/lib/desk-copilot-floating-layout";
import { useLayoutEffect } from "react";

/** Runs before CopilotKit web-inspector hydrates so the FAB clears the sidebar header. */
export function DeskCopilotFloatingLayout() {
  useLayoutEffect(() => {
    applyDeskInspectorFloatingLayout();
  }, []);

  return null;
}
