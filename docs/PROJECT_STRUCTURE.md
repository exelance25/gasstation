# PUMPSTATION — Proje Yapısı

```
pumpstation/
├── GO.cmd / START.cmd / dev.cmd
├── packages/gas-engine-stub/      # @pumpstation/gas-engine (yerel stub)
├── contracts/                     # PumpPaymaster, TestNetworkNFT
├── sdk/                           # @pumpstation/sdk
├── src/
│   ├── app/
│   │   ├── page.tsx               # Landing
│   │   ├── yakit-al/              # Gas pompası UI
│   │   ├── gas-havuzu/            # Paymaster havuzu
│   │   └── api/gas/dispense/      # Gas teslim API
│   ├── components/landing/        # PUMPSTATION landing
│   ├── lib/
│   │   ├── pumpstation-client.ts  # Gas engine + bakiye
│   │   ├── treasury-vault.ts      # Kasa (PUMPSTATION etiketi)
│   │   └── gas-sponsor.ts
│   └── pumpstation/               # Uygulama servis katmanı
└── docs/PUMPSTATION_GAS_ROADMAP.md
```

## Ana bileşenler

| Dosya | Rol |
|-------|-----|
| `YakitAl.tsx` | Gas pompası — USDC öde, native gas al |
| `useGasPump.ts` | Ödeme + dispense akışı |
| `PumpPaymaster.sol` | On-chain gas havuzu + paymaster |
| `api/gas/dispense` | Oracle fiyat + gas teslimi |
