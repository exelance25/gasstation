# @gasstation/gas-engine

Gas sponsorship orchestration — dApp, oyun, NFT (ilk işlemde native gas yok).

## Kurulum

```bash
npm install file:./packages/gas-engine-stub
```

## Örnek

```typescript
import { GasStationClient } from "@gasstation/gas-engine";

const client = new GasStationClient({
  settlementUrl: "http://localhost:4200",
  apiKey: process.env.SETTLEMENT_API_KEY,
});

const eligible = await client.checkGasEligibility(
  "0xUser",
  10143,
  0n,
);

if (eligible.needsSponsorship) {
  const sponsor = await client.requestGasSponsorship({
    userAddress: "0xUser",
    chainId: 10143,
    intentId: "order-abc",
    paymentToken: "MON",
  });
}
```

## settleAutoFee

Ödeme tx + imzalı quote → tek settlement çağrısı.

## Dikeyler

- Gasless ilk tx (Base / Monad)
- Oyun onboarding
- Sponsor + otomatik fee recovery

Settlement engine `:4200` çalışır olmalı.
