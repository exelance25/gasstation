const SESSION_KEY = "onebalance.session.v1";

export const secureStorage = {
  setEncryptedSession(payload: string) {
    if (typeof window === "undefined") return;
    const encoded = btoa(payload);
    window.localStorage.setItem(SESSION_KEY, encoded);
  },
  getEncryptedSession() {
    if (typeof window === "undefined") return null;
    const encoded = window.localStorage.getItem(SESSION_KEY);
    if (!encoded) return null;
    try {
      return atob(encoded);
    } catch {
      return null;
    }
  },
  clearSession() {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(SESSION_KEY);
  }
};
