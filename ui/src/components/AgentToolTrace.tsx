"use client";

type Props = {
  name: string;
  status?: string;
  args?: Record<string, unknown>;
  result?: unknown;
};

export function AgentToolTrace({ name, status, args, result }: Props) {
  const running = status !== "complete" && status !== "error";

  return (
    <div className="rounded-lg border border-pd-border bg-pd-bg/60 px-3 py-2 font-mono text-xs text-pd-ink">
      <div className="flex items-center gap-2">
        <span
          className={`inline-block h-2 w-2 rounded-full ${
            running ? "animate-pulse bg-pd-accent" : "bg-pd-accent"
          }`}
        />
        <span className="font-semibold text-pd-accent">{name}</span>
        {running && <span className="text-pd-ink/50">running…</span>}
      </div>
      {args && Object.keys(args).length > 0 && (
        <pre className="mt-2 max-h-24 overflow-auto text-pd-ink/80">
          {JSON.stringify(args, null, 2)}
        </pre>
      )}
      {status === "complete" && result != null && (
        <pre className="mt-2 max-h-40 overflow-auto border-t border-pd-border pt-2 text-pd-ink/70">
          {typeof result === "string"
            ? result.slice(0, 1200)
            : JSON.stringify(result, null, 2).slice(0, 1200)}
        </pre>
      )}
    </div>
  );
}
