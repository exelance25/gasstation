export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  // Vercel build aşamasında env henüz tam değil — runtime'da tekrar kontrol edilir
  if (process.env.NEXT_PHASE === "phase-production-build") return;

  const {
    assertVaultSecretsNotPublic,
    assertNoTestPrivateKeysInProduction,
  } = await import("@/config/vault-security");
  const { validatePublicEnvKeys } = await import("@/config/client-env");

  assertVaultSecretsNotPublic();
  assertNoTestPrivateKeysInProduction();
  validatePublicEnvKeys();
}
