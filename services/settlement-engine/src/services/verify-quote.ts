import { getEnv } from "../config/env.js";
import type { SettleFeeRequest } from "../types/settlement.js";

export async function verifyQuoteWithEngine(
  quote: Pick<
    SettleFeeRequest,
    | "quoteId"
    | "chain"
    | "paymentToken"
    | "gasEstimateWei"
    | "paymentAmount"
    | "expiresAt"
    | "signature"
  >,
): Promise<{ valid: boolean; error?: string }> {
  const res = await fetch(`${getEnv().QUOTE_ENGINE_URL}/v1/quote/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(quote),
    signal: AbortSignal.timeout(10_000),
  });
  const body = (await res.json()) as { valid?: boolean; error?: string };
  if (!res.ok || !body.valid) {
    return { valid: false, error: body.error ?? "Quote doğrulanamadı" };
  }
  return { valid: true };
}
