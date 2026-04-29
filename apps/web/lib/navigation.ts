export function normalizeInternalPath(value: string | undefined, fallback = "/profile"): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  return value;
}
