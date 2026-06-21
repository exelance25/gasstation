import "server-only";

import {
  createPublicClient,
  decodeEventLog,
  http,
  parseAbiItem,
  parseUnits,
  type Address,
  type Hash,
  type Transport,
} from "viem";
import { base, baseSepolia, mainnet, sepolia } from "viem/chains";
import {
  arcTestnet,
  getUsdcAddress,
  isUsdcDepositChain,
  monadMainnet,
  monadTestnet,
  DEPOSIT_EVM_CHAIN_IDS,
} from "@config/evm-chains";
import { nativePaySymbolForChain } from "@/lib/manual-payment";
import { clientEnv } from "@/config/client-env";
import { getServerCollectorAddress } from "@/config/operator-env";
import type { AmountOption } from "@/lib/pricing";
import { createMonadTestnetTransport, isMonadTestnetChainId } from "@/lib/monad-rpc";

const transferEvent = parseAbiItem(
  "event Transfer(address indexed from, address indexed to, uint256 value)",
);

function resolveRpcUrl(chainId: number): string {
  switch (chainId) {
    case mainnet.id:
      return (
        process.env.ETH_RPC_PRIVATE_URL ??
        process.env.NEXT_PUBLIC_ETH_MAINNET_RPC ??
        "https://ethereum-rpc.publicnode.com"
      );
    case base.id:
      return (
        process.env.BASE_RPC_PRIVATE_URL ??
        process.env.NEXT_PUBLIC_BASE_RPC ??
        "https://mainnet.base.org"
      );
    case sepolia.id:
      return (
        process.env.ETH_RPC_PRIVATE_URL ??
        process.env.NEXT_PUBLIC_ETH_SEPOLIA_RPC ??
        "https://ethereum-sepolia-rpc.publicnode.com"
      );
    case baseSepolia.id:
      return (
        process.env.BASE_RPC_PRIVATE_URL ??
        process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC ??
        "https://sepolia.base.org"
      );
    case monadTestnet.id:
      return (
        process.env.MONAD_RPC_PRIVATE_URL ??
        process.env.NEXT_PUBLIC_MONAD_TESTNET_RPC ??
        "https://testnet-rpc.monad.xyz"
      );
    case monadMainnet.id:
      return (
        process.env.MONAD_RPC_PRIVATE_URL ??
        process.env.NEXT_PUBLIC_MONAD_MAINNET_RPC ??
        "https://rpc.monad.xyz"
      );
    case arcTestnet.id:
      return (
        process.env.ARC_RPC_PRIVATE_URL ??
        clientEnv.NEXT_PUBLIC_ARC_TESTNET_RPC ??
        "https://rpc.testnet.arc.network"
      );
    default:
      throw new Error(`Desteklenmeyen depozit chainId: ${chainId}`);
  }
}

function chainForId(chainId: number) {
  const chains = [mainnet, sepolia, base, baseSepolia, monadTestnet, monadMainnet, arcTestnet];
  const found = chains.find((c) => c.id === chainId);
  if (!found) throw new Error(`Bilinmeyen chainId: ${chainId}`);
  return found;
}

export function createDepositPublicClient(chainId: number) {
  const transport: Transport = isMonadTestnetChainId(chainId)
    ? createMonadTestnetTransport()
    : http(resolveRpcUrl(chainId));
  return createPublicClient({
    chain: chainForId(chainId),
    transport,
  });
}

export type UsdcDepositVerification = {
  valid: true;
  from: Address;
  amountWei: bigint;
  treasury: Address;
};

export type UsdcDepositFailure = {
  valid: false;
  reason: string;
};

const NATIVE_DEPOSIT_CHAIN_IDS = DEPOSIT_EVM_CHAIN_IDS.filter(
  (chainId) => nativePaySymbolForChain(chainId) != null,
);

export async function resolveDepositChainId(txHash: Hash): Promise<number | null> {
  const chainIds = [...new Set([...DEPOSIT_EVM_CHAIN_IDS, ...NATIVE_DEPOSIT_CHAIN_IDS])];
  for (const chainId of chainIds) {
    try {
      const client = createDepositPublicClient(chainId);
      const receipt = await client.getTransactionReceipt({ hash: txHash }).catch(() => null);
      if (receipt) return chainId;
    } catch {
      continue;
    }
  }
  return null;
}

export async function verifyUsdcDeposit(params: {
  txHash: Hash;
  chainId: number;
  packageUsd: AmountOption;
  depositorAddress?: Address;
}): Promise<UsdcDepositVerification | UsdcDepositFailure> {
  const { txHash, chainId, packageUsd, depositorAddress } = params;

  if (!isUsdcDepositChain(chainId)) {
    return { valid: false, reason: "USDC depozit ağı desteklenmiyor" };
  }

  const usdc = getUsdcAddress(chainId);
  if (!usdc) {
    return { valid: false, reason: "Bu ağda USDC kontratı bulunamadı" };
  }

  const treasury = getServerCollectorAddress();
  const roundedUsd = Math.round(packageUsd * 1_000_000) / 1_000_000;
  const expectedWei = parseUnits(roundedUsd.toFixed(6), 6);
  const client = createDepositPublicClient(chainId);

  const receipt = await client.getTransactionReceipt({ hash: txHash }).catch(() => null);
  if (!receipt || receipt.status !== "success") {
    return { valid: false, reason: "İşlem bulunamadı veya başarısız" };
  }

  let matchedFrom: Address | null = null;
  let matchedAmount = 0n;

  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== usdc.toLowerCase()) continue;
    try {
      const decoded = decodeEventLog({
        abi: [transferEvent],
        data: log.data,
        topics: log.topics,
      });
      if (decoded.eventName !== "Transfer") continue;
      const { from, to, value } = decoded.args;
      if (to.toLowerCase() !== treasury.toLowerCase()) continue;
      if (value < expectedWei) continue;
      matchedFrom = from;
      matchedAmount = value;
      break;
    } catch {
      continue;
    }
  }

  if (!matchedFrom || matchedAmount < expectedWei) {
    return {
      valid: false,
      reason: `Treasury'ye $${packageUsd} USDC transferi doğrulanamadı`,
    };
  }

  if (
    depositorAddress &&
    matchedFrom.toLowerCase() !== depositorAddress.toLowerCase()
  ) {
    return {
      valid: false,
      reason: "Depozit gönderen cüzdan eşleşmiyor",
    };
  }

  return {
    valid: true,
    from: matchedFrom,
    amountWei: matchedAmount,
    treasury,
  };
}
