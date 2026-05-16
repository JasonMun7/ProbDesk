/**
 * Node 22+ may define global `localStorage` without working Storage methods
 * (e.g. when `--localstorage-file` has no valid path). CopilotKit touches
 * localStorage during SSR; shim it so getItem/setItem are real functions.
 */
function patchBrokenNodeLocalStorage(): void {
  const ls = globalThis.localStorage as Storage | undefined;
  if (!ls || typeof ls.getItem === "function") {
    return;
  }
  const store = new Map<string, string>();
  const shim: Storage = {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.get(key) ?? null;
    },
    key(index: number) {
      return [...store.keys()][index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, String(value));
    },
  };
  Object.defineProperty(globalThis, "localStorage", {
    value: shim,
    writable: true,
    configurable: true,
  });
}

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    patchBrokenNodeLocalStorage();
  }
}
