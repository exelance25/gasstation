import { z } from "zod";

const envSchema = z.object({
  SETTLEMENT_PORT: z.coerce.number().default(4200),
  QUOTE_ENGINE_URL: z.string().default("http://localhost:4100"),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  SETTLEMENT_API_KEY: z.string().optional(),
  EVM_OPERATOR_PRIVATE_KEY: z.string().optional(),
  OPERATOR_PRIVATE_KEY: z.string().optional(),
  SOLANA_PRIVATE_KEY: z.string().optional(),
  SOLANA_TREASURY_ADDRESS: z.string().optional(),
  TREASURY_EVM_ADDRESS: z.string().optional(),
  ETH_RPC_URL: z.string().optional(),
  BASE_RPC_URL: z.string().optional(),
  MONAD_RPC_URL: z.string().optional(),
  SOLANA_RPC_URL: z.string().optional(),
  APP_ENV: z.enum(["development", "testnet", "staging", "mainnet"]).default("development"),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

export function getEnv(): Env {
  if (!cached) cached = envSchema.parse(process.env);
  return cached;
}

export function getOperatorKey(): `0x${string}` | null {
  const raw = (
    getEnv().EVM_OPERATOR_PRIVATE_KEY ?? getEnv().OPERATOR_PRIVATE_KEY
  )?.trim();
  if (!raw || raw.length < 64) return null;
  return (raw.startsWith("0x") ? raw : `0x${raw}`) as `0x${string}`;
}

export function getTreasuryEvm(): `0x${string}` | null {
  const raw = getEnv().TREASURY_EVM_ADDRESS?.trim();
  if (!raw?.startsWith("0x") || raw.length !== 42) return null;
  return raw as `0x${string}`;
}
