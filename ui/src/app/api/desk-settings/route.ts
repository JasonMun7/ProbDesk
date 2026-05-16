import {
  readDeskSettingsFile,
  resolveAgentPhoneAgentId,
  writeDeskSettingsFile,
  type DeskSettings,
} from "@/lib/server-desk-settings";
import { envPresent, loadRepoEnv } from "@/lib/server-env";
import { NextResponse } from "next/server";

export async function GET() {
  loadRepoEnv();
  const file = readDeskSettingsFile();
  const resolved = resolveAgentPhoneAgentId();

  return NextResponse.json({
    agentphone: {
      apiKeyConfigured: envPresent("AGENTPHONE_API_KEY"),
      agentId: resolved.agentId,
      agentIdSource: resolved.source,
      agentName: file.agentphoneAgentName ?? null,
      fileAgentId: file.agentphoneAgentId ?? null,
    },
  });
}

export async function PATCH(request: Request) {
  let body: DeskSettings;
  try {
    body = (await request.json()) as DeskSettings;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const allowed: DeskSettings = {};
  if (body.agentphoneAgentId !== undefined) {
    allowed.agentphoneAgentId = body.agentphoneAgentId;
  }
  if (body.agentphoneAgentName !== undefined) {
    allowed.agentphoneAgentName = body.agentphoneAgentName;
  }

  if (Object.keys(allowed).length === 0) {
    return NextResponse.json(
      { error: "No supported fields in body" },
      { status: 400 },
    );
  }

  const saved = writeDeskSettingsFile(allowed);
  const resolved = resolveAgentPhoneAgentId();

  return NextResponse.json({
    agentphone: {
      agentId: resolved.agentId,
      agentIdSource: resolved.source,
      agentName: saved.agentphoneAgentName ?? null,
      fileAgentId: saved.agentphoneAgentId ?? null,
    },
  });
}
