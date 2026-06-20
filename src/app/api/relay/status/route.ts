import { NextResponse } from "next/server";
import { isRelayerConfigured } from "@/config/relayer-env";

export async function GET() {
  return NextResponse.json({
    enabled: isRelayerConfigured(),
  });
}
