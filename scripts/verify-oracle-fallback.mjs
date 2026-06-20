/**
 * SSL fallback doğrulama — Pyth/CoinGecko erişilemese bile stub quote üretilmeli.
 */
import { fetchOraclePrices } from "../src/lib/oracle/pyth-oracle.ts";
import { getOraclePackageQuote } from "../src/server/oracle/oracle-service.ts";

console.log("=== Oracle SSL Fallback Doğrulama ===\n");

const prices = await fetchOraclePrices();
console.log("[fetchOraclePrices]", {
  source: prices.source,
  ETH: prices.ETH_Price,
  MON: prices.MON_Price,
});

const quote = await getOraclePackageQuote(10, "MON");
console.log("\n[getOraclePackageQuote $10 MON]", {
  source: quote.oracle.source,
  estimatedGas: quote.estimatedGasAmount.toFixed(4),
  contractGasWei: quote.contractGasWei.slice(0, 20) + "…",
  roundId: quote.oracle.roundId,
});

const ok =
  prices.ETH_Price > 0 &&
  prices.MON_Price > 0 &&
  quote.estimatedGasAmount > 0 &&
  quote.contractGasWei !== "0";

if (ok) {
  console.log("\n✓ SSL FALLBACK OK — stub/canlı fiyat ile quote üretildi.");
  process.exit(0);
}

console.error("\n✗ FALLBACK FAILED");
process.exit(1);
