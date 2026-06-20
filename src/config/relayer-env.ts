import "server-only";

import { z } from "zod";
import { DEFAULT_ENTRY_POINT_V06 } from "@/lib/paymaster-config";

const relayerEnvSchema = z.object({
  RELAYER_PRIVATE_KEY: z.string().min(64).optional(),
  ENTRY_POINT_ADDRESS: z.string().optional(),
  ETH_RPC_PRIVATE_URL: z.string().url().optional(),
  BASE_RPC_PRIVATE_URL: z.string().url().optional(),
});

function resolveRpcUrl(): string | undefined {
  return (
    process.env.BASE_RPC_PRIVATE_URL ??
    process.env.ETH_RPC_PRIVATE_URL ??
    process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC ??
    process.env.NEXT_PUBLIC_BASE_RPC
  );
}

export function isRelayerConfigured(): boolean {
  const key = process.env.RELAYER_PRIVATE_KEY?.trim();
  const rpc = resolveRpcUrl();
  return Boolean(key && key.length >= 64 && rpc);
}

export function getRelayerConfig() {
  const parsed = relayerEnvSchema.parse({
    RELAYER_PRIVATE_KEY: process.env.RELAYER_PRIVATE_KEY,
    ENTRY_POINT_ADDRESS: process.env.ENTRY_POINT_ADDRESS,
    ETH_RPC_PRIVATE_URL: process.env.ETH_RPC_PRIVATE_URL,
    BASE_RPC_PRIVATE_URL: process.env.BASE_RPC_PRIVATE_URL,
  });

  const rpcUrl = parsed.BASE_RPC_PRIVATE_URL ?? parsed.ETH_RPC_PRIVATE_URL ?? resolveRpcUrl();
  const privateKey = parsed.RELAYER_PRIVATE_KEY;

  if (!privateKey || !rpcUrl) {
    throw new Error("RELAYER_PRIVATE_KEY and RPC URL are required");
  }

  return {
    privateKey,
    rpcUrl,
    entryPointAddress:
      parsed.ENTRY_POINT_ADDRESS?.trim() || DEFAULT_ENTRY_POINT_V06,
  };
}
