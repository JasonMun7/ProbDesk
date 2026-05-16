"use client";

import { useDeskAgentPrompt } from "@/hooks/use-desk-agent-prompt";
import { DESK_HEADER_CHIPS } from "@/lib/desk-demo-prompts";
import {
  BookOpen,
  Search,
  ShieldAlert,
  Wallet,
  type LucideIcon,
} from "lucide-react";

const STARTER_ICONS: Record<string, LucideIcon> = {
  portfolio: Wallet,
  search: Search,
  orderbook: BookOpen,
  risk: ShieldAlert,
};

export type DeskStarterAction = {
  id: string;
  label: string;
  prompt: string;
  icon: LucideIcon;
};

export const DESK_STARTER_ACTIONS: DeskStarterAction[] = DESK_HEADER_CHIPS.map(
  ({ id, title, message }) => ({
    id,
    label: title,
    prompt: message,
    icon: STARTER_ICONS[id] ?? Search,
  }),
);

/** Fire a user message through the desk Copilot agent (chips, idle starters, nav). */
export function useDeskPrompt() {
  const { runPrompt, isRunning, isAgentReady } = useDeskAgentPrompt();
  return { sendPrompt: runPrompt, isRunning, isAgentReady };
}
