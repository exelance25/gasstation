"use client";

import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeftRight,
  Fuel,
  Layers,
  ShieldAlert,
  Wallet,
} from "lucide-react";
import { PAIN_POINTS } from "@/components/landing/landing-data";

const ICONS = {
  fuel: Fuel,
  network: Layers,
  bridge: ArrowLeftRight,
  wallet: Wallet,
  cost: ShieldAlert,
  alert: AlertTriangle,
} as const;

export function WhyGasStation() {
  return (
    <section className="border-t border-white/[0.06] bg-[#05060a]/50 px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            The Most Common Problem In Web3
          </h2>
          <p className="mt-3 text-zinc-400">
            Users don&apos;t fail because they lack capital. They fail because they lack the right
            fee token on the right chain at the right moment.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PAIN_POINTS.map((card, i) => {
            const Icon = ICONS[card.icon];
            return (
              <motion.article
                key={card.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                whileHover={{ y: -4 }}
                className="group rounded-2xl border border-white/10 bg-white/[0.02] p-6 transition hover:border-indigo-500/25 hover:bg-white/[0.05] hover:shadow-lg hover:shadow-indigo-500/5"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-white/[0.05] text-zinc-400 transition group-hover:bg-indigo-500/15 group-hover:text-indigo-300">
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <h3 className="font-semibold text-white">{card.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500 group-hover:text-zinc-400">
                  {card.description}
                </p>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
