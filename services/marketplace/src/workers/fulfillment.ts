import type { Job } from "bullmq";
import { isAddress, type Address } from "viem";
import { getOrderById, updateOrderStatus } from "../db/orders-repo.js";
import { sendEvmNativeGas } from "../blockchain/evm.js";
import { sendSolanaGas } from "../blockchain/solana.js";
import type { DeliveryChain } from "../types/order.js";
import { createWorker, QUEUE_NAMES, type FulfillmentJob } from "../queues/index.js";
import { getOperatorKey } from "../config/env.js";

async function fulfillOrder(orderId: string): Promise<void> {
  const order = await getOrderById(orderId);
  if (!order) return;
  if (order.status !== "PAYMENT_CONFIRMED" && order.status !== "FULFILLING") return;

  await updateOrderStatus(orderId, "FULFILLING");

  try {
    const dest = order.destination_chain as DeliveryChain;
    const amount = Number(order.delivery_amount);
    let deliveryTxHash: string;

    if (dest === "solana") {
      deliveryTxHash = await sendSolanaGas({
        to: order.destination_address,
        amountSol: amount,
      });
    } else {
      if (!isAddress(order.destination_address)) {
        throw new Error("Geçersiz EVM hedef adresi");
      }
      const asset = order.delivery_asset as "ETH" | "BASE" | "MON";
      const chain = dest as "ethereum" | "base" | "monad";
      if (!getOperatorKey()) {
        throw new Error("EVM treasury yapılandırılmamış");
      }
      deliveryTxHash = await sendEvmNativeGas({
        chain,
        to: order.destination_address as Address,
        amount,
        asset,
      });
    }

    await updateOrderStatus(orderId, "COMPLETED", { deliveryTxHash });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Teslimat başarısız";
    await updateOrderStatus(orderId, "FAILED", { failureReason: message });
  }
}

export function startFulfillmentWorker(): ReturnType<typeof createWorker> {
  return createWorker(
    QUEUE_NAMES.FULFILLMENT,
    async (job: Job<FulfillmentJob>) => {
      await fulfillOrder(job.data.orderId);
    },
    { concurrency: 3 },
  );
}
