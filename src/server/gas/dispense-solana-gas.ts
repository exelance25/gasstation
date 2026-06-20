import "server-only";

import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { getSolanaPrivateKeyRaw } from "@/config/operator-env";

function isMainnetEnv(): boolean {
  return process.env.NEXT_PUBLIC_APP_ENV === "mainnet";
}

function getSolanaRpcUrl(): string {
  return isMainnetEnv()
    ? (process.env.SOLANA_RPC_PRIVATE_URL ??
        process.env.NEXT_PUBLIC_SOLANA_MAINNET_RPC ??
        "https://api.mainnet-beta.solana.com")
    : (process.env.SOLANA_RPC_PRIVATE_URL ??
        process.env.NEXT_PUBLIC_SOLANA_DEVNET_RPC ??
        "https://api.devnet.solana.com");
}

async function decodeSecretKey(raw: string): Promise<Uint8Array> {
  const trimmed = raw.trim();
  if (trimmed.startsWith("[")) {
    const parsed = JSON.parse(trimmed) as number[];
    return Uint8Array.from(parsed);
  }

  const bs58 = await import("bs58");
  return bs58.default.decode(trimmed);
}

export async function dispenseSolanaGas(params: {
  targetAddress: string;
  solAmount: number;
}): Promise<{ deliveryTxHash: string }> {
  const recipient = params.targetAddress.trim();
  if (!recipient) {
    throw new Error("Geçersiz Solana hedef adresi");
  }

  if (!Number.isFinite(params.solAmount) || params.solAmount <= 0) {
    throw new Error("Geçersiz SOL miktarı");
  }

  let toPubkey: PublicKey;
  try {
    toPubkey = new PublicKey(recipient);
  } catch {
    throw new Error("Solana PublicKey parse edilemedi");
  }

  const secret = await decodeSecretKey(getSolanaPrivateKeyRaw());
  const keypair = Keypair.fromSecretKey(secret);
  const connection = new Connection(getSolanaRpcUrl(), "confirmed");

  const lamports = BigInt(Math.floor(params.solAmount * LAMPORTS_PER_SOL));
  if (lamports <= 0n) {
    throw new Error("SOL lamports hesaplanamadı");
  }

  const operatorBalance = await connection.getBalance(keypair.publicKey);
  if (BigInt(operatorBalance) < lamports) {
    throw new Error("Solana operatör likiditesi yetersiz — SOL gönderilemedi");
  }

  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: keypair.publicKey,
      toPubkey,
      lamports: Number(lamports),
    }),
  );

  const deliveryTxHash = await sendAndConfirmTransaction(connection, tx, [keypair], {
    commitment: "confirmed",
  });

  return { deliveryTxHash };
}

export async function canDispenseSolanaGas(
  solAmount: number,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (!Number.isFinite(solAmount) || solAmount <= 0) {
    return { ok: false, reason: "Geçersiz SOL miktarı" };
  }
  const secret = await decodeSecretKey(getSolanaPrivateKeyRaw());
  const keypair = Keypair.fromSecretKey(secret);
  const connection = new Connection(getSolanaRpcUrl(), "confirmed");
  const lamports = BigInt(Math.floor(solAmount * LAMPORTS_PER_SOL));
  if (lamports <= 0n) {
    return { ok: false, reason: "SOL lamports hesaplanamadı" };
  }
  const operatorBalance = await connection.getBalance(keypair.publicKey);
  if (BigInt(operatorBalance) < lamports) {
    return { ok: false, reason: "Solana operatör likiditesi yetersiz" };
  }
  return { ok: true };
}
