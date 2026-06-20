"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useAdminSession } from "@/hooks/useAdminSession";

type KasaOverview = {
  env: string;
  configured: { evmOperator: boolean; solanaOperator: boolean; collector: boolean };
  addresses: { collector: string | null; operator: string | null };
  balances: Array<{
    label: string;
    symbol: string;
    amount: string;
    role: string;
  }>;
  ledgerSummary: {
    totalDepositsUsd: number;
    totalRetainedUsd: number;
    totalGasBudgetUsd: number;
    count: number;
  };
  ledger: Array<{
    at: string;
    depositTxHash: string;
    deliveryTxHash: string;
    packageUsd: number;
    targetAsset: string;
    targetAddress: string;
    estimatedGasAmount: number;
    treasuryRetainedUsd: number;
  }>;
  recentDispenses: Array<{
    depositTxHash: string;
    deliveryTxHash: string;
    at: number;
    chainId: number;
  }>;
  openOrders: Array<{
    orderId: string;
    passId: string;
    status: string;
    packageAmount: number;
    targetAsset: string;
    paySymbol: string;
    depositorAddress: string;
    createdAt: number;
  }>;
  activePasses: Array<{
    passId: string;
    walletAddress: string;
    expiresAt: number;
  }>;
};

function shortAddr(a: string): string {
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

export default function AdminKasaPage() {
  const admin = useAdminSession();
  const { openConnectModal } = useConnectModal();
  const { isConnected } = admin;
  const [data, setData] = useState<KasaOverview | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryTx, setRetryTx] = useState("");
  const [retryMsg, setRetryMsg] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);

  const load = useCallback(async () => {
    setLoadError(null);
    const res = await fetch("/api/admin/kasa", { credentials: "include" });
    if (!res.ok) {
      setLoadError("Kasa verisi alınamadı — admin girişi gerekli");
      setData(null);
      return;
    }
    setData((await res.json()) as KasaOverview);
  }, []);

  useEffect(() => {
    if (admin.authenticated) void load();
  }, [admin.authenticated, load]);

  const handleRetry = async () => {
    const hash = retryTx.trim();
    if (!hash) return;
    setRetrying(true);
    setRetryMsg(null);
    try {
      const res = await fetch("/api/admin/kasa/retry", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ txHash: hash }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Retry başarısız");
      setRetryMsg(
        body.idempotent
          ? `Zaten işlenmiş — teslimat ${String(body.deliveryTxHash).slice(0, 12)}…`
          : `Teslimat tamam — ${String(body.deliveryTxHash).slice(0, 12)}…`,
      );
      void load();
    } catch (e) {
      setRetryMsg(e instanceof Error ? e.message : "Retry başarısız");
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 p-4 text-white sm:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">GASSTATION · Kasa</h1>
            <p className="mt-1 text-sm text-neutral-500">Operatör paneli — gelir, bakiye, takılı işlemler</p>
          </div>
          <div className="flex gap-3 text-sm">
            <Link href="/yakit-al" className="text-emerald-400 hover:underline">
              Yakıt Al
            </Link>
            <Link href="/admin/marketplace" className="text-neutral-400 hover:underline">
              Marketplace
            </Link>
          </div>
        </header>

        {!admin.configured && (
          <p className="rounded-xl border border-amber-500/30 bg-amber-950/30 p-4 text-sm text-amber-200">
            <code className="text-xs">ADMIN_WALLET_ADDRESS</code> .env.local içinde tanımlı değil.
          </p>
        )}

        {admin.configured && !admin.authenticated && (
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="font-semibold">Admin girişi</h2>
            <p className="mt-2 text-sm text-neutral-400">
              MetaMask ile <strong>ADMIN_WALLET_ADDRESS</strong> cüzdanını bağlayıp mesaj imzalayın.
              Bu cüzdan kasa operatörü değil — yalnızca panel yetkisi.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {!isConnected && (
                <button
                  type="button"
                  onClick={() => openConnectModal?.()}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold"
                >
                  MetaMask Bağla
                </button>
              )}
              <button
                type="button"
                disabled={!isConnected || admin.signingIn}
                onClick={() => void admin.signIn()}
                className="rounded-xl border border-emerald-500/40 px-4 py-2 text-sm font-semibold text-emerald-300 disabled:opacity-40"
              >
                {admin.signingIn ? "İmzalanıyor…" : "Admin olarak giriş"}
              </button>
            </div>
            {admin.error && <p className="mt-3 text-sm text-red-400">{admin.error}</p>}
          </section>
        )}

        {admin.authenticated && (
          <>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => void admin.signOut()}
                className="text-xs text-neutral-500 hover:text-red-300"
              >
                Çıkış
              </button>
            </div>

            {loadError && <p className="text-red-400">{loadError}</p>}

            {data && (
              <>
                <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Stat label="Ortam" value={data.env} />
                  <Stat label="İşlem sayısı" value={String(data.ledgerSummary.count)} />
                  <Stat
                    label="Toplam depozit"
                    value={`$${data.ledgerSummary.totalDepositsUsd.toFixed(2)}`}
                  />
                  <Stat
                    label="Kasada kalan (marj)"
                    value={`$${data.ledgerSummary.totalRetainedUsd.toFixed(4)}`}
                  />
                </section>

                <section className="rounded-2xl border border-white/10 p-4">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-400">
                    Yapılandırma
                  </h2>
                  <ul className="mt-3 space-y-2 text-sm">
                    <li>
                      Collector (USDC alır):{" "}
                      {data.addresses.collector ? shortAddr(data.addresses.collector) : "—"}
                      {data.configured.collector ? " ✓" : " ✗"}
                    </li>
                    <li>
                      Operatör (gas gönderir):{" "}
                      {data.addresses.operator ? shortAddr(data.addresses.operator) : "—"}
                      {data.configured.evmOperator ? " ✓" : " ✗"}
                    </li>
                    <li>Solana operatör: {data.configured.solanaOperator ? "✓" : "✗"}</li>
                  </ul>
                  <p className="mt-4 text-xs text-neutral-500">
                    Collector ve operatör aynı MetaMask hesabı olabilir (testnet). Mainnet’te operatör
                    anahtarı sunucuda kalır; MetaMask yalnızca admin paneli için kullanılır.
                  </p>
                </section>

                <section className="rounded-2xl border border-white/10 p-4">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-400">
                    Canlı bakiyeler
                  </h2>
                  {data.balances.length === 0 ? (
                    <p className="mt-3 text-sm text-neutral-500">Bakiye yok veya RPC yanıt vermedi.</p>
                  ) : (
                    <ul className="mt-3 divide-y divide-white/5">
                      {data.balances.map((b) => (
                        <li
                          key={`${b.role}-${b.label}-${b.symbol}`}
                          className="flex justify-between py-2 text-sm"
                        >
                          <span className="text-neutral-400">
                            {b.label}{" "}
                            <span className="text-[10px] uppercase">({b.role})</span>
                          </span>
                          <span className="font-mono tabular-nums">
                            {Number(b.amount).toFixed(6)} {b.symbol}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <section className="rounded-2xl border border-white/10 p-4">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-400">
                    Açık sipariş fişleri (GO-…)
                  </h2>
                  {data.openOrders.length === 0 ? (
                    <p className="mt-3 text-sm text-neutral-500">Bekleyen sipariş yok.</p>
                  ) : (
                    <ul className="mt-3 space-y-2 text-xs">
                      {data.openOrders.map((o) => (
                        <li
                          key={o.orderId}
                          className="rounded-lg border border-amber-500/20 bg-amber-950/20 px-3 py-2"
                        >
                          <span className="font-mono font-bold text-amber-200">{o.orderId}</span>
                          {" · "}
                          <span className="text-neutral-400">{o.passId}</span>
                          <br />
                          ${o.packageAmount.toFixed(3)} {o.paySymbol} → {o.targetAsset} ·{" "}
                          {shortAddr(o.depositorAddress)}
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <section className="rounded-2xl border border-white/10 p-4">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-400">
                    Takılı depozit — retry
                  </h2>
                  <p className="mt-2 text-xs text-neutral-500">
                    USDC kasaya geldi ama gas gitmediyse depozit tx hash yapıştırın (sipariş fişi
                    gerekli).
                  </p>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <input
                      value={retryTx}
                      onChange={(e) => setRetryTx(e.target.value)}
                      placeholder="0x… veya Solana imza"
                      className="flex-1 rounded-xl border border-white/10 bg-black/40 px-3 py-2 font-mono text-xs"
                    />
                    <button
                      type="button"
                      disabled={retrying}
                      onClick={() => void handleRetry()}
                      className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold disabled:opacity-50"
                    >
                      {retrying ? "Gönderiliyor…" : "Gas teslim et"}
                    </button>
                  </div>
                  {retryMsg && <p className="mt-2 text-sm text-emerald-300">{retryMsg}</p>}
                </section>

                <section className="rounded-2xl border border-white/10 p-4">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-400">
                    Son işlemler (muhasebe)
                  </h2>
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="text-neutral-500">
                        <tr>
                          <th className="py-2 pr-2">Zaman</th>
                          <th className="py-2 pr-2">$</th>
                          <th className="py-2 pr-2">Gas</th>
                          <th className="py-2 pr-2">Marj</th>
                          <th className="py-2">Depozit tx</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.ledger.map((row) => (
                          <tr key={row.depositTxHash} className="border-t border-white/5">
                            <td className="py-2 pr-2 whitespace-nowrap">
                              {new Date(row.at).toLocaleString("tr-TR")}
                            </td>
                            <td className="py-2 pr-2">${row.packageUsd.toFixed(3)}</td>
                            <td className="py-2 pr-2">
                              {row.estimatedGasAmount.toFixed(4)} {row.targetAsset}
                            </td>
                            <td className="py-2 pr-2 text-emerald-400">
                              ${row.treasuryRetainedUsd.toFixed(4)}
                            </td>
                            <td className="py-2 font-mono">{shortAddr(row.depositTxHash)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {data.ledger.length === 0 && (
                      <p className="py-4 text-center text-neutral-500">Henüz kayıt yok.</p>
                    )}
                  </div>
                </section>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">{label}</p>
      <p className="mt-1 text-lg font-bold tabular-nums">{value}</p>
    </div>
  );
}
