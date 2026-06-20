import "server-only";

import type { Hash } from "viem";
import { decodeEventLog, formatUnits, parseAbiItem } from "viem";
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
import { getUsdcAddress } from "@config/evm-chains";
import { getServerCollectorAddress } from "@/config/operator-env";

const transferEvent = parseAbiItem(
  "event Transfer(address indexed from, address indexed to, uint256 value)",
);

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

export async function retryDepositFromTxHash(txHash: string) {
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

  const intent = findPendingIntentForDepositor(exact.from, evmChainId);
  if (!intent) {
    throw new Error("Bekleyen sipariş kaydı (intent) bulunamadı");
  }

  return runGasDispense({
    txHash,
    targetAsset: intent.targetAsset,
    targetAddress: intent.targetAddress,
    packageAmount: exact.packageUsd,
    depositorAddress: exact.from,
    intentId: intent.id,
  });
}
