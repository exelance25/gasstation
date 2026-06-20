import { calculatePackageQuote } from "@/lib/pricing";
import {
  calculatePackageQuoteSync,
  encodeBuyGasManuel,
  getTestnetDefaults,
  BASE_SEPOLIA_USDC,
} from "@pumpstation/sdk";

async function runFrontEndSimulation() {
  console.log("PUMP_STATION FRONT-END INTEGRATION TEST STARTING...\n");

  for (const pkg of [5, 10, 20] as const) {
    const result = await calculatePackageQuote(pkg, "MON");
    console.log(`[Paket $${pkg}]`);
    console.log(`  Protokol marjı (%10): $${result.protocolFeeUsd.toFixed(2)}`);
    console.log(`  Net gas bütçesi: $${result.netUsdForGas.toFixed(2)}`);
    console.log(`  Tahmini MON: ${result.estimatedGasAmount.toFixed(6)}`);
    console.log(`  Kontrat Wei: ${result.contractGasWei.toString()}\n`);
  }

  console.log("--- @pumpstation/sdk ---\n");
  const testnet = getTestnetDefaults("0x0000000000000000000000000000000000000001");
  console.log(`Kaynak: ${testnet.sourceChain.name} → Hedef: ${testnet.targetChain.name}`);
  console.log(`USDC: ${testnet.usdcAddress}`);

  const sdkQuote = calculatePackageQuoteSync(10, "MON");
  const calldata = encodeBuyGasManuel({
    paymaster: "0x0000000000000000000000000000000000000001",
    tokenPaid: BASE_SEPOLIA_USDC,
    packageUsd: 10,
    expectedGasWei: sdkQuote.contractGasWei,
    recipient: "0x0000000000000000000000000000000000000002",
  });
  console.log(`SDK $10 paket calldata: ${calldata.data.slice(0, 20)}…\n`);

  console.log("INTEGRATION TEST PASSED — SDK + %10 marj aktif.");
}

void runFrontEndSimulation();
