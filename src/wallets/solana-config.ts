"use client";

import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { SolflareWalletAdapter } from "@solana/wallet-adapter-solflare";
import type { WalletAdapter } from "@solana/wallet-adapter-base";
import type { AppEnv } from "@/types";
import { clientEnv } from "@/config/client-env";

export const SOLANA_WALLET_STORAGE_KEY = "gasstation_sol_wallet";

export function getSolanaConnection(env: AppEnv): string {
  const isProd = env === "mainnet";
  return isProd ? clientEnv.NEXT_PUBLIC_SOLANA_MAINNET_RPC : clientEnv.NEXT_PUBLIC_SOLANA_DEVNET_RPC;
}

/** Onay akışı phantom-hybrid.ts içinde — adapter sade tutulur */
export function getSolanaWallets(): WalletAdapter[] {
  return [new PhantomWalletAdapter(), new SolflareWalletAdapter()];
}
