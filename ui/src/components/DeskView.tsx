"use client";

import { DeskAgentPhoneMessage } from "@/components/DeskAgentPhoneMessage";
import { DeskGenerativePanel } from "@/components/DeskGenerativePanel";
import { DeskRunStatus } from "@/components/DeskRunStatus";
import { ProbDeskViewHeader } from "@/components/ProbDeskViewHeader";

export function DeskView() {
  return (
    <>
      <DeskRunStatus />
      <ProbDeskViewHeader
        title="Trading desk"
        subtitle="Live views from agent tools · chat on the right"
      />
      <section className="flex flex-1 flex-col gap-6 overflow-auto p-6">
        <DeskGenerativePanel />
        <DeskAgentPhoneMessage />
      </section>
    </>
  );
}
