/**
 * Arka plan benzin istasyonu silüeti — soluk, saf SVG (MIT).
 */
export function GasStationSilhouette() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center overflow-hidden"
      aria-hidden
    >
      <svg
        viewBox="0 0 1200 700"
        className="h-full w-full max-w-[1400px] opacity-[0.08]"
        preserveAspectRatio="xMidYMid meet"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M120 320 H1080 L1000 180 H200 Z"
          stroke="#A855F7"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <rect x="220" y="280" width="80" height="200" rx="4" stroke="#A855F7" strokeWidth="2" />
        <rect x="520" y="260" width="90" height="220" rx="4" stroke="#A855F7" strokeWidth="2" />
        <rect x="820" y="280" width="80" height="200" rx="4" stroke="#A855F7" strokeWidth="2" />
        <line x1="80" y1="500" x2="1120" y2="500" stroke="#10B981" strokeWidth="1" opacity="0.5" />
      </svg>
    </div>
  );
}
