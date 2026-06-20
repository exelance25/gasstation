# @pumpstation/fee-sdk

B2B gas settlement — cüzdan, DEX, custodial uygulama backend'leri.

## Akış

```
1. getQuote()     → imzalı native ödeme teklifi
2. Kullanıcı     → treasury'ye ödeme tx
3. settleFee()    → beneficiary'ye native gas teslim
```

## Kurulum

```bash
npm install file:./packages/fee-sdk
```

## Örnek

```typescript
import { PumpStationFee } from "@pumpstation/fee-sdk";

const fee = new PumpStationFee({
  apiUrl: "http://localhost:4100",
  settlementUrl: "http://localhost:4200",
  apiKey: process.env.SETTLEMENT_API_KEY,
});

const quote = await fee.getQuote({
  chain: "monad",
  paymentToken: "MON",
  gasEstimateWei: fee.estimateGasWei(),
  userAddress: "0xUser",
});

// Kullanıcıya quote.paymentAmount göster → ödeme sonrası:
const result = await fee.settleFee({
  quote,
  paymentTxHash: "0x…",
  payerAddress: "0xUser",
  beneficiaryAddress: "0xUser",
});
```

## Dikeyler

- **Monad/Base dApp** — ilk işlem gas
- **NFT launchpad** — mint öncesi top-up
- **Trading bot** — worker wallet funding

## Test

```bash
cd packages/fee-sdk && npm install && npm run test
```

Production: `SETTLEMENT_API_KEY` zorunlu.
