"use client";

import { useEffect, useMemo, useState } from "react";
import { useAccount, useConnect } from "wagmi";
import type { Connector } from "wagmi";
import { WalletConnectPicker } from "@/components/WalletConnectPicker";
import { truncateAddress } from "@/lib/address";
import {
  getPaymentTokens,
  type PaymentTokenId,
  isFeeTokenConfigured,
} from "@/config/pool-tokens";
import { useBuyGasManuel } from "@/hooks/useBuyGasManuel";
import { useAutoGasApprove } from "@/hooks/useAutoGasApprove";
import { usePumpAdmin } from "@/hooks/usePumpAdmin";
import { usePaymasterContract } from "@/hooks/usePaymasterContract";
import { isPaymasterDeployed } from "@/lib/paymaster";
import type { ManuelGasTarget } from "@/lib/oracle/calculate-manuel-gas-out";
import { PROTOCOL_PROFIT_RATE } from "@/lib/oracle/live-prices";
import { SOURCE_CHAIN_NAME } from "@/lib/chains";
import { usePumpRelay } from "@/hooks/usePumpRelay";
import { useManuelGasQuote } from "@/hooks/useManuelGasQuote";

type DashboardTab = "manuel" | "otomatik" | "admin";

export function PumpDashboard() {
  const paymentTokens = useMemo(() => getPaymentTokens(), []);
  const defaultPay =
    paymentTokens.find((t) => t.enabled)?.id ?? paymentTokens[0]?.id ?? "USDC";

  const [tab, setTab] = useState<DashboardTab>("manuel");
  const [payToken, setPayToken] = useState<PaymentTokenId>(defaultPay);
  const [payAmount, setPayAmount] = useState("");
  const [gasTarget, setGasTarget] = useState<ManuelGasTarget>("ETH");
  const [adminEth, setAdminEth] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { address, isConnected: walletConnected } = useAccount();
  const { connectAsync, isPending: isSourceConnecting } = useConnect();
  const { isRelayerEnabled } = usePumpRelay();
  const { buyGas, isPending: buying } = useBuyGasManuel();
  const { approve, isPending: approving } = useAutoGasApprove();
  const { isOwner, addNative, addToken, isPending: adminPending } = usePumpAdmin();

  const { poolNativeFormatted, allowanceWei, isDeployed } = usePaymasterContract(
    address as `0x${string}` | undefined,
  );

  const { quote: manuelQuote, loading: quoteLoading } = useManuelGasQuote(
    payAmount,
    gasTarget,
  );

  const isConnected = walletConnected && Boolean(address);
  const activePay = paymentTokens.find((t) => t.id === payToken);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (isOwner) setTab((t) => (t === "admin" ? t : t));
  }, [isOwner]);

  const walletLabel =
    mounted && isConnected && address
      ? truncateAddress(address)
      : "Bağlanmadı";

  return (
    <div className="font-mono flex min-h-[680px] w-full max-w-xl flex-col rounded-xl border border-neutral-800 bg-black p-6 text-emerald-400 shadow-2xl md:p-8">
      <header className="flex items-center justify-between border-b border-emerald-900 pb-4">
        <h1 className="text-xl font-bold tracking-widest text-white md:text-2xl">
          ⛽ GASSTATION
        </h1>
        <button
          type="button"
          onClick={() => {
            if (!isConnected) setPickerOpen(true);
          }}
          className="rounded-md border border-emerald-500 bg-emerald-950 px-3 py-2 text-xs text-emerald-300 hover:bg-emerald-900 md:text-sm"
        >
          {isConnected ? `Cüzdan: ${walletLabel}` : "+ Cüzdan Bağla"}
        </button>
      </header>

      <nav className="mt-4 flex gap-1 rounded-lg border border-neutral-800 bg-neutral-950 p-1">
        {(
          [
            { id: "manuel" as const, label: "Manuel Gas" },
            { id: "otomatik" as const, label: "Otomatik Fee" },
            ...(isOwner ? [{ id: "admin" as const, label: "Admin" }] : []),
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`flex-1 rounded py-2 text-[10px] font-bold uppercase md:text-xs ${
              tab === item.id
                ? "bg-emerald-600 text-black"
                : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <main className="my-5 flex-1 rounded-xl border border-neutral-800 bg-neutral-950 p-5">
        <div className="mb-4 flex justify-between text-xs">
          <span className="text-neutral-500">
            Protokol havuzu (çoklu ağ · legacy {SOURCE_CHAIN_NAME})
          </span>
          <span
            className={
              isRelayerEnabled ? "text-emerald-400" : "text-neutral-600"
            }
          >
            Relayer {isRelayerEnabled ? "ON" : "OFF"}
          </span>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-2 rounded border border-neutral-800 bg-neutral-900/80 p-3 text-xs">
          <div>
            <span className="text-neutral-500">Havuz native gas</span>
            <p className="mt-1 font-semibold text-white">
              {isDeployed ? `${poolNativeFormatted} ETH` : "—"}
            </p>
          </div>
          <div>
            <span className="text-neutral-500">Fee approve</span>
            <p className="mt-1 text-emerald-400">
              {allowanceWei > 0n ? "Aktif" : "Gerekli"}
            </p>
          </div>
        </div>

        {tab === "manuel" && (
          <>
            <h2 className="text-lg text-white">1. Manuel Gas Alımı</h2>
            <p className="mt-1 mb-4 text-xs text-neutral-400">
              USDC ödeyin; %{(PROTOCOL_PROFIT_RATE * 100).toFixed(1)} protokol kârı
              düşülür. Base&apos;de havuzdan native ETH transfer edilir.
            </p>

            <div className="mb-4 grid grid-cols-2 gap-2">
              {(["ETH", "MON"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setGasTarget(t)}
                  className={`rounded border py-2 text-sm font-bold ${
                    gasTarget === t
                      ? "border-emerald-500 bg-emerald-950/50 text-white"
                      : "border-neutral-800 text-neutral-500"
                  }`}
                >
                  Alınacak: {t}
                </button>
              ))}
            </div>

            <div className="mb-4 grid grid-cols-2 gap-2">
              {paymentTokens.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  disabled={!t.enabled}
                  onClick={() => setPayToken(t.id)}
                  className={`rounded border py-2 text-sm ${
                    payToken === t.id
                      ? "border-emerald-500 bg-emerald-950/50 text-white"
                      : "border-neutral-800 text-neutral-500"
                  } ${!t.enabled ? "opacity-40" : ""}`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <label className="mb-2 block text-xs uppercase text-neutral-500">
              Ödeme miktarı ({activePay?.label})
            </label>
            <input
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              placeholder="4.50"
              className="mb-2 w-full rounded border border-neutral-800 bg-neutral-900 px-4 py-3 text-white focus:border-emerald-500 focus:outline-none"
            />
            {manuelQuote && (
              <div className="mb-4 rounded border border-emerald-900/50 bg-emerald-950/20 p-3 text-[11px] text-neutral-300">
                <p>
                  Oracle: ETH ${manuelQuote.prices.ETH_Price} · MON $
                  {manuelQuote.prices.MON_Price}
                </p>
                <p className="mt-1">
                  Net (gas için): ${manuelQuote.netUsdcForGas.toFixed(4)} USDC
                </p>
                <p className="mt-1 font-semibold text-emerald-300">
                  {quoteLoading
                    ? "Hesaplanıyor…"
                    : `≈ ${manuelQuote.pureGasAmount.toFixed(6)} ${gasTarget}`}
                </p>
                {gasTarget === "MON" && (
                  <p className="mt-1 text-neutral-500">
                    Kontrat Base native ETH gönderir (USD eşdeğeri).
                  </p>
                )}
              </div>
            )}

            <button
              type="button"
              disabled={
                buying || !payAmount || !isConnected || !activePay?.enabled
              }
              onClick={() => void buyGas(payToken, payAmount, gasTarget)}
              className="w-full rounded bg-emerald-500 py-4 font-bold uppercase text-black disabled:bg-neutral-800 disabled:text-neutral-600"
            >
              {buying ? "İşleniyor…" : "Gas Satın Al (buyGasManuel)"}
            </button>
          </>
        )}

        {tab === "otomatik" && (
          <>
            <h2 className="text-lg text-white">2. Otomatik Gas Modu</h2>
            <p className="mt-1 mb-4 text-xs text-neutral-400">
              ERC-4337 işlem sonrası gas + %0.5 fee, approve ettiğiniz token&apos;dan
              otomatik çekilir (postOp).
            </p>

            <button
              type="button"
              disabled={
                approving ||
                !isConnected ||
                !isFeeTokenConfigured() ||
                !isPaymasterDeployed()
              }
              onClick={() => void approve()}
              className="w-full rounded border border-emerald-500 bg-emerald-950 py-4 font-bold uppercase text-emerald-300 hover:bg-emerald-900 disabled:opacity-40"
            >
              {approving
                ? "Approve…"
                : "PumpPaymaster'a Fee İzni Ver (approve)"}
            </button>
            {!isFeeTokenConfigured() && (
              <p className="mt-2 text-[11px] text-amber-500">
                NEXT_PUBLIC_BASE_USDC_ADDRESS tanımlayın.
              </p>
            )}
          </>
        )}

        {tab === "admin" && isOwner && (
          <>
            <h2 className="text-lg text-white">Admin — Havuz Likiditesi</h2>
            <p className="mt-1 mb-4 text-xs text-neutral-400">
              Sadece owner: native / ERC-20 likidite ekleme (adminAdd*).
            </p>
            <input
              value={adminEth}
              onChange={(e) => setAdminEth(e.target.value)}
              placeholder="ETH miktarı"
              className="mb-3 w-full rounded border border-neutral-800 bg-neutral-900 px-3 py-2 text-white"
            />
            <button
              type="button"
              disabled={adminPending || !adminEth}
              onClick={() => void addNative(adminEth)}
              className="mb-3 w-full rounded bg-neutral-800 py-3 text-sm text-white hover:bg-neutral-700"
            >
              adminAddNativeLiquidity
            </button>
            {activePay?.enabled && activePay.contractAddress && (
              <button
                type="button"
                disabled={adminPending || !adminEth}
                onClick={() => {
                  const addr = activePay.contractAddress;
                  if (!addr) return;
                  void addToken(addr, adminEth, activePay.decimals);
                }}
                className="w-full rounded bg-neutral-800 py-3 text-sm text-white hover:bg-neutral-700"
              >
                adminAddTokenLiquidity ({activePay.label})
              </button>
            )}
          </>
        )}
      </main>

      <footer className="text-center text-xs text-neutral-600">
        GasStation v1.0.0 // Admin havuz · %10 paket marjı
      </footer>

      <WalletConnectPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(connector: Connector) => {
          setPickerOpen(false);
          void connectAsync({ connector });
        }}
      />
    </div>
  );
}
