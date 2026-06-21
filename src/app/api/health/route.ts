import { NextResponse } from "next/server";
import {
  getCollectorAddressSafe,
  isOperatorConfigured,
  isSolanaOperatorConfigured,
} from "@/config/operator-env";
import { isAutoFeeEnabled } from "@/config/client-env";
import { isWalletConnectReady } from "@config/evm-chains";

export const dynamic = "force-dynamic";

export async function GET() {
  const appEnv = process.env.NEXT_PUBLIC_APP_ENV ?? "development";

  const collector = getCollectorAddressSafe();

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
    },
    collector: {
      configured: collector !== null,
      /** Sunucu COLLECTOR_ADDRESS — UI için NEXT_PUBLIC_COLLECTOR_ADDRESS de gerekir */
      server: collector,
    },
    walletConnect: isWalletConnectReady,
    timestamp: new Date().toISOString(),
  });
}
