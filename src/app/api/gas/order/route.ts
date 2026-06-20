import { NextResponse } from "next/server";
import { z } from "zod";
import { isAddress } from "viem";
import type { GasDeliveryAsset } from "@/config/depot-assets";
import { isValidPackageUsd } from "@/lib/pricing";
import { SUPPORTED_PAY_SYMBOLS } from "@/config/payment-assets";
import { createGasOrder } from "@/server/gas/gas-order";

const bodySchema = z.object({
  passId: z.string().min(4),
  targetAsset: z.enum(["ETH", "MON", "BASE", "SOL"]),
  targetAddress: z.string().min(1),
  packageAmount: z.number().refine(isValidPackageUsd),
  depositChainId: z.number().int().positive(),
  depositorAddress: z.string().min(1),
  paySymbol: z.enum(SUPPORTED_PAY_SYMBOLS),
  paymentMode: z.enum(["usdc", "native"]),
});

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  }

  const data = parsed.data;
  if (data.targetAsset !== "SOL" && !isAddress(data.targetAddress)) {
    return NextResponse.json({ error: "Geçersiz hedef adres" }, { status: 400 });
  }
  if (!isAddress(data.depositorAddress)) {
    return NextResponse.json({ error: "Geçersiz gönderen adres" }, { status: 400 });
  }

  try {
    const order = createGasOrder({
      passId: data.passId,
      targetAsset: data.targetAsset as GasDeliveryAsset,
      targetAddress: data.targetAddress.trim(),
      packageAmount: data.packageAmount,
      depositChainId: data.depositChainId,
      depositorAddress: data.depositorAddress.trim(),
      paySymbol: data.paySymbol,
      paymentMode: data.paymentMode,
    });

    return NextResponse.json({
      ok: true,
      orderId: order.orderId,
      passId: order.passId,
      status: order.status,
      expiresInSec: Math.max(0, Math.floor((order.expiresAt - Date.now()) / 1000)),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Sipariş oluşturulamadı";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
