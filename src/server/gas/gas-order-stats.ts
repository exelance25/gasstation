import "server-only";

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

type OrderRow = {
  depositorAddress: string;
  status: string;
};

function loadOrders(): OrderRow[] {
  const configured = process.env.GAS_ORDER_FILE?.trim();
  const path = configured ? resolve(configured) : resolve(process.cwd(), ".data", "gas-orders.json");
  if (!existsSync(path)) return [];
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8")) as { orders?: OrderRow[] };
    return Array.isArray(parsed.orders) ? parsed.orders : [];
  } catch {
    return [];
  }
}

export function listDeliveredOrderStats(): {
  uniqueUsers: number;
  completedTransactions: number;
} {
  const orders = loadOrders();
  const delivered = orders.filter((o) => o.status === "delivered");
  const wallets = new Set(
    delivered.map((o) => o.depositorAddress?.trim().toLowerCase()).filter(Boolean),
  );
  return {
    uniqueUsers: wallets.size,
    completedTransactions: delivered.length,
  };
}
