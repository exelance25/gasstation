/** Jupiter Price API — Solana token fiyatları (ücretsiz, key gerektirmez) */
export async function fetchJupiterSolUsd(): Promise<number | null> {
  try {
    const res = await fetch(
      "https://api.jup.ag/price/v2?ids=So11111111111111111111111111111111111111112",
      { signal: AbortSignal.timeout(6000) },
    );
    if (!res.ok) return null;
    const json = (await res.json()) as {
      data?: Record<string, { price?: string }>;
    };
    const raw =
      json.data?.["So11111111111111111111111111111111111111112"]?.price;
    const px = raw ? Number(raw) : NaN;
    return Number.isFinite(px) && px > 0 ? px : null;
  } catch {
    return null;
  }
}
