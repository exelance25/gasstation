import { randomUUID } from "node:crypto";
import { getSolanaCollectorAddress } from "@/config/solana-usdc";
import { getCollectorAddress } from "@/lib/treasury-config";
import {
  buildLocalFeeQuote,
  type PaymentToken,
  type SupportedChain,
} from "@/server/quote/local-fee-quote";

const CHAIN_MAP: Record<number, SupportedChain> = {
  1: "ethereum",
  11155111: "ethereum-sepolia",
  8453: "base",
  84532: "base-sepolia",
  143: "monad",
  10143: "monad-testnet",
  900001: "solana-devnet",
};

const DEFAULT_GAS_ESTIMATE_WEI = String(21_000n * 50_000_000_000n);

export type LocalSponsorPrepareRequest = {
  userAddress: string;
  chainId: number;
  intentId: string;
  gasEstimateWei?: string;
  paymentToken?: PaymentToken;
};

export type LocalSponsorPrepareResponse = {
  sponsorshipId: string;
  status: "quote_ready";
  quote: Awaited<ReturnType<typeof buildLocalFeeQuote>>;
  treasuryAddress: string | null;
  message: string;
};

/** Settlement Engine kapalıyken yerel sponsor hazırlığı */
export async function buildLocalSponsorPrepare(
  req: LocalSponsorPrepareRequest,
): Promise<LocalSponsorPrepareResponse> {
  const chain = CHAIN_MAP[req.chainId] ?? "ethereum-sepolia";
  const paymentToken = req.paymentToken ?? "ETH";

  const quote = await buildLocalFeeQuote({
    chain,
    paymentToken,
    gasEstimateWei: req.gasEstimateWei ?? DEFAULT_GAS_ESTIMATE_WEI,
    userAddress: req.userAddress,
  });

  const isSolana = chain.startsWith("solana");
  const treasuryAddress = isSolana
    ? (getSolanaCollectorAddress() ?? null)
    : (getCollectorAddress() ?? null);

  return {
    sponsorshipId: `sponsor_${req.intentId}_${randomUUID().slice(0, 8)}`,
    status: "quote_ready",
    quote,
    treasuryAddress,
    message: "Ödeme quote hazır — yerel oracle yedek (Settlement Engine kapalı)",
  };
}
