function SkeletonBar({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`animate-pulse rounded bg-pd-border/90 ${className}`.trim()}
    />
  );
}

function ContentGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-xl border border-pd-border bg-pd-white p-4"
        >
          <SkeletonBar className="h-3 w-24 bg-pd-border" />
          <SkeletonBar className="mt-3 h-4 w-full bg-pd-bg" />
          <div className="mt-4 grid grid-cols-2 gap-2">
            <SkeletonBar className="h-8 bg-pd-bg" />
            <SkeletonBar className="h-8 bg-pd-bg" />
          </div>
        </div>
      ))}
    </div>
  );
}

function CopilotPanelSkeleton() {
  return (
    <aside
      aria-hidden
      className="hidden w-[min(100%,400px)] shrink-0 flex-col border-l border-pd-border shadow-[-4px_0_24px_rgb(17_81_102/0.08)] xl:flex"
      style={{ background: "var(--pd-gradient-surface)" }}
    >
      <div className="relative shrink-0 border-b border-pd-border px-4 py-4">
        <div
          className="absolute inset-x-0 bottom-0 h-0.5 opacity-85"
          style={{ background: "var(--pd-gradient-accent)" }}
        />
        <div className="flex items-center gap-3">
          <SkeletonBar className="h-8 w-8 shrink-0 rounded-lg bg-pd-bg" />
          <SkeletonBar className="h-4 w-28 bg-pd-border" />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-4 overflow-hidden p-4">
        <div className="flex justify-end">
          <SkeletonBar className="h-16 w-[72%] rounded-2xl rounded-br-md bg-pd-bg" />
        </div>
        <div className="flex justify-start">
          <SkeletonBar className="h-24 w-[85%] rounded-2xl rounded-bl-md bg-pd-white" />
        </div>
        <div className="flex justify-end">
          <SkeletonBar className="h-12 w-[55%] rounded-2xl rounded-br-md bg-pd-bg" />
        </div>
        <div className="mt-auto space-y-2">
          <div className="flex flex-wrap gap-2">
            <SkeletonBar className="h-8 w-24 rounded-full bg-pd-white" />
            <SkeletonBar className="h-8 w-32 rounded-full bg-pd-white" />
            <SkeletonBar className="h-8 w-28 rounded-full bg-pd-white" />
          </div>
          <SkeletonBar className="h-11 w-full rounded-xl bg-pd-white" />
        </div>
      </div>
    </aside>
  );
}

/** Full-desk skeleton mirroring ProbDeskLayout + desk panel + Copilot sidebar. */
export function DeskLoadingSkeleton() {
  return (
    <div
      className="flex min-h-dvh"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading Prob Desk"
    >
      <span className="sr-only">Loading Prob Desk…</span>

      <aside
        aria-hidden
        className="pd-sidebar-bg relative hidden w-[72px] shrink-0 flex-col border-r border-pd-accent/20 shadow-lg md:flex lg:w-[280px]"
      >
        <div
          className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,var(--pd-accent),transparent)] opacity-50"
        />
        <div className="flex items-center gap-3 border-b border-pd-accent/30 px-4 py-5 lg:px-5">
          <SkeletonBar className="h-9 w-9 shrink-0 rounded-lg bg-white/20 lg:h-10 lg:w-10" />
          <div className="hidden min-w-0 flex-1 space-y-2 lg:block">
            <SkeletonBar className="h-3.5 w-24 bg-white/25" />
            <SkeletonBar className="h-3 w-20 bg-white/15" />
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-2 lg:p-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className={`flex items-center justify-center gap-3 rounded-lg px-2 py-2.5 lg:justify-start lg:px-3 ${
                i === 0 ? "bg-white/20" : "bg-white/10"
              }`}
            >
              <SkeletonBar
                className={`h-5 w-5 shrink-0 rounded-md ${
                  i === 0 ? "bg-white/35" : "bg-white/20"
                }`}
              />
              <SkeletonBar className="hidden h-3 flex-1 bg-white/20 lg:block lg:max-w-[5.5rem]" />
            </div>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1">
        <main className="flex min-w-0 flex-1 flex-col">
          <header className="shrink-0 border-b border-pd-border bg-pd-white/80 px-6 py-4 backdrop-blur">
            <SkeletonBar className="h-6 w-36 bg-pd-border" />
            <SkeletonBar className="mt-2 h-3 w-56 bg-pd-bg" />
          </header>

          <section className="flex flex-1 flex-col overflow-auto p-6">
            <div className="mb-6 flex items-center gap-3">
              <SkeletonBar className="h-10 w-10 shrink-0 rounded-xl bg-pd-accent/25" />
              <div className="min-w-0 flex-1 space-y-2">
                <SkeletonBar className="h-3 w-28" />
                <SkeletonBar className="h-4 w-full max-w-xs bg-pd-bg" />
              </div>
            </div>

            <ContentGridSkeleton />

            <div className="mt-8 flex flex-wrap justify-center gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <SkeletonBar
                  key={i}
                  className="h-10 w-full rounded-xl bg-pd-white sm:w-36"
                />
              ))}
            </div>
          </section>
        </main>

        <CopilotPanelSkeleton />
      </div>
    </div>
  );
}
