import { NextResponse } from "next/server";

import { z } from "zod";

import { buildLocalSponsorPrepare } from "@/server/settlement/local-sponsor-prepare";

import { checkRateLimit, getClientIp } from "@/server/security/rate-limit-store";



const SETTLEMENT_URL =

  process.env.SETTLEMENT_ENGINE_URL ?? "http://localhost:4200";



const bodySchema = z.object({

  userAddress: z.string(),

  chainId: z.number(),

  intentId: z.string(),

  gasEstimateWei: z.string().optional(),

  paymentToken: z.enum(["ETH", "MON", "BASE", "SOL"]).optional(),

});



async function proxyToSettlement(body: z.infer<typeof bodySchema>) {

  const headers: Record<string, string> = { "Content-Type": "application/json" };

  const key = process.env.SETTLEMENT_API_KEY;

  if (key) headers.Authorization = `Bearer ${key}`;



  const res = await fetch(`${SETTLEMENT_URL}/v1/sponsor/prepare`, {

    method: "POST",

    headers,

    body: JSON.stringify(body),

    signal: AbortSignal.timeout(15_000),

  });

  const data = await res.json();

  return { ok: res.ok, status: res.status, data };

}



export async function POST(request: Request) {

  const ip = getClientIp(request);

  if (!checkRateLimit("sponsor-prepare", ip, 30)) {

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

    const upstream = await proxyToSettlement(body);

    if (upstream.ok) {

      return NextResponse.json(upstream.data, { status: upstream.status });

    }

    if (!disableFallback && upstream.status >= 500) {

      const local = await buildLocalSponsorPrepare(body);

      return NextResponse.json(local);

    }

    return NextResponse.json(upstream.data, { status: upstream.status });

  } catch (error) {

    if (disableFallback) {

      const message = error instanceof Error ? error.message : "Sponsor hazırlık başarısız";

      return NextResponse.json({ error: message }, { status: 502 });

    }

    try {

      const local = await buildLocalSponsorPrepare(body);

      return NextResponse.json(local);

    } catch (fallbackError) {

      const message =

        fallbackError instanceof Error

          ? fallbackError.message

          : "Sponsor hazırlık başarısız";

      return NextResponse.json({ error: message }, { status: 502 });

    }

  }

}

