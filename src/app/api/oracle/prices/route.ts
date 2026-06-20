import { NextResponse } from "next/server";
import { getOracleTick } from "@/server/oracle/oracle-service";
import { buildStubOracleTick } from "@/server/oracle/oracle-fallback";

export const dynamic = "force-dynamic";

/** Adım B — canlı fiyat kahini (Pyth + Chainlink sim, stub yedek) */
export async function GET() {
  try {
    const tick = await getOracleTick();
    return NextResponse.json(tick);
  } catch {
    return NextResponse.json(buildStubOracleTick());
  }
}
