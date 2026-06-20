import { expireStaleOrders } from "../db/orders-repo.js";
import { createQueue, createWorker, QUEUE_NAMES } from "../queues/index.js";

export function startExpiryWorker(): ReturnType<typeof createWorker> {
  const q = createQueue(QUEUE_NAMES.EXPIRY);
  void q.add("expire", {}, { repeat: { every: 60_000 }, removeOnComplete: 20 });
  return createWorker(QUEUE_NAMES.EXPIRY, async () => {
    const count = await expireStaleOrders();
    if (count > 0) console.log(`[expiry] ${count} sipariş süresi doldu`);
  });
}
