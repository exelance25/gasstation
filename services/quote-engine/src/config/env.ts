import { z } from "zod";

const envSchema = z.object({
  QUOTE_ENGINE_PORT: z.coerce.number().default(4100),
  ORACLE_API_URL: z.string().default("http://localhost:3000/api/oracle/prices"),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  PRICE_SIGNER_PRIVATE_KEY: z.string().optional(),
  MAX_SOURCE_SPREAD_BPS: z.coerce.number().default(200), // %2 üzeri → quote reddet
  QUOTE_TTL_SEC: z.coerce.number().default(15),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

export function getEnv(): Env {
  if (!cached) cached = envSchema.parse(process.env);
  return cached;
}
