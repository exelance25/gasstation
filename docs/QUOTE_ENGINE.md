# Katman A — Quote Engine v0.2

## Özellikler

- **Çok kaynaklı fiyat:** Pyth + CoinGecko + Jupiter (SOL) + PUMPSTATION oracle
- **Arbitraj koruması:** Kaynak spread > %2 → quote reddedilir
- **Konservatif fiyatlama:** Gas için yüksek USD, ödeme tokeni için düşük USD
- **İmzalı quote:** `PRICE_SIGNER_PRIVATE_KEY` ile EIP-191 imza
- **Tek kullanımlık:** `POST /v1/quote/verify` replay koruması

## Servisler

| Servis | Port | Endpoint |
|--------|------|----------|
| Quote Engine | 4100 | `POST /v1/quote/fee` |
| Next.js proxy | 3000 | `POST /api/v1/quote/fee` |

## SDK — `@pumpstation/fee-sdk`

```typescript
import { PumpStationFee } from "@pumpstation/fee-sdk";

const fee = new PumpStationFee({
  apiUrl: "http://localhost:4100", // veya /api proxy
});

const quote = await fee.getQuote({
  chain: "ethereum",
  paymentToken: "ETH",
  gasEstimateWei: 21_000n * 50_000_000_000n,
});

console.log(quote.paymentAmountFormatted, quote.paymentToken);
await fee.verifyQuote(quote);
```

## Çalıştırma

```powershell
cd C:\Users\omerr\.cursor\projects\empty-window
npm run quote-engine:install
npm run quote-engine:dev
```

Ayrı terminal:
```powershell
npm run go
```

Smoke test:
```powershell
npm run fee-sdk:smoke
```
