# GASSTATION — Proje Yapısı

```
gasstation/
├── GO.cmd / START.cmd / dev.cmd
├── packages/gas-engine-stub/      # @gasstation/gas-engine (yerel stub)
├── contracts/                     # PumpPaymaster, TestNetworkNFT
├── sdk/                           # @gasstation/sdk
├── src/
│   ├── app/
│   │   ├── page.tsx               # Landing
│   │   ├── yakit-al/              # Gas pompası UI
│   │   ├── gas-havuzu/            # Paymaster havuzu
│   │   └── api/gas/dispense/      # Gas teslim API
│   ├── components/landing/        # GASSTATION landing
│   ├── lib/
│   │   ├── gasstation-client.ts  # Gas engine + bakiye
│   │   ├── treasury-vault.ts      # Kasa (GASSTATION etiketi)
│   │   └── gas-sponsor.ts
│   └── gasstation/               # Uygulama servis katmanı
└── docs/GASSTATION_GAS_ROADMAP.md
```

## Ana bileşenler

| Dosya | Rol |
|-------|-----|
| `YakitAl.tsx` | Gas pompası — USDC öde, native gas al |
| `useGasPump.ts` | Ödeme + dispense akışı |
| `PumpPaymaster.sol` | On-chain gas havuzu + paymaster |
| `api/gas/dispense` | Oracle fiyat + gas teslimi |
