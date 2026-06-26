import { NextRequest, NextResponse } from "next/server";
import { deployPumpPaymasterOnMonadTestnet } from "@/server/contracts/deploy-pump-paymaster";
import { getPumpPaymasterAddress } from "@/lib/paymaster-config";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorize(request: NextRequest): boolean {
  const expected = process.env.DEPLOY_PAYMASTER_TOKEN?.trim();
  if (!expected) return false;
  const provided =
    request.headers.get("x-deploy-token")?.trim() ??
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  return Boolean(provided && provided === expected);
}

export async function POST(request: NextRequest) {
  if (!authorize(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (getPumpPaymasterAddress()) {
    return NextResponse.json({
      ok: true,
      alreadyDeployed: true,
      address: getPumpPaymasterAddress(),
    });
  }

  try {
    const result = await deployPumpPaymasterOnMonadTestnet();
    return NextResponse.json({
      ok: true,
      network: "Monad Testnet",
      chainId: 10143,
      contractAddress: result.address,
      txHash: result.txHash,
      entryPoint: result.entryPoint,
      priceSigner: result.priceSigner,
      deployer: result.deployer,
      vercelEnv: {
        NEXT_PUBLIC_PUMP_PAYMASTER_ADDRESS: result.address,
        NEXT_PUBLIC_ENTRY_POINT_ADDRESS: result.entryPoint,
        PRICE_SIGNER_ADDRESS: result.priceSigner,
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Deploy failed";
    return NextResponse.json({ error: msg }, { status: 503 });
  }
}
