/**
 * Lightweight address fingerprint for localStorage (not a security hash).
 * Used only to restore nicknames when the same wallet reconnects.
 */
export async function hashAddress(address: string): Promise<string> {
  const normalized = address.trim().toLowerCase();
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const data = new TextEncoder().encode(normalized);
    const digest = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(digest))
      .slice(0, 12)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  let h = 0;
  for (let i = 0; i < normalized.length; i++) h = (h << 5) - h + normalized.charCodeAt(i);
  return `fb_${Math.abs(h).toString(16)}`;
}

/** Sync fallback for persist merge during SSR/hydration */
export function hashAddressSync(address: string): string {
  const normalized = address.trim().toLowerCase();
  let h = 0;
  for (let i = 0; i < normalized.length; i++) h = (h << 5) - h + normalized.charCodeAt(i);
  return `fb_${Math.abs(h).toString(16)}`;
}
