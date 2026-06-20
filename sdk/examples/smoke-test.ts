import {
  calculatePackageQuoteSync,
  encodeBuyGasManuel,
  getTestnetDefaults,
  BASE_SEPOLIA_USDC,
} from "../src/index.js";

const paymaster = "0x0000000000000000000000000000000000000001" as const;

console.log("PUMPSTATION SDK smoke test\n");

const testnet = getTestnetDefaults(paymaster);
console.log("Source chain:", testnet.sourceChain.name);
console.log("Target chain:", testnet.targetChain.name);
console.log("USDC:", testnet.usdcAddress);

for (const pkg of [5, 10, 20] as const) {
  const quote = calculatePackageQuoteSync(pkg, "MON");
  const tx = encodeBuyGasManuel({
    paymaster,
    tokenPaid: BASE_SEPOLIA_USDC,
    packageUsd: pkg,
    expectedGasWei: quote.contractGasWei,
    recipient: "0x0000000000000000000000000000000000000002",
  });
  console.log(`\n$${pkg} → ~${quote.estimatedGasAmount.toFixed(4)} MON (dispense ~${quote.conservativeDeliveryAmount.toFixed(4)})`);
  console.log("  buyGasManuel calldata:", tx.data.slice(0, 18) + "…");
}

console.log("\nSDK smoke test OK");
