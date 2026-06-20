"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeftRight,
  Globe,
  Home,
  MessageCircle,
  Wallet
} from "lucide-react";
import { BrandLogo } from "@/components/brand/one-coin-icon";
import { BrandStrokeIcon } from "@/components/brand/brand-icon";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/connected-wallets", icon: Wallet, label: "Wallet" },
  { href: "/cross-chain-payment", icon: ArrowLeftRight, label: "Swap" },
  { href: "/notifications", icon: MessageCircle, label: "Chat" },
  { href: "/settings", icon: Globe, label: "Browser" }
] as const;

export function CoinNavLauncher() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div ref={rootRef} className="relative flex items-center">
      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ opacity: 0, y: 8, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.92 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute left-0 top-full z-50 mt-2 flex flex-col items-center gap-3.5 pt-1"
            aria-label="Ana menü"
          >
            {navItems.map((item, index) => {
              const active = pathname === item.href;
              return (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                >
                  <Link
                    href={item.href}
                    prefetch
                    aria-label={item.label}
                    onClick={() => setOpen(false)}
                    className="tap-fast flex h-11 w-11 items-center justify-center bg-transparent p-0 shadow-none"
                  >
                    <BrandStrokeIcon icon={item.icon} size={26} active={active} />
                  </Link>
                </motion.div>
              );
            })}
          </motion.nav>
        )}
      </AnimatePresence>

      <button
        type="button"
        aria-label={open ? "Menüyü kapat" : "Menüyü aç"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="tap-fast relative rounded-full bg-transparent p-0 shadow-none outline-none focus-visible:ring-2 focus-visible:ring-monad-400/40"
      >
        <div className={cn("transition-transform duration-200", open && "scale-105")}>
          <BrandLogo size="sm" />
        </div>
      </button>
    </div>
  );
}
