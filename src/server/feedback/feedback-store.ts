import "server-only";

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { isEphemeralRuntime } from "@/server/gas/signed-ticket";

export type FeedbackMessage = {
  id: string;
  email: string;
  message: string;
  createdAt: number;
  read: boolean;
};

type FeedbackStore = { messages: FeedbackMessage[] };

const MAX_MESSAGES = 5_000;
const BLOB_PREFIX = "gasstation/feedback/";
const UPSTASH_KEY = "gasstation:feedback-messages";

function nextId(): string {
  return `FB-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

function localStorePath(): string {
  const configured = process.env.FEEDBACK_FILE?.trim();
  if (configured) return resolve(configured);
  if (isEphemeralRuntime()) {
    return "/tmp/feedback-messages.json";
  }
  return resolve(process.cwd(), ".data", "feedback-messages.json");
}

function loadStoreFromFile(): FeedbackStore {
  const path = localStorePath();
  if (!existsSync(path)) return { messages: [] };
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8")) as FeedbackStore;
    return Array.isArray(parsed.messages) ? parsed : { messages: [] };
  } catch {
    return { messages: [] };
  }
}

function saveStoreToFile(store: FeedbackStore): boolean {
  try {
    const path = localStorePath();
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, JSON.stringify(store, null, 2), "utf8");
    return true;
  } catch {
    return false;
  }
}

function blobToken(): string | null {
  return process.env.BLOB_READ_WRITE_TOKEN?.trim() || null;
}

function upstashConfig(): { url: string; token: string } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;
  return { url, token };
}

async function appendToBlob(entry: FeedbackMessage): Promise<boolean> {
  const token = blobToken();
  if (!token) return false;
  try {
    const { put } = await import("@vercel/blob");
    await put(`${BLOB_PREFIX}${entry.id}.json`, JSON.stringify(entry), {
      access: "public",
      addRandomSuffix: false,
      token,
      contentType: "application/json",
    });
    return true;
  } catch {
    return false;
  }
}

async function listFromBlob(): Promise<FeedbackMessage[] | null> {
  const token = blobToken();
  if (!token) return null;
  try {
    const { list } = await import("@vercel/blob");
    const { blobs } = await list({ prefix: BLOB_PREFIX, token, limit: MAX_MESSAGES });
    const messages: FeedbackMessage[] = [];
    for (const blob of blobs) {
      const res = await fetch(blob.url, { cache: "no-store" });
      if (!res.ok) continue;
      const item = (await res.json()) as FeedbackMessage;
      if (item?.id) messages.push(item);
    }
    return messages;
  } catch {
    return null;
  }
}

async function deleteFromBlob(id: string): Promise<boolean> {
  const token = blobToken();
  if (!token) return false;
  try {
    const { del } = await import("@vercel/blob");
    await del(`${BLOB_PREFIX}${id}.json`, { token });
    return true;
  } catch {
    return false;
  }
}

async function loadStoreFromUpstash(): Promise<FeedbackStore | null> {
  const cfg = upstashConfig();
  if (!cfg) return null;
  try {
    const res = await fetch(`${cfg.url}/get/${UPSTASH_KEY}`, {
      headers: { Authorization: `Bearer ${cfg.token}` },
      cache: "no-store",
    });
    if (!res.ok) return { messages: [] };
    const data = (await res.json()) as { result?: string | null };
    if (!data.result) return { messages: [] };
    const parsed = JSON.parse(data.result) as FeedbackStore;
    return Array.isArray(parsed.messages) ? parsed : { messages: [] };
  } catch {
    return null;
  }
}

async function saveStoreToUpstash(store: FeedbackStore): Promise<boolean> {
  const cfg = upstashConfig();
  if (!cfg) return false;
  try {
    const res = await fetch(`${cfg.url}/set/${UPSTASH_KEY}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${cfg.token}` },
      body: JSON.stringify(store),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function loadStore(): Promise<FeedbackStore> {
  const fromBlob = await listFromBlob();
  if (fromBlob) return { messages: fromBlob };

  const fromUpstash = await loadStoreFromUpstash();
  if (fromUpstash) return fromUpstash;

  return loadStoreFromFile();
}

async function saveStore(store: FeedbackStore): Promise<boolean> {
  if (await saveStoreToUpstash(store)) return true;
  return saveStoreToFile(store);
}

async function notifyFeedbackWebhook(entry: FeedbackMessage): Promise<boolean> {
  const url = process.env.FEEDBACK_WEBHOOK_URL?.trim();
  if (!url) return false;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: [
          "**GASSTATION — Contact & feedback**",
          `Email: ${entry.email}`,
          `ID: ${entry.id}`,
          "",
          entry.message || "—",
        ].join("\n"),
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function notifyViaFormSubmit(entry: FeedbackMessage): Promise<boolean> {
  const inbox = process.env.FEEDBACK_NOTIFY_EMAIL?.trim();
  if (!inbox) return false;
  try {
    const res = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(inbox)}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        name: entry.email,
        email: entry.email,
        message: entry.message || "—",
        _subject: `GASSTATION feedback ${entry.id}`,
        _template: "table",
      }),
    });
    if (!res.ok) return false;
    const data = (await res.json().catch(() => ({}))) as { success?: string };
    return data.success === "true";
  } catch {
    return false;
  }
}

export async function createFeedbackMessage(input: {
  email: string;
  message: string;
}): Promise<FeedbackMessage> {
  const entry: FeedbackMessage = {
    id: nextId(),
    email: input.email.trim().toLowerCase(),
    message: input.message.trim(),
    createdAt: Date.now(),
    read: false,
  };

  let persisted = false;

  if (blobToken()) {
    persisted = await appendToBlob(entry);
  }

  if (!persisted) {
    const store = await loadStore();
    store.messages.push(entry);
    if (store.messages.length > MAX_MESSAGES) {
      store.messages = store.messages.slice(-MAX_MESSAGES);
    }
    persisted = await saveStore(store);
  }

  const webhookOk = await notifyFeedbackWebhook(entry);
  const emailOk = await notifyViaFormSubmit(entry);

  if (!persisted && !webhookOk && !emailOk) {
    if (isEphemeralRuntime()) {
      throw new Error(
        "Feedback storage is not configured. In Vercel: Storage → Blob (or Upstash Redis), or set FEEDBACK_NOTIFY_EMAIL.",
      );
    }
    throw new Error("Could not save feedback. Please try again later.");
  }

  return entry;
}

export async function listFeedbackMessages(limit = 200): Promise<FeedbackMessage[]> {
  return (await loadStore())
    .messages.sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, limit);
}

export async function deleteFeedbackMessage(id: string): Promise<boolean> {
  if (blobToken()) {
    const deleted = await deleteFromBlob(id);
    if (deleted) return true;
  }

  const store = await loadStore();
  const before = store.messages.length;
  store.messages = store.messages.filter((m) => m.id !== id);
  if (store.messages.length === before) return false;
  return saveStore(store);
}
