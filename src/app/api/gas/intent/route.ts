import { NextResponse } from "next/server";
import { z } from "zod";
import { isAddress } from "viem";
import type { GasDeliveryAsset } from "@/config/depot-assets";
import { isValidPackageUsd } from "@/lib/pricing";
import { issuePumpPass, validatePumpPass } from "@/server/gas/pump-pass";
import { createGasOrder } from "@/server/gas/gas-order";
import { SUPPORTED_PAY_SYMBOLS } from "@/config/payment-assets";
import type { PaySymbol } from "@/config/payment-assets";

const bodySchema = z.object({
  targetAsset: z.enum(["ETH", "MON", "BASE", "SOL", "USDC"]),
  targetAddress: z.string().min(1),
  packageAmount: z.number().refine(isValidPackageUsd),
  depositChainId: z.number().int().positive(),
  depositorAddress: z.string().min(1),
  passId: z.string().optional(),
  paySymbol: z.enum(SUPPORTED_PAY_SYMBOLS).optional(),
  paymentMode: z.enum(["usdc", "native"]).optional(),
});

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  }

  const { targetAsset, targetAddress, packageAmount, depositChainId, depositorAddress } =
    parsed.data;
  const paySymbol = (parsed.data.paySymbol ?? "USDC") as PaySymbol;
  const paymentMode = parsed.data.paymentMode ?? "usdc";

  if (targetAsset !== "SOL" && !isAddress(targetAddress)) {
    return NextResponse.json({ error: "Geçersiz hedef adres" }, { status: 400 });
  }
  if (!isAddress(depositorAddress)) {
    return NextResponse.json({ error: "Geçersiz gönderen adres" }, { status: 400 });
  }

  const wallet = depositorAddress.trim();

  try {
    const passId =
      parsed.data.passId && validatePumpPass(parsed.data.passId, wallet)
        ? parsed.data.passId
        : issuePumpPass(wallet).passId;

    const order = createGasOrder({
      passId,
      targetAsset: targetAsset as GasDeliveryAsset,
      targetAddress: targetAddress.trim(),
      packageAmount,
      depositChainId,
      depositorAddress: wallet,
      paySymbol,
      paymentMode,
    });

    return NextResponse.json({
      ok: true,
      intentId: order.orderId,
      orderId: order.orderId,
      passId: order.passId,
      expiresInSec: Math.max(0, Math.floor((order.expiresAt - Date.now()) / 1000)),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Sipariş oluşturulamadı";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
