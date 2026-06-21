import "server-only";

import type { Hash } from "viem";
import type { GasDeliveryAsset } from "@/config/depot-assets";
import {
  isOperatorConfigured,
  isSolanaOperatorConfigured,
} from "@/config/operator-env";
import { getConservativeDispenseQuote } from "@/server/oracle/oracle-service";
import { assertProfitableDispense } from "@/lib/treasury-accounting";
import {
  resolveDepositChainId,
  verifyUsdcDeposit,
} from "@/server/gas/verify-usdc-deposit";
import { verifyNativeDeposit } from "@/server/gas/verify-native-deposit";
import { verifySolanaUsdcDeposit } from "@/server/gas/verify-solana-usdc-deposit";
import { dispenseEvmNativeGas } from "@/server/gas/dispense-evm-gas";
import { dispenseSolanaGas } from "@/server/gas/dispense-solana-gas";
import {
  getProcessedDeposit,
  isTxHashAlreadyProcessed,
  markDepositProcessed,
} from "@/server/gas/dispense-idempotency";
import { recordTreasuryDispense } from "@/server/gas/treasury-ledger";
import { markIntentConsumed } from "@/server/gas/pending-deposit-intents";
import {
  assertOrderMatchesDispense,
  markOrderDelivered,
  type GasOrder,
} from "@/server/gas/gas-order";
import type { AmountOption } from "@/lib/pricing";

function isSolanaSignature(sig: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{64,128}$/.test(sig);
}

export type RunGasDispenseInput = {
  txHash: string;
  targetAsset: GasDeliveryAsset;
  targetAddress: string;
  packageAmount: AmountOption;
  depositorAddress?: string;
  intentId?: string;
  orderId?: string;
  /** Retry — imzalı fiş / disk aranmaz, depozit zincirde doğrulanır */
  recoveryMode?: boolean;
};

export type RunGasDispenseResult = {
  ok: true;
  depositTxHash: string;
  deliveryTxHash: string;
  deliveryChainId?: number;
  targetAsset: GasDeliveryAsset;
  estimatedGasAmount: number;
  treasuryRetainedUsd?: number;
  message: string;
  idempotent?: boolean;
};

