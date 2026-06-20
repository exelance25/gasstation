# Güvenlik Düzeltmeleri (GASSTATION)

## Paymaster postOp
- **Sorun:** `actualGasCost` (wei) doğrudan ERC-20 biriminde tahsil ediliyordu.
- **Çözüm:** İmzalı `maxTokenCharge` + orantılı hesaplama (`actualGasCost / maxNativeCost * maxTokenCharge`).
- **Dosya:** `contracts/src/PumpPaymaster.sol`

## priceSigner
- Oracle tabanlı quote imzası zorunlu (production).
- **Dosyalar:** `src/server/paymaster/price-signer.ts`, `paymaster-quote.ts`

## Relay API
- `RELAYER_API_KEY` — production'da `/api/relay/*` için zorunlu.
- Rate limit: 30 istek/dk/IP.

## Rate limit
- Dispense + relay: dosya destekli store (production `.data/`).

## Admin session
- Production'da `API_SECRET_KEY` veya `SESSION_ENCRYPTION_KEY` zorunlu.

## Marketplace HD wallet
- Production/staging'de `DEPOSIT_MASTER_MNEMONIC` zorunlu.

## Ücret tutarlılığı
- Tek kaynak: `config/protocol-fees.ts`

## Katman A — Quote Engine
- `services/quote-engine/` — `POST /v1/quote/fee`
- Port: 4100

```cmd
npm run quote-engine:install
npm run quote-engine:dev
```

Test:
```cmd
curl -X POST http://localhost:4100/v1/quote/fee -H "Content-Type: application/json" -d "{\"chain\":\"ethereum\",\"paymentToken\":\"ETH\",\"gasEstimateWei\":\"210000000000000\"}"
```
