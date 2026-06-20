export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const {
    assertVaultSecretsNotPublic,
    assertNoTestPrivateKeysInProduction,
  } = await import("@/config/vault-security");
  const { validatePublicEnvKeys } = await import("@/config/client-env");

  assertVaultSecretsNotPublic();
  assertNoTestPrivateKeysInProduction();
  validatePublicEnvKeys();
}
