"use client";

import { useCallback, useEffect, useState } from "react";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useAdminSession } from "@/hooks/useAdminSession";
import { messages } from "@/i18n/messages";

type FeedbackRow = {
  id: string;
  email: string;
  message: string;
  createdAt: number;
};

type KasaOverview = {
  env: string;
  balances: Array<{ label: string; symbol: string; amount: string; role: string }>;
  ledgerSummary: {
    totalDepositsUsd: number;
    totalRetainedUsd: number;
    count: number;
  };
  openOrders: Array<{ orderId: string; packageAmount: number; targetAsset: string }>;
};

type AdminOverlayPanelProps = {
  open: boolean;
  onClose: () => void;
};

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString("tr-TR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function notifyFeedbackChanged() {
  window.dispatchEvent(new Event("admin-feedback-changed"));
}

export function AdminOverlayPanel({ open, onClose }: AdminOverlayPanelProps) {
  const admin = useAdminSession();
  const { openConnectModal } = useConnectModal();
  const [kasa, setKasa] = useState<KasaOverview | null>(null);
  const [messages, setMessages] = useState<FeedbackRow[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadAdminData = useCallback(async () => {
    setLoadError(null);
    const [kasaRes, fbRes] = await Promise.all([
      fetch("/api/admin/kasa", { credentials: "include" }),
      fetch("/api/admin/feedback", { credentials: "include" }),
    ]);
    if (!kasaRes.ok) {
      setLoadError("Kasa verisi alınamadı.");
      setKasa(null);
      setMessages([]);
      return;
    }
    setKasa((await kasaRes.json()) as KasaOverview);
    if (fbRes.ok) {
      const fb = (await fbRes.json()) as { messages?: FeedbackRow[] };
      setMessages(Array.isArray(fb.messages) ? fb.messages : []);
    } else {
      setMessages([]);
    }
    notifyFeedbackChanged();
  }, []);

  const deleteMessage = useCallback(
    async (id: string) => {
      setDeletingId(id);
      try {
        const res = await fetch(`/api/admin/feedback?id=${encodeURIComponent(id)}`, {
          method: "DELETE",
          credentials: "include",
        });
        if (!res.ok) return;
        setMessages((prev) => prev.filter((m) => m.id !== id));
        if (expandedId === id) setExpandedId(null);
        notifyFeedbackChanged();
      } finally {
        setDeletingId(null);
      }
    },
    [expandedId],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open && admin.authenticated) void loadAdminData();
  }, [open, admin.authenticated, loadAdminData]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[400] flex items-start justify-center overflow-y-auto bg-black/70 p-4 pt-8 backdrop-blur-sm sm:pt-12"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-panel-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl rounded-2xl border border-white/10 bg-neutral-950 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <h2 id="admin-panel-title" className="text-lg font-bold text-white">
              {messages.admin.title}
            </h2>
            <p className="text-xs text-neutral-500">{messages.admin.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/10 px-2 py-1 text-sm text-neutral-400 hover:text-white"
            aria-label="Kapat"
          >
            ✕
          </button>
        </header>

        <div className="space-y-5 p-5">
          {!admin.configured && (
            <p className="rounded-xl border border-amber-500/30 bg-amber-950/20 px-4 py-3 text-sm text-amber-200">
              {messages.admin.notConfigured}
            </p>
          )}

          {admin.configured && !admin.authenticated && (
            <div className="rounded-xl border border-purple-500/30 bg-purple-950/20 p-5 text-center">
              {admin.adminWallet && (
                <p className="mb-3 text-xs text-neutral-500">
                  {messages.admin.expectedWallet}:{" "}
                  <code className="text-emerald-400">{admin.adminWallet.slice(0, 10)}…</code>
                </p>
              )}
              <p className="text-sm text-neutral-300">
                Connect the treasury admin wallet and sign to access the vault panel.
              </p>
              {!admin.isConnected ? (
                <button
                  type="button"
                  onClick={() => openConnectModal?.()}
                  className="mt-4 w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-500"
                >
                  {messages.admin.connectWallet}
                </button>
              ) : (
                <>
                  {admin.error && (
                    <p className="mt-3 text-sm text-red-400">{admin.error}</p>
                  )}
                  <button
                    type="button"
                    disabled={admin.signingIn}
                    onClick={() => void admin.signIn()}
                    className="mt-4 w-full rounded-lg bg-purple-600 px-4 py-3 text-sm font-bold text-white hover:bg-purple-500 disabled:opacity-50"
                  >
                    {admin.signingIn ? messages.admin.signingIn : messages.admin.signIn}
                  </button>
                </>
              )}
            </div>
          )}

          {admin.authenticated && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-emerald-400/90">Oturum açık — kasa verileri yüklendi</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => void loadAdminData()}
                    className="rounded border border-white/10 px-2 py-1 text-xs text-neutral-400 hover:text-white"
                  >
                    Yenile
                  </button>
                  <button
                    type="button"
                    onClick={() => void admin.signOut()}
                    className="rounded border border-white/10 px-2 py-1 text-xs text-neutral-400 hover:text-white"
                  >
                    Çıkış
                  </button>
                </div>
              </div>

              {loadError && <p className="text-sm text-red-400">{loadError}</p>}

              {kasa && (
                <>
                  <section className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                      Gerçekleşen hacim
                    </h3>
                    <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                      <Stat label="İşlem" value={String(kasa.ledgerSummary.count)} />
                      <Stat
                        label="Toplam depozit"
                        value={`$${kasa.ledgerSummary.totalDepositsUsd.toFixed(2)}`}
                      />
                      <Stat
                        label="Kasa marjı"
                        value={`$${kasa.ledgerSummary.totalRetainedUsd.toFixed(2)}`}
                      />
                    </div>
                  </section>

                  <section className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                      Kasa içeriği
                    </h3>
                    <ul className="mt-3 space-y-2">
                      {kasa.balances.map((b) => (
                        <li
                          key={`${b.label}-${b.symbol}`}
                          className="flex items-center justify-between gap-2 rounded-lg border border-white/5 bg-black/20 px-3 py-2 text-sm"
                        >
                          <span className="text-neutral-400">
                            {b.label}{" "}
                            <span className="text-[10px] uppercase text-neutral-600">
                              ({b.role})
                            </span>
                          </span>
                          <span className="font-mono text-emerald-300">
                            {b.amount} {b.symbol}
                          </span>
                        </li>
                      ))}
                      {kasa.balances.length === 0 && (
                        <li className="text-sm text-neutral-500">Bakiye okunamadı.</li>
                      )}
                    </ul>
                    {kasa.openOrders.length > 0 && (
                      <p className="mt-3 text-xs text-amber-400/90">
                        {kasa.openOrders.length} açık sipariş bekliyor
                      </p>
                    )}
                  </section>
                </>
              )}

              <section className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Kullanıcı mesajları
                </h3>
                {messages.length === 0 ? (
                  <p className="mt-3 text-sm text-neutral-500">Henüz mesaj yok.</p>
                ) : (
                  <ul className="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1">
                    {messages.map((m) => {
                      const expanded = expandedId === m.id;
                      return (
                        <li
                          key={m.id}
                          className="overflow-hidden rounded-lg border border-white/10 bg-black/25"
                        >
                          <div className="flex items-center gap-2 px-3 py-2.5">
                            <button
                              type="button"
                              onClick={() => setExpandedId(expanded ? null : m.id)}
                              className="min-w-0 flex-1 text-left"
                            >
                              <span className="block truncate text-sm font-medium text-[#f5e6c8]">
                                {m.email}
                              </span>
                              <span className="text-[10px] text-neutral-500">
                                {formatDate(m.createdAt)}
                                {!expanded ? " · açmak için tıkla" : ""}
                              </span>
                            </button>
                            <button
                              type="button"
                              disabled={deletingId === m.id}
                              onClick={() => void deleteMessage(m.id)}
                              className="shrink-0 rounded-lg p-2 text-neutral-400 transition hover:bg-red-950/40 hover:text-red-400 disabled:opacity-40"
                              aria-label="Mesajı sil"
                              title="Sil"
                            >
                              <TrashIcon />
                            </button>
                          </div>
                          {expanded && (
                            <div className="border-t border-white/5 bg-[#faf3dc]/5 px-3 py-2.5">
                              <p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-200">
                                {m.message}
                              </p>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
    </svg>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/5 bg-black/30 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wider text-neutral-500">{label}</p>
      <p className="mt-0.5 text-lg font-bold tabular-nums text-white">{value}</p>
    </div>
  );
}
