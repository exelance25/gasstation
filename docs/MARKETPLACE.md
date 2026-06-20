# GASSTATION Cross-Chain Gas Marketplace

Production-grade gas marketplace: pay USDC on any supported chain, receive native gas on any destination chain.

## Architecture

```
Frontend (Next.js)          Marketplace API (Express :4000)
     │                              │
     │  POST /orders/create         ├── PostgreSQL (orders)
     │  GET  /orders/:id/status     ├── Redis + BullMQ
     └──────────────────────────────┤
                                    ├── Payment Monitor Worker
                                    ├── Fulfillment Worker
                                    ├── Treasury Monitor
                                    └── Order Expiry Worker
```

## Quick start

```cmd
docker compose up -d
START_MARKETPLACE.cmd
```

In another terminal:

```cmd
GO.cmd
```

- Sipariş UI: http://localhost:3000/siparis
- Admin: http://localhost:3000/admin/marketplace
- API health: http://localhost:4000/health

## API

| Method | Path | Description |
|--------|------|-------------|
| POST | `/orders/create` | Create order + unique deposit address |
| GET | `/orders/:id` | Full order |
| GET | `/orders/:id/status` | Status polling |
| POST | `/webhooks/payment` | Manual payment confirmation |
| GET | `/admin/*` | Admin (Bearer ADMIN_API_KEY) |

## Order flow

1. User selects payment chain (Ethereum / Base / Monad)
2. User selects destination chain + address (any valid address)
3. User picks gas package ($5 / $10 / $20 USDC)
4. System creates order with HD-derived unique deposit address
5. Payment monitor detects exact USDC transfer
6. Fulfillment worker sends gas from treasury
7. Status → COMPLETED

Orders expire after 30 minutes.

## Env

Copy `services/marketplace/.env.example` → `services/marketplace/.env`

Required for full E2E:
- `DEPOSIT_MASTER_MNEMONIC` (production)
- `EVM_OPERATOR_PRIVATE_KEY` / `SOLANA_PRIVATE_KEY` (treasury delivery)
- `ADMIN_API_KEY` (admin panel)
