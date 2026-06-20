"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

/** Bilardo topu hissi — parlak küre + kabartma mor “1” */
export function OneCoinIcon({ className }: { className?: string }) {
  const uid = useId().replace(/:/g, "");

  const ball = `ball-${uid}`;
  const gold = `gold-${uid}`;
  const shine = `shine-${uid}`;
  const oneGrad = `oneGrad-${uid}`;
  const oneShadow = `oneShadow-${uid}`;
  const ballShadow = `ballShadow-${uid}`;

  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-full w-full", className)}
      aria-hidden
    >
      <defs>
        <radialGradient id={ball} cx="32%" cy="28%" r="68%">
          <stop offset="0%" stopColor="#FFFEF5" />
          <stop offset="22%" stopColor="#FDE68A" />
          <stop offset="55%" stopColor="#F59E0B" />
          <stop offset="88%" stopColor="#B45309" />
          <stop offset="100%" stopColor="#78350F" />
        </radialGradient>
        <radialGradient id={gold} cx="70%" cy="75%" r="45%">
          <stop offset="0%" stopColor="#92400E" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#451A03" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={oneGrad} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#EDE9FE" />
          <stop offset="35%" stopColor="#A78BFA" />
          <stop offset="70%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#4C1D95" />
        </linearGradient>
        <filter id={ballShadow} x="-30%" y="-20%" width="160%" height="160%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#4C1D95" floodOpacity="0.45" />
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.25" />
        </filter>
        <filter id={oneShadow} x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="2" stdDeviation="0.5" floodColor="#2E1065" floodOpacity="0.9" />
          <feDropShadow dx="0" dy="-1" stdDeviation="0" floodColor="#F5F3FF" floodOpacity="0.85" />
        </filter>
        <filter id={shine} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.2" />
        </filter>
      </defs>

      <circle cx="50" cy="50" r="47" fill="url(#ball)" filter={`url(#${ballShadow})`} />
      <circle cx="50" cy="50" r="47" fill="url(#gold)" />

      {/* İnce mor bant — bilardo şeridi */}
      <ellipse cx="50" cy="50" rx="47" ry="47" fill="none" stroke="#6B4FDB" strokeOpacity="0.22" strokeWidth="3" />
      <path
        d="M 6 50 A 44 44 0 0 1 94 50"
        fill="none"
        stroke="#8B5CF6"
        strokeOpacity="0.35"
        strokeWidth="5"
      />

      {/* Parlak yansıma */}
      <ellipse cx="34" cy="30" rx="18" ry="12" fill="#FFFFFF" opacity="0.55" filter={`url(#${shine})`} />
      <ellipse cx="30" cy="26" rx="8" ry="5" fill="#FFFFFF" opacity="0.75" />

      {/* Kabartma “1” gölge + yüzey */}
      <text
        x="50"
        y="58"
        textAnchor="middle"
        fontSize="42"
        fontWeight="900"
        fontFamily="Inter, system-ui, sans-serif"
        fill="#3B0764"
        opacity="0.55"
        transform="translate(1.5, 2.5)"
      >
        1
      </text>
      <text
        x="50"
        y="58"
        textAnchor="middle"
        fontSize="42"
        fontWeight="900"
        fontFamily="Inter, system-ui, sans-serif"
        fill={`url(#${oneGrad})`}
        filter={`url(#${oneShadow})`}
      >
        1
      </text>
      <text
        x="50"
        y="57.5"
        textAnchor="middle"
        fontSize="42"
        fontWeight="900"
        fontFamily="Inter, system-ui, sans-serif"
        fill="none"
        stroke="#EDE9FE"
        strokeWidth="0.8"
        opacity="0.9"
      >
        1
      </text>

      {/* Kenar halkası */}
      <circle cx="50" cy="50" r="47" fill="none" stroke="#FEF3C7" strokeOpacity="0.35" strokeWidth="1" />
    </svg>
  );
}

export function BrandLogo({ size = "md" }: { size?: "sm" | "md" | "lg" | "xl" | "hero" }) {
  const sizes = {
    sm: "h-10 w-10",
    md: "h-11 w-11",
    lg: "h-16 w-16",
    xl: "h-24 w-24",
    hero: "h-32 w-32"
  };

  return (
    <div className={cn(sizes[size], "shrink-0 drop-shadow-coin")}>
      <OneCoinIcon />
    </div>
  );
}
