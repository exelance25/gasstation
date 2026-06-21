import "server-only";

import {
  createPublicClient,
  createWalletClient,
  formatEther,
  http,
  isAddress,
  parseEther,
  type Address,
  type Chain,
  type Hash,
  type Transport,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base, baseSepolia, mainnet, sepolia } from "viem/chains";
import { monadMainnet, monadTestnet } from "@config/evm-chains";
import { getOperatorPrivateKey } from "@/config/operator-env";
import type { GasDeliveryAsset } from "@/config/depot-assets";
import {
  formatMonadReserveHint,
  getMonadMinOperatorBalanceWei,
  isMonadChain,
} from "@/lib/monad-reserve";
import { createMonadTestnetTransport, isMonadTestnetChainId } from "@/lib/monad-rpc";

import { isMainnetAppEnv } from "@/lib/app-env";

export function getDeliveryChain(asset: GasDeliveryAsset): Chain {
  switch (asset) {
    case "MON":
      return isMainnetAppEnv() ? monadMainnet : monadTestnet;
    case "BASE":
      return isMainnetAppEnv() ? base : baseSepolia;
    case "ETH":
      return isMainnetAppEnv() ? mainnet : sepolia;
    default:
      return isMainnetAppEnv() ? mainnet : sepolia;
  }
}

function resolveDeliveryRpc(chain: Chain): string {
  switch (chain.id) {
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
      throw new Error(`Teslimat RPC yok — chain ${chain.id}`);
  }
}

export async function dispenseEvmNativeGas(params: {
  targetAsset: GasDeliveryAsset;
  targetAddress: string;
  nativeAmount: number;
  /** false = tx hash hemen döner (hızlı UX); true = receipt bekler */
  waitForReceipt?: boolean;
}): Promise<{ deliveryTxHash: Hash; chainId: number; confirmed: boolean }> {
  if (params.targetAsset === "SOL") {
    throw new Error("SOL teslimatı EVM fonksiyonu ile yapılamaz");
  }

  const recipient = params.targetAddress.trim();
  if (!isAddress(recipient)) {
    throw new Error("Geçersiz EVM hedef adresi");
  }

  if (!Number.isFinite(params.nativeAmount) || params.nativeAmount <= 0) {
    throw new Error("Geçersiz gas miktarı");
  }

  const chain = getDeliveryChain(params.targetAsset);
  const transport: Transport = isMonadTestnetChainId(chain.id)
    ? createMonadTestnetTransport()
    : http(resolveDeliveryRpc(chain));
  const account = privateKeyToAccount(getOperatorPrivateKey());
  const valueWei = parseEther(params.nativeAmount.toFixed(18));

  const publicClient = createPublicClient({ chain, transport });
  const walletClient = createWalletClient({
    account,
    chain,
    transport,
  });

  const operatorBalance = await publicClient.getBalance({ address: account.address });

  if (isMonadChain(chain) && isMainnetAppEnv()) {
    const minBalance = getMonadMinOperatorBalanceWei(valueWei);
    if (operatorBalance < minBalance) {
      throw new Error(formatMonadReserveHint(operatorBalance, valueWei));
    }
  }

  const sendParams: {
    to: Address;
    value: bigint;
    gas?: bigint;
    gasPrice?: bigint;
    type?: "legacy";
  } = {
    to: recipient as Address,
    value: valueWei,
  };

  const gasPrice = await publicClient.getGasPrice();
  const gasLimit = isMonadChain(chain) ? 50_000n : 21_000n;
  const txCostReserve = gasPrice * gasLimit * 3n;

  if (operatorBalance < valueWei + txCostReserve) {
    throw new Error(
      `Operatör likiditesi yetersiz (${chain.name}) — ${formatEther(operatorBalance)} ${chain.nativeCurrency.symbol} var, ~${formatEther(valueWei + txCostReserve)} gerekli (gas+transfer)`,
    );
  }

  if (isMonadChain(chain)) {
    sendParams.gas = gasLimit;
    sendParams.gasPrice = gasPrice;
    sendParams.type = "legacy";
  }

  let deliveryTxHash: Hash;
  try {
    deliveryTxHash = await walletClient.sendTransaction(sendParams);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`Gas transferi gönderilemedi (${chain.name}): ${detail}`);
  }

  if (params.waitForReceipt) {
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: deliveryTxHash,
      timeout: 120_000,
    });

    if (receipt.status !== "success") {
      throw new Error(`${chain.name} üzerinde gas transferi başarısız`);
    }
    return { deliveryTxHash, chainId: chain.id, confirmed: true };
  }

  return { deliveryTxHash, chainId: chain.id, confirmed: false };
}

export async function canDispenseEvmNativeGas(
  targetAsset: Exclude<GasDeliveryAsset, "SOL">,
  nativeAmount: number,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (!Number.isFinite(nativeAmount) || nativeAmount <= 0) {
    return { ok: false, reason: "Geçersiz gas miktarı" };
  }
  const chain = getDeliveryChain(targetAsset);
  const transport: Transport = isMonadTestnetChainId(chain.id)
    ? createMonadTestnetTransport()
    : http(resolveDeliveryRpc(chain));
  const account = privateKeyToAccount(getOperatorPrivateKey());
  const valueWei = parseEther(nativeAmount.toFixed(18));
  const publicClient = createPublicClient({ chain, transport });
  const operatorBalance = await publicClient.getBalance({ address: account.address });

  const gasPrice = await publicClient.getGasPrice();
  const gasLimit = isMonadChain(chain) ? 50_000n : 21_000n;
  const totalNeeded = valueWei + gasPrice * gasLimit * 3n;

  if (operatorBalance < totalNeeded) {
    return {
      ok: false,
      reason: `Gas tankı boş (${chain.name}): kasada ${formatEther(operatorBalance)} ${chain.nativeCurrency.symbol}, gerekli ~${formatEther(totalNeeded)} ${targetAsset}`,
    };
  }
  if (isMonadChain(chain) && isMainnetAppEnv()) {
    const minBalance = getMonadMinOperatorBalanceWei(valueWei);
    if (operatorBalance < minBalance) {
      return { ok: false, reason: formatMonadReserveHint(operatorBalance, valueWei) };
    }
  }
  return { ok: true };
}
