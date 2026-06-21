import "server-only";

import type { Hash } from "viem";
import type { GasDeliveryAsset } from "@/config/depot-assets";
import type { AmountOption } from "@/lib/pricing";
import { resolveDepositChainId } from "@/server/gas/verify-usdc-deposit";
import {
  getProcessedDeposit,
  isTxHashAlreadyProcessed,
} from "@/server/gas/dispense-idempotency";
import { findPendingIntentForDepositor } from "@/server/gas/pending-deposit-intents";
import { runGasDispense } from "@/server/gas/run-gas-dispense";
import { getGasOrder } from "@/server/gas/gas-order";
import {
  readAnyTreasuryDepositFromTx,
  readExactUsdcDepositFromTx,
  resolvePackageUsdForNativeDeposit,
} from "@/server/gas/read-deposit-from-tx";

export type RetryDispenseParams = {
  txHash: string;
  orderId?: string;
  targetAsset?: GasDeliveryAsset;
  targetAddress?: string;
  packageAmount?: AmountOption;
  depositorAddress?: string;
};

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
        paymentMode: order.paymentMode,
      });
    }
  }

  if (
    params.targetAsset &&
    params.targetAddress &&
    params.packageAmount != null &&
    params.depositorAddress
  ) {
    const deposit = await readAnyTreasuryDepositFromTx(txHash as Hash, evmChainId);
    const packageAmount =
      deposit?.kind === "native"
        ? (
            await resolvePackageUsdForNativeDeposit({
              txHash: txHash as Hash,
              chainId: evmChainId,
              hintedPackageUsd: params.packageAmount,
            })
          )?.packageUsd ?? params.packageAmount
        : params.packageAmount;

    return runGasDispense({
      txHash,
      targetAsset: params.targetAsset,
      targetAddress: params.targetAddress,
      packageAmount,
      depositorAddress: params.depositorAddress,
      orderId: params.orderId,
      recoveryMode: true,
      paymentMode: deposit?.kind === "native" ? "native" : "usdc",
    });
  }

  const deposit = await readAnyTreasuryDepositFromTx(txHash as Hash, evmChainId);
  if (!deposit) {
    throw new Error("Treasury transferi okunamadı (USDC veya native)");
  }

  if (deposit.kind === "usdc") {
    const intent = findPendingIntentForDepositor(deposit.from, evmChainId);
    if (intent) {
      return runGasDispense({
        txHash,
        targetAsset: intent.targetAsset,
        targetAddress: intent.targetAddress,
        packageAmount: deposit.packageUsd,
        depositorAddress: deposit.from,
        intentId: intent.id,
        recoveryMode: true,
        paymentMode: "usdc",
      });
    }
  }

  if (deposit.kind === "native") {
    const resolved = await resolvePackageUsdForNativeDeposit({
      txHash: txHash as Hash,
      chainId: evmChainId,
    });
    if (resolved) {
      const intent = findPendingIntentForDepositor(resolved.from, evmChainId);
      if (intent) {
        return runGasDispense({
          txHash,
          targetAsset: intent.targetAsset,
          targetAddress: intent.targetAddress,
          packageAmount: resolved.packageUsd,
          depositorAddress: resolved.from,
          intentId: intent.id,
          recoveryMode: true,
          paymentMode: "native",
        });
      }
    }
  }

  const usdcOnly = await readExactUsdcDepositFromTx(txHash as Hash, evmChainId);
  if (usdcOnly) {
    throw new Error(
      "Sipariş fişi bulunamadı — sayfayı yenileyip tekrar deneyin veya destek ile tx hash paylaşın",
    );
  }

  throw new Error(
    "Native depozit bulundu ancak teslimat bilgisi eksik — hedef adres ve MON/ETH seçimi ile tekrar deneyin",
  );
}
