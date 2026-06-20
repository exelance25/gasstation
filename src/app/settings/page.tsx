"use client";

import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { useAppStore } from "@/stores/use-app-store";

const envOptions = ["development", "staging", "testnet", "mainnet"] as const;

export default function SettingsPage() {
  const env = useAppStore((s) => s.env);
  const setEnv = useAppStore((s) => s.setEnv);

  return (
    <AppShell title="Settings">
      <Card className="space-y-4">
        <p className="text-sm text-muted">Network environment</p>
        <div className="grid grid-cols-2 gap-2">
          {envOptions.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setEnv(option)}
              className={`rounded-2xl px-3 py-2 text-sm capitalize transition ${
                env === option ? "bg-primary-gradient text-white" : "bg-white/5 text-muted"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </Card>
      <Link href="/language-settings" className="glass mt-3 block rounded-3xl p-4 text-sm hover-glow">
        Language Settings →
      </Link>
      <Link href="/profile" className="glass mt-3 block rounded-3xl p-4 text-sm hover-glow">
        Profile →
      </Link>
    </AppShell>
  );
}