export async function runGasDispense(
  input: RunGasDispenseInput,
): Promise<RunGasDispenseResult> {
  const { txHash, targetAsset, targetAddress, packageAmount, depositorAddress, intentId, orderId, recoveryMode } =
    input;
  const ticketId = orderId ?? intentId;
  const isSolanaDeposit = isSolanaSignature(txHash);
  let depositChainId: number;

  if (isSolanaDeposit) {
    const solDeposit = await verifySolanaUsdcDeposit({
      signature: txHash,
      packageUsd: packageAmount,
      depositorAddress,
    });
    if (!solDeposit.valid) {
      throw new Error(solDeposit.reason);
    }
    depositChainId = solDeposit.chainId;
  } else {
    const evmChainId = await resolveDepositChainId(txHash as Hash);
    if (!evmChainId) {
      throw new Error("İşlem bulunamadı veya desteklenmeyen ağda");
    }
    depositChainId = evmChainId;
  }

  let order: GasOrder;
  if (recoveryMode) {
    order = {
      orderId: ticketId ?? `recovery-${txHash.slice(0, 18)}`,
      passId: "",
      targetAsset,
      targetAddress: targetAddress.trim(),
      packageAmount,
      depositChainId,
      depositorAddress: depositorAddress?.trim().toLowerCase() ?? "",
      paySymbol: "USDC",
      paymentMode: "usdc",
      status: "awaiting_payment",
      createdAt: Date.now(),
      expiresAt: Date.now() + 30 * 60 * 1000,
    };
  } else {
    order = assertOrderMatchesDispense(ticketId, {
      targetAsset,
      targetAddress,
      packageAmount,
      depositorAddress,
      depositChainId,
    });
  }

  if (order.status === "delivered" && order.deliveryTxHash) {
    return {
      ok: true,
      idempotent: true,
      depositTxHash: order.depositTxHash ?? txHash,
      deliveryTxHash: order.deliveryTxHash,
      targetAsset: order.targetAsset,
      estimatedGasAmount: 0,
      message: `Sipariş fişi zaten tamamlandı (${order.orderId})`,
    };
  }

  const idempotencyKey = isSolanaDeposit ? txHash : (txHash as Hash);

  if (isTxHashAlreadyProcessed(idempotencyKey)) {
    const prior = getProcessedDeposit(depositChainId, idempotencyKey);
    if (prior) {
      return {
        ok: true,
        idempotent: true,
        depositTxHash: txHash,
        deliveryTxHash: prior.deliveryTxHash,
        targetAsset,
        estimatedGasAmount: 0,
        message: "Bu depozit daha önce işlendi",
      };
    }
    throw new Error("Double Spend Attempt");
  }

  if (!isSolanaDeposit) {
    const usdcDeposit = await verifyUsdcDeposit({
      txHash: txHash as Hash,
      chainId: depositChainId,
      packageUsd: packageAmount,
      depositorAddress: depositorAddress as `0x${string}` | undefined,
    });
    if (!usdcDeposit.valid) {
      const nativeDeposit = await verifyNativeDeposit({
        txHash: txHash as Hash,
        chainId: depositChainId,
        packageUsd: packageAmount,
        depositorAddress: depositorAddress as `0x${string}` | undefined,
      });
      if (!nativeDeposit.valid) {
        throw new Error(nativeDeposit.reason || usdcDeposit.reason);
      }
    }
  }

  const quote = await getConservativeDispenseQuote(packageAmount, targetAsset);
  assertProfitableDispense(
    packageAmount,
    quote.estimatedGasAmount,
    targetAsset,
    quote.oracle,
  );

  if (targetAsset === "SOL") {
    if (!isSolanaOperatorConfigured()) {
      throw new Error("Solana operatör anahtarı yapılandırılmamış");
    }
    const { deliveryTxHash } = await dispenseSolanaGas({
      targetAddress: targetAddress.trim(),
      solAmount: quote.estimatedGasAmount,
    });
    markDepositProcessed(depositChainId, idempotencyKey, deliveryTxHash);
    if (intentId) {
      try {
        markIntentConsumed(intentId, txHash);
      } catch {
        /* ephemeral disk */
      }
    }
    markOrderDelivered(order.orderId, txHash, deliveryTxHash);
    const ledger = recordTreasuryDispense({
      depositTxHash: txHash,
      deliveryTxHash,
      depositChainId,
      packageUsd: packageAmount,
      targetAsset,
      targetAddress: targetAddress.trim(),
      estimatedGasAmount: quote.estimatedGasAmount,
    });
    return {
      ok: true,
      depositTxHash: txHash,
      deliveryTxHash,
      targetAsset,
      estimatedGasAmount: quote.estimatedGasAmount,
      treasuryRetainedUsd: ledger.treasuryRetainedUsd,
      message: "SOL gas teslim edildi",
    };
  }

  if (!isOperatorConfigured()) {
    throw new Error("EVM operatör anahtarı yapılandırılmamış");
  }

  const { deliveryTxHash, chainId: deliveryChainId } = await dispenseEvmNativeGas({
    targetAsset,
    targetAddress: targetAddress.trim(),
    nativeAmount: quote.estimatedGasAmount,
  });

  markDepositProcessed(depositChainId, idempotencyKey, deliveryTxHash);
  if (intentId) markIntentConsumed(intentId, txHash);
  markOrderDelivered(order.orderId, txHash, deliveryTxHash);
  const ledger = recordTreasuryDispense({
    depositTxHash: txHash,
    deliveryTxHash,
    depositChainId,
    packageUsd: packageAmount,
    targetAsset,
    targetAddress: targetAddress.trim(),
    estimatedGasAmount: quote.estimatedGasAmount,
  });

  return {
    ok: true,
    depositTxHash: txHash,
    deliveryTxHash,
    deliveryChainId,
    targetAsset,
    estimatedGasAmount: quote.estimatedGasAmount,
    treasuryRetainedUsd: ledger.treasuryRetainedUsd,
    message: `${targetAsset} gas teslim edildi`,
  };
}
