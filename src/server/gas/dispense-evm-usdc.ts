import "server-only";

import {
  createPublicClient,
  createWalletClient,
  formatUnits,
  http,
  isAddress,
  parseUnits,
  type Address,
  type Chain,
  type Hash,
  type Transport,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base, baseSepolia, mainnet, sepolia } from "viem/chains";
import { monadMainnet, monadTestnet } from "@config/evm-chains";
import { getOperatorPrivateKey } from "@/config/operator-env";
import { getUsdcAddress, USDC_DECIMALS } from "@config/evm-chains";
import { erc20Abi } from "@/lib/erc20-abi";
import { createMonadTestnetTransport, isMonadTestnetChainId } from "@/lib/monad-rpc";
import { isMainnetAppEnv } from "@/lib/app-env";

function chainForId(chainId: number): Chain {
  switch (chainId) {
    case mainnet.id:
      return mainnet;
    case sepolia.id:
      return sepolia;
    case base.id:
      return base;
    case baseSepolia.id:
      return baseSepolia;
    case monadMainnet.id:
      return monadMainnet;
    case monadTestnet.id:
      return monadTestnet;
    default:
      return isMainnetAppEnv() ? base : baseSepolia;
  }
}

function resolveRpc(chainId: number): string {
  switch (chainId) {
    case mainnet.id:
      return (
        process.env.ETH_RPC_PRIVATE_URL ??
        process.env.NEXT_PUBLIC_ETH_MAINNET_RPC ??
        "https://ethereum-rpc.publicnode.com"
      );
    case sepolia.id:
      return (
        process.env.ETH_RPC_PRIVATE_URL ??
        process.env.NEXT_PUBLIC_ETH_SEPOLIA_RPC ??
        "https://ethereum-sepolia-rpc.publicnode.com"
      );
    case base.id:
      return (
        process.env.BASE_RPC_PRIVATE_URL ??
        process.env.NEXT_PUBLIC_BASE_RPC ??
        "https://mainnet.base.org"
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
    default:
      return "https://sepolia.base.org";
  }
}

export function getUsdcDeliveryChainId(preferredChainId?: number): number {
  if (preferredChainId && getUsdcAddress(preferredChainId)) {
    return preferredChainId;
  }
  return isMainnetAppEnv() ? base.id : baseSepolia.id;
}

export async function dispenseEvmUsdc(params: {
  chainId: number;
  targetAddress: string;
  usdcAmount: number;
  waitForReceipt?: boolean;
}): Promise<{ deliveryTxHash: Hash; chainId: number; confirmed: boolean }> {
  const recipient = params.targetAddress.trim();
  if (!isAddress(recipient)) {
    throw new Error("Invalid EVM target address");
  }
  if (!Number.isFinite(params.usdcAmount) || params.usdcAmount <= 0) {
    throw new Error("Invalid USDC amount");
  }

  const chainId = getUsdcDeliveryChainId(params.chainId);
  const usdcToken = getUsdcAddress(chainId);
  if (!usdcToken) {
    throw new Error(`USDC is not configured on chain ${chainId}`);
  }

  const chain = chainForId(chainId);
  const transport: Transport = isMonadTestnetChainId(chain.id)
    ? createMonadTestnetTransport()
    : http(resolveRpc(chainId));
  const account = privateKeyToAccount(getOperatorPrivateKey());
  const amountRaw = parseUnits(params.usdcAmount.toFixed(USDC_DECIMALS), USDC_DECIMALS);

  const publicClient = createPublicClient({ chain, transport });
  const walletClient = createWalletClient({ account, chain, transport });

  const [usdcBalance, nativeBalance] = await Promise.all([
    publicClient.readContract({
      address: usdcToken,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [account.address],
    }) as Promise<bigint>,
    publicClient.getBalance({ address: account.address }),
  ]);

  if (usdcBalance < amountRaw) {
    throw new Error(
      `USDC tank low (${chain.name}): have ${formatUnits(usdcBalance, USDC_DECIMALS)} USDC, need ${formatUnits(amountRaw, USDC_DECIMALS)}`,
    );
  }

  const gasPrice = await publicClient.getGasPrice();
  const minNative = gasPrice * 80_000n;
  if (nativeBalance < minNative) {
    throw new Error(
      `Need native gas on ${chain.name} to send USDC — have ${formatUnits(nativeBalance, 18)} ${chain.nativeCurrency.symbol}`,
    );
  }

  let deliveryTxHash: Hash;
  try {
    deliveryTxHash = await walletClient.writeContract({
      address: usdcToken as Address,
      abi: erc20Abi,
      functionName: "transfer",
      args: [recipient as Address, amountRaw],
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`USDC transfer failed (${chain.name}): ${detail}`);
  }

  if (params.waitForReceipt) {
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: deliveryTxHash,
      timeout: 120_000,
    });
    if (receipt.status !== "success") {
      throw new Error(`USDC transfer failed on ${chain.name}`);
    }
    return { deliveryTxHash, chainId, confirmed: true };
  }

  return { deliveryTxHash, chainId, confirmed: false };
}

export async function canDispenseEvmUsdc(
  chainId: number,
  usdcAmount: number,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (!Number.isFinite(usdcAmount) || usdcAmount <= 0) {
    return { ok: false, reason: "Invalid USDC amount" };
  }

  const resolvedChainId = getUsdcDeliveryChainId(chainId);
  const usdcToken = getUsdcAddress(resolvedChainId);
  if (!usdcToken) {
    return { ok: false, reason: `USDC not available on chain ${resolvedChainId}` };
  }

  const chain = chainForId(resolvedChainId);
  const transport: Transport = isMonadTestnetChainId(chain.id)
    ? createMonadTestnetTransport()
    : http(resolveRpc(resolvedChainId));
  const account = privateKeyToAccount(getOperatorPrivateKey());
  const amountRaw = parseUnits(usdcAmount.toFixed(USDC_DECIMALS), USDC_DECIMALS);
  const publicClient = createPublicClient({ chain, transport });

  const [usdcBalance, nativeBalance] = await Promise.all([
    publicClient.readContract({
      address: usdcToken,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [account.address],
    }) as Promise<bigint>,
    publicClient.getBalance({ address: account.address }),
  ]);

  if (usdcBalance < amountRaw) {
    return {
      ok: false,
      reason: `USDC tank low (${chain.name}): ${formatUnits(usdcBalance, USDC_DECIMALS)} available, ${formatUnits(amountRaw, USDC_DECIMALS)} required`,
    };
  }

  const gasPrice = await publicClient.getGasPrice();
  if (nativeBalance < gasPrice * 80_000n) {
    return {
      ok: false,
      reason: `Need ${chain.nativeCurrency.symbol} on ${chain.name} to pay for USDC transfer`,
    };
  }

  return { ok: true };
}
