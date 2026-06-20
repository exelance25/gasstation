import { encodeAbiParameters, keccak256, type Hex } from "viem";
import { privateKeyToAccount, signMessage } from "viem/accounts";
import { getEnv } from "../config/env.js";

function getSignerKey(): Hex | null {
  const raw = getEnv().PRICE_SIGNER_PRIVATE_KEY?.trim();
  if (!raw || raw.length < 64) return null;
  return (raw.startsWith("0x") ? raw : `0x${raw}`) as Hex;
}

export function getSignerAddress(): string | null {
  const key = getSignerKey();
  if (!key) return null;
  return privateKeyToAccount(key).address;
}

export function buildQuoteDigest(params: {
  quoteId: string;
  chain: string;
  paymentToken: string;
  gasEstimateWei: string;
  paymentAmount: string;
  expiresAt: string;
}): Hex {
  return keccak256(
    encodeAbiParameters(
      [
        { type: "string" },
        { type: "string" },
        { type: "string" },
        { type: "uint256" },
        { type: "uint256" },
        { type: "uint256" },
      ],
      [
        params.quoteId,
        params.chain,
        params.paymentToken,
        BigInt(params.gasEstimateWei),
        BigInt(params.paymentAmount),
        BigInt(Math.floor(new Date(params.expiresAt).getTime() / 1000)),
      ],
    ),
  );
}

export async function signFeeQuote(params: {
  quoteId: string;
  chain: string;
  paymentToken: string;
  gasEstimateWei: string;
  paymentAmount: string;
  expiresAt: string;
}): Promise<Hex | null> {
  const key = getSignerKey();
  if (!key) return null;
  const digest = buildQuoteDigest(params);
  return signMessage({ privateKey: key, message: { raw: digest } });
}
