import "server-only";

import {
  createPublicClient,
  formatEther,
  http,
  type Transport,
} from "viem";
import {
  getCollectorAddressSafe,
  getOperatorAddressSafe,
  isOperatorConfigured,
  isSolanaOperatorConfigured,
} from "@/config/operator-env";
import { dispenseEvmNativeGas, getDeliveryChain } from "@/server/gas/dispense-evm-gas";
import type { GasDeliveryAsset } from "@/config/depot-assets";
import { createMonadTestnetTransport, isMonadTestnetChainId } from "@/lib/monad-rpc";
import { isMainnetAppEnv } from "@/lib/app-env";

function resolveDeliveryRpc(chainId: number): string {
  switch (chainId) {
    case 1:
      return (
        process.env.ETH_RPC_PRIVATE_URL ??
        process.env.NEXT_PUBLIC_ETH_MAINNET_RPC ??
        "https://ethereum-rpc.publicnode.com"
      );
    case 11155111:
      return (
        process.env.ETH_RPC_PRIVATE_URL ??
        process.env.NEXT_PUBLIC_ETH_SEPOLIA_RPC ??
        "https://ethereum-sepolia-rpc.publicnode.com"
      );
    case 8453:
      return (
        process.env.BASE_RPC_PRIVATE_URL ??
        process.env.NEXT_PUBLIC_BASE_RPC ??
        "https://mainnet.base.org"
      );
    case 84532:
      return (
        process.env.BASE_RPC_PRIVATE_URL ??
        process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC ??
        "https://sepolia.base.org"
      );
    case 10143:
      return (
        process.env.MONAD_RPC_PRIVATE_URL ??
        process.env.NEXT_PUBLIC_MONAD_TESTNET_RPC ??
        "https://testnet-rpc.monad.xyz"
      );
    default:
      return "https://ethereum-sepolia-rpc.publicnode.com";
  }
}

export type OperatorTankStatus = {
  address: string | null;
  configured: boolean;
  collector: string | null;
  tanks: Array<{
    asset: GasDeliveryAsset;
    chainId: number;
    chainName: string;
    balanceNative: string;
    symbol: string;
  }>;
};

/** Canlı kasa / operatör tank durumu (private key asla dönmez) */
export async function getOperatorTankStatus(): Promise<OperatorTankStatus> {
  const collector = getCollectorAddressSafe();
  if (!isOperatorConfigured()) {
    return {
      address: null,
      configured: false,
      collector,
      tanks: [],
    };
  }

  const address = getOperatorAddressSafe();
  if (!address) {
    return { address: null, configured: false, collector, tanks: [] };
  }

  const assets: GasDeliveryAsset[] = ["ETH", "BASE", "MON"];
  const tanks: OperatorTankStatus["tanks"] = [];

  for (const asset of assets) {
    const chain = getDeliveryChain(asset);
    const transport: Transport = isMonadTestnetChainId(chain.id)
      ? createMonadTestnetTransport()
      : http(resolveDeliveryRpc(chain.id));
    const client = createPublicClient({ chain, transport });
    const balance = await client.getBalance({ address }).catch(() => 0n);
    tanks.push({
      asset,
      chainId: chain.id,
      chainName: chain.name,
      balanceNative: formatEther(balance),
      symbol: chain.nativeCurrency.symbol,
    });
  }

  return {
    address,
    configured: true,
    collector,
    tanks,
  };
}

export function isAnyOperatorReady(): boolean {
  return isOperatorConfigured() || isSolanaOperatorConfigured();
}
