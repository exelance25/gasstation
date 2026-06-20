import { NextResponse } from "next/server";
import { z } from "zod";
import { isAddress } from "viem";
import type { GasDeliveryAsset } from "@/config/depot-assets";
import { SOLANA_ADDRESS_REGEX } from "@/lib/delivery-target";
import { assertVaultSecretsNotPublic } from "@/config/vault-security";
import { checkDispenseRateLimit } from "@/server/gas/dispense-rate-limit";
import { isValidPackageUsd } from "@/lib/pricing";
import { runGasDispense } from "@/server/gas/run-gas-dispense";

assertVaultSecretsNotPublic();

export const dynamic = "force-dynamic";

const ASSETS = new Set<GasDeliveryAsset>(["ETH", "MON", "BASE", "SOL"]);

const bodySchema = z.object({
  txHash: z.string().min(32).max(128),
  targetAsset: z.enum(["ETH", "MON", "BASE", "SOL"]),
  targetAddress: z.string().min(1),
  packageAmount: z.number().refine(isValidPackageUsd, {
    message: "Geçersiz tutar",
  }),
  depositorAddress: z.string().optional(),
  intentId: z.string().optional(),
  orderId: z.string().optional(),
});

function isEvmTxHash(hash: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(hash);
}

function isSolanaSignature(sig: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{64,128}$/.test(sig);
}

function isValidTargetAddress(asset: GasDeliveryAsset, address: string): boolean {
  const trimmed = address.trim();
  if (asset === "SOL") return SOLANA_ADDRESS_REGEX.test(trimmed);
  return isAddress(trimmed);
}

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON gövdesi" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Geçersiz istek", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { txHash, targetAsset, targetAddress, packageAmount, depositorAddress, intentId, orderId } =
    parsed.data;

  if (!isEvmTxHash(txHash) && !isSolanaSignature(txHash)) {
    return NextResponse.json({ error: "Geçersiz işlem kimliği" }, { status: 400 });
  }

  const rateKey =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  if (!checkDispenseRateLimit(rateKey)) {
    return NextResponse.json(
      { error: "Çok fazla istek — lütfen bir dakika bekleyin" },
      { status: 429 },
    );
  }

  if (!ASSETS.has(targetAsset)) {
    return NextResponse.json({ error: "Geçersiz targetAsset" }, { status: 400 });
  }

  if (!isValidTargetAddress(targetAsset, targetAddress)) {
    return NextResponse.json(
      { error: "Hedef adres formatı seçilen ağ ile uyumsuz" },
      { status: 400 },
    );
  }

  try {
    const result = await runGasDispense({
      txHash,
      targetAsset,
      targetAddress,
      packageAmount,
      depositorAddress,
      intentId,
      orderId,
    });
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Gas teslimatı başarısız";
    const status =
      message.includes("yetersiz") || message.includes("Likidite")
        ? 503
        : message.includes("doğrulanamadı")
          ? 422
          : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
