import "server-only";

import type { Hash } from "viem";
import { decodeEventLog, formatUnits, parseAbiItem } from "viem";
import type { GasDeliveryAsset } from "@/config/depot-assets";
import type { AmountOption } from "@/lib/pricing";
import {
  createDepositPublicClient,
  resolveDepositChainId,
} from "@/server/gas/verify-usdc-deposit";
import {
  getProcessedDeposit,
  isTxHashAlreadyProcessed,
} from "@/server/gas/dispense-idempotency";
import { findPendingIntentForDepositor } from "@/server/gas/pending-deposit-intents";
import { runGasDispense } from "@/server/gas/run-gas-dispense";
import { getGasOrder } from "@/server/gas/gas-order";
import { getUsdcAddress } from "@config/evm-chains";
import { getServerCollectorAddress } from "@/config/operator-env";

const transferEvent = parseAbiItem(
  "event Transfer(address indexed from, address indexed to, uint256 value)",
);

export type RetryDispenseParams = {
  txHash: string;
  orderId?: string;
  targetAsset?: GasDeliveryAsset;
  targetAddress?: string;
  packageAmount?: AmountOption;
  depositorAddress?: string;
};

async function readExactUsdcDeposit(
  txHash: Hash,
  chainId: number,
): Promise<{ from: string; packageUsd: number } | null> {
  const usdc = getUsdcAddress(chainId);
  if (!usdc) return null;
  const treasury = getServerCollectorAddress();
  const client = createDepositPublicClient(chainId);
  const receipt = await client.getTransactionReceipt({ hash: txHash }).catch(() => null);
  if (!receipt || receipt.status !== "success") return null;

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
      return { from, packageUsd: Number(formatUnits(value, 6)) };
    } catch {
      continue;
    }
  }
  return null;
}

export async function retryDepositFromTxHash(params: RetryDispenseParams) {
  const { txHash } = params;
  const evmChainId = await resolveDepositChainId(txHash as Hash);
  if (!evmChainId) {
    throw new Error("İşlem bulunamadı veya desteklenmeyen ağda");
  }

  if (isTxHashAlreadyProcessed(txHash)) {
    const prior = getProcessedDeposit(evmChainId, txHash);
    if (prior) {
      return {
        ok: true as const,
        idempotent: true,
        depositTxHash: txHash,
        deliveryTxHash: prior.deliveryTxHash,
        message: "Bu depozit zaten işlendi",
      };
    }
  }

  const exact = await readExactUsdcDeposit(txHash as Hash, evmChainId);
  if (!exact) {
    throw new Error("Treasury USDC transferi okunamadı");
  }

  if (params.orderId) {
    const order = getGasOrder(params.orderId);
    if (order) {
      return runGasDispense({
        txHash,
        targetAsset: order.targetAsset,
        targetAddress: order.targetAddress,
        packageAmount: order.packageAmount,
        depositorAddress: order.depositorAddress,
        orderId: params.orderId,
        recoveryMode: true,
      });
    }
  }

  if (
    params.targetAsset &&
    params.targetAddress &&
    params.packageAmount != null &&
    params.depositorAddress
  ) {
    return runGasDispense({
      txHash,
      targetAsset: params.targetAsset,
      targetAddress: params.targetAddress,
      packageAmount: params.packageAmount,
      depositorAddress: params.depositorAddress,
      orderId: params.orderId,
      recoveryMode: true,
    });
  }

  const intent = findPendingIntentForDepositor(exact.from, evmChainId);
  if (intent) {
    return runGasDispense({
      txHash,
      targetAsset: intent.targetAsset,
      targetAddress: intent.targetAddress,
      packageAmount: exact.packageUsd as AmountOption,
      depositorAddress: exact.from,
      intentId: intent.id,
      recoveryMode: true,
    });
  }

  throw new Error(
    "Sipariş fişi bulunamadı — sayfayı yenileyip tekrar deneyin veya destek ile tx hash paylaşın",
  );
}
