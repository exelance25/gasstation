import "server-only";

import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";

type RateLimitEntry = { count: number; resetAt: number };

const WINDOW_MS = 60_000;
const memory = new Map<string, RateLimitEntry>();

function resolveStorePath(namespace: string): string | null {
  const configured = process.env.RATE_LIMIT_FILE?.trim();
  if (configured) return resolve(configured);
  if (process.env.NODE_ENV === "production") {
    return resolve(process.cwd(), ".data", `rate-limit-${namespace}.json`);
  }
  return null;
}

function loadDisk(path: string): Record<string, RateLimitEntry> {
  if (!existsSync(path)) return {};
  try {
    return JSON.parse(readFileSync(path, "utf8")) as Record<string, RateLimitEntry>;
  } catch {
    return {};
  }
}

function saveDisk(path: string, data: Record<string, RateLimitEntry>): void {
  try {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, JSON.stringify(data), "utf8");
  } catch {
    /* Vercel serverless — disk not writable; memory-only is enough */
  }
}

export function checkRateLimit(
  namespace: string,
  key: string,
  maxRequests: number,
  windowMs = WINDOW_MS,
): boolean {
  const now = Date.now();
  const diskPath = resolveStorePath(namespace);
  const storeKey = `${namespace}:${key}`;

  let entry = memory.get(storeKey);
  if (!entry && diskPath) {
    const disk = loadDisk(diskPath);
    entry = disk[storeKey];
    if (entry) memory.set(storeKey, entry);
  }

  if (!entry || now > entry.resetAt) {
    entry = { count: 1, resetAt: now + windowMs };
    memory.set(storeKey, entry);
    if (diskPath) {
      const disk = loadDisk(diskPath);
      disk[storeKey] = entry;
      saveDisk(diskPath, disk);
    }
    return true;
  }

  if (entry.count >= maxRequests) return false;
  entry.count += 1;
  memory.set(storeKey, entry);
  if (diskPath) {
    const disk = loadDisk(diskPath);
    disk[storeKey] = entry;
    saveDisk(diskPath, disk);
  }
  return true;
}

export function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}
