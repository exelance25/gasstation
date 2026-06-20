import { NextResponse } from "next/server";
import { z } from "zod";
import { retryDepositFromTxHash } from "@/server/gas/retry-deposit-from-tx";

const bodySchema = z.object({
  txHash: z.string().min(32).max(128),
});

/** USDC gönderildi, dispense kaçtı — kasa intent ile teslimatı tamamlar */
export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  }

  try {
    const result = await retryDepositFromTxHash(parsed.data.txHash);
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Retry dispense başarısız";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
