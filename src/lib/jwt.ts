/**
 * Client-side JWT payload decoding. No signature verification is performed —
 * the backend is the sole authority on authorization; this is only used to
 * read the `permission` claims baked into the access token for UI gating.
 */
export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const json = decodeURIComponent(
      atob(padded)
        .split("")
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join("")
    );
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Reads a claim that may appear zero, one, or many times in the token. */
export function claimAsStringArray(payload: Record<string, unknown> | null, claimType: string): string[] {
  const value = payload?.[claimType];
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === "string");
  if (typeof value === "string") return [value];
  return [];
}
