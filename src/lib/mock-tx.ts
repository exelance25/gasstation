/**
 * Simüle işlem hash'i — crypto.getRandomValues (MIT, güvenli rastgele).
 */
export function generateMockTxHash(): `0x${string}` {
  const bytes = new Uint8Array(32);
  globalThis.crypto.getRandomValues(bytes);
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `0x${hex}`;
}
