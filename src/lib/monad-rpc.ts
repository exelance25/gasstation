import { fallback, http, type Transport } from "viem";
import { monadTestnet } from "@config/evm-chains";

/** Resmi + topluluk Monad testnet RPC yedekleri */
const MONAD_TESTNET_PUBLIC_FALLBACKS = [
  "https://rpc.ankr.com/monad_testnet",
  "https://monad-testnet.drpc.org",
  "https://rpc-testnet.monadinfra.com",
  "https://testnet-rpc.monad.xyz",
] as const;

/** .env öncelikli, sonra kamu yedek hatlar */
export function getMonadTestnetRpcUrls(): string[] {
  const fromEnv = [
    process.env.MONAD_RPC_PRIVATE_URL,
    process.env.NEXT_PUBLIC_MONAD_TESTNET_RPC,
  ].filter((u): u is string => Boolean(u?.trim() && !u.includes("your-optional-key")));

  const seen = new Set<string>();
  const out: string[] = [];
  for (const url of [...fromEnv, ...MONAD_TESTNET_PUBLIC_FALLBACKS]) {
    if (!seen.has(url)) {
      seen.add(url);
      out.push(url);
    }
  }
  return out;
}

export function createMonadTestnetTransport(): Transport {
  const urls = getMonadTestnetRpcUrls();
  return fallback(urls.map((url) => http(url)));
}

export function isMonadTestnetChainId(chainId: number): boolean {
  return chainId === monadTestnet.id;
}
