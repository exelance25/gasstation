# Vercel Deploy — GASSTATION

## Ön koşul

1. `npm run security:audit` — temiz olmalı
2. `.env.local` **asla** commit edilmemeli (`.gitignore` içinde)
3. GitHub repo oluşturulmuş olmalı

## Vercel’de proje oluşturma

1. [vercel.com](https://vercel.com) → **Add New Project**
2. GitHub reposunu import et
3. Framework: **Next.js** (otomatik algılanır)
4. Root Directory: `.` (repo kökü)
5. Build: `npm run build` · Output: Next.js default

## Ortam değişkenleri (Vercel Dashboard → Settings → Environment Variables)

### Zorunlu (testnet demo)

| Değişken | Örnek | Not |
|----------|--------|-----|
| `NEXT_PUBLIC_APP_ENV` | `testnet` | |
| `NEXT_PUBLIC_WC_PROJECT_ID` | Reown project id | WalletConnect |
| `NEXT_PUBLIC_GITHUB_REPO` | `https://github.com/org/gasstation` | SDK linkleri |

### Gas dispense (sunucu — Production + Preview dikkatli)

| Değişken | Not |
|----------|-----|
| `EVM_OPERATOR_PRIVATE_KEY` | **Encrypted** — sadece Production |
| `COLLECTOR_ADDRESS` | USDC kasa |
| `ADMIN_WALLET_ADDRESS` | Admin panel auth |

Tam liste: `.env.testnet.example`

## Güvenlik notları

- Operator private key’leri **Preview** deployment’lara koymayın
- `RELAYER_API_KEY`, `SETTLEMENT_API_KEY` production’da zorunlu
- Vercel: **Sensitive** olarak işaretleyin

## Domain

Vercel → Project → Settings → Domains → `gasstation.vercel.app` veya custom domain.

WalletConnect Reown dashboard’a production domain ekleyin.

## Yerel test (production build)

```cmd
npm.cmd run build
npm.cmd run start
```

## GitHub push sonrası

Vercel otomatik deploy tetikler. İlk deploy loglarında env eksikliği varsa `/api/health` kontrol edin.
