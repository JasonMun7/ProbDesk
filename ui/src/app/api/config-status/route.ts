import { COPILOT_AGENT_ID } from "@/lib/constants";
import {
  envPresent,
  kalshiConfigured,
  kalshiPrivateKeyConfigured,
  loadRepoEnv,
} from "@/lib/server-env";
import { NextResponse } from "next/server";

export async function GET() {
  loadRepoEnv();

  const kalshiApiKeyId = envPresent("KALSHI_API_KEY_ID");
  const kalshiPrivateKey = kalshiPrivateKeyConfigured();

  return NextResponse.json({
    kalshi: {
      apiKeyId: kalshiApiKeyId,
      privateKey: kalshiPrivateKey,
      configured: kalshiConfigured(),
    },
    agent: {
      googleApiKey: envPresent("GOOGLE_API_KEY"),
      aguiUrl: process.env.PROB_DESK_AGUI_URL?.trim() || "http://127.0.0.1:8000/",
    },
    agentphone: {
      configured: envPresent("AGENTPHONE_API_KEY"),
    },
    copilot: {
      runtimeUrl: "/api/copilotkit",
      agentId: COPILOT_AGENT_ID,
      mcpApps: envPresent("PROB_DESK_MCP_APPS_URL"),
    },
    version: "0.1.0",
  });
}
