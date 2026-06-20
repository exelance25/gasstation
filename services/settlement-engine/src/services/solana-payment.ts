import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
} from "@solana/web3.js";
import { getEnv } from "../config/env.js";

function getSolanaRpc(): string {
  const env = getEnv();
  return (
    env.SOLANA_RPC_URL ??
    (env.APP_ENV === "mainnet"
      ? "https://api.mainnet-beta.solana.com"
      : "https://api.devnet.solana.com")
  );
}

export function getSolanaTreasury(): PublicKey | null {
  const raw = getEnv().SOLANA_TREASURY_ADDRESS?.trim();
  if (!raw) return null;
  try {
    return new PublicKey(raw);
  } catch {
    return null;
  }
}

export async function verifySolanaNativePayment(params: {
  signature: string;
  payerAddress: string;
  expectedLamports: bigint;
}): Promise<{ valid: boolean; reason?: string }> {
  const treasury = getSolanaTreasury();
  if (!treasury) {
    return { valid: false, reason: "SOLANA_TREASURY_ADDRESS yapılandırılmamış" };
  }

  let payer: PublicKey;
  try {
    payer = new PublicKey(params.payerAddress.trim());
  } catch {
    return { valid: false, reason: "Geçersiz Solana ödeme adresi" };
  }

  const connection = new Connection(getSolanaRpc(), "confirmed");
  const tx = await connection.getTransaction(params.signature, {
    maxSupportedTransactionVersion: 0,
  });

  if (!tx?.meta || tx.meta.err) {
    return { valid: false, reason: "Solana ödeme işlemi başarısız" };
  }

  const accountKeys = tx.transaction.message.getAccountKeys().staticAccountKeys;
  const payerIndex = accountKeys.findIndex((k) => k.equals(payer));
  if (payerIndex < 0) {
    return { valid: false, reason: "Ödeme gönderen bulunamadı" };
  }

  const treasuryIndex = accountKeys.findIndex((k) => k.equals(treasury));
  if (treasuryIndex < 0) {
    return { valid: false, reason: "Ödeme GASSTATION Solana kasasına gitmedi" };
  }

  const pre = tx.meta.preBalances[treasuryIndex] ?? 0;
  const post = tx.meta.postBalances[treasuryIndex] ?? 0;
  const received = BigInt(post - pre);

  if (received < params.expectedLamports) {
    return { valid: false, reason: "Solana ödeme tutarı yetersiz" };
  }

  return { valid: true };
}

export function lamportsFromPaymentAmount(amountWei: string): bigint {
  return BigInt(amountWei);
}

export async function deliverSolanaGas(params: {
  beneficiaryAddress: string;
  solAmount: number;
}): Promise<string> {
  const key = getEnv().SOLANA_PRIVATE_KEY?.trim();
  if (!key) throw new Error("SOLANA_PRIVATE_KEY yapılandırılmamış");

  const { Keypair, Transaction, sendAndConfirmTransaction } = await import(
    "@solana/web3.js"
  );
  const bs58 = await import("bs58");

  const secret = key.startsWith("[")
    ? Uint8Array.from(JSON.parse(key) as number[])
    : bs58.default.decode(key);
  const payer = Keypair.fromSecretKey(secret);
  const connection = new Connection(getSolanaRpc(), "confirmed");
  const to = new PublicKey(params.beneficiaryAddress);
  const lamports = Math.floor(params.solAmount * LAMPORTS_PER_SOL);

  const tx = new Transaction().add(
    SystemProgram.transfer({ fromPubkey: payer.publicKey, toPubkey: to, lamports }),
  );
  return sendAndConfirmTransaction(connection, tx, [payer], { commitment: "confirmed" });
}
