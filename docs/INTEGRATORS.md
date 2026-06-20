# GASSTATION — Entegratör Rehberi

Cross-chain native gas teslim protokolü. Bu belge B2B entegrasyon için tek referans noktasıdır.

## Kim entegre olabilir?

| Dikey | Senaryo | Önerilen paket |
|-------|---------|----------------|
| Cüzdan / DEX | Gömülü "Gas al" butonu | `@pumpstation/fee-sdk` |
| dApp / Oyun | İlk işlemde gas yok | `@pumpstation/gas-engine` |
| NFT launchpad | Mint öncesi MON/ETH top-up | REST veya fee-sdk |
| Trading bot | Worker cüzdan funding | `GasStationRestClient` |
| On-chain protokol | Gasless USDC checkout | `@pumpstation/sdk` + paymaster |

## Akış (REST)

```
1. GET  /api/oracle/quote?amount=1&asset=MON   → fiyat
2. POST /api/gas/pass                         → oturum (2 saat)
3. POST /api/gas/intent                       → sipariş (30 dk)
4. POST /api/gas/precheck                     → likidite (opsiyonel)
5. Kullanıcı USDC/native öder
6. POST /api/gas/dispense                     → gas teslim
```

## Paketler

### `@pumpstation/sdk` (MIT)

- `calculatePackageQuoteSync` — ana uygulama `src/lib/pricing.ts` ile senkron
- `computeConservativeDeliveryAmount` — dispense tahmini
- `GasStationRestClient` — REST wrapper
- `PumpClient` — ERC-4337 relayer
- `encodeBuyGasManuel` — on-chain paymaster

```bash
cd sdk && npm install && npm run build
npm run test:sdk   # monorepo kökünden
```

### `@pumpstation/fee-sdk`

3 adım: quote → kullanıcı treasury'ye öder → settleFee

```typescript
const fee = new PumpStationFee({
  apiUrl: "http://localhost:4100",
  settlementUrl: "http://localhost:4200",
  apiKey: process.env.SETTLEMENT_API_KEY,
});
```

### `@pumpstation/gas-engine`

Sponsorship + eligibility check — dApp backend.

## Ortam değişkenleri (integrator backend)

| Değişken | Amaç |
|----------|------|
| `SETTLEMENT_API_KEY` | Production settle/sponsor |
| `RELAYER_API_KEY` | ERC-4337 relay |
| `NEXT_PUBLIC_GITHUB_REPO` | UI'da SDK linkleri |

## Testnet POC checklist

- [ ] Oracle quote alındı
- [ ] Precheck `ok: true`
- [ ] Intent oluşturuldu
- [ ] Ödeme tx on-chain
- [ ] Dispense `deliveryTxHash` döndü
- [ ] Tahmini teslim ≈ `conservativeDeliveryAmount`

## Dikey örnekler

### Monad dApp — ilk swap gas

1. Kullanıcı MON yok, USDC var
2. fee-sdk quote → native ödeme tutarı göster
3. settleFee → beneficiary = kullanıcı cüzdanı

### NFT launchpad

1. Mint öncesi REST `getOracleQuote({ deliveryAmount: 0.05, asset: "MON" })`
2. Intent + USDC ödeme
3. dispense → mint tx için yeterli MON

### Bot platform

1. Backend `GasStationRestClient` ile toplu intent
2. Her worker için dispense (rate limit'e dikkat)

## Mainnet

Testnet'te protokol/ağ ücreti 0; mainnet'te %10 protokol + $0.02 ağ. Fiyatlandırma `sdk/src/constants.ts` ile uyumludur.

## Destek

- `sdk/README.md` — paymaster + testnet
- `packages/fee-sdk/README.md` — settlement
- `packages/gas-engine-stub/README.md` — sponsorship
