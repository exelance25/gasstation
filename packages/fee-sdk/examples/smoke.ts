import { PumpStationFee } from "../src/index";

const apiUrl = process.env.QUOTE_ENGINE_URL ?? "http://localhost:4100";

async function main() {
  const fee = new PumpStationFee({ apiUrl });
  const quote = await fee.getQuote({
    chain: "ethereum",
    paymentToken: "ETH",
    gasEstimateWei: fee.estimateGasWei(),
  });
  console.log("quoteId:", quote.quoteId);
  console.log("pay:", quote.paymentAmountFormatted, quote.paymentToken);
  console.log("sources:", quote.priceSource);
  console.log("signature:", quote.signature ? "yes" : "no");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
