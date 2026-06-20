const HERMES = "https://hermes.pyth.network/v2/updates/price/latest";
const PYTH_ETH_USD =
  "0xff61491a931112ddf1bd8147cd1b641375f79f5826404a55845f75afb5e8561e";

export async function fetchPythEthUsd(): Promise<number | null> {
  try {
    const url = `${HERMES}?ids[]=${PYTH_ETH_USD}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      parsed?: Array<{ price?: { price: string; expo: number } }>;
    };
    const tick = json.parsed?.[0]?.price;
    if (!tick) return null;
    const px = Number(tick.price) * 10 ** tick.expo;
    return px > 0 ? px : null;
  } catch {
    return null;
  }
}
