import { NextResponse } from "next/server";

import { z } from "zod";

import {

  isLocalSettleAllowed,

  settleFeeLocally,

} from "@/server/settlement/local-settle-fee";

import { checkRateLimit, getClientIp } from "@/server/security/rate-limit-store";



const SETTLEMENT_URL =

  process.env.SETTLEMENT_ENGINE_URL ?? "http://localhost:4200";



const bodySchema = z.object({

  quoteId: z.string().uuid(),

  chain: z.string(),

  paymentToken: z.enum(["ETH", "MON", "BASE", "SOL"]),

  gasEstimateWei: z.string().regex(/^\d+$/),

  paymentAmount: z.string().regex(/^\d+$/),

  expiresAt: z.string(),

  signature: z.string().regex(/^0x[0-9a-fA-F]+$/).optional().nullable(),

  paymentTxHash: z.string().min(10),

  payerAddress: z.string().min(10),

  beneficiaryAddress: z.string().min(10),

});



async function proxyToSettlement(body: z.infer<typeof bodySchema>) {

  const headers: Record<string, string> = { "Content-Type": "application/json" };

  const key = process.env.SETTLEMENT_API_KEY;

  if (key) headers.Authorization = `Bearer ${key}`;



  const res = await fetch(`${SETTLEMENT_URL}/v1/settle/fee`, {

    method: "POST",

    headers,

    body: JSON.stringify({

      ...body,

      signature: body.signature ?? "0x" + "00".repeat(65),

    }),

    signal: AbortSignal.timeout(30_000),

  });

  const data = await res.json();

  return { ok: res.ok, status: res.status, data };

}



export async function POST(request: Request) {

  const ip = getClientIp(request);

  if (!checkRateLimit("settle-fee", ip, 30)) {

    return NextResponse.json({ error: "Çok fazla istek" }, { status: 429 });

  }



  let body: z.infer<typeof bodySchema>;

  try {

    body = bodySchema.parse(await request.json());

  } catch {

    return NextResponse.json({ error: "Geçersiz istek gövdesi" }, { status: 400 });

  }



  const useLocal =

    isLocalSettleAllowed() &&

    (!body.signature || body.signature === `0x${"00".repeat(65)}`);



  if (useLocal) {

    try {

      const local = await settleFeeLocally(body);

      return NextResponse.json(local);

    } catch (error) {

      const message = error instanceof Error ? error.message : "Yerel settlement başarısız";

      return NextResponse.json({ error: message }, { status: 422 });

    }

  }



  if (!body.signature) {

    return NextResponse.json({ error: "İmzasız quote settle edilemez" }, { status: 400 });

  }



  try {

    const upstream = await proxyToSettlement(body);

    if (upstream.ok) {

      return NextResponse.json(upstream.data, { status: upstream.status });

    }

    if (isLocalSettleAllowed() && upstream.status >= 500) {

      const local = await settleFeeLocally(body);

      return NextResponse.json(local);

    }

    return NextResponse.json(upstream.data, { status: upstream.status });

  } catch (error) {

    if (!isLocalSettleAllowed()) {

      const message = error instanceof Error ? error.message : "Settlement başarısız";

      return NextResponse.json({ error: message }, { status: 502 });

    }

    try {

      const local = await settleFeeLocally(body);

      return NextResponse.json(local);

    } catch (fallbackError) {

      const message =

        fallbackError instanceof Error ? fallbackError.message : "Settlement başarısız";

      return NextResponse.json({ error: message }, { status: 502 });

    }

  }

}

