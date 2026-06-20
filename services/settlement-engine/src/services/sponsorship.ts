import { randomUUID } from "node:crypto";
import type { SponsorshipPrepareRequest, SponsorshipPrepareResponse } from "../types/settlement.js";
import { getEnv, getTreasuryEvm } from "../config/env.js";
import { getSolanaTreasury } from "./solana-payment.js";

const CHAIN_MAP: Record<number, string> = {
  1: "ethereum",
  11155111: "ethereum-sepolia",
  8453: "base",
  84532: "base-sepolia",
  143: "monad",
  10143: "monad-testnet",
};

export async function prepareSponsorship(
  req: SponsorshipPrepareRequest,
): Promise<SponsorshipPrepareResponse> {
  const chain = CHAIN_MAP[req.chainId] ?? "ethereum-sepolia";
  const gasWei = req.gasEstimateWei ?? String(21_000n * 50_000_000_000n);
  const paymentToken = req.paymentToken ?? "ETH";

  const res = await fetch(`${getEnv().QUOTE_ENGINE_URL}/v1/quote/fee`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chain,
      paymentToken,
      gasEstimateWei: gasWei,
      userAddress: req.userAddress,
    }),
    signal: AbortSignal.timeout(10_000),
  });

  const quote = await res.json();
  if (!res.ok) {
    throw new Error((quote as { error?: string }).error ?? "Quote alınamadı");
  }

  const isSolana = chain.startsWith("solana");
  const treasuryAddress = isSolana
    ? (getSolanaTreasury()?.toBase58() ?? null)
    : getTreasuryEvm();

  return {
    sponsorshipId: `sponsor_${req.intentId}_${randomUUID().slice(0, 8)}`,
    status: "quote_ready",
    quote,
    treasuryAddress,
    message: "Ödeme quote hazır — treasury'ye transfer sonrası settle çağırın",
  };
}
