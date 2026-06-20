"use client";

import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

export function PaymentSuccessPanel() {
  const { t } = useTranslation();

  return (
    <div className="mt-6 text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20"
      >
        <CheckCircle2 className="text-emerald-400" size={40} />
      </motion.div>
      <p className="text-lg font-semibold">{t("paymentSuccess")}</p>
      <p className="mt-2 text-sm text-muted">Settlement tracking ready for backend integration</p>
      <Link href="/dashboard" className="mt-6 block">
        <Button>Back to Dashboard</Button>
      </Link>
    </div>
  );
}
