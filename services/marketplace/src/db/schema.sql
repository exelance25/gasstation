-- GASSTATION Cross-Chain Gas Marketplace schema

CREATE TABLE IF NOT EXISTS orders (
  id              BIGSERIAL PRIMARY KEY,
  order_id        UUID NOT NULL UNIQUE,
  payment_chain   TEXT NOT NULL,
  payment_token   TEXT NOT NULL DEFAULT 'USDC',
  payment_amount  NUMERIC(18, 6) NOT NULL,
  destination_chain TEXT NOT NULL,
  destination_address TEXT NOT NULL,
  delivery_amount NUMERIC(36, 18) NOT NULL,
  delivery_asset  TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'PENDING_PAYMENT',
  deposit_address TEXT NOT NULL,
  derivation_index INTEGER NOT NULL UNIQUE,
  payment_tx_hash TEXT UNIQUE,
  delivery_tx_hash TEXT UNIQUE,
  expires_at      TIMESTAMPTZ NOT NULL,
  payment_confirmed_at TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  failure_reason  TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_deposit_address ON orders(deposit_address);
CREATE INDEX IF NOT EXISTS idx_orders_expires_at ON orders(expires_at) WHERE status = 'PENDING_PAYMENT';

CREATE TABLE IF NOT EXISTS treasury_snapshots (
  id          BIGSERIAL PRIMARY KEY,
  chain       TEXT NOT NULL,
  asset       TEXT NOT NULL,
  balance     NUMERIC(36, 18) NOT NULL,
  threshold   NUMERIC(36, 18) NOT NULL,
  is_low      BOOLEAN NOT NULL DEFAULT FALSE,
  checked_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_treasury_snapshots_chain ON treasury_snapshots(chain, checked_at DESC);

CREATE TABLE IF NOT EXISTS processed_payments (
  id          BIGSERIAL PRIMARY KEY,
  tx_hash     TEXT NOT NULL UNIQUE,
  order_id    UUID NOT NULL REFERENCES orders(order_id),
  chain       TEXT NOT NULL,
  amount      NUMERIC(18, 6) NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS derivation_counter (
  id    INTEGER PRIMARY KEY DEFAULT 1,
  next_index INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT single_row CHECK (id = 1)
);

INSERT INTO derivation_counter (id, next_index) VALUES (1, 0) ON CONFLICT (id) DO NOTHING;
