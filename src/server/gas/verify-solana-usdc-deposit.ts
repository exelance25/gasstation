import "server-only";

import { Connection, PublicKey } from "@solana/web3.js";
import {
  getSolanaCollectorAddress,
  getSolanaDepositChainId,
  getSolanaRpcUrl,
  getSolanaUsdcMint,
} from "@/config/solana-usdc";
import { deriveAssociatedTokenAddress } from "@/lib/solana-spl-usdc";
import type { AmountOption } from "@/lib/pricing";

const MICRO_USDC = 1_000_000;

export type SolanaUsdcDepositVerification = {
  valid: true;
  from: string;
  amountMicro: bigint;
  treasury: string;
  chainId: number;
};

export type SolanaUsdcDepositFailure = {
  valid: false;
  reason: string;
};

export async function verifySolanaUsdcDeposit(params: {
  signature: string;
  packageUsd: AmountOption;
  depositorAddress?: string;
}): Promise<SolanaUsdcDepositVerification | SolanaUsdcDepositFailure> {
  const collector = getSolanaCollectorAddress();
  const mint = getSolanaUsdcMint();
  if (!collector) {
    return { valid: false, reason: "Solana collector yapılandırılmamış" };
  }

  const expectedMicro = BigInt(params.packageUsd) * BigInt(MICRO_USDC);
  const connection = new Connection(getSolanaRpcUrl(), "confirmed");
  const mintPk = new PublicKey(mint);
  const collectorPk = new PublicKey(collector);
  const collectorAta = await deriveAssociatedTokenAddress(collectorPk, mintPk);

  const tx = await connection.getParsedTransaction(params.signature, {
    maxSupportedTransactionVersion: 0,
    commitment: "confirmed",
  });

  if (!tx || tx.meta?.err) {
    return { valid: false, reason: "Solana işlemi bulunamadı veya başarısız" };
  }

  let matchedFrom: string | null = null;
  let matchedAmount = 0n;

  const inner = tx.meta?.innerInstructions ?? [];
  const topLevel = tx.transaction.message.instructions;

  const checkTransfer = (
    programId: string,
    parsed: { type?: string; info?: Record<string, unknown> } | null,
  ) => {
    if (!parsed || parsed.type !== "transfer") return;
    const info = parsed.info;
    if (!info) return;
    const dest = String(info.destination ?? "");
    const amount = BigInt(String(info.amount ?? "0"));
    const source = String(info.source ?? "");
    const authority = String(info.authority ?? info.owner ?? "");

    if (dest !== collectorAta.toBase58()) return;
    if (amount < expectedMicro) return;

    matchedFrom = authority || source;
    matchedAmount = amount;
  };

  for (const ix of topLevel) {
    if ("parsed" in ix && ix.program === "spl-token") {
      checkTransfer(ix.programId.toBase58(), ix.parsed as { type?: string; info?: Record<string, unknown> });
    }
  }

  for (const group of inner) {
    for (const ix of group.instructions) {
      if ("parsed" in ix && ix.program === "spl-token") {
        checkTransfer(ix.programId.toBase58(), ix.parsed as { type?: string; info?: Record<string, unknown> });
      }
    }
  }

  if (!matchedFrom || matchedAmount < expectedMicro) {
    return {
      valid: false,
      reason: `Treasury'ye $${params.packageUsd} Solana USDC transferi doğrulanamadı`,
    };
  }

  if (params.depositorAddress && matchedFrom !== params.depositorAddress) {
    return {
      valid: false,
      reason: "Depozit gönderen Solana cüzdanı eşleşmiyor",
    };
  }

  return {
    valid: true,
    from: matchedFrom,
    amountMicro: matchedAmount,
    treasury: collector,
    chainId: getSolanaDepositChainId(),
  };
}
