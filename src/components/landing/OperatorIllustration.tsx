"use client";

import { motion } from "framer-motion";

const TOKENS = ["ETH", "SOL", "BASE", "ARB", "OP"] as const;

/** Original SVG — retro fuel-station pose, cyber-fintech operator (not a copy of any reference). */
export function OperatorIllustration() {
  return (
    <motion.div
      className="relative mx-auto aspect-[4/5] w-full max-w-md"
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      aria-hidden
    >
      {/* Ambient particles */}
      {Array.from({ length: 12 }).map((_, i) => (
        <motion.span
          key={i}
          className="absolute h-1 w-1 rounded-full bg-indigo-400/40"
          style={{ left: `${10 + (i * 7) % 80}%`, top: `${15 + (i * 11) % 70}%` }}
          animate={{ opacity: [0.2, 0.8, 0.2], scale: [1, 1.4, 1] }}
          transition={{ duration: 3 + (i % 3), repeat: Infinity, delay: i * 0.2 }}
        />
      ))}

      <svg viewBox="0 0 400 500" className="h-full w-full drop-shadow-[0_24px_80px_rgba(99,102,241,0.25)]">
        <defs>
          <linearGradient id="terminalBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e1b4b" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#0f172a" stopOpacity="0.95" />
          </linearGradient>
          <linearGradient id="energyStream" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="50%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#a78bfa" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Futuristic gas terminal */}
        <rect x="40" y="120" width="320" height="280" rx="16" fill="url(#terminalBg)" stroke="#334155" strokeWidth="1.5" />
        <rect x="60" y="145" width="120" height="80" rx="8" fill="#0f172a" stroke="#475569" />
        <text x="72" y="175" fill="#94a3b8" fontSize="11" fontFamily="system-ui,sans-serif">
          PUMP
        </text>
        <text x="72" y="195" fill="#e2e8f0" fontSize="16" fontWeight="600" fontFamily="system-ui,sans-serif">
          STATION
        </text>
        <line x1="60" y1="240" x2="340" y2="240" stroke="#334155" strokeWidth="1" />
        {TOKENS.map((t, i) => (
          <text
            key={t}
            x={75 + i * 52}
            y="268"
            fill="#818cf8"
            fontSize="10"
            fontFamily="monospace"
            opacity={0.85}
          >
            {t}
          </text>
        ))}

        {/* Operator body */}
        <ellipse cx="200" cy="430" rx="70" ry="12" fill="#000" opacity="0.35" />
        <path
          d="M175 380 L175 290 Q175 250 200 235 Q225 250 225 290 L225 380 Z"
          fill="#1e293b"
          stroke="#475569"
          strokeWidth="1"
        />
        <path d="M185 290 L190 220 L210 220 L215 290" fill="#312e81" />
        <circle cx="200" cy="205" r="28" fill="#fcd9bd" />
        <path d="M172 200 Q200 175 228 200 L225 215 Q200 195 175 215 Z" fill="#1e293b" />
        <rect x="168" y="255" width="64" height="8" rx="4" fill="#4f46e5" />

        {/* Arm + nozzle */}
        <path d="M225 280 Q260 270 275 240" fill="none" stroke="#64748b" strokeWidth="10" strokeLinecap="round" />
        <path d="M268 235 L295 210 L310 218 L285 245 Z" fill="#334155" stroke="#64748b" />
        <rect x="300" y="200" width="36" height="22" rx="6" fill="#1e293b" stroke="#6366f1" strokeWidth="2" />

        {/* Energy stream */}
        <path
          d="M318 195 Q340 160 355 120 Q365 90 380 70"
          fill="none"
          stroke="url(#energyStream)"
          strokeWidth="6"
          strokeLinecap="round"
          filter="url(#glow)"
          opacity="0.9"
        />
        {TOKENS.map((t, i) => (
          <text
            key={`e-${t}`}
            x={330 + (i % 3) * 18}
            y={100 + i * 22}
            fill="#c7d2fe"
            fontSize="11"
            fontWeight="600"
            fontFamily="monospace"
            opacity={0.7 + (i % 3) * 0.1}
          >
            {t}
          </text>
        ))}

        {/* Blockchain energy lines */}
        <path d="M50 350 Q120 320 200 340 T350 350" fill="none" stroke="#4338ca" strokeWidth="1" opacity="0.4" strokeDasharray="4 6" />
        <path d="M70 390 Q200 360 330 390" fill="none" stroke="#0ea5e9" strokeWidth="1" opacity="0.35" strokeDasharray="3 5" />
      </svg>
    </motion.div>
  );
}
