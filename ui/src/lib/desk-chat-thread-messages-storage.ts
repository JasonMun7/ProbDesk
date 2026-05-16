import type { Message } from "@ag-ui/core";

/** Browser cache of AG-UI transcripts keyed by CopilotKit thread id. */
export const DESK_CHAT_THREAD_MESSAGES_KEY = "prob-desk-chat-thread-messages-v1";

type MessageStore = {
  version: 1;
  threads: Record<string, Message[]>;
};

const EMPTY_STORE: MessageStore = { version: 1, threads: {} };

function loadStore(): MessageStore {
  if (typeof window === "undefined") return { ...EMPTY_STORE };
  try {
    const raw = window.localStorage.getItem(DESK_CHAT_THREAD_MESSAGES_KEY);
    if (!raw) return { ...EMPTY_STORE };
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      (parsed as MessageStore).version !== 1 ||
      typeof (parsed as MessageStore).threads !== "object"
    ) {
      return { ...EMPTY_STORE };
    }
    return parsed as MessageStore;
  } catch {
    return { ...EMPTY_STORE };
  }
}

function saveStore(store: MessageStore): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      DESK_CHAT_THREAD_MESSAGES_KEY,
      JSON.stringify(store),
    );
  } catch {
    /* quota / private mode */
  }
}

function cloneMessages(messages: Message[]): Message[] {
  return JSON.parse(JSON.stringify(messages)) as Message[];
}

export function loadThreadMessages(threadId: string): Message[] | null {
  if (!threadId) return null;
  const msgs = loadStore().threads[threadId];
  if (!Array.isArray(msgs) || msgs.length === 0) return null;
  return cloneMessages(msgs);
}

export function threadHasCachedMessages(threadId: string): boolean {
  return (loadThreadMessages(threadId)?.length ?? 0) > 0;
}

export function saveThreadMessages(
  threadId: string,
  messages: Message[],
): void {
  if (!threadId || messages.length === 0) return;
  const store = loadStore();
  store.threads[threadId] = cloneMessages(messages);
  saveStore(store);
}

export function deleteThreadMessages(threadId: string): void {
  if (!threadId) return;
  const store = loadStore();
  if (!store.threads[threadId]) return;
  delete store.threads[threadId];
  saveStore(store);
}
