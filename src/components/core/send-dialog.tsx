"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { parseRecipientInput } from "@/lib/address-parser";
import { amountToUsd, executeTransfer, getTransferRoute, mapTransferError } from "@/lib/pumpstation-client";
import type { OptimalRoute, TransferCurrency } from "@/lib/pumpstation-client";
import { useTekBakiyeStore } from "@/lib/store";
import { useToastStore } from "@/stores/use-toast-store";

const CURRENCIES: TransferCurrency[] = ["USDC", "ETH", "SOL"];

function formatUsd(value: number) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "USD" }).format(value);
}

export function SendDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [recipientRaw, setRecipientRaw] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<TransferCurrency>("USDC");
  const [route, setRoute] = useState<OptimalRoute | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const connectedWallets = useTekBakiyeStore((s) => s.connectedWallets);
  const totalBalanceUSD = useTekBakiyeStore((s) => s.totalBalanceUSD);
  const fetchTotalBalance = useTekBakiyeStore((s) => s.fetchTotalBalance);
  const showToast = useToastStore((s) => s.show);

  const parsed = useMemo(() => parseRecipientInput(recipientRaw), [recipientRaw]);
  const amountNum = parseFloat(amount) || 0;
  const amountUsd = amountToUsd(amountNum, currency);
  const balanceAfter =
    totalBalanceUSD !== null ? Math.max(0, totalBalanceUSD - amountUsd) : null;

  const reset = () => {
    setStep(1);
    setRecipientRaw("");
    setAmount("");
    setCurrency("USDC");
    setRoute(null);
    setSubmitting(false);
  };

  const handleClose = (value: boolean) => {
    if (!value) reset();
    onOpenChange(value);
  };

  const goStep2 = () => {
    if (parsed.kind === "unknown") {
      showToast("Geçerli bir adres veya domain girin");
      return;
    }
    setStep(2);
  };

  const goStep3 = async () => {
    if (amountNum <= 0) {
      showToast("Geçerli bir tutar girin");
      return;
    }
    if (totalBalanceUSD !== null && amountUsd > totalBalanceUSD) {
      showToast("Yetersiz bakiye");
      return;
    }
    try {
      const optimal = await getTransferRoute({
        fromAddresses: connectedWallets.map((w) => w.address),
        toAddress: parsed.address,
        amount: amountNum,
        currency
      });
      setRoute(optimal);
      setStep(3);
    } catch (e) {
      showToast(mapTransferError(e));
    }
  };

  const confirmSend = async () => {
    if (!route) return;
    setSubmitting(true);
    showToast("Transfer başlatıldı. Zincirler arası işlem devam ediyor...");
    try {
      await executeTransfer(
        {
          fromAddresses: connectedWallets.map((w) => w.address),
          toAddress: parsed.address,
          amount: amountNum,
          currency,
          recipient: parsed
        },
        route
      );
      showToast("Transfer başarıyla tamamlandı");
      await fetchTotalBalance({ silent: true });
      handleClose(false);
    } catch (e) {
      showToast(mapTransferError(e));
    } finally {
      setSubmitting(false);
    }
  };

  const stepTitle =
    step === 1 ? "Kime?" : step === 2 ? "Ne Kadar?" : "Onayla ve Gönder";

  return (
    <Dialog open={open} onOpenChange={handleClose} title={`Gönder · ${stepTitle}`}>
      <div className="mb-4 flex gap-2">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full transition ${s <= step ? "bg-primary-gradient" : "bg-white/10"}`}
          />
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <p className="text-sm text-muted">Adres, ENS (.eth) veya Solana domain (.sol) yapıştırın.</p>
          <Input
            placeholder="0x... veya name.eth veya name.sol"
            value={recipientRaw}
            onChange={(e) => setRecipientRaw(e.target.value)}
          />
          {recipientRaw && (
            <Badge variant={parsed.kind === "unknown" ? "danger" : "success"} className="text-xs font-normal">
              {parsed.shortLabel}
            </Badge>
          )}
          <Button onClick={goStep2} disabled={parsed.kind === "unknown"}>
            Devam <ArrowRight className="ml-2 inline" size={16} />
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="number"
              min="0"
              step="any"
              placeholder="Tutar"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="flex-1"
            />
            <div className="flex gap-1">
              {CURRENCIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCurrency(c)}
                  className={`tap-fast rounded-xl px-3 py-2 text-sm font-medium ${
                    currency === c ? "bg-primary-gradient text-white" : "bg-card text-muted"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          {balanceAfter !== null && amountNum > 0 && (
            <p className="rounded-2xl bg-card px-4 py-3 text-sm text-muted">
              Gönderim sonrası tahmini bakiyen:{" "}
              <span className="font-semibold text-foreground">{formatUsd(balanceAfter)}</span>
            </p>
          )}
          <div className="flex gap-2">
            <Button className="bg-card-elevated text-foreground" onClick={() => setStep(1)}>
              <ArrowLeft className="mr-2 inline" size={16} /> Geri
            </Button>
            <Button onClick={goStep3}>
              Devam <ArrowRight className="ml-2 inline" size={16} />
            </Button>
          </div>
        </div>
      )}

      {step === 3 && route && (
        <div className="space-y-4">
          <div className="space-y-2 rounded-2xl bg-card p-4 text-sm text-muted">
            {route.summaryLines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
          <p className="text-center text-xs text-accent">
            Ağ seçmenize gerek yok — GASSTATION en uygun rotayı seçti.
          </p>
          <div className="flex gap-2">
            <Button className="bg-card-elevated text-foreground" onClick={() => setStep(2)} disabled={submitting}>
              Geri
            </Button>
            <Button loading={submitting} onClick={confirmSend}>
              <Check className="mr-2 inline" size={18} /> Onayla ve Gönder
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
