import { NextResponse } from "next/server";
import {
  isOperatorConfigured,
  isSolanaOperatorConfigured,
} from "@/config/operator-env";
import { isAutoFeeEnabled } from "@/config/client-env";
import { isWalletConnectReady } from "@config/evm-chains";

export const dynamic = "force-dynamic";

export async function GET() {
  const appEnv = process.env.NEXT_PUBLIC_APP_ENV ?? "development";

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
    walletConnect: isWalletConnectReady,
    timestamp: new Date().toISOString(),
  });
}
