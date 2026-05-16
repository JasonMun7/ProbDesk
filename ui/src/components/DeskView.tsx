"use client";

import { DeskGenerativePanel } from "@/components/DeskGenerativePanel";
import { DeskHelpModal } from "@/components/DeskHelpModal";
import { DeskRunStatus } from "@/components/DeskRunStatus";
import { ProbDeskViewHeader } from "@/components/ProbDeskViewHeader";
import { CircleHelp } from "lucide-react";
import { useCallback, useState } from "react";

export function DeskView() {
  const [helpOpen, setHelpOpen] = useState(false);
  const openHelp = useCallback(() => setHelpOpen(true), []);
  const closeHelp = useCallback(() => setHelpOpen(false), []);

  return (
    <>
      <DeskRunStatus />
      <ProbDeskViewHeader
        title="Trading desk"
        subtitle="Live views from agent tools · chat on the right"
        action={
          <button
            type="button"
            onClick={openHelp}
            className="cursor-pointer rounded-lg p-1.5 text-pd-ink/45 transition hover:bg-pd-bg hover:text-pd-accent"
            aria-label="Desk help"
          >
            <CircleHelp className="h-5 w-5" aria-hidden />
          </button>
        }
      />
      <section className="flex flex-1 flex-col gap-6 overflow-auto p-6">
        <DeskGenerativePanel />
      </section>
      <DeskHelpModal open={helpOpen} onClose={closeHelp} />
    </>
  );
}
