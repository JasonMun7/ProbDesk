import { ToolCallStatus } from "@copilotkit/core";

export type DeskToolStatus = "inProgress" | "executing" | "complete" | "error";

export function normalizeDeskToolStatus(status: unknown): DeskToolStatus {
  const s = String(status);
  if (s === ToolCallStatus.Complete || s === "complete") return "complete";
  if (s === ToolCallStatus.Executing || s === "executing") return "executing";
  if (s === "error") return "error";
  return "inProgress";
}

export function isDeskToolRunning(status: unknown): boolean {
  const n = normalizeDeskToolStatus(status);
  return n !== "complete" && n !== "error";
}

export function isDeskToolComplete(status: unknown): boolean {
  return normalizeDeskToolStatus(status) === "complete";
}
