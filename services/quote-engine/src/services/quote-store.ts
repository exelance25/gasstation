const used = new Map<string, number>();
const TTL_MS = 60_000;

export function markQuoteUsed(quoteId: string): boolean {
  prune();
  if (used.has(quoteId)) return false;
  used.set(quoteId, Date.now());
  return true;
}

export function isQuoteUsed(quoteId: string): boolean {
  prune();
  return used.has(quoteId);
}

function prune(): void {
  const now = Date.now();
  for (const [id, at] of used) {
    if (now - at > TTL_MS) used.delete(id);
  }
}
