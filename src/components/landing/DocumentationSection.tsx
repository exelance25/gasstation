"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, BookOpen } from "lucide-react";
import { DOC_CARDS } from "@/components/landing/landing-data";

export function DocumentationSection() {
  return (
    <section id="documentation" className="border-t border-white/[0.06] bg-[#05060a]/50 px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white sm:text-3xl">Documentation</h2>
            <p className="mt-2 text-zinc-400">Build on the GASSTATION gas infrastructure layer.</p>
          </div>
          <BookOpen className="hidden h-8 w-8 text-indigo-400/60 sm:block" aria-hidden />
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DOC_CARDS.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                href={card.href}
                className="group flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.02] p-5 transition hover:border-indigo-500/30 hover:bg-white/[0.05]"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-white group-hover:text-indigo-200">
                    {card.title}
                  </h3>
                  <ArrowUpRight
                    className="h-4 w-4 shrink-0 text-zinc-600 transition group-hover:text-indigo-400"
                    aria-hidden
                  />
                </div>
                <p className="mt-2 flex-1 text-sm text-zinc-500">{card.description}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
