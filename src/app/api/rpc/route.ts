import { NextResponse } from "next/server";
import { getServerEnv } from "@/config/server-env";

/**
 * Server-only RPC proxy scaffold.
 * Private RPC URLs must never be exposed via NEXT_PUBLIC_*.
 */
export async function POST(request: Request) {
  const server = getServerEnv();
  const body = await request.json().catch(() => ({}));
  const chain = typeof body.chain === "string" ? body.chain : "ethereum";

  if (!server.ETH_RPC_PRIVATE_URL) {
    return NextResponse.json(
      { error: "Private RPC not configured", chain, mode: "public-fallback-required" },
      { status: 503 }
    );
  }

  return NextResponse.json({
    ok: true,
    chain,
    message: "Wire viem/ethers JSON-RPC forward here using server.ETH_RPC_PRIVATE_URL"
  });
}
