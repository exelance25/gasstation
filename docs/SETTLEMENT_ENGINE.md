# Katman B — Settlement Engine

Ödeme tokeni (ETH/MON/BASE) → gas teslimi.

## Akış

```
1. fee-sdk getQuote()        → imzalı teklif
2. Kullanıcı treasury'ye öder → paymentTxHash
3. fee-sdk settleFee()       → ödeme doğrula + gas gönder
```

## Servis

| Port | Endpoint |
|------|----------|
| 4200 | `POST /v1/settle/fee` |
| 4200 | `POST /v1/sponsor/prepare` |
| 4200 | `GET /v1/settle/:id` |

## SDK

```typescript
const fee = new PumpStationFee({
  apiUrl: "http://localhost:4100",
  settlementUrl: "http://localhost:4200",
});

const quote = await fee.getQuote({
  chain: "ethereum-sepolia",
  paymentToken: "ETH",
  gasEstimateWei: fee.estimateGasWei(),
  userAddress: walletAddress,
});

// Kullanıcı treasury'ye quote.paymentAmount wei gönderir...

const result = await fee.settleFee({
  quote,
  paymentTxHash: txHash,
  payerAddress: walletAddress,
  beneficiaryAddress: walletAddress,
});
```

## Gas Engine

`@pumpstation/gas-engine` artık sponsorship için settlement API kullanır:

```typescript
const client = new PumpStationClient({
  settlementUrl: "http://localhost:4200",
  apiKey: process.env.SETTLEMENT_API_KEY,
});
await client.requestGasSponsorship({ userAddress, chainId, intentId });
```

## Env

```
TREASURY_EVM_ADDRESS=0x...
EVM_OPERATOR_PRIVATE_KEY=0x...
PRICE_SIGNER_PRIVATE_KEY=0x...  (quote-engine)
SETTLEMENT_API_KEY=...
```

## Tüm stack

```powershell
.\START_STACK.cmd
```
