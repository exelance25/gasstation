"use client";

import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";

const LINKS = [
  { href: "#nasil-kullanilir", label: "Nasıl Kullanılır" },
  { href: "#vizyon", label: "Vizyon" },
] as const;

export function LandingNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#030712]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-bold text-white shadow-lg shadow-indigo-500/20">
            P
          </span>
          <span className="text-sm font-semibold tracking-[0.2em] text-white sm:text-base">
            GASSTATION
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Ana menü">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-zinc-400 transition hover:text-white"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/yakit-al"
            className="hidden rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white backdrop-blur-md transition hover:border-indigo-400/40 hover:bg-white/[0.08] sm:inline-flex"
          >
            Uygulamayı Aç
          </Link>
          <div className="landing-connect [&_button]:!rounded-full [&_button]:!border [&_button]:!border-white/10 [&_button]:!bg-white/[0.06] [&_button]:!text-sm [&_button]:!font-medium [&_button]:!text-white [&_button]:!backdrop-blur-md">
            <ConnectButton showBalance={false} chainStatus="none" accountStatus="address" />
          </div>
        </div>
      </div>
    </header>
  );
}

export function GlassCta({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
}) {
  const base =
    "inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition duration-200 hover:scale-[1.02]";
  const styles =
    variant === "primary"
      ? "bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40"
      : "border border-white/15 bg-white/[0.04] text-zinc-200 backdrop-blur-md hover:border-white/25 hover:bg-white/[0.08]";

  return (
    <Link href={href} className={`${base} ${styles}`}>
      {children}
    </Link>
  );
}
