# Cross-Chain Test NFT

Monad Testnet ve Base Sepolia icin 200 adetlik, 0.0001 native token mint fiyatli test NFT'leri.

## Kontrat

- **Kaynak:** `contracts/src/TestNetworkNFT.sol`
- **Standart:** OpenZeppelin v5 ERC-721
- **Monad:** MTNFT — Monad Test NFT
- **Base:** BTNFT — Base Test NFT
- **Owner (withdraw):** `0x1491baEd4db010D8F8B54cED442aF3326ed2c77a`

## Kurulum

### 1. Foundry

```powershell
# https://book.getfoundry.sh/getting-started/installation
foundryup
cd contracts
forge install OpenZeppelin/openzeppelin-contracts@v5.0.2 forge-std --no-commit
forge build
forge test -vvv
```

### 2. Ortam degiskenleri

`.env.local` dosyasina ekleyin:

```env
NEXT_PUBLIC_APP_ENV=testnet
NEXT_PUBLIC_SITE_URL=http://localhost:3000
DEPLOYER_PRIVATE_KEY=0x...          # deploy cuzdani — ASLA commit etmeyin
NFT_OWNER=0x1491baEd4db010D8F8B54cED442aF3326ed2c77a
NEXT_PUBLIC_MONAD_TESTNET_RPC=https://testnet-rpc.monad.xyz
NEXT_PUBLIC_BASE_SEPOLIA_RPC=https://sepolia.base.org
```

### 3. Deploy (her iki ag)

```powershell
npm run deploy:nft-testnet
```

Script cikan adresleri `.env.local` icine yazin:

```env
NEXT_PUBLIC_MONAD_NFT_ADDRESS=0x...
NEXT_PUBLIC_BASE_NFT_ADDRESS=0x...
```

### 4. Frontend

```powershell
npm install
npm run dev
```

Tarayici: [http://localhost:3000/nft-test](http://localhost:3000/nft-test)

### 5. Vercel

- Repo'yu Vercel'e baglayin
- Environment variables: `.env.testnet.example` NFT satirlarini ekleyin
- `NEXT_PUBLIC_SITE_URL=https://YOUR-APP.vercel.app` (metadata URI icin zorunlu)
- Deploy sonrasi kontrat metadata URI'lerini guncellemek icin kontrati yeniden deploy edin veya owner olarak URI guncelleyen bir fonksiyon ekleyin (su an sabit constructor URI)

## Manuel Foundry deploy

```powershell
cd contracts
$env:DEPLOYER_PRIVATE_KEY="0x..."
$env:NFT_NAME="Monad Test NFT"
$env:NFT_SYMBOL="MTNFT"
$env:NFT_METADATA_URI="https://YOUR-APP.vercel.app/api/nft/metadata/monad"
$env:NFT_MAX_SUPPLY="200"
$env:NFT_MINT_PRICE_WEI="100000000000000"
$env:NFT_OWNER="0x1491baEd4db010D8F8B54cED442aF3326ed2c77a"

forge script script/DeployTestNFT.s.sol:DeployTestNFT --rpc-url https://testnet-rpc.monad.xyz --broadcast -vvv
```

Base Sepolia icin ayni komutu `NFT_NAME`, `NFT_SYMBOL`, `NFT_METADATA_URI` (base) ve `--rpc-url https://sepolia.base.org` ile tekrarlayin.

## Test ETH / MON

- **Sepolia ETH:** [https://sepoliafaucet.com](https://sepoliafaucet.com) veya Alchemy faucet
- **Base Sepolia:** [https://www.alchemy.com/faucets/base-sepolia](https://www.alchemy.com/faucets/base-sepolia)
- **Monad Testnet:** Monad testnet faucet / discord

Gas test aglarinda genelde ~0.00001 ETH civarindadir; mint ucreti 0.0001 native tokendir.
