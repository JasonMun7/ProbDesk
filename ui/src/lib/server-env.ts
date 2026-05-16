import fs from "fs";
import path from "path";

/** Repo root (ProbDesk/), not necessarily `ui/`. */
export function getRepoRoot(): string {
  const cwd = process.cwd();
  if (fs.existsSync(path.join(cwd, ".env"))) {
    return cwd;
  }
  const parent = path.join(cwd, "..");
  if (fs.existsSync(path.join(parent, ".env"))) {
    return parent;
  }
  return cwd;
}

let repoEnvLoaded = false;

/** Load root `.env` into `process.env` without overriding existing vars (matches Python loader). */
export function loadRepoEnv(): void {
  if (repoEnvLoaded) return;
  repoEnvLoaded = true;

  const envFile = path.join(getRepoRoot(), ".env");
  if (!fs.existsSync(envFile)) return;

  const content = fs.readFileSync(envFile, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    if (!key || process.env[key] !== undefined) continue;
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    value = value.replace(/\\n/g, "\n");
    process.env[key] = value;
  }
}

export function envPresent(name: string): boolean {
  loadRepoEnv();
  const v = process.env[name];
  return typeof v === "string" && v.trim().length > 0;
}

export function kalshiPrivateKeyConfigured(): boolean {
  loadRepoEnv();
  if (envPresent("KALSHI_PRIVATE_KEY_PEM")) return true;
  const keyPath = process.env.KALSHI_PRIVATE_KEY_PATH?.trim();
  if (!keyPath) return false;
  const resolved = path.isAbsolute(keyPath)
    ? keyPath
    : path.join(getRepoRoot(), keyPath);
  try {
    return fs.existsSync(resolved) && fs.statSync(resolved).isFile();
  } catch {
    return false;
  }
}

export function kalshiConfigured(): boolean {
  return envPresent("KALSHI_API_KEY_ID") && kalshiPrivateKeyConfigured();
}
