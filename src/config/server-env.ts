import "server-only";
import { z } from "zod";

const serverEnvSchema = z.object({
  SESSION_ENCRYPTION_KEY: z.string().min(32).optional(),
  API_SECRET_KEY: z.string().min(16).optional(),
  WALLETCONNECT_SECRET: z.string().optional(),
  ETH_RPC_PRIVATE_URL: z.string().url().optional(),
  BASE_RPC_PRIVATE_URL: z.string().url().optional(),
  RELAYER_PRIVATE_KEY: z.string().min(64).optional(),
  ENTRY_POINT_ADDRESS: z.string().optional(),
  ADMIN_WALLET_ADDRESS: z.string().optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function getServerEnv(): ServerEnv {
  return serverEnvSchema.parse({
    SESSION_ENCRYPTION_KEY: process.env.SESSION_ENCRYPTION_KEY,
    API_SECRET_KEY: process.env.API_SECRET_KEY,
    WALLETCONNECT_SECRET: process.env.WALLETCONNECT_SECRET,
    ETH_RPC_PRIVATE_URL: process.env.ETH_RPC_PRIVATE_URL,
    BASE_RPC_PRIVATE_URL: process.env.BASE_RPC_PRIVATE_URL,
    RELAYER_PRIVATE_KEY: process.env.RELAYER_PRIVATE_KEY,
    ENTRY_POINT_ADDRESS: process.env.ENTRY_POINT_ADDRESS,
    ADMIN_WALLET_ADDRESS: process.env.ADMIN_WALLET_ADDRESS,
    NODE_ENV: process.env.NODE_ENV,
  });
}

export function assertNoSecretLeak(key: string): void {
  if (key.startsWith("NEXT_PUBLIC_")) {
    throw new Error(`Secret key "${key}" must not use NEXT_PUBLIC_ prefix`);
  }
}
