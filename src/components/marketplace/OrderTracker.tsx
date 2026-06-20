"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getOrder, getOrderStatus, type MarketplaceOrder } from "@/lib/marketplace/client";
import { PumpStationPage } from "@/components/PumpStationPage";

const STATUS_LABEL: Record<string, string> = {
  PENDING_PAYMENT: "Ödeme bekleniyor",
  PAYMENT_CONFIRMED: "Ödeme onaylandı",
  FULFILLING: "Gas gönderiliyor",
  COMPLETED: "Tamamlandı",
  EXPIRED: "Süresi doldu",
  FAILED: "Başarısız",
  REFUND_PENDING: "İade bekleniyor",
};

export function OrderTracker({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<MarketplaceOrder | null>(null);
  const [status, setStatus] = useState<string>("");
  const [failureReason, setFailureReason] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function poll() {
      try {
        const [o, s] = await Promise.all([getOrder(orderId), getOrderStatus(orderId)]);
        if (!active) return;
        setOrder(o);
        setStatus(s.status);
        setFailureReason(s.failureReason);
      } catch {
        // retry on next tick
      }
    }
    void poll();
    const id = setInterval(poll, 4000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [orderId]);

  if (!order) {
    return (
      <PumpStationPage variant="fuel">
        <div className="p-8 text-center text-zinc-400">Sipariş yükleniyor...</div>
      </PumpStationPage>
    );
  }

  const done = status === "COMPLETED";
  const expired = status === "EXPIRED" || status === "FAILED";

  return (
    <PumpStationPage variant="fuel">
      <div className="mx-auto w-full max-w-lg space-y-6 p-4">
        <header className="text-center">
          <h1 className="text-xl font-bold text-white">Sipariş Takibi</h1>
          <p className="mt-1 text-xs text-zinc-500 break-all">{order.orderId}</p>
        </header>

        <div className={`rounded-xl border p-4 ${done ? "border-emerald-500/50 bg-emerald-500/10" : expired ? "border-red-500/50 bg-red-500/10" : "border-zinc-800 bg-zinc-900/60"}`}>
          <p className="text-lg font-semibold text-white">{STATUS_LABEL[status] ?? status}</p>
          {failureReason && <p className="mt-2 text-sm text-red-400">{failureReason}</p>}
        </div>

        {status === "PENDING_PAYMENT" && (
          <section className="space-y-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
            <h2 className="font-semibold text-amber-200">Deposit adresi</h2>
            <p className="text-sm text-zinc-400">
              Tam olarak <strong className="text-white">{order.paymentAmount} USDC</strong> gönder ({order.paymentChain})
            </p>
            <code className="block break-all rounded-lg bg-zinc-950 p-3 text-sm text-emerald-300">
              {order.depositAddress}
            </code>
            <p className="text-xs text-zinc-500">
              Süre: {new Date(order.expiresAt).toLocaleString("tr-TR")}
            </p>
          </section>
        )}

        {order.paymentTxHash && (
          <p className="text-xs text-zinc-500 break-all">Ödeme tx: {order.paymentTxHash}</p>
        )}
        {order.deliveryTxHash && (
          <p className="text-xs text-emerald-400 break-all">Teslimat tx: {order.deliveryTxHash}</p>
        )}

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 text-sm text-zinc-400">
          <p>Teslimat: {order.deliveryAmount.toFixed(6)} {order.deliveryAsset}</p>
          <p className="break-all mt-1">Hedef: {order.destinationAddress}</p>
        </div>

        <Link href="/siparis" className="block text-center text-sm text-zinc-500 underline">
          Yeni sipariş
        </Link>
      </div>
    </PumpStationPage>
  );
}
