import type pg from "pg";
import type {
  CreateOrderInput,
  DeliveryAsset,
  OrderRow,
  OrderStatus,
  PackageAmount,
} from "../types/order.js";
import { getPool, withTransaction } from "../db/pool.js";
import { deriveDepositAddress } from "./hd-wallet.js";

function mapRow(row: OrderRow): OrderRow {
  return row;
}

export async function reserveDerivationIndex(client: pg.PoolClient): Promise<number> {
  const { rows } = await client.query<{ next_index: number }>(
    `UPDATE derivation_counter SET next_index = next_index + 1 WHERE id = 1 RETURNING next_index - 1 AS next_index`,
  );
  return rows[0]!.next_index;
}

export async function insertOrder(params: {
  orderId: string;
  input: CreateOrderInput;
  deliveryAmount: number;
  deliveryAsset: DeliveryAsset;
  depositAddress: string;
  derivationIndex: number;
  expiresAt: Date;
}): Promise<OrderRow> {
  const { rows } = await getPool().query<OrderRow>(
    `INSERT INTO orders (
      order_id, payment_chain, payment_token, payment_amount,
      destination_chain, destination_address, delivery_amount, delivery_asset,
      status, deposit_address, derivation_index, expires_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'PENDING_PAYMENT',$9,$10,$11)
    RETURNING *`,
    [
      params.orderId,
      params.input.paymentChain,
      params.input.paymentToken ?? "USDC",
      params.input.paymentAmount,
      params.input.destinationChain,
      params.input.destinationAddress.trim(),
      params.deliveryAmount,
      params.deliveryAsset,
      params.depositAddress,
      params.derivationIndex,
      params.expiresAt,
    ],
  );
  return mapRow(rows[0]!);
}

export async function createOrderRecord(
  orderId: string,
  input: CreateOrderInput,
  deliveryAmount: number,
  deliveryAsset: DeliveryAsset,
  expiresAt: Date,
): Promise<OrderRow> {
  return withTransaction(async (client) => {
    const derivationIndex = await reserveDerivationIndex(client);
    const depositAddress = deriveDepositAddress(derivationIndex);
    const { rows } = await client.query<OrderRow>(
      `INSERT INTO orders (
        order_id, payment_chain, payment_token, payment_amount,
        destination_chain, destination_address, delivery_amount, delivery_asset,
        status, deposit_address, derivation_index, expires_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'PENDING_PAYMENT',$9,$10,$11)
      RETURNING *`,
      [
        orderId,
        input.paymentChain,
        input.paymentToken ?? "USDC",
        input.paymentAmount,
        input.destinationChain,
        input.destinationAddress.trim(),
        deliveryAmount,
        deliveryAsset,
        depositAddress,
        derivationIndex,
        expiresAt,
      ],
    );
    return mapRow(rows[0]!);
  });
}

export async function getOrderById(orderId: string): Promise<OrderRow | null> {
  const { rows } = await getPool().query<OrderRow>(
    `SELECT * FROM orders WHERE order_id = $1`,
    [orderId],
  );
  return rows[0] ? mapRow(rows[0]) : null;
}

export async function getOrderByDepositAddress(
  depositAddress: string,
): Promise<OrderRow | null> {
  const { rows } = await getPool().query<OrderRow>(
    `SELECT * FROM orders WHERE LOWER(deposit_address) = LOWER($1) AND status = 'PENDING_PAYMENT'`,
    [depositAddress],
  );
  return rows[0] ? mapRow(rows[0]) : null;
}

export async function getPendingOrders(): Promise<OrderRow[]> {
  const { rows } = await getPool().query<OrderRow>(
    `SELECT * FROM orders WHERE status = 'PENDING_PAYMENT' AND expires_at > NOW() ORDER BY created_at ASC`,
  );
  return rows.map(mapRow);
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  extra?: {
    paymentTxHash?: string;
    deliveryTxHash?: string;
    failureReason?: string;
  },
): Promise<OrderRow | null> {
  const sets = ["status = $2", "updated_at = NOW()"];
  const values: unknown[] = [orderId, status];
  let idx = 3;

  if (extra?.paymentTxHash) {
    sets.push(`payment_tx_hash = $${idx++}`);
    values.push(extra.paymentTxHash);
    sets.push(`payment_confirmed_at = NOW()`);
  }
  if (extra?.deliveryTxHash) {
    sets.push(`delivery_tx_hash = $${idx++}`);
    values.push(extra.deliveryTxHash);
    sets.push(`completed_at = NOW()`);
  }
  if (extra?.failureReason) {
    sets.push(`failure_reason = $${idx++}`);
    values.push(extra.failureReason);
  }

  const { rows } = await getPool().query<OrderRow>(
    `UPDATE orders SET ${sets.join(", ")} WHERE order_id = $1 RETURNING *`,
    values,
  );
  return rows[0] ? mapRow(rows[0]) : null;
}

export async function markPaymentProcessed(
  txHash: string,
  orderId: string,
  chain: string,
  amount: PackageAmount,
): Promise<boolean> {
  try {
    await getPool().query(
      `INSERT INTO processed_payments (tx_hash, order_id, chain, amount) VALUES ($1,$2,$3,$4)`,
      [txHash, orderId, chain, amount],
    );
    return true;
  } catch {
    return false;
  }
}

export async function isPaymentTxProcessed(txHash: string): Promise<boolean> {
  const { rows } = await getPool().query(
    `SELECT 1 FROM processed_payments WHERE tx_hash = $1`,
    [txHash],
  );
  return rows.length > 0;
}

export async function expireStaleOrders(): Promise<number> {
  const { rowCount } = await getPool().query(
    `UPDATE orders SET status = 'EXPIRED', updated_at = NOW()
     WHERE status = 'PENDING_PAYMENT' AND expires_at <= NOW()`,
  );
  return rowCount ?? 0;
}

export async function listOrders(limit = 50, status?: OrderStatus): Promise<OrderRow[]> {
  if (status) {
    const { rows } = await getPool().query<OrderRow>(
      `SELECT * FROM orders WHERE status = $1 ORDER BY created_at DESC LIMIT $2`,
      [status, limit],
    );
    return rows.map(mapRow);
  }
  const { rows } = await getPool().query<OrderRow>(
    `SELECT * FROM orders ORDER BY created_at DESC LIMIT $1`,
    [limit],
  );
  return rows.map(mapRow);
}

export async function getRevenueStats(): Promise<{
  totalOrders: number;
  completedOrders: number;
  totalRevenueUsd: number;
}> {
  const { rows } = await getPool().query<{
    total_orders: string;
    completed_orders: string;
    total_revenue: string;
  }>(
    `SELECT
      COUNT(*)::text AS total_orders,
      COUNT(*) FILTER (WHERE status = 'COMPLETED')::text AS completed_orders,
      COALESCE(SUM(payment_amount) FILTER (WHERE status = 'COMPLETED'), 0)::text AS total_revenue
     FROM orders`,
  );
  const r = rows[0]!;
  return {
    totalOrders: Number(r.total_orders),
    completedOrders: Number(r.completed_orders),
    totalRevenueUsd: Number(r.total_revenue),
  };
}
