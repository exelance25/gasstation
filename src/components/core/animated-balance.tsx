"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValueEvent, useSpring } from "framer-motion";

function formatUsdParts(value: number) {
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
  const digits = formatted.replace(/[^\d.,]/g, "");
  const symbol = formatted.replace(/[\d.,\s]/g, "") || "$";
  const [whole, cents] = digits.includes(".") ? digits.split(".") : [digits, "00"];
  return { symbol, whole, cents };
}

export function AnimatedBalance({ value, className }: { value: number; className?: string }) {
  const spring = useSpring(value, { stiffness: 85, damping: 26, mass: 0.55 });
  const [parts, setParts] = useState(() => formatUsdParts(value));
  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  useMotionValueEvent(spring, "change", (latest) => {
    setParts(formatUsdParts(latest));
  });

  return (
    <motion.div className={className} layout transition={{ type: "spring", stiffness: 120, damping: 22 }}>
      <div className="flex items-end justify-center gap-0.5 leading-none">
        <span
          className="pb-2 text-2xl font-semibold tracking-tight sm:text-3xl"
          style={{
            backgroundImage: `linear-gradient(135deg, #D97706, #7C3AED)`,
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent"
          }}
        >
          {parts.symbol}
        </span>
        <span
          className="font-sans text-5xl font-bold tracking-tight tabular-nums sm:text-6xl"
          style={{
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            backgroundImage: "linear-gradient(125deg, #92400E 0%, #F59E0B 28%, #A78BFA 58%, #5B21B6 100%)"
          }}
        >
          {parts.whole}
        </span>
        <span className="pb-1.5 text-xl font-semibold tabular-nums text-monad-600/80 sm:text-2xl">
          .{parts.cents}
        </span>
      </div>
    </motion.div>
  );
}
