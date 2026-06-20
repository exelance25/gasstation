/**
 * Passkey / WebAuthn integration scaffold.
 * Wire @simplewebauthn/browser on the server + client when backend is ready.
 */
export const passkeyAuth = {
  isSupported(): boolean {
    return typeof window !== "undefined" && "PublicKeyCredential" in window;
  },

  async registerPlaceholder(userId: string) {
    return { userId, credentialId: null, status: "not_configured" as const };
  },

  async loginPlaceholder() {
    return { status: "not_configured" as const };
  }
};
