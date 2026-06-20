import { NextResponse } from "next/server";
import { z } from "zod";
import { isAddress } from "viem";
import { getActivePassForWallet, issuePumpPass } from "@/server/gas/pump-pass";

const postSchema = z.object({
  walletAddress: z.string().min(1),
});

export async function POST(request: Request) {
  const parsed = postSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  }

  const wallet = parsed.data.walletAddress.trim();
  if (!isAddress(wallet)) {
    return NextResponse.json({ error: "Geçersiz EVM adresi" }, { status: 400 });
  }

  const pass = issuePumpPass(wallet);
  return NextResponse.json({
    ok: true,
    passId: pass.passId,
    walletAddress: pass.walletAddress,
    expiresAt: pass.expiresAt,
    expiresInSec: Math.max(0, Math.floor((pass.expiresAt - Date.now()) / 1000)),
  });
}

export async function GET(request: Request) {
  const wallet = new URL(request.url).searchParams.get("wallet")?.trim();
  if (!wallet || !isAddress(wallet)) {
    return NextResponse.json({ error: "wallet parametresi gerekli" }, { status: 400 });
  }

  const pass = getActivePassForWallet(wallet);
  if (!pass) {
    return NextResponse.json({ ok: true, pass: null });
  }

  return NextResponse.json({
    ok: true,
    pass: {
      passId: pass.passId,
      walletAddress: pass.walletAddress,
      expiresAt: pass.expiresAt,
      expiresInSec: Math.max(0, Math.floor((pass.expiresAt - Date.now()) / 1000)),
    },
  });
}
