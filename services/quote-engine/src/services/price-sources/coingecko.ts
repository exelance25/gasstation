import type { PaymentToken } from "../../types/quote.js";

const COINGECKO =
  "https://api.coingecko.com/api/v3/simple/price?ids=ethereum,solana,monad&vs_currencies=usd";

const TOKEN_TO_CG: Partial<Record<PaymentToken, keyof CgRow>> = {
  ETH: "ethereum",
  BASE: "ethereum",
  SOL: "solana",
  MON: "monad",
};

type CgRow = {
  ethereum?: { usd?: number };
  solana?: { usd?: number };
  monad?: { usd?: number };
};

export async function fetchCoinGeckoUsd(
  token: PaymentToken,
): Promise<number | null> {
  try {
    const res = await fetch(COINGECKO, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return null;
    const json = (await res.json()) as CgRow;
    const key = TOKEN_TO_CG[token];
    if (!key) return null;
    const px = json[key]?.usd;
    return px && px > 0 ? px : null;
  } catch {
    return null;
  }
}
