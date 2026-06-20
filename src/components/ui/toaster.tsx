"use client";

import { useToastStore } from "@/stores/use-toast-store";
import { AnimatePresence, motion } from "framer-motion";

export function Toaster() {
  const { message, visible, hide } = useToastStore();

  return (
    <AnimatePresence>
      {visible && message && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          onClick={hide}
          className="fixed bottom-24 left-1/2 z-[60] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-2xl border border-accent/30 bg-card-elevated px-5 py-3.5 text-center text-base font-semibold text-accent shadow-glass"
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
