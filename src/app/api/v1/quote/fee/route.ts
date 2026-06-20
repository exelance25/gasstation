import { NextResponse } from "next/server";

import { z } from "zod";

import { buildLocalFeeQuote } from "@/server/quote/local-fee-quote";

import { checkRateLimit, getClientIp } from "@/server/security/rate-limit-store";



const QUOTE_ENGINE_URL =

  process.env.QUOTE_ENGINE_URL ?? "http://localhost:4100";



const CHAINS = [

  "ethereum",

  "base",

  "monad",

  "solana",

  "ethereum-sepolia",

  "base-sepolia",

  "monad-testnet",

  "solana-devnet",

] as const;



const bodySchema = z.object({

  chain: z.enum(CHAINS),

  paymentToken: z.enum(["ETH", "MON", "BASE", "SOL"]),

  gasEstimateWei: z.string().regex(/^\d+$/),

  userAddress: z.string().optional(),

});



async function proxyToQuoteEngine(body: z.infer<typeof bodySchema>) {

  const res = await fetch(`${QUOTE_ENGINE_URL}/v1/quote/fee`, {

    method: "POST",

    headers: { "Content-Type": "application/json" },

    body: JSON.stringify(body),

    signal: AbortSignal.timeout(10_000),

  });

  const data = await res.json();

  return { ok: res.ok, status: res.status, data };

}



export async function POST(request: Request) {

  const ip = getClientIp(request);

  if (!checkRateLimit("quote-fee", ip, 60)) {

    return NextResponse.json({ error: "Çok fazla istek" }, { status: 429 });

  }



  let body: z.infer<typeof bodySchema>;

  try {

    body = bodySchema.parse(await request.json());

  } catch {

    return NextResponse.json({ error: "Geçersiz istek gövdesi" }, { status: 400 });

  }



  const disableFallback = process.env.DISABLE_LOCAL_QUOTE_FALLBACK === "true";



  try {

    const upstream = await proxyToQuoteEngine(body);

    if (upstream.ok) {

      return NextResponse.json(upstream.data, { status: upstream.status });

    }

    if (!disableFallback && upstream.status >= 500) {

      const local = await buildLocalFeeQuote(body);

      return NextResponse.json(local);

    }

    return NextResponse.json(upstream.data, { status: upstream.status });

  } catch (error) {

    if (disableFallback) {

      const message = error instanceof Error ? error.message : "Quote alınamadı";

      return NextResponse.json({ error: message }, { status: 502 });

    }

    try {

      const local = await buildLocalFeeQuote(body);

      return NextResponse.json(local);

    } catch (fallbackError) {

      const message =

        fallbackError instanceof Error ? fallbackError.message : "Quote alınamadı";

      return NextResponse.json({ error: message }, { status: 502 });

    }

  }

}

