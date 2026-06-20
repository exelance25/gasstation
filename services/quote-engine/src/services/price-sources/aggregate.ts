import type { PaymentToken } from "../../types/quote.js";
import type { PriceSourceSnapshot } from "../../types/quote.js";
import { fetchPythEthUsd } from "./pyth.js";
import { fetchCoinGeckoUsd } from "./coingecko.js";
import { fetchJupiterSolUsd } from "./jupiter.js";
import { getEnv } from "../../config/env.js";

const STUB: Record<PaymentToken, number> = {
  ETH: 3500,
  BASE: 3500,
  MON: 0.026,
  SOL: 180,
};

export type AggregatedPrice = {
  conservativeUsd: number;
  aggressiveUsd: number;
  sources: PriceSourceSnapshot[];
  maxSpreadBps: number;
  rejected: boolean;
  rejectReason?: string;
};

function spreadBps(min: number, max: number): number {
  if (min <= 0) return 0;
  return Math.round(((max - min) / min) * 10_000);
}

/** Çok kaynaklı USD fiyat — arbitraj koruması */
export async function aggregateTokenUsd(
  token: PaymentToken,
): Promise<AggregatedPrice> {
  const now = new Date().toISOString();
  const sources: PriceSourceSnapshot[] = [];

  const tasks: Promise<void>[] = [];

  if (token === "ETH" || token === "BASE") {
    tasks.push(
      fetchPythEthUsd().then((px) => {
        if (px) sources.push({ source: "pyth", usd: px, fetchedAt: now });
      }),
    );
    tasks.push(
      fetchCoinGeckoUsd(token).then((px) => {
        if (px) sources.push({ source: "coingecko", usd: px, fetchedAt: now });
      }),
    );
  } else if (token === "SOL") {
    tasks.push(
      fetchJupiterSolUsd().then((px) => {
        if (px) sources.push({ source: "jupiter", usd: px, fetchedAt: now });
      }),
    );
    tasks.push(
      fetchCoinGeckoUsd("SOL").then((px) => {
        if (px) sources.push({ source: "coingecko", usd: px, fetchedAt: now });
      }),
    );
  } else {
    tasks.push(
      fetchCoinGeckoUsd("MON").then((px) => {
        if (px) sources.push({ source: "coingecko", usd: px, fetchedAt: now });
      }),
    );
  }

  // Oracle API yedek
  tasks.push(
    fetchOracleApi(token).then((px) => {
      if (px) sources.push({ source: "gasstation-oracle", usd: px, fetchedAt: now });
    }),
  );

  await Promise.all(tasks);

  if (sources.length === 0) {
    const stub = STUB[token];
    sources.push({ source: "stub", usd: stub, fetchedAt: now });
  }

  const prices = sources.map((s) => s.usd);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const maxSpread = spreadBps(min, max);
  const env = getEnv();

  if (sources.length >= 2 && maxSpread > env.MAX_SOURCE_SPREAD_BPS) {
    return {
      conservativeUsd: max,
      aggressiveUsd: min,
      sources,
      maxSpreadBps: maxSpread,
      rejected: true,
      rejectReason: `Kaynak spread %${(maxSpread / 100).toFixed(2)} — limit aşıldı`,
    };
  }

  // Kasa koruması: gas maliyeti için yüksek, ödeme tokeni için düşük USD
  return {
    conservativeUsd: max,
    aggressiveUsd: min,
    sources,
    maxSpreadBps: maxSpread,
    rejected: false,
  };
}

async function fetchOracleApi(token: PaymentToken): Promise<number | null> {
  try {
    const res = await fetch(getEnv().ORACLE_API_URL, {
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as Record<string, number>;
    switch (token) {
      case "ETH":
        return json.ETH_Price > 0 ? json.ETH_Price : null;
      case "BASE":
        return json.BASE_Price > 0 ? json.BASE_Price : null;
      case "MON":
        return json.MON_Price > 0 ? json.MON_Price : null;
      case "SOL":
        return json.SOL_Price > 0 ? json.SOL_Price : null;
    }
  } catch {
    return null;
  }
}
