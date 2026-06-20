"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { OneCoinIcon } from "@/components/brand/one-coin-icon";
import { BrandWordmark } from "@/components/brand/brand-wordmark";

const SPLASH_MS = 1000;

export function SplashScreen() {
  useEffect(() => {
    const timer = setTimeout(() => {
      fetch("/api/auth/session", { credentials: "same-origin", cache: "no-store" })
        .then((r) => r.json())
        .then((data: { authenticated?: boolean }) => {
          window.location.href = data.authenticated ? "/" : "/welcome";
        })
        .catch(() => {
          window.location.href = "/welcome";
        });
    }, SPLASH_MS);

    return () => clearTimeout(timer);
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-splash px-6">
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="embossed-3d relative h-32 w-32 rounded-full p-2 sm:h-36 sm:w-36"
      >
        <OneCoinIcon className="h-full w-full" />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="mt-8"
      >
        <BrandWordmark size="hero" variant="splash" hideLogo showTagline tagline="ONEBALANCE" />
      </motion.div>
    </main>
  );
}
