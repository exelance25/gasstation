import "server-only";

import { type Address, type Hash } from "viem";
import { getLivePrices } from "@/lib/oracle/live-prices";
import {
  computeNativePaymentWei,
  nativePaySymbolForChain,
} from "@/lib/manual-payment";
import { roundPackageUsd, type AmountOption } from "@/lib/pricing";
import { getServerCollectorAddress } from "@/config/operator-env";
import { createDepositPublicClient } from "@/server/gas/verify-usdc-deposit";

export type NativeDepositVerification = {
  valid: true;
  from: Address;
  amountWei: bigint;
  treasury: Address;
  paySymbol: "ETH" | "BASE" | "MON";
};

export type NativeDepositFailure = {
  valid: false;
  reason: string;
};

export async function verifyNativeDeposit(params: {
  txHash: Hash;
  chainId: number;
  packageUsd: AmountOption;
  depositorAddress?: Address;
}): Promise<NativeDepositVerification | NativeDepositFailure> {
  const paySymbol = nativePaySymbolForChain(params.chainId);
  if (!paySymbol) {
    return { valid: false, reason: "Bu ağda native depozit desteklenmiyor" };
  }

  const treasury = getServerCollectorAddress();
  const prices = await getLivePrices();
  const packageUsd = roundPackageUsd(params.packageUsd);
  const expectedWei = computeNativePaymentWei(packageUsd, paySymbol, prices);
  const tolerance =
    process.env.NEXT_PUBLIC_APP_ENV === "mainnet" ? expectedWei / 100n : expectedWei / 20n;
  const minWei = expectedWei > tolerance ? expectedWei - tolerance : 0n;

  const client = createDepositPublicClient(params.chainId);
  const receipt = await client.getTransactionReceipt({ hash: params.txHash }).catch(() => null);
  if (!receipt || receipt.status !== "success") {
    return { valid: false, reason: "İşlem bulunamadı veya başarısız" };
  }

  const tx = await client.getTransaction({ hash: params.txHash }).catch(() => null);
  if (!tx) {
    return { valid: false, reason: "İşlem detayı alınamadı" };
  }

  if (tx.to?.toLowerCase() !== treasury.toLowerCase()) {
    return { valid: false, reason: "Treasury adresine native transfer bulunamadı" };
  }

  if (tx.value < minWei) {
    return {
      valid: false,
      reason: `Treasury'ye yeterli ${paySymbol} transferi doğrulanamadı`,
    };
  }

  const from = tx.from;
  if (
    params.depositorAddress &&
    from.toLowerCase() !== params.depositorAddress.toLowerCase()
  ) {
    return { valid: false, reason: "Depozit gönderen cüzdan eşleşmiyor" };
  }

  return {
    valid: true,
    from,
    amountWei: tx.value,
    treasury,
    paySymbol,
  };
}
