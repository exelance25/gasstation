import type { Job } from "bullmq";
import {
  getOrderById,
  getPendingOrders,
  isPaymentTxProcessed,
  markPaymentProcessed,
  updateOrderStatus,
} from "../db/orders-repo.js";
import { checkUsdcDeposit } from "../blockchain/evm.js";
import type { PaymentChain } from "../types/order.js";
import {
  createQueue,
  createWorker,
  QUEUE_NAMES,
  type FulfillmentJob,
  type PaymentJob,
} from "../queues/index.js";

const fulfillmentQueue = createQueue(QUEUE_NAMES.FULFILLMENT);

async function processPaymentDetection(): Promise<void> {
  const pending = await getPendingOrders();
  for (const order of pending) {
    const result = await checkUsdcDeposit({
      paymentChain: order.payment_chain as PaymentChain,
      depositAddress: order.deposit_address,
      expectedAmount: Number(order.payment_amount),
    });
    if (!result.found || !result.txHash) continue;
    if (await isPaymentTxProcessed(result.txHash)) continue;

    const inserted = await markPaymentProcessed(
      result.txHash,
      order.order_id,
      order.payment_chain,
      Number(order.payment_amount) as 0.05 | 0.1 | 0.2,
    );
    if (!inserted) continue;

    await updateOrderStatus(order.order_id, "PAYMENT_CONFIRMED", {
      paymentTxHash: result.txHash,
    });
    await fulfillmentQueue.add("deliver", { orderId: order.order_id } satisfies FulfillmentJob);
  }
}

export function startPaymentMonitorWorker(): ReturnType<typeof createWorker> {
  const paymentQueue = createQueue(QUEUE_NAMES.PAYMENT);
  void paymentQueue.add(
    "scan",
    {},
    { repeat: { every: 15_000 }, removeOnComplete: 100, removeOnFail: 50 },
  );

  return createWorker(QUEUE_NAMES.PAYMENT, async (_job: Job) => {
    await processPaymentDetection();
  });
}

export async function handlePaymentWebhook(job: PaymentJob): Promise<void> {
  const order = await getOrderById(job.orderId);
  if (!order || order.status !== "PENDING_PAYMENT") return;
  if (await isPaymentTxProcessed(job.txHash)) return;

  const inserted = await markPaymentProcessed(
    job.txHash,
    job.orderId,
    job.chain,
    Number(order.payment_amount) as 0.05 | 0.1 | 0.2,
  );
  if (!inserted) return;

  await updateOrderStatus(job.orderId, "PAYMENT_CONFIRMED", {
    paymentTxHash: job.txHash,
  });
  await fulfillmentQueue.add("deliver", { orderId: job.orderId });
}
