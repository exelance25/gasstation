# PumpPaymaster

Kaynak: **`contracts/src/PumpPaymaster.sol`**

## Deploy

```bash
forge create contracts/src/PumpPaymaster.sol:PumpPaymaster \
  --constructor-args <ENTRY_POINT> <PRICE_SIGNER> \
  --rpc-url $BASE_RPC
```

EntryPoint v0.6: `0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789`

## Özet

| Rol | Fonksiyon |
|-----|-----------|
| Admin | `adminAddNativeLiquidity`, `adminAddTokenLiquidity`, `adminWithdraw` |
| Kullanıcı manuel | `buyGasManuel` |
| Kullanıcı otomatik | `approve` + ERC-4337 `postOp` (%0.5 fee) |

Eski `contracts/PumpPaymaster.sol` kaldırıldı — tek kaynak `src/` altındadır.
