"use client";

import { createPublicClient, http, type Chain, type Hash, type PublicClient } from "viem";
import { base, baseSepolia, mainnet, sepolia } from "viem/chains";
import { clientEnv } from "@/config/client-env";
import { arcTestnet, monadMainnet, supportedEvmChains } from "@config/evm-chains";
import { createMonadTestnetTransport, isMonadTestnetChainId } from "@/lib/monad-rpc";

export function getChainById(chainId: number): Chain {
  const chain = supportedEvmChains.find((c) => c.id === chainId);
  if (!chain) {
    throw new Error(
      `Desteklenmeyen ağ (chainId ${chainId}). MetaMask'ta Sepolia, Base Sepolia veya Monad Testnet kullanın.`,
    );
  }
  return chain;
}

function resolveTransport(chainId: number) {
  if (isMonadTestnetChainId(chainId)) {
    return createMonadTestnetTransport();
  }
  switch (chainId) {
    case mainnet.id:
      return http(clientEnv.NEXT_PUBLIC_ETH_MAINNET_RPC);
    case sepolia.id:
      return http(clientEnv.NEXT_PUBLIC_ETH_SEPOLIA_RPC);
    case base.id:
      return http(clientEnv.NEXT_PUBLIC_BASE_RPC ?? "https://mainnet.base.org");
    case baseSepolia.id:
      return http(clientEnv.NEXT_PUBLIC_BASE_SEPOLIA_RPC ?? "https://sepolia.base.org");
    case monadMainnet.id:
      return http(clientEnv.NEXT_PUBLIC_MONAD_MAINNET_RPC ?? "https://rpc.monad.xyz");
    case arcTestnet.id:
      return http(clientEnv.NEXT_PUBLIC_ARC_TESTNET_RPC ?? "https://rpc.testnet.arc.network");
    default:
      return http();
  }
}

export function getChainPublicClient(chainId: number): PublicClient {
  return createPublicClient({
    chain: getChainById(chainId),
    transport: resolveTransport(chainId),
  });
}

export async function waitForDepositReceipt(chainId: number, hash: Hash) {
  const client = getChainPublicClient(chainId);
  return client.waitForTransactionReceipt({
    hash,
    timeout: 180_000,
    confirmations: 1,
  });
}
