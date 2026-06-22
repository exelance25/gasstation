import { NextResponse } from "next/server";
import { z } from "zod";
import { buildGasQuote } from "@/server/quote/gas-quoter";
import { checkRateLimit, getClientIp } from "@/server/security/rate-limit-store";

const bodySchema = z.object({
  deliveryAsset: z.enum(["ETH", "MON", "BASE", "SOL", "USDC"]),
  paymentToken: z.enum(["USDC", "MON", "BASE", "ETH", "DAI"]),
  gasEstimateWei: z.string().regex(/^\d+$/),
  depositChainId: z.number().int().positive().optional(),
});

/** Layer 2 — Quoter API */
export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (!checkRateLimit("quote-gas", ip, 80)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    const quote = await buildGasQuote(parsed.data);
    return NextResponse.json(quote);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Quote failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
