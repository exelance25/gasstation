/** Token written to ob_session for passwordless dev login */
export const QUICK_LOGIN_TOKEN = "guest-dev";

/**
 * Passwordless quick login — production/mainnet'te kapalı.
 * Dev: NEXT_PUBLIC_QUICK_LOGIN=false ile kapatılabilir.
 */
export function isQuickLoginEnabled(): boolean {
  const env = process.env.NEXT_PUBLIC_APP_ENV;
  if (env === "mainnet" || env === "staging") return false;
  return process.env.NEXT_PUBLIC_QUICK_LOGIN !== "false";
}
