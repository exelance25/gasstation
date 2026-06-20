import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import bs58 from "bs58";
import { getEnv } from "../config/env.js";

function getConnection(): Connection {
  const rpc = getEnv().SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
  return new Connection(rpc, "confirmed");
}

function getSolanaKeypair(): Keypair {
  const raw = getEnv().SOLANA_PRIVATE_KEY?.trim();
  if (!raw) throw new Error("SOLANA_PRIVATE_KEY yapılandırılmamış");
  try {
    if (raw.startsWith("[")) {
      return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(raw)));
    }
    return Keypair.fromSecretKey(bs58.decode(raw));
  } catch {
    throw new Error("Geçersiz SOLANA_PRIVATE_KEY formatı");
  }
}

export async function sendSolanaGas(params: {
  to: string;
  amountSol: number;
}): Promise<string> {
  const connection = getConnection();
  const payer = getSolanaKeypair();
  const to = new PublicKey(params.to);
  const lamports = Math.floor(params.amountSol * LAMPORTS_PER_SOL);

  const tx = new Transaction().add(
    SystemProgram.transfer({ fromPubkey: payer.publicKey, toPubkey: to, lamports }),
  );
  const sig = await sendAndConfirmTransaction(connection, tx, [payer], {
    commitment: "confirmed",
  });
  return sig;
}

export async function getSolanaBalance(): Promise<number> {
  const connection = getConnection();
  const key = getEnv().SOLANA_PRIVATE_KEY?.trim();
  if (!key) return 0;
  try {
    const payer = getSolanaKeypair();
    const lamports = await connection.getBalance(payer.publicKey);
    return lamports / LAMPORTS_PER_SOL;
  } catch {
    return 0;
  }
}
