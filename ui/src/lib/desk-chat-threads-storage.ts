/** localStorage registry for CopilotKit thread ids (self-hosted; no Intelligence platform). */
export const DESK_CHAT_THREADS_STORAGE_KEY = "prob-desk-chat-threads-v1";

export type DeskChatThreadMeta = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  /** True after the user has sent at least one message in this thread. */
  hasMessages: boolean;
};

export type DeskChatThreadsSnapshot = {
  version: 1;
  activeThreadId: string;
  threads: DeskChatThreadMeta[];
};

const EMPTY: DeskChatThreadsSnapshot = {
  version: 1,
  activeThreadId: "",
  threads: [],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseThreadMeta(value: unknown): DeskChatThreadMeta | null {
  if (!isRecord(value)) return null;
  const { id, title, createdAt, updatedAt } = value;
  if (
    typeof id !== "string" ||
    typeof title !== "string" ||
    typeof createdAt !== "string" ||
    typeof updatedAt !== "string"
  ) {
    return null;
  }
  const hasMessages = value.hasMessages === true;
  return { id, title, createdAt, updatedAt, hasMessages };
}

export function loadDeskChatThreads(): DeskChatThreadsSnapshot {
  if (typeof window === "undefined") return { ...EMPTY };
  try {
    const raw = window.localStorage.getItem(DESK_CHAT_THREADS_STORAGE_KEY);
    if (!raw) return { ...EMPTY };
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || parsed.version !== 1) return { ...EMPTY };
    const activeThreadId =
      typeof parsed.activeThreadId === "string" ? parsed.activeThreadId : "";
    const threads = Array.isArray(parsed.threads)
      ? parsed.threads
          .map(parseThreadMeta)
          .filter((t): t is DeskChatThreadMeta => t !== null)
      : [];
    return { version: 1, activeThreadId, threads };
  } catch {
    return { ...EMPTY };
  }
}

export function saveDeskChatThreads(snapshot: DeskChatThreadsSnapshot): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      DESK_CHAT_THREADS_STORAGE_KEY,
      JSON.stringify(snapshot),
    );
  } catch {
    /* private mode / quota */
  }
}

export function titleFromMessage(content: string, maxLen = 48): string {
  const line = content.replace(/\s+/g, " ").trim();
  if (!line) return "New chat";
  if (line.length <= maxLen) return line;
  return `${line.slice(0, maxLen - 1)}…`;
}

export function defaultThreadTitle(createdAt: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(createdAt));
  } catch {
    return "Conversation";
  }
}

export function sortThreadsByRecent(
  threads: DeskChatThreadMeta[],
): DeskChatThreadMeta[] {
  return [...threads].sort(
    (a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}
