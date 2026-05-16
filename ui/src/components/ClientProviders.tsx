"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";

const CopilotRoot = dynamic(
  () => import("@/components/CopilotRoot").then((m) => m.CopilotRoot),
  { ssr: false },
);

export function ClientProviders({ children }: { children: ReactNode }) {
  return <CopilotRoot>{children}</CopilotRoot>;
}
