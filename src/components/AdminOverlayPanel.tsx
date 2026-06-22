"use client";

import { useCallback, useEffect, useState } from "react";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useAdminSession } from "@/hooks/useAdminSession";
import { adminTr } from "@/i18n/admin-tr";

type FeedbackRow = {
  id: string;
  email: string;
  message: string;
  createdAt: number;
};

type KasaOverview = {
  balances: Array<{ label: string; symbol: string; amount: string; role: string }>;
  ledgerSummary: {
    totalDepositsUsd: number;
    totalRetainedUsd: number;
    count: number;
  };
  platformStats?: {
    uniqueUsers: number;
    completedTransactions: number;
    profitMarginPercent: number;
  };
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
  const [feedbackList, setFeedbackList] = useState<FeedbackRow[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [kasaError, setKasaError] = useState<string | null>(null);

  const loadAdminData = useCallback(async () => {
    setKasaError(null);
    const [kasaRes, fbRes] = await Promise.all([
      fetch("/api/admin/kasa", { credentials: "include" }),
      fetch("/api/admin/feedback", { credentials: "include" }),
    ]);

    if (kasaRes.ok) {
      setKasa((await kasaRes.json()) as KasaOverview);
    } else {
      setKasa(null);
      setKasaError(adminTr.loadFailed);
    }

    if (fbRes.ok) {
      const fb = (await fbRes.json()) as { messages?: FeedbackRow[] };
      setFeedbackList(Array.isArray(fb.messages) ? fb.messages : []);
    } else {
      setFeedbackList([]);
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
        setFeedbackList((prev) => prev.filter((m) => m.id !== id));
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
    if (!open) return;
    if (admin.authenticated) void loadAdminData();
    else {
      setKasa(null);
      setFeedbackList([]);
      setKasaError(null);
    }
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
              {adminTr.title}
            </h2>
            <p className="text-xs text-neutral-500">{adminTr.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/10 px-2 py-1 text-sm text-neutral-400 hover:text-white"
            aria-label={adminTr.close}
          >
            ✕
          </button>
        </header>

        <div className="space-y-5 p-5">
          {!admin.configured && (
            <p className="rounded-xl border border-amber-500/30 bg-amber-950/20 px-4 py-3 text-sm text-amber-200">
              {adminTr.notConfigured}
            </p>
          )}

          {admin.configured && !admin.authenticated && (
            <div className="rounded-xl border border-purple-500/30 bg-purple-950/20 p-6 text-center">
              {!admin.isConnected ? (
                <>
                  <p className="text-sm text-neutral-300">{adminTr.signInPrompt}</p>
                  <button
                    type="button"
                    onClick={() => openConnectModal?.()}
                    className="mt-5 w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-500"
                  >
                    {adminTr.connectWallet}
                  </button>
                </>
              ) : (
                <>
                  <p className="text-sm text-neutral-300">{adminTr.verifyDetail}</p>
                  {admin.error && (
                    <p className="mt-3 text-sm text-red-400">{admin.error}</p>
                  )}
                  <button
                    type="button"
                    disabled={admin.signingIn}
                    onClick={() => void admin.signIn()}
                    className="mt-5 w-full rounded-lg bg-purple-600 px-4 py-3 text-sm font-bold text-white hover:bg-purple-500 disabled:opacity-50"
                  >
                    {admin.signingIn ? adminTr.signingIn : adminTr.signIn}
                  </button>
                </>
              )}
            </div>
          )}

          {admin.authenticated && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-emerald-400/90">{adminTr.sessionOpen}</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => void loadAdminData()}
                    className="rounded border border-white/10 px-2 py-1 text-xs text-neutral-400 hover:text-white"
                  >
                    {adminTr.refresh}
                  </button>
                  <button
                    type="button"
                    onClick={() => void admin.signOut()}
                    className="rounded border border-white/10 px-2 py-1 text-xs text-neutral-400 hover:text-white"
                  >
                    {adminTr.signOut}
                  </button>
                </div>
              </div>

              {kasaError && <p className="text-sm text-red-400">{kasaError}</p>}

              {kasa?.platformStats && (
                <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <KpiCard
                    label={adminTr.kpiUsers}
                    value={String(kasa.platformStats.uniqueUsers)}
                    hint={adminTr.kpiUsersHint}
                  />
                  <KpiCard
                    label={adminTr.kpiMarginRate}
                    value={`${kasa.platformStats.profitMarginPercent.toFixed(1)}%`}
                    hint={adminTr.kpiMarginRateHint}
                  />
                  <KpiCard
                    label={adminTr.kpiTransactions}
                    value={String(kasa.platformStats.completedTransactions)}
                    hint={`$${kasa.ledgerSummary.totalRetainedUsd.toFixed(2)} ${adminTr.margin.toLowerCase()}`}
                  />
                </section>
              )}

              {kasa && (
                <section className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    {adminTr.vaultContents}
                  </h3>
                  <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto">
                    {kasa.balances.map((b) => (
                      <li
                        key={`${b.label}-${b.symbol}`}
                        className="flex items-center justify-between gap-2 rounded-lg border border-white/5 bg-black/20 px-3 py-2 text-sm"
                      >
                        <span className="text-neutral-400">{b.label}</span>
                        <span className="font-mono text-emerald-300">
                          {b.amount} {b.symbol}
                        </span>
                      </li>
                    ))}
                    {kasa.balances.length === 0 && (
                      <li className="text-sm text-neutral-500">{adminTr.balanceUnreadable}</li>
                    )}
                  </ul>
                </section>
              )}

              <section className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  {adminTr.userMessages}
                </h3>
                {feedbackList.length === 0 ? (
                  <p className="mt-3 text-sm text-neutral-500">{adminTr.noMessages}</p>
                ) : (
                  <ul className="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1">
                    {feedbackList.map((m) => {
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
                                {!expanded ? adminTr.clickToExpand : ""}
                              </span>
                            </button>
                            <button
                              type="button"
                              disabled={deletingId === m.id}
                              onClick={() => void deleteMessage(m.id)}
                              className="shrink-0 rounded-lg p-2 text-neutral-400 transition hover:bg-red-950/40 hover:text-red-400 disabled:opacity-40"
                              aria-label={adminTr.deleteMessage}
                              title={adminTr.deleteMessage}
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

function KpiCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-300">{value}</p>
      <p className="mt-1 text-[10px] leading-snug text-neutral-500">{hint}</p>
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
