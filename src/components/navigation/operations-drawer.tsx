"use client";

import { X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { operationsMenuItems } from "@/constants/operations-menu";
import { useAppStore } from "@/stores/use-app-store";
import { useToastStore } from "@/stores/use-toast-store";

export function OperationsDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const locale = useAppStore((s) => s.locale);
  const showToast = useToastStore((s) => s.show);
  const soon = locale === "tr" ? "ÇOK YAKINDA" : "COMING SOON";

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Close menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="fixed left-0 top-0 z-50 flex h-full w-[min(88vw,320px)] flex-col bg-card-elevated p-5 shadow-glass"
          >
            <div className="mb-6 flex items-center justify-between">
              <p className="text-lg font-semibold text-foreground">
                {locale === "tr" ? "Islemler" : "Operations"}
              </p>
              <button type="button" onClick={onClose} className="tap-fast rounded-xl p-2 text-accent hover:bg-white/5">
                <X size={20} />
              </button>
            </div>
            <nav className="flex flex-col gap-2">
              {operationsMenuItems.map((item) => {
                const Icon = item.icon;
                const label = locale === "tr" ? item.labelTr : item.labelEn;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className="tap-fast flex items-center gap-4 rounded-2xl bg-card px-4 py-4 text-left transition hover:bg-surface-hover"
                    onClick={() => {
                      showToast(soon);
                      onClose();
                    }}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-accent">
                      <Icon size={20} />
                    </div>
                    <span className="text-base font-medium text-foreground">{label}</span>
                  </button>
                );
              })}
            </nav>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
