import { NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit, getClientIp } from "@/server/security/rate-limit-store";

const QUOTE_ENGINE_URL =
  process.env.QUOTE_ENGINE_URL ?? "http://localhost:4100";

const bodySchema = z.object({
  quoteId: z.string().uuid(),
  chain: z.string(),
  paymentToken: z.enum(["ETH", "MON", "BASE", "SOL"]),
  gasEstimateWei: z.string().regex(/^\d+$/),
  paymentAmount: z.string().regex(/^\d+$/),
  expiresAt: z.string(),
  signature: z.string().regex(/^0x[0-9a-fA-F]+$/),
});

export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (!checkRateLimit("quote-verify", ip, 60)) {
    return NextResponse.json({ error: "Çok fazla istek" }, { status: 429 });
  }

  try {
    const body = bodySchema.parse(await request.json());
    const res = await fetch(`${QUOTE_ENGINE_URL}/v1/quote/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Doğrulama başarısız";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
