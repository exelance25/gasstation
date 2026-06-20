import { NextResponse } from "next/server";
import { getPublicPlatformStats } from "@/server/stats/public-stats";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(getPublicPlatformStats());
}
