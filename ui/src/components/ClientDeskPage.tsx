"use client";

import dynamic from "next/dynamic";
import { PageLoadingShell } from "@/components/PageLoadingShell";

const DeskPage = dynamic(() => import("@/components/ProbDeskShell"), {
  ssr: false,
  loading: () => <PageLoadingShell />,
});

export function ClientDeskPage() {
  return <DeskPage />;
}
