import { writeDeskSettingsFile } from "@/lib/server-desk-settings";
import { loadRepoEnv } from "@/lib/server-env";
import { NextResponse } from "next/server";

const AGENTPHONE_API_BASE = "https://api.agentphone.ai";

const DEFAULT_AGENT_NAME = "ProbDesk";

export async function POST(request: Request) {
  loadRepoEnv();
  const apiKey = (process.env.AGENTPHONE_API_KEY || "").trim();
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "AGENTPHONE_API_KEY is not set. Add it to the repo .env and restart the ADK agent.",
      },
      { status: 400 },
    );
  }

  let name = DEFAULT_AGENT_NAME;
  try {
    const body = (await request.json()) as { name?: string };
    const trimmed = body?.name?.trim();
    if (trimmed) name = trimmed;
  } catch {
    // use default name
  }

  let res: Response;
  try {
    res = await fetch(`${AGENTPHONE_API_BASE}/v1/agents`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        voiceMode: "hosted",
      }),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  if (!res.ok) {
    const detail = (await res.text()).slice(0, 500);
    return NextResponse.json(
      { error: `AgentPhone API returned ${res.status}`, detail },
      { status: 502 },
    );
  }

  const data = (await res.json()) as { id?: string };
  const agentId = (data.id || "").trim();
  if (!agentId) {
    return NextResponse.json(
      { error: "AgentPhone did not return an agent id." },
      { status: 502 },
    );
  }

  const saved = writeDeskSettingsFile({
    agentphoneAgentId: agentId,
    agentphoneAgentName: name,
  });

  return NextResponse.json({
    agentId,
    agentName: saved.agentphoneAgentName ?? name,
  });
}
