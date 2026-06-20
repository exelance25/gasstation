const STORAGE_PREFIX = "ob_enc_";

function toBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

function fromBase64(value: string): Uint8Array {
  const binary = atob(value);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

export async function encryptSessionPayload(payload: string, deviceKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(deviceKey.padEnd(32, "0").slice(0, 32)),
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    keyMaterial,
    encoder.encode(payload)
  );
  return `${STORAGE_PREFIX}${toBase64(iv)}.${toBase64(new Uint8Array(cipher))}`;
}

export async function decryptSessionPayload(encrypted: string, deviceKey: string): Promise<string | null> {
  if (!encrypted.startsWith(STORAGE_PREFIX)) return null;
  try {
    const [, payload] = encrypted.split(STORAGE_PREFIX);
    const [ivB64, dataB64] = payload.split(".");
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(deviceKey.padEnd(32, "0").slice(0, 32)),
      { name: "AES-GCM" },
      false,
      ["decrypt"]
    );
    const iv = fromBase64(ivB64);
    const data = fromBase64(dataB64);
    const plain = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv as BufferSource },
      keyMaterial,
      data as BufferSource,
    );
    return decoder.decode(plain);
  } catch {
    return null;
  }
}
