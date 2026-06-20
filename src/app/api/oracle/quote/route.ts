import { NextResponse } from "next/server";
import {
  isValidDeliveryAmount,
  isValidPackageUsd,
  computePackageUsdFromDeliveryAmount,
} from "@/lib/pricing";
import type { GasDeliveryAsset } from "@/config/depot-assets";
import { getOraclePackageQuote, getOracleTick } from "@/server/oracle/oracle-service";
import { buildFallbackOracleQuote } from "@/server/oracle/oracle-fallback";

export const dynamic = "force-dynamic";

const ASSETS = new Set<GasDeliveryAsset>(["ETH", "MON", "BASE", "SOL"]);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const asset = (searchParams.get("asset") ?? "ETH") as GasDeliveryAsset;
  const deliveryAmount = Number(searchParams.get("amount") ?? "");
  const legacyPackage = Number(searchParams.get("package") ?? "");

  if (!ASSETS.has(asset)) {
    return NextResponse.json(
      { error: "Geçersiz asset — ETH, MON, BASE, SOL" },
      { status: 400 },
    );
  }

  let packageUsd: number;

  if (Number.isFinite(deliveryAmount) && deliveryAmount > 0) {
    if (!isValidDeliveryAmount(deliveryAmount, asset)) {
      return NextResponse.json({ error: "Geçersiz teslimat miktarı" }, { status: 400 });
    }
    const tick = await getOracleTick(true);
    packageUsd = computePackageUsdFromDeliveryAmount(deliveryAmount, asset, tick);
  } else if (isValidPackageUsd(legacyPackage)) {
    packageUsd = legacyPackage;
  } else {
    return NextResponse.json({ error: "amount veya package gerekli" }, { status: 400 });
  }

  if (!isValidPackageUsd(packageUsd)) {
    return NextResponse.json({ error: "Geçersiz ödeme tutarı" }, { status: 400 });
  }

  try {
    const quote = await getOraclePackageQuote(packageUsd, asset);
    if (Number.isFinite(deliveryAmount) && deliveryAmount > 0) {
      return NextResponse.json({ ...quote, estimatedGasAmount: deliveryAmount });
    }
    return NextResponse.json(quote);
  } catch {
    const fallback = buildFallbackOracleQuote(packageUsd, asset);
    if (Number.isFinite(deliveryAmount) && deliveryAmount > 0) {
      return NextResponse.json({ ...fallback, estimatedGasAmount: deliveryAmount });
    }
    return NextResponse.json(fallback);
  }
}
