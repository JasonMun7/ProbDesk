import { DeskLoadingSkeleton } from "@/components/DeskLoadingSkeleton";

/** Shown while client-only CopilotKit / desk UI loads (avoids SSR localStorage). */
export function PageLoadingShell() {
  return <DeskLoadingSkeleton />;
}
