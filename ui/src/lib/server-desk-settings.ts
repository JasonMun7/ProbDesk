import fs from "fs";
import os from "os";
import path from "path";
import { getRepoRoot, loadRepoEnv } from "@/lib/server-env";

export type DeskSettings = {
  agentphoneAgentId?: string;
  agentphoneAgentName?: string;
};

const SETTINGS_DIR = ".prob-desk";
const SETTINGS_FILE = "desk-settings.json";

function settingsPath(): string {
  // Vercel serverless FS is ephemeral; use /tmp so writes do not fail at runtime.
  if (process.env.VERCEL) {
    return path.join(os.tmpdir(), "prob-desk", SETTINGS_FILE);
  }
  return path.join(getRepoRoot(), SETTINGS_DIR, SETTINGS_FILE);
}

function ensureSettingsDir(): void {
  const dir = path.dirname(settingsPath());
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function readDeskSettingsFile(): DeskSettings {
  const file = settingsPath();
  if (!fs.existsSync(file)) {
    return {};
  }
  try {
    const raw = fs.readFileSync(file, "utf8");
    const parsed = JSON.parse(raw) as DeskSettings;
    if (!parsed || typeof parsed !== "object") {
      return {};
    }
    return parsed;
  } catch {
    return {};
  }
}

export function writeDeskSettingsFile(patch: DeskSettings): DeskSettings {
  ensureSettingsDir();
  const current = readDeskSettingsFile();
  const next: DeskSettings = { ...current };

  if ("agentphoneAgentId" in patch) {
    const id = patch.agentphoneAgentId?.trim();
    if (id) {
      next.agentphoneAgentId = id;
    } else {
      delete next.agentphoneAgentId;
    }
  }

  if ("agentphoneAgentName" in patch) {
    const name = patch.agentphoneAgentName?.trim();
    if (name) {
      next.agentphoneAgentName = name;
    } else {
      delete next.agentphoneAgentName;
    }
  }

  fs.writeFileSync(settingsPath(), `${JSON.stringify(next, null, 2)}\n`, "utf8");
  return next;
}

export type AgentPhoneAgentIdResolution = {
  agentId: string | null;
  source: "env" | "file" | null;
};

/** Env `AGENTPHONE_AGENT_ID` wins over `.prob-desk/desk-settings.json`. */
export function resolveAgentPhoneAgentId(): AgentPhoneAgentIdResolution {
  loadRepoEnv();
  const fromEnv = (process.env.AGENTPHONE_AGENT_ID || "").trim();
  if (fromEnv) {
    return { agentId: fromEnv, source: "env" };
  }
  const fromFile = (readDeskSettingsFile().agentphoneAgentId || "").trim();
  if (fromFile) {
    return { agentId: fromFile, source: "file" };
  }
  return { agentId: null, source: null };
}
