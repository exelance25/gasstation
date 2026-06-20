# GASSTATION

Cross-chain gas pump — USDC/native ödeme, ETH · MON · BASE · SOL teslimi.

## Yerel çalıştırma (Windows)

PowerShell script policy hatası alırsanız `npm.cmd` veya `dev.cmd` kullanın:

```cmd
cd C:\Users\omerr\.cursor\projects\empty-window
.\dev.cmd
```

Tarayıcı: [http://localhost:3000/yakit-al](http://localhost:3000/yakit-al)

## Güvenlik (deploy öncesi)

```cmd
npm.cmd run security:audit
```

- `.env.local` repoda **olmamalı** (`.gitignore` içinde)
- Operator private key'ler yalnızca Vercel **Encrypted** env
- Detay: `docs/VERCEL_DEPLOY.md`

## GitHub + Vercel

1. Repo oluştur → push
2. [vercel.com](https://vercel.com) → Import Git Repository
3. Env: `.env.testnet.example` referans alın
4. `NEXT_PUBLIC_GITHUB_REPO` → SDK panel linkleri

## SDK

| Paket | Klasör |
|-------|--------|
| `@gasstation/sdk` | `sdk/` |
| `@gasstation/fee-sdk` | `packages/fee-sdk/` |
| `@gasstation/gas-engine` | `packages/gas-engine-stub/` |

Entegratör rehberi: `docs/INTEGRATORS.md`

## Scripts

```cmd
npm.cmd install
npm.cmd run dev
npm.cmd run build
npm.cmd run test:sdk
npm.cmd run security:audit
```
