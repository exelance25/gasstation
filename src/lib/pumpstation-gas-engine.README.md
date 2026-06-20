# PUMPSTATION gas engine entegrasyonu

## Şu an

- `packages/gas-engine-stub` → npm alias `@pumpstation/gas-engine`
- `src/lib/pumpstation-client.ts` → `createPumpStationClient()`, `getAggregatedBalance(addresses[])`

## Gerçek paket geldiğinde

1. `packages/gas-engine-stub` klasörünü silin veya gerçek pakete yönlendirin
2. `package.json` içinde `"@pumpstation/gas-engine": "^x.y.z"` ekleyin
3. Stub ile aynı export isimlerini (`PumpStationClient`, `getAggregatedBalance`) koruyun

```ts
import { PumpStationClient } from "@pumpstation/gas-engine";
```
