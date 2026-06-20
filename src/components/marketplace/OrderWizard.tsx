"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMarketplaceOrder } from "@/hooks/useMarketplaceOrder";
import type { DeliveryChain, PaymentChain } from "@/lib/marketplace/client";
import { PumpStationPage } from "@/components/PumpStationPage";
import { formatPackageUsd } from "@/lib/pricing";

const PAYMENT_CHAINS: { id: PaymentChain; label: string }[] = [
  { id: "ethereum", label: "Ethereum" },
  { id: "base", label: "Base" },
  { id: "monad", label: "Monad" },
];

const DELIVERY_CHAINS: { id: DeliveryChain; label: string }[] = [
  { id: "ethereum", label: "Ethereum (ETH)" },
  { id: "base", label: "Base (ETH)" },
  { id: "monad", label: "Monad (MON)" },
  { id: "solana", label: "Solana (SOL)" },
];

const PACKAGES = [0.05, 0.1, 0.2] as const;

export function OrderWizard() {
  const router = useRouter();
  const { submit, loading, error } = useMarketplaceOrder();
  const [step, setStep] = useState(1);
  const [paymentChain, setPaymentChain] = useState<PaymentChain>("ethereum");
  const [destinationChain, setDestinationChain] = useState<DeliveryChain>("solana");
  const [destinationAddress, setDestinationAddress] = useState("");
  const [packageAmount, setPackageAmount] = useState<(typeof PACKAGES)[number]>(0.1);

  async function handleCreate() {
    const order = await submit({
      paymentChain,
      paymentAmount: packageAmount,
      destinationChain,
      destinationAddress,
    });
    router.push(`/siparis/${order.orderId}`);
  }

  return (
    <PumpStationPage variant="fuel">
      <div className="mx-auto w-full max-w-lg space-y-6 p-4">
        <header className="space-y-1 text-center">
          <h1 className="text-2xl font-bold text-white">Cross-Chain Gas</h1>
          <p className="text-sm text-zinc-400">
            Herhangi bir ağdan USDC öde, istediğin ağa gas al.
          </p>
          <p className="text-xs text-zinc-500">Adım {step} / 6</p>
        </header>

        {step === 1 && (
          <section className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
            <h2 className="font-semibold text-white">Ödeme ağı</h2>
            <div className="grid gap-2">
              {PAYMENT_CHAINS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setPaymentChain(c.id)}
                  className={`rounded-lg border px-4 py-3 text-left ${
                    paymentChain === c.id
                      ? "border-emerald-500 bg-emerald-500/10 text-white"
                      : "border-zinc-700 text-zinc-300"
                  }`}
                >
                  {c.label} · USDC
                </button>
              ))}
            </div>
            <button type="button" onClick={() => setStep(2)} className="w-full rounded-lg bg-emerald-600 py-3 font-medium text-white">
              Devam
            </button>
          </section>
        )}

        {step === 2 && (
          <section className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
            <h2 className="font-semibold text-white">Teslimat ağı</h2>
            <div className="grid gap-2">
              {DELIVERY_CHAINS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setDestinationChain(c.id)}
                  className={`rounded-lg border px-4 py-3 text-left ${
                    destinationChain === c.id
                      ? "border-emerald-500 bg-emerald-500/10 text-white"
                      : "border-zinc-700 text-zinc-300"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setStep(1)} className="flex-1 rounded-lg border border-zinc-700 py-3 text-zinc-300">Geri</button>
              <button type="button" onClick={() => setStep(3)} className="flex-1 rounded-lg bg-emerald-600 py-3 text-white">Devam</button>
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
            <h2 className="font-semibold text-white">Hedef adres</h2>
            <p className="text-xs text-zinc-500">Teslimat bu adrese gidecek — cüzdanınla aynı olmak zorunda değil.</p>
            <input
              value={destinationAddress}
              onChange={(e) => setDestinationAddress(e.target.value)}
              placeholder={destinationChain === "solana" ? "Solana adresi" : "0x..."}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-3 text-white outline-none focus:border-emerald-500"
            />
            <div className="flex gap-2">
              <button type="button" onClick={() => setStep(2)} className="flex-1 rounded-lg border border-zinc-700 py-3 text-zinc-300">Geri</button>
              <button type="button" onClick={() => setStep(4)} disabled={!destinationAddress.trim()} className="flex-1 rounded-lg bg-emerald-600 py-3 text-white disabled:opacity-40">Devam</button>
            </div>
          </section>
        )}

        {step === 4 && (
          <section className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
            <h2 className="font-semibold text-white">Gas paketi</h2>
            <div className="grid grid-cols-3 gap-2">
              {PACKAGES.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPackageAmount(p)}
                  className={`rounded-lg border py-4 font-bold ${
                    packageAmount === p ? "border-emerald-500 bg-emerald-500/10 text-white" : "border-zinc-700 text-zinc-300"
                  }`}
                >
                  {formatPackageUsd(p)}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setStep(3)} className="flex-1 rounded-lg border border-zinc-700 py-3 text-zinc-300">Geri</button>
              <button type="button" onClick={() => setStep(5)} className="flex-1 rounded-lg bg-emerald-600 py-3 text-white">Devam</button>
            </div>
          </section>
        )}

        {step === 5 && (
          <section className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 text-sm text-zinc-300">
            <h2 className="font-semibold text-white">Özet</h2>
            <p>Ödeme: <span className="text-white">{packageAmount} USDC</span> · {paymentChain}</p>
            <p>Teslimat: <span className="text-white">{destinationChain}</span></p>
            <p className="break-all">Adres: <span className="text-white">{destinationAddress}</span></p>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setStep(4)} className="flex-1 rounded-lg border border-zinc-700 py-3 text-zinc-300">Geri</button>
              <button type="button" onClick={() => setStep(6)} className="flex-1 rounded-lg bg-emerald-600 py-3 text-white">Onayla</button>
            </div>
          </section>
        )}

        {step === 6 && (
          <section className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
            <h2 className="font-semibold text-white">Sipariş oluştur</h2>
            <p className="text-sm text-zinc-400">Benzersiz deposit adresi alacaksın. Tam tutarı gönderince gas otomatik teslim edilir.</p>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              type="button"
              onClick={() => void handleCreate()}
              disabled={loading}
              className="w-full rounded-lg bg-emerald-600 py-3 font-medium text-white disabled:opacity-50"
            >
              {loading ? "Oluşturuluyor..." : "Sipariş Oluştur"}
            </button>
            <Link href="/yakit-al" className="block text-center text-xs text-zinc-500 underline">
              Klasik pompa arayüzü
            </Link>
          </section>
        )}
      </div>
    </PumpStationPage>
  );
}
