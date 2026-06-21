import { NextResponse } from "next/server";
import { getCollectorAddressSafe } from "@/config/operator-env";

export const dynamic = "force-dynamic";

/** Tarayıcı — COLLECTOR_ADDRESS sunucudan (NEXT_PUBLIC gerekmez) */
export async function GET() {
  const address = getCollectorAddressSafe();
  return NextResponse.json({
    ok: Boolean(address),
    address,
  });
}
