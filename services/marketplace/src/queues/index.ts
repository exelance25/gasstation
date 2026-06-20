import { Queue, Worker, type ConnectionOptions } from "bullmq";
import IORedis from "ioredis";
import { getEnv } from "../config/env.js";

export const QUEUE_NAMES = {
  PAYMENT: "pumpstation-payment",
  FULFILLMENT: "pumpstation-fulfillment",
  TREASURY: "pumpstation-treasury",
  EXPIRY: "pumpstation-expiry",
} as const;

let redis: IORedis | null = null;

export function getRedis(): IORedis {
  if (!redis) {
    redis = new IORedis(getEnv().REDIS_URL, { maxRetriesPerRequest: null });
  }
  return redis;
}

export function getRedisConnection(): ConnectionOptions {
  return getRedis() as unknown as ConnectionOptions;
}

export function createQueue(name: string): Queue {
  return new Queue(name, { connection: getRedisConnection() });
}

export function createWorker(
  name: string,
  processor: Parameters<typeof Worker>[1],
  opts?: { concurrency?: number },
): Worker {
  return new Worker(name, processor, {
    connection: getRedisConnection(),
    concurrency: opts?.concurrency ?? 2,
  });
}

export async function closeQueues(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}

export type PaymentJob = { orderId: string; txHash: string; chain: string };
export type FulfillmentJob = { orderId: string };
