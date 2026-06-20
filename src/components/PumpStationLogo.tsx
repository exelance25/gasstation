/**
 * GASSTATION markası — saf SVG (MIT).
 */
export function PumpStationLogo({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      aria-hidden
    >
      <path
        d="M24 4 L40 12 V28 L24 44 L8 28 V12 Z"
        stroke="#8A2BE2"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <rect x="18" y="14" width="12" height="22" rx="2" stroke="#10B981" strokeWidth="1.5" />
      <path
        d="M30 20 H38 M38 20 V26 M38 26 H34"
        stroke="#8A2BE2"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
