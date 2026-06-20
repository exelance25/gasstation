import "server-only";

import { listDeliveredOrderStats } from "@/server/gas/gas-order-stats";

export type PublicPlatformStats = {
  uniqueUsers: number;
  completedTransactions: number;
  updatedAt: string;
};

export function getPublicPlatformStats(): PublicPlatformStats {
  const { uniqueUsers, completedTransactions } = listDeliveredOrderStats();
  return {
    uniqueUsers,
    completedTransactions,
    updatedAt: new Date().toISOString(),
  };
}
