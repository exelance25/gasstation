# GASSTATION — Testnet Hazırlık

## Ağlar

| Rol | Ağ | Chain ID |
|-----|-----|----------|
| Ödeme (kaynak) | Base Sepolia | 84532 |
| Gas teslimi (hedef) | Monad Testnet | 10143 |

## 1. Ortam dosyası

```powershell
cd C:\Users\omerr\.cursor\projects\empty-window
Copy-Item .env.testnet.example .env.local
# WalletConnect + deploy sonrasi paymaster adresini duzenleyin
```

## 2. SDK build

```powershell
cd sdk
npm install
npm run build
cd ..
npm install
npm run test:sdk
```

## 3. Kontrat deploy (Foundry)

```powershell
$env:DEPLOYER_PRIVATE_KEY = "0x..."
$env:PRICE_SIGNER_ADDRESS = "0x..."   # opsiyonel
.\scripts\deploy-testnet.ps1
```

Deploy çıktısındaki adresi `.env.local` → `NEXT_PUBLIC_PUMP_PAYMASTER_ADDRESS` olarak kaydedin.

## 4. Havuz likiditesi (admin)

Gas Havuzu panelinden (`/gas-havuzu`) admin cüzdanı ile:

- Native ETH likidite ekle (`adminAddNativeLiquidity`)
- USDC likidite ekle (`adminAddTokenLiquidity`)

## 5. dApp çalıştır

```powershell
if (Test-Path .next) { Remove-Item -Recurse -Force .next }
npm run dev
```

Tarayıcı: http://localhost:3000/yakit-al

MetaMask ağı: **Base Sepolia**

## 6. Hızlı test (Sepolia ETH gerekmez — önerilen)

Ödeme ağları: **Ethereum · Base · Monad · Solana** (Circle USDC).  
Sepolia ETH zorunluluğu yok — Solana devnet yolu:

```powershell
.\dev.cmd
# Yeni terminal:
node scripts/gen-test-solana-wallet.mjs
# https://faucet.circle.com → Solana Devnet → $5 USDC (depozitör adresine)
npm.cmd run test:quick
```

Kasa koruması: $5 pakette ~$4.48 gas, ~$0.52 kasada kalır.

## 7. GitHub’a SDK yükleme

```powershell
git add sdk/ docs/TESTNET.md scripts/deploy-testnet.ps1 .env.testnet.example
git commit -m "feat: @gasstation/sdk testnet package"
git push origin main
```

## SDK kullanımı

```typescript
import { PumpClient, calculatePackageQuoteSync } from "@gasstation/sdk";

const client = PumpClient.fromTestnet("0xPaymaster...");
const quote = calculatePackageQuoteSync(10, "MON");
```

Paket fiyatları: **$5 / $10 / $20** (%10 protokol marjı).
