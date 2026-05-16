import { handleCopilotKitRequest } from "@/lib/copilotkit-server";
import type { NextRequest } from "next/server";

async function handler(req: NextRequest) {
  return handleCopilotKitRequest(req);
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;
