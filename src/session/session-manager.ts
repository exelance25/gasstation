"use client";

import { decryptSessionPayload, encryptSessionPayload } from "@/encryption/session-crypto";

const DEVICE_KEY_STORAGE = "ob_device_key";
const SESSION_STORAGE = "ob_secure_session";

function getOrCreateDeviceKey(): string {
  if (typeof window === "undefined") return "server";
  let key = localStorage.getItem(DEVICE_KEY_STORAGE);
  if (!key) {
    key = crypto.randomUUID().replace(/-/g, "");
    localStorage.setItem(DEVICE_KEY_STORAGE, key);
  }
  return key;
}

export type SecureSession = {
  userId: string;
  email?: string;
  walletLinked: boolean;
  createdAt: string;
  expiresAt: string;
};

export const sessionManager = {
  async save(session: SecureSession): Promise<void> {
    const deviceKey = getOrCreateDeviceKey();
    const encrypted = await encryptSessionPayload(JSON.stringify(session), deviceKey);
    localStorage.setItem(SESSION_STORAGE, encrypted);
  },

  async load(): Promise<SecureSession | null> {
    const raw = localStorage.getItem(SESSION_STORAGE);
    if (!raw) return null;
    const deviceKey = getOrCreateDeviceKey();
    const decrypted = await decryptSessionPayload(raw, deviceKey);
    if (!decrypted) {
      localStorage.removeItem(SESSION_STORAGE);
      return null;
    }
    const session = JSON.parse(decrypted) as SecureSession;
    if (new Date(session.expiresAt).getTime() < Date.now()) {
      sessionManager.clear();
      return null;
    }
    return session;
  },

  clear(): void {
    localStorage.removeItem(SESSION_STORAGE);
  },

  async invalidateServerSession(): Promise<void> {
    await fetch("/api/auth/session", { method: "DELETE" });
    sessionManager.clear();
  }
};
