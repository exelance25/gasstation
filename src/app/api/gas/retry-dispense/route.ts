import { NextResponse } from "next/server";

import { z } from "zod";

import { retryDepositFromTxHash } from "@/server/gas/retry-deposit-from-tx";



const bodySchema = z.object({

  txHash: z.string().min(32).max(128),

  orderId: z.string().optional(),

  targetAsset: z.enum(["ETH", "MON", "BASE", "SOL", "USDC"]).optional(),

  targetAddress: z.string().optional(),

  packageAmount: z.number().optional(),

  depositorAddress: z.string().optional(),

});



/** USDC veya native gönderildi, dispense kaçtı — kasa teslimatı tamamlar */

export async function POST(request: Request) {

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {

    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });

  }



  try {

    const result = await retryDepositFromTxHash(parsed.data);

    return NextResponse.json(result);

  } catch (e) {

    const message = e instanceof Error ? e.message : "Retry dispense başarısız";

    const status =

      message.includes("yetersiz") || message.includes("tankı") || message.includes("Likidite")

        ? 503

        : 422;

    return NextResponse.json({ error: message }, { status });

  }

}


