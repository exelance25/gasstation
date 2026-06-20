import { cn } from "@/lib/utils";

type IconProps = { className?: string };

/** Ethereum — embossed 3D */
export function EthereumIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" className={cn("h-full w-full", className)} aria-hidden>
      <defs>
        <linearGradient id="ethGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E8E8E8" />
          <stop offset="50%" stopColor="#C0C0C0" />
          <stop offset="100%" stopColor="#8A8A8A" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="15" fill="url(#ethGrad)" />
      <path fill="#627EEA" d="M16 6l-1 12.2 1 1.1 1-1.1L16 6z" />
      <path fill="#8FA8F0" d="M16 19.3l-5.5 3.2L16 26l5.5-3.5-5.5-3.2z" />
      <path fill="#627EEA" opacity="0.85" d="M10.5 11.5L16 6v13.3l-5.5-7.8z" />
      <path fill="#454A75" opacity="0.7" d="M21.5 11.5L16 19.3V6l5.5 5.5z" />
    </svg>
  );
}

/** Solana-style — SVM wallet row */
export function SolanaIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" className={cn("h-full w-full", className)} aria-hidden>
      <circle cx="16" cy="16" r="15" fill="#0f0f0f" />
      <path fill="#00FFA3" d="M8 20.5l4-4 4 4-4 4-4-4z" />
      <path fill="#03E1FF" d="M12 8.5l4 4-4 4-4-4 4-4z" />
      <path fill="#DC1FFF" d="M20 11.5l-4 4 4 4 4-4-4-4z" />
    </svg>
  );
}

/** USDT (Tether) */
export function UsdtIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" className={cn("h-full w-full", className)} aria-hidden>
      <circle cx="16" cy="16" r="15" fill="#26A17B" />
      <path
        fill="#fff"
        d="M18.2 17.1c0-1.1-0.7-1.4-2-1.6l-1.2-0.2c-1.3-0.2-1.5-0.5-1.5-1 0-0.6 0.5-1 1.4-1 0.8 0 1.4 0.3 1.5 0.9h1.4c-0.1-1.2-1-2-2.5-2.2V9.5h-1.3v1.4c-1.4 0.2-2.3 1-2.4 2.1h1.4c0.1-0.7 0.6-1.1 1.4-1.1 0.8 0 1.2 0.4 1.2 0.9 0 0.9-0.5 1.1-1.9 1.3l-1.2 0.2c-1.5 0.2-1.8 0.6-1.8 1.2 0 0.7 0.6 1.1 1.5 1.1 0.9 0 1.6-0.3 1.8-1h1.3c-0.2 1.3-1.1 2.1-2.6 2.3V22h1.3v-1.5c1.5-0.2 2.4-1 2.5-2.2h-1.3z"
      />
    </svg>
  );
}

export type WalletRowIcon = "ethereum" | "solana" | "usdt";

export function WalletRowIconBadge({ icon, className }: { icon: WalletRowIcon; className?: string }) {
  const inner = icon === "ethereum" ? <EthereumIcon /> : icon === "solana" ? <SolanaIcon /> : <UsdtIcon />;
  return (
    <div className={cn("embossed-3d h-11 w-11 shrink-0 overflow-hidden rounded-full p-0.5", className)}>
      {inner}
    </div>
  );
}
