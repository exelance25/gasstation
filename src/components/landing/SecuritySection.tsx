"use client";

import { motion } from "framer-motion";
import { Lock, ScanEye, Shield, ShieldCheck, UserCheck, Zap } from "lucide-react";
import { SECURITY_CARDS } from "@/components/landing/landing-data";

const SEC_ICONS = [Shield, UserCheck, Lock, ScanEye, ShieldCheck, Zap] as const;

export function SecuritySection() {
  return (
    <section id="security" className="border-t border-white/[0.06] px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">Security</h2>
          <p className="mx-auto mt-3 max-w-xl text-zinc-400">
            Institutional-grade trust signals for production deployments.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SECURITY_CARDS.map((card, i) => {
            const Icon = SEC_ICONS[i] ?? Shield;
            return (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, scale: 0.98 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="rounded-2xl border border-emerald-500/10 bg-emerald-500/[0.03] p-5"
              >
                <Icon className="mb-3 h-5 w-5 text-emerald-400/80" aria-hidden />
                <h3 className="font-semibold text-white">{card.title}</h3>
                <p className="mt-2 text-sm text-zinc-500">{card.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
