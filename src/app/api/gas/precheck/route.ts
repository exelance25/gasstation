import { NextResponse } from "next/server";
import { z } from "zod";
import type { GasDeliveryAsset } from "@/config/depot-assets";
import { SOLANA_ADDRESS_REGEX } from "@/lib/delivery-target";
import { isAddress } from "viem";
import { isValidPackageUsd } from "@/lib/pricing";
import { getConservativeDispenseQuote } from "@/server/oracle/oracle-service";
import { assertProfitableDispense } from "@/lib/treasury-accounting";
import { canDispenseEvmNativeGas } from "@/server/gas/dispense-evm-gas";
import { canDispenseSolanaGas } from "@/server/gas/dispense-solana-gas";

const bodySchema = z.object({
  targetAsset: z.enum(["ETH", "MON", "BASE", "SOL"]),
  packageAmount: z.number().refine(isValidPackageUsd, {
    message: "Geçersiz tutar",
  }),
  targetAddress: z.string().min(1),
});

function isValidTargetAddress(asset: GasDeliveryAsset, address: string): boolean {
  const trimmed = address.trim();
  if (asset === "SOL") return SOLANA_ADDRESS_REGEX.test(trimmed);
  return isAddress(trimmed);
}

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, reason: "Geçersiz istek" }, { status: 400 });
  }

  const { targetAsset, packageAmount, targetAddress } = parsed.data;
  if (!isValidTargetAddress(targetAsset, targetAddress)) {
    return NextResponse.json(
      { ok: false, reason: "Hedef adres formatı seçilen ağ ile uyumsuz" },
      { status: 400 },
    );
  }

  try {
    const quote = await getConservativeDispenseQuote(packageAmount, targetAsset);
    assertProfitableDispense(
      packageAmount,
      quote.estimatedGasAmount,
      targetAsset,
      quote.oracle,
    );

    const check =
      targetAsset === "SOL"
        ? await canDispenseSolanaGas(quote.estimatedGasAmount)
        : await canDispenseEvmNativeGas(targetAsset, quote.estimatedGasAmount);

    if (!check.ok) {
      return NextResponse.json({ ok: false, reason: check.reason }, { status: 422 });
    }

    return NextResponse.json({
      ok: true,
      targetAsset,
      packageAmount,
      estimatedGasAmount: quote.estimatedGasAmount,
    });
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Precheck başarısız";
    return NextResponse.json({ ok: false, reason }, { status: 422 });
  }
}
