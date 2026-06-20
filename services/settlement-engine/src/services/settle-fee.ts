import { randomUUID } from "node:crypto";
import type { SettleFeeRequest, SettleFeeResponse } from "../types/settlement.js";
import { verifyQuoteWithEngine } from "./verify-quote.js";
import {
  deliverNativeGas,
  gasAmountFromQuote,
  parsePaymentAmountWei,
  verifyNativePayment,
} from "./payment-and-delivery.js";
import {
  deliverSolanaGas,
  lamportsFromPaymentAmount,
  verifySolanaNativePayment,
} from "./solana-payment.js";
import {
  createSettlement,
  isPaymentTxUsed,
  markPaymentTxUsed,
  updateSettlement,
} from "../store/settlements.js";

const EVM_NATIVE_TOKENS = new Set(["ETH", "BASE", "MON"]);
const SOLANA_CHAINS = new Set(["solana", "solana-devnet"]);

function isSolanaChain(chain: string): boolean {
  return SOLANA_CHAINS.has(chain);
}

export async function settleFee(req: SettleFeeRequest): Promise<SettleFeeResponse> {
  const settlementId = randomUUID();

  if (isPaymentTxUsed(req.paymentTxHash)) {
    throw new Error("Bu ödeme işlemi zaten kullanıldı");
  }

  const quoteCheck = await verifyQuoteWithEngine(req);
  if (!quoteCheck.valid) {
    throw new Error(quoteCheck.error ?? "Quote geçersiz");
  }

  if (req.paymentToken === "SOL") {
    if (!isSolanaChain(req.chain)) {
      throw new Error("SOL ödemesi yalnızca Solana ağlarında");
    }
    const expectedLamports = lamportsFromPaymentAmount(req.paymentAmount);
    const paymentOk = await verifySolanaNativePayment({
      signature: req.paymentTxHash,
      payerAddress: req.payerAddress,
      expectedLamports,
    });
    if (!paymentOk.valid) {
      throw new Error(paymentOk.reason ?? "Solana ödemesi doğrulanamadı");
    }
  } else if (EVM_NATIVE_TOKENS.has(req.paymentToken)) {
    if (isSolanaChain(req.chain)) {
      throw new Error("EVM token ödemesi Solana zincirinde yapılamaz");
    }
    const expectedWei = parsePaymentAmountWei(req.paymentAmount);
    const paymentOk = await verifyNativePayment({
      chain: req.chain,
      paymentTxHash: req.paymentTxHash,
      payerAddress: req.payerAddress,
      expectedAmountWei: expectedWei,
    });
    if (!paymentOk.valid) {
      throw new Error(paymentOk.reason ?? "Ödeme doğrulanamadı");
    }
  } else {
    throw new Error("Desteklenmeyen ödeme tokeni");
  }

  markPaymentTxUsed(req.paymentTxHash);

  createSettlement({
    settlementId,
    quoteId: req.quoteId,
    status: "PAYMENT_VERIFIED",
    paymentTxHash: req.paymentTxHash,
    deliveryTxHash: null,
    payerAddress: req.payerAddress,
    beneficiaryAddress: req.beneficiaryAddress,
  });

  try {
    const gasNative = gasAmountFromQuote(req.gasEstimateWei);
    let deliveryTxHash: string;

    if (isSolanaChain(req.chain) || req.paymentToken === "SOL") {
      deliveryTxHash = await deliverSolanaGas({
        beneficiaryAddress: req.beneficiaryAddress,
        solAmount: gasNative,
      });
    } else {
      deliveryTxHash = await deliverNativeGas({
        chain: req.chain,
        beneficiaryAddress: req.beneficiaryAddress,
        gasAmountNative: gasNative,
      });
    }

    updateSettlement(settlementId, {
      status: "GAS_DELIVERED",
      deliveryTxHash,
    });

    return {
      settlementId,
      quoteId: req.quoteId,
      status: "GAS_DELIVERED",
      paymentTxHash: req.paymentTxHash,
      deliveryTxHash,
      beneficiaryAddress: req.beneficiaryAddress,
      gasDeliveredWei: req.gasEstimateWei,
      message: "Gas teslim edildi",
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Teslimat başarısız";
    updateSettlement(settlementId, { status: "FAILED", failureReason: message });
    throw new Error(message);
  }
}
