"use client";

import Link from "next/link";
import {
  ArrowLeftRight,
  BadgeCheck,
  BadgeDollarSign,
  ChevronRight,
  Grid2X2,
  Send
} from "lucide-react";
import { useAggregatedBalance } from "@/hooks/use-aggregated-balance";
import { formatFiat } from "@/utils/format";
import { FastLink } from "@/components/ui/fast-link";
import { Skeleton } from "@/components/ui/skeleton";

const quickActions = [
  { label: "Gönder", href: "/cross-chain-payment", icon: Send },
  { label: "Takas Et", href: "/unified-balance", icon: ArrowLeftRight },
  { label: "Al", href: "/qr-payment", icon: Grid2X2 },
  { label: "Satın Al", href: "/investments", icon: BadgeDollarSign }
] as const;

const tokens = [
  {
    id: "sol",
    name: "Solana",
    symbol: "SOL",
    amount: "0.80814",
    value: 70.06,
    change: 0.34,
    color: "from-[#9945FF] to-[#14F195]"
  },
  {
    id: "xsol",
    name: "Hylo Leveraged SOL",
    symbol: "xSOL",
    amount: "2.70624",
    value: 0.18,
    change: 0.01,
    color: "from-[#7C3AED] to-[#4F46E5]"
  },
  {
    id: "usdt",
    name: "USDT",
    symbol: "USDT",
    amount: "0.02229",
    value: 0.02,
    change: -0.01,
    color: "from-[#22C55E] to-[#16A34A]"
  }
];

export function WalletHome() {
  const { balance, loading } = useAggregatedBalance();
  const change = 0.25;
  const changePct = 0.36;

  return (
    <div className="space-y-5">
      <section>
        {loading ? (
          <Skeleton className="h-10 w-48" />
        ) : (
          <p className="text-4xl font-semibold tracking-tight text-foreground">
            {formatFiat(balance.fiat, balance.currency)}
          </p>
        )}
        <div className="mt-2 flex items-center gap-2 text-sm">
          <span className="text-positive">+{formatFiat(change, "USD")}</span>
          <span className="rounded-md bg-positive/20 px-2 py-0.5 text-xs font-medium text-positive">
            +{changePct}%
          </span>
        </div>
      </section>

      <section className="grid grid-cols-4 gap-2">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <FastLink
              key={action.label}
              href={action.href}
              className="tap-fast flex flex-col items-center gap-2 rounded-2xl bg-card py-3"
            >
              <Icon size={22} className="text-accent" strokeWidth={1.75} />
              <span className="text-[11px] font-medium text-muted">{action.label}</span>
            </FastLink>
          );
        })}
      </section>

      <section className="rounded-2xl bg-card px-4 py-4">
        <p className="text-sm text-muted">Harcanabilir bakiye :</p>
        {loading ? (
          <Skeleton className="mt-1 h-9 w-36" />
        ) : (
          <p className="mt-1 text-3xl font-semibold text-foreground">
            {formatFiat(balance.fiat * 0.98, balance.currency)}
          </p>
        )}
      </section>

      <section>
        <Link
          href="/unified-balance"
          className="tap-fast mb-3 flex items-center gap-1 text-base font-medium text-foreground"
        >
          Token&apos;lar
          <ChevronRight size={18} className="text-muted" />
        </Link>
        <ul className="space-y-2">
          {tokens.map((token) => (
            <li key={token.id} className="rounded-2xl bg-card px-4 py-3">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${token.color} text-xs font-bold text-white`}
                >
                  {token.symbol.slice(0, 1)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <p className="truncate font-medium text-foreground">{token.name}</p>
                    <BadgeCheck size={14} className="shrink-0 text-accent" />
                  </div>
                  <p className="text-xs text-muted">
                    {token.amount} {token.symbol}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-foreground">{formatFiat(token.value, "USD")}</p>
                  <p className={`text-xs ${token.change >= 0 ? "text-positive" : "text-negative"}`}>
                    {token.change >= 0 ? "+" : ""}
                    {formatFiat(token.change, "USD")}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
