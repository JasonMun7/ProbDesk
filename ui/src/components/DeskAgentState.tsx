"use client";

/**
 * Agent shared-state UI is disabled — ADK/AG-UI only exposes internal `_ag_ui_*`
 * keys in chat, which is not useful on the desk. Tool results drive the center panel.
 */
export function DeskAgentState() {
  return null;
}
