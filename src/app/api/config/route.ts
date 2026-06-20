import { NextResponse } from "next/server";
import { getServerEnv } from "@/config/server-env";
import { clientEnv, isAutoFeeEnabled } from "@/config/client-env";
import { isRelayerConfigured } from "@/config/relayer-env";

export async function GET() {
  const server = getServerEnv();
  return NextResponse.json({
    appEnv: clientEnv.NEXT_PUBLIC_APP_ENV,
    apiBaseUrl: clientEnv.NEXT_PUBLIC_API_BASE_URL,
    features: {
      gasstation: clientEnv.NEXT_PUBLIC_APP_ENV !== "mainnet",
      crossChainPayments: true,
      biometricAuth: false,
      passkeys: false,
      pumpRelayer: isRelayerConfigured(),
      autoFee: isAutoFeeEnabled(),
      gasModes: {
        manual: true,
        automatic: isAutoFeeEnabled(),
      },
    },
    chains: {
      evm: ["ethereum-mainnet", "ethereum-sepolia", "monad-testnet"],
      solana: ["solana-mainnet", "solana-devnet"]
    },
    security: {
      serverConfigured: Boolean(server.API_SECRET_KEY),
      encryptedSessions: Boolean(server.SESSION_ENCRYPTION_KEY)
    }
  });
}
