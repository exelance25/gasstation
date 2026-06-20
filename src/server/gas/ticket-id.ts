import "server-only";

import { randomBytes } from "node:crypto";

/** GP-7K2M9X style okunabilir bilet kodu */
export function generateTicketId(prefix: "GP" | "GO"): string {
  const body = randomBytes(6).toString("base64url").replace(/[-_]/g, "").slice(0, 8).toUpperCase();
  return `${prefix}-${body}`;
}
