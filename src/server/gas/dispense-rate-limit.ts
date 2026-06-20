import "server-only";

import { checkRateLimit } from "@/server/security/rate-limit-store";

const MAX_REQUESTS = 20;
const WINDOW_MS = 60_000;

export function checkDispenseRateLimit(key: string): boolean {
  return checkRateLimit("dispense", key, MAX_REQUESTS, WINDOW_MS);
}
