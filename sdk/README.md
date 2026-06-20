# @gasstation/sdk

MIT lisanslı GASSTATION SDK — fiyatlandırma, REST entegrasyonu, ERC-4337 paymaster.

Ana uygulama `src/lib/pricing.ts` ve `config/protocol-fees.ts` ile **senkron** tutulur.

## Kurulum

```bash
npm install @gasstation/sdk viem
# monorepo:
npm install file:./sdk
```

## Fiyatlandırma (senkron)

```typescript
import {
  calculatePackageQuoteSync,
  calculatePackageQuoteFromDeliverySync,
  computeConservativeDeliveryAmount,
  formatGasDeliveryAmount,
} from "@gasstation/sdk";

// $10 paket → MON teslim tahmini
const quote = calculatePackageQuoteSync(10, "MON");
console.log("UI tahmin:", quote.estimatedGasAmount);
console.log("Dispense tahmin:", quote.conservativeDeliveryAmount);

// 1 MON iste → ödenecek USD
const fromDelivery = calculatePackageQuoteFromDeliverySync(1, "MON");
console.log("Ödeme:", fromDelivery.packageUsd);

// Mainnet ücretleri
const mainnetQuote = calculatePackageQuoteSync(10, "MON", { env: "mainnet" });
```

### Ortam

| `env` | Protokol | Ağ ücreti |
|-------|----------|-----------|
| `testnet` (varsayılan) | 0% | $0 |
| `mainnet` | 10% | $0.02 |

Oracle buffer: **%5** (`ORACLE_CONSERVATIVE_BUFFER`) — ödeme ve muhafazakâr dispense.

## REST client (B2B POC)

```typescript
import { GasStationRestClient } from "@gasstation/sdk";

const api = new GasStationRestClient({ baseUrl: "http://localhost:3000" });

const quote = await api.getOracleQuote({ deliveryAmount: 1, asset: "MON" });
const pre = await api.precheckGas({
  packageAmount: quote.packageUsd,
  targetAsset: "MON",
  targetAddress: "0x…",
});
// … intent, ödeme, dispense
```

## Paymaster (ERC-4337)

```typescript
import {
  PumpClient,
  getTestnetDefaults,
  encodeBuyGasManuel,
  BASE_SEPOLIA_USDC,
} from "@gasstation/sdk";

const paymaster = "0xYourPaymaster" as const;
const quote = calculatePackageQuoteSync(10, "MON");

const tx = encodeBuyGasManuel({
  paymaster,
  tokenPaid: BASE_SEPOLIA_USDC,
  packageUsd: 10,
  expectedGasWei: quote.contractGasWei,
  recipient: "0xRecipient",
});
```

## Export listesi

| Export | Açıklama |
|--------|----------|
| `calculatePackageQuoteSync` | Paket USD → quote |
| `calculatePackageQuoteFromDeliverySync` | Teslim miktarı → quote |
| `computeConservativeDeliveryAmount` | Dispense tahmini |
| `GasStationRestClient` | REST API |
| `PumpClient` | Relayer UserOp |
| `computePackageAccounting` | Kasa muhasebesi |
| `assertProfitableDispense` | Treasury guard |

## Build & test

```bash
cd sdk && npm install && npm run build
cd .. && npm run test:sdk
```

## GitHub

`package.json` → `repository.url` alanını kendi repo URL'nizle güncelleyin.

UI linkleri: `NEXT_PUBLIC_GITHUB_REPO=https://github.com/org/repo`
