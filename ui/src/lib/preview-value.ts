/** Truncate values for in-memory dedupe keys (not logged in production). */
export function previewValue(value: unknown, max = 200): string {
  if (value == null) return String(value);
  if (typeof value === "string") {
    return value.length > max ? `${value.slice(0, max)}…` : value;
  }
  try {
    const s = JSON.stringify(value);
    return s.length > max ? `${s.slice(0, max)}…` : s;
  } catch {
    return `[${typeof value}]`;
  }
}
