import "server-only";

import {
  createPublicClient,
  formatEther,
  formatUnits,
  http,
  type Address,
  type Transport,
} from "viem";
import {
  DEPOSIT_EVM_CHAIN_IDS,
  getChainDisplayName,
  getUsdcAddress,
  supportedEvmChains,
  USDC_DECIMALS,
} from "@config/evm-chains";
import { erc20Abi } from "@/lib/erc20-abi";
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
    kind: "native" | "usdc";
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
      kind: "native",
    });
  }

  for (const chainId of DEPOSIT_EVM_CHAIN_IDS) {
    const usdcToken = getUsdcAddress(chainId);
    if (!usdcToken) continue;
    const chainDef = supportedEvmChains.find((c) => c.id === chainId);
    if (!chainDef) continue;
    const transport: Transport = isMonadTestnetChainId(chainId)
      ? createMonadTestnetTransport()
      : http(resolveDeliveryRpc(chainId));
    const client = createPublicClient({ chain: chainDef, transport });
    const holder = address as Address;
    const raw = (await client
      .readContract({
        address: usdcToken,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [holder],
      })
      .catch(() => 0n)) as bigint;
    tanks.push({
      asset: "USDC",
      chainId,
      chainName: getChainDisplayName(chainId),
      balanceNative: formatUnits(raw, USDC_DECIMALS),
      symbol: "USDC",
      kind: "usdc",
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
