"use client";

import { COPILOT_AGENT_ID } from "@/lib/constants";
import { ToolCallStatus } from "@copilotkit/core";
import { useHumanInTheLoop } from "@copilotkit/react-core/v2";
import { ShieldCheck, ShieldX } from "lucide-react";
import { z } from "zod";

const approveKalshiOrderSchema = z.object({
  ticker: z.string().describe("Kalshi market ticker"),
  side: z.enum(["yes", "no"]).describe("Contract side"),
  action: z.enum(["buy", "sell"]).describe("Order action"),
  count: z.number().int().positive().describe("Number of contracts"),
  price_cents: z
    .number()
    .int()
    .min(1)
    .max(99)
    .optional()
    .describe("Limit price in cents (omit for market-style intent)"),
  rationale: z.string().optional().describe("Why the agent proposes this order"),
});

type ApproveArgs = z.infer<typeof approveKalshiOrderSchema>;

function parseHitlResult(result: string): { approved: boolean; reason?: string } {
  try {
    const parsed = JSON.parse(result) as { approved?: boolean; reason?: string };
    return { approved: Boolean(parsed.approved), reason: parsed.reason };
  } catch {
    return { approved: result.toLowerCase().includes("approv") };
  }
}

/** Demo HITL gate before execution agent places Kalshi orders. */
export function DeskHitl() {
  useHumanInTheLoop<ApproveArgs>(
    {
      name: "approve_kalshi_order",
      description:
        "Pause and require explicit user approval before describing or placing a Kalshi order.",
      parameters: approveKalshiOrderSchema,
      agentId: COPILOT_AGENT_ID,
      render: ({ args, status, respond, result }) => {
        if (status === ToolCallStatus.Executing && respond) {
          return (
            <div className="pd-desk-fade-in my-2 rounded-2xl border border-pd-border bg-pd-white p-4 shadow-sm">
              <div className="pd-accent-bar mb-3 h-0.5 w-14 rounded-full" aria-hidden />
              <h3 className="text-sm font-semibold text-pd-ink">Approve Kalshi order?</h3>
              <p className="mt-1 text-xs text-pd-ink/60">
                Review in chat before execution. After you approve and the order
                fills, a receipt appears in the center desk panel.
              </p>
              <dl className="mt-3 grid gap-1 text-sm text-pd-ink/80">
                <div className="flex justify-between gap-4">
                  <dt>Ticker</dt>
                  <dd className="font-mono text-pd-accent">{args.ticker}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>Side / action</dt>
                  <dd className="font-medium capitalize">
                    {args.action} {args.side}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>Size</dt>
                  <dd>{args.count} contracts</dd>
                </div>
                {args.price_cents != null ? (
                  <div className="flex justify-between gap-4">
                    <dt>Limit</dt>
                    <dd>{args.price_cents}¢</dd>
                  </div>
                ) : null}
              </dl>
              {args.rationale ? (
                <p className="mt-3 rounded-lg bg-pd-bg/80 px-3 py-2 text-xs text-pd-ink/70">
                  {args.rationale}
                </p>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void respond({ approved: true })}
                  className="pd-gradient-chip inline-flex items-center gap-2 rounded-xl border border-pd-accent/40 px-4 py-2 text-sm font-medium text-pd-ink shadow-sm"
                >
                  <ShieldCheck className="h-4 w-4 text-pd-accent" aria-hidden />
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() =>
                    void respond({
                      approved: false,
                      reason: "User denied at desk",
                    })
                  }
                  className="inline-flex items-center gap-2 rounded-xl border border-pd-border bg-pd-white px-4 py-2 text-sm font-medium text-pd-ink/80 hover:border-red-300"
                >
                  <ShieldX className="h-4 w-4 text-red-500/80" aria-hidden />
                  Deny
                </button>
              </div>
            </div>
          );
        }

        if (status === ToolCallStatus.Complete && result) {
          const { approved, reason } = parseHitlResult(result);
          return (
            <div
              className={`pd-desk-fade-in my-2 rounded-2xl border px-4 py-3 text-sm shadow-sm ${
                approved
                  ? "border-pd-accent/35 bg-pd-accent/10 text-pd-ink"
                  : "border-red-200 bg-red-50/80 text-red-800/90"
              }`}
            >
              <p className="font-medium">
                {approved
                  ? "Order approved — execution may proceed."
                  : `Order denied${reason ? `: ${reason}` : "."}`}
              </p>
              <dl className="mt-2 grid gap-1 text-xs opacity-90">
                <div className="flex justify-between gap-4">
                  <dt>Ticker</dt>
                  <dd className="font-mono">{args.ticker}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>Intent</dt>
                  <dd className="capitalize">
                    {args.action} {args.count} {args.side}
                  </dd>
                </div>
              </dl>
            </div>
          );
        }

        return null;
      },
    },
    [],
  );

  return null;
}
