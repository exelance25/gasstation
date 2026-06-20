"use client";

import { useRef } from "react";
import type { PumpActionMode, PumpButtonBlockReason } from "@/hooks/useGasPump";
import { useToast } from "@/providers/ToastProvider";
import { cn } from "@/lib/utils";

interface PumpGasButtonProps {
  actionMode: PumpActionMode;
  isPumping: boolean;
  isLocked?: boolean;
  blockReason: PumpButtonBlockReason;
  blockDetail?: string | null;
  onPrimaryAction: () => void;
  locked?: boolean;
}

export function PumpGasButton({
  actionMode,
  isPumping,
  isLocked = false,
  blockReason,
  blockDetail,
  onPrimaryAction,
  locked = false,
}: PumpGasButtonProps) {
  const { showToast } = useToast();
  const lastClickRef = useRef(0);
  const busy = isPumping || isLocked;
  const disabled = busy || locked;

  const label = isPumping ? "İŞLEM BEKLENİYOR…" : isLocked ? "KİLİTLENDİ…" : "ATEŞLE";

  const handleClick = () => {
    const now = Date.now();
    if (now - lastClickRef.current < 800) return;
    lastClickRef.current = now;

    if (disabled) return;

    if (actionMode === "fire") {
      onPrimaryAction();
      return;
    }

    if (blockReason === "invalid_amount") {
      showToast({
        variant: "info",
        title: "Miktar gerekli",
        message: "Almak istediğiniz gas miktarını yazın.",
      });
      return;
    }
    if (blockReason === "wallet") {
      showToast({
        variant: "info",
        title: "Cüzdan gerekli",
        message: "EVM veya Solana cüzdanınızı bağlayın.",
      });
      return;
    }
    if (blockReason === "deposit_network") {
      showToast({
        variant: "info",
        title: "Ödeme kaynağı",
        message: blockDetail ?? "USDC, ETH, BASE veya MON ile ödeme kaynağı seçin.",
      });
      return;
    }
    if (blockReason === "below_minimum") {
      showToast({
        variant: "error",
        title: "Yetersiz bakiye",
        message: "Seçili ödeme kaynağında bu işlem için yeterli bakiye yok.",
      });
      return;
    }
    if (blockReason === "invalid_target") {
      showToast({
        variant: "info",
        title: "Hedef adres",
        message: "Gas gönderilecek geçerli bir hedef adresi girin.",
      });
      return;
    }
    if (blockReason === "insufficient_usdc") {
      showToast({
        variant: "error",
        title: "Yetersiz bakiye",
        message:
          blockDetail ??
          "Seçili ağda bu işlem için yeterli USDC yok — başka token veya daha küçük miktar seçin.",
      });
      return;
    }
    if (blockReason === "collector") {
      showToast({
        variant: "error",
        title: "GASSTATION kasası yapılandırılmamış",
        message: "Operatör kasası henüz hazır değil — lütfen daha sonra tekrar deneyin.",
      });
      return;
    }
    if (blockReason === "automatic_soon") {
      showToast({
        variant: "info",
        title: "Otomatik mod kapalı",
        message: "NEXT_PUBLIC_AUTO_FEE_ENABLED=true ile etkinleştirin veya manuel modu kullanın.",
      });
      return;
    }
    if (blockReason === "treasury_native") {
      showToast({
        variant: "error",
        title: "Native kasa yapılandırılmamış",
        message: "GASSTATION treasury adresleri .env içinde tanımlanmalı.",
      });
      return;
    }
    if (blockReason === "auto_quote") {
      showToast({
        variant: "info",
        title: "Ücret hesaplanıyor",
        message: "Quote engine'den otomatik ücret teklifi alınıyor…",
      });
      return;
    }
    if (blockReason === "insufficient_native") {
      showToast({
        variant: "error",
        title: "Yetersiz bakiye",
        message:
          blockDetail ??
          "Seçili token ile bu işlem için yeterli bakiye yok.",
      });
      return;
    }
    if (blockReason === "tank_empty") {
      showToast({
        variant: "error",
        title: "Gas tankı hazır değil",
        message:
          blockDetail ??
          "Operatör kasasında teslimat için yeterli ETH / BASE / MON yok. Kasayı doldurun.",
      });
      return;
    }
    if (blockReason === "precheck_loading") {
      showToast({
        variant: "info",
        title: "Tank kontrol ediliyor",
        message: "Gas tankı bakiyesi doğrulanıyor…",
      });
      return;
    }
    if (blockReason === "insufficient_usdc_paymaster") {
      showToast({
        variant: "error",
        title: "Yetersiz USDC",
        message: "Paymaster ağında bu paket için yeterli USDC yok.",
      });
      return;
    }
    if (blockReason === "paymaster_chain") {
      showToast({
        variant: "info",
        title: "Paymaster ağı gerekli",
        message: "Native yetersiz — paymaster ağına geçin veya USDC yükleyin.",
      });
      return;
    }
    if (blockReason === "pumping") {
      return;
    }
  };

  const ready = !locked && actionMode === "fire" && !busy;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={handleClick}
        className={cn(
        "w-full rounded-2xl py-5 text-base font-bold uppercase tracking-[0.28em] transition-all duration-300 sm:text-lg",
        ready
          ? "relative z-0 bg-gradient-to-r from-emerald-600/90 to-emerald-500/90 text-white shadow-[0_0_40px_rgba(16,185,129,0.35),0_12px_40px_rgba(0,0,0,0.45)] hover:scale-[1.01] hover:shadow-[0_0_56px_rgba(16,185,129,0.45),0_16px_48px_rgba(0,0,0,0.5)]"
          : "relative z-0 cursor-not-allowed bg-white/[0.06] text-neutral-500 opacity-60 shadow-[0_8px_32px_rgba(0,0,0,0.35)]",
        busy && "animate-pulse opacity-80",
      )}
      aria-busy={busy}
      aria-disabled={disabled}
    >
      {label}
    </button>
  );
}
