import "server-only";

import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";

export type FeedbackMessage = {
  id: string;
  email: string;
  message: string;
  createdAt: number;
  read: boolean;
};

type FeedbackStore = { messages: FeedbackMessage[] };

const MAX_MESSAGES = 5_000;

function storePath(): string {
  const configured = process.env.FEEDBACK_FILE?.trim();
  if (configured) return resolve(configured);
  return resolve(process.cwd(), ".data", "feedback-messages.json");
}

function loadStore(): FeedbackStore {
  const path = storePath();
  if (!existsSync(path)) return { messages: [] };
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8")) as FeedbackStore;
    return Array.isArray(parsed.messages) ? parsed : { messages: [] };
  } catch {
    return { messages: [] };
  }
}

function saveStore(store: FeedbackStore): void {
  const path = storePath();
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(store, null, 2), "utf8");
}

function nextId(): string {
  return `FB-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export function createFeedbackMessage(input: {
  email: string;
  message: string;
}): FeedbackMessage {
  const store = loadStore();
  const entry: FeedbackMessage = {
    id: nextId(),
    email: input.email.trim().toLowerCase(),
    message: input.message.trim(),
    createdAt: Date.now(),
    read: false,
  };
  store.messages.push(entry);
  if (store.messages.length > MAX_MESSAGES) {
    store.messages = store.messages.slice(-MAX_MESSAGES);
  }
  saveStore(store);
  return entry;
}

export function listFeedbackMessages(limit = 200): FeedbackMessage[] {
  return loadStore()
    .messages.sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, limit);
}

export function deleteFeedbackMessage(id: string): boolean {
  const store = loadStore();
  const before = store.messages.length;
  store.messages = store.messages.filter((m) => m.id !== id);
  if (store.messages.length === before) return false;
  saveStore(store);
  return true;
}
