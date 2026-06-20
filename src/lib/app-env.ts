/** Üretim dışı ortamlarda test kolaylığı (min tutar, Monad reserve vb.) */
export function isMainnetAppEnv(): boolean {
  return process.env.NEXT_PUBLIC_APP_ENV === "mainnet";
}

export function isTestnetAppEnv(): boolean {
  return !isMainnetAppEnv();
}

/** İstemci — mainnet canlı sayaç vb. */
export function isMainnetClientEnv(): boolean {
  return process.env.NEXT_PUBLIC_APP_ENV === "mainnet";
}
