import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  MARKETPLACE_PORT: z.coerce.number().default(4000),
  DATABASE_URL: z
    .string()
    .default("postgresql://gasstation:gasstation_dev@localhost:5432/gasstation_marketplace"),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  DEPOSIT_MASTER_MNEMONIC: z.string().optional(),
  EVM_OPERATOR_PRIVATE_KEY: z.string().optional(),
  OPERATOR_PRIVATE_KEY: z.string().optional(),
  SOLANA_PRIVATE_KEY: z.string().optional(),
  APP_ENV: z.enum(["development", "testnet", "staging", "mainnet"]).default("development"),
  ETH_RPC_URL: z.string().optional(),
  BASE_RPC_URL: z.string().optional(),
  MONAD_RPC_URL: z.string().optional(),
  SOLANA_RPC_URL: z.string().optional(),
  ORACLE_API_URL: z.string().default("http://localhost:3000/api/oracle/quote"),
  QUOTE_ENGINE_URL: z.string().default("http://localhost:4100"),
  SETTLEMENT_ENGINE_URL: z.string().default("http://localhost:4200"),
  ORDER_EXPIRY_MINUTES: z.coerce.number().default(30),
  ADMIN_API_KEY: z.string().optional(),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

export function getEnv(): Env {
  if (!cached) {
    cached = envSchema.parse(process.env);
  }
  return cached;
}

export function isMainnet(): boolean {
  return getEnv().APP_ENV === "mainnet";
}

export function getOperatorKey(): `0x${string}` | null {
  const raw = (
    getEnv().EVM_OPERATOR_PRIVATE_KEY ?? getEnv().OPERATOR_PRIVATE_KEY
  )?.trim();
  if (!raw || raw.length < 64) return null;
  return (raw.startsWith("0x") ? raw : `0x${raw}`) as `0x${string}`;
}
