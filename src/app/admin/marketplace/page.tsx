"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type AdminData = {
  orders?: unknown[];
  revenue?: { totalOrders: number; completedOrders: number; totalRevenueUsd: number };
  balances?: unknown[];
  pendingPayment?: unknown[];
  fulfilling?: unknown[];
};

const API = process.env.NEXT_PUBLIC_MARKETPLACE_API_URL ?? "http://localhost:4000";

export default function AdminMarketplacePage() {
  const [data, setData] = useState<AdminData>({});
  const [error, setError] = useState<string | null>(null);
  const [key, setKey] = useState("");

  async function load(adminKey: string) {
    setError(null);
    const headers = { Authorization: `Bearer ${adminKey}` };
    try {
      const [revenue, treasury, pending, orders] = await Promise.all([
        fetch(`${API}/admin/revenue`, { headers }).then((r) => r.json()),
        fetch(`${API}/admin/treasury`, { headers }).then((r) => r.json()),
        fetch(`${API}/admin/pending`, { headers }).then((r) => r.json()),
        fetch(`${API}/admin/orders`, { headers }).then((r) => r.json()),
      ]);
      setData({ revenue, balances: treasury.balances, ...pending, orders: orders.orders });
    } catch {
      setError("Admin verisi alınamadı — API anahtarını kontrol et");
    }
  }

  useEffect(() => {
    const saved = sessionStorage.getItem("ps_admin_key");
    if (saved) {
      setKey(saved);
      void load(saved);
    }
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 p-6 text-white">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">GASSTATION Admin</h1>
          <Link href="/siparis" className="text-sm text-zinc-400 underline">Siparişler</Link>
        </header>

        <div className="flex gap-2">
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="Admin API key"
            className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2"
          />
          <button
            type="button"
            onClick={() => {
              sessionStorage.setItem("ps_admin_key", key);
              void load(key);
            }}
            className="rounded-lg bg-emerald-600 px-4 py-2"
          >
            Yükle
          </button>
        </div>

        {error && <p className="text-red-400">{error}</p>}

        {data.revenue && (
          <section className="grid grid-cols-3 gap-4">
            <Stat label="Toplam sipariş" value={String(data.revenue.totalOrders)} />
            <Stat label="Tamamlanan" value={String(data.revenue.completedOrders)} />
            <Stat label="Gelir (USDC)" value={`$${data.revenue.totalRevenueUsd}`} />
          </section>
        )}

        {data.balances && (
          <section className="rounded-xl border border-zinc-800 p-4">
            <h2 className="mb-3 font-semibold">Kasa bakiyeleri</h2>
            <pre className="overflow-auto text-xs text-zinc-400">{JSON.stringify(data.balances, null, 2)}</pre>
          </section>
        )}

        {data.orders && (
          <section className="rounded-xl border border-zinc-800 p-4">
            <h2 className="mb-3 font-semibold">Son siparişler</h2>
            <pre className="overflow-auto text-xs text-zinc-400 max-h-96">{JSON.stringify(data.orders, null, 2)}</pre>
          </section>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}
