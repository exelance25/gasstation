"use client";

import { getDepotAsset, type DepotAssetId } from "@/config/depot-assets";

type FuelTankGaugeProps = {
  activeAsset: DepotAssetId;
  poolFillPercent: number;
  requestFillPercent: number;
  className?: string;
};

/**
 * Tanker tır + şeffaf silindirik depo — iç doluluk = bağlı kasa.
 */
export function FuelTankGauge({
  activeAsset,
  poolFillPercent,
  requestFillPercent,
  className = "",
}: FuelTankGaugeProps) {
  const asset = getDepotAsset(activeAsset);
  const pool = Math.min(100, Math.max(0, poolFillPercent));
  const request = Math.min(pool, Math.max(0, requestFillPercent));
  const fillH = (pool / 100) * 34;
  const reqH = (request / 100) * 34;
  const gradId = `tankGrad-${activeAsset}`;

  return (
    <svg
      viewBox="0 0 140 72"
      className={`h-[4.5rem] w-[7.5rem] shrink-0 ${className}`}
      aria-label={`Gas tankı ${pool.toFixed(0)}% dolu`}
    >
      {/* Kabin */}
      <path
        d="M4 38 H28 V22 H42 V38 H52"
        fill="#141414"
        stroke="#525252"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <rect x="8" y="26" width="14" height="8" rx="1" fill="#1f2937" stroke="#404040" />

      {/* Şeffaf silindirik tank */}
      <rect
        x="54"
        y="14"
        width="58"
        height="38"
        rx="19"
        fill="rgba(15,15,15,0.35)"
        stroke="#6b7280"
        strokeWidth="1.5"
      />
      <clipPath id="tankClip">
        <rect x="56" y="16" width="54" height="34" rx="17" />
      </clipPath>
      <g clipPath="url(#tankClip)">
        {/* Kasa doluluğu */}
        <rect
          x="56"
          y={50 - fillH}
          width="54"
          height={fillH}
          fill={`url(#${gradId})`}
          opacity={0.55}
          className="transition-all duration-500"
        />
        {/* Talep katmanı */}
        {reqH > 0 && (
          <rect
            x="56"
            y={50 - reqH}
            width="54"
            height={reqH}
            fill={`url(#${gradId})`}
            opacity={0.95}
            className="transition-all duration-500"
          />
        )}
      </g>

      {/* Tank şeritleri */}
      <line x1="68" y1="20" x2="68" y2="46" stroke="rgba(255,255,255,0.08)" />
      <line x1="83" y1="18" x2="83" y2="48" stroke="rgba(255,255,255,0.08)" />
      <line x1="98" y1="20" x2="98" y2="46" stroke="rgba(255,255,255,0.08)" />

      {/* Hortum */}
      <path
        d="M112 32 H122 L128 28 V36 L122 34 H112"
        fill="none"
        stroke="#525252"
        strokeWidth="1.5"
      />

      {/* Tekerlekler */}
      <circle cx="22" cy="56" r="6" fill="#111" stroke="#404040" strokeWidth="1.5" />
      <circle cx="22" cy="56" r="2.5" fill="#333" />
      <circle cx="100" cy="56" r="6" fill="#111" stroke="#404040" strokeWidth="1.5" />
      <circle cx="100" cy="56" r="2.5" fill="#333" />

      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={asset.colorFrom} />
          <stop offset="100%" stopColor={asset.colorTo} />
        </linearGradient>
      </defs>
    </svg>
  );
}
