import { NextResponse } from "next/server";
import {
  getCollectorAddressSafe,
  isOperatorConfigured,
  isSolanaOperatorConfigured,
} from "@/config/operator-env";
import { isAutoFeeEnabled } from "@/config/client-env";
import { isWalletConnectReady } from "@config/evm-chains";
import { getOperatorTankStatus } from "@/server/gas/operator-tank-status";

export const dynamic = "force-dynamic";

export async function GET() {
  const appEnv = process.env.NEXT_PUBLIC_APP_ENV ?? "development";

  const collector = getCollectorAddressSafe();
  const tank = await getOperatorTankStatus();

  return NextResponse.json({
    ok: true,
    service: "gasstation",
    env: appEnv,
    features: {
      manualGas: true,
      automaticGas: isAutoFeeEnabled(),
    },
    operators: {
      evm: isOperatorConfigured(),
      solana: isSolanaOperatorConfigured(),
      address: tank.address,
      tanks: tank.tanks,
    },
    collector: {
      configured: collector !== null,
      server: collector,
    },
    walletConnect: isWalletConnectReady,
    timestamp: new Date().toISOString(),
  });
}
