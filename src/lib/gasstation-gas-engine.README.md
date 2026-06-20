# GASSTATION gas engine entegrasyonu

## Yerel stub

- `packages/gas-engine-stub` → npm alias `@gasstation/gas-engine`
- `src/lib/gasstation-client.ts` → `createGasStationClient()`, `getAggregatedBalance(addresses[])`

## Gerçek pakete geçiş

1. `packages/gas-engine-stub` yerine npm paketini kullanın
2. `package.json` içinde `"@gasstation/gas-engine": "^x.y.z"` ekleyin
3. Stub ile aynı export isimlerini (`GasStationClient`, `getAggregatedBalance`) koruyun

```ts
import { GasStationClient } from "@gasstation/gas-engine";
```
