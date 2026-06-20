import type { ConnectedWallet } from "@/lib/store";
import type { WalletRowIcon } from "@/components/brand/chain-icons";

/** Giriş sonrası cüzdan bağlanmadan önizleme — GASSTATION demo bakiye */
export const DEMO_WALLETS: ConnectedWallet[] = [
  {
    address: "0xdemo-ethereum-wallet",
    chain: "evm",
    walletName: "Demo EVM"
  },
  {
    address: "DemoSolanaWallet11111111111111111111111",
    chain: "solana",
    walletName: "Demo Solana"
  }
];

export type DemoWalletRow = {
  id: string;
  label: string;
  subtitle?: string;
  icon: WalletRowIcon;
  value: number;
  change: number;
};

export const DEMO_WALLET_ROWS: DemoWalletRow[] = [
  {
    id: "evm",
    label: "EWM Wallet",
    icon: "ethereum",
    value: 45.12,
    change: 0.22
  },
  {
    id: "svm",
    label: "SWM Wallet",
    icon: "solana",
    value: 25.53,
    change: 0.15
  },
  {
    id: "usdt",
    label: "USDT",
    subtitle: "0.02229 USDT",
    icon: "usdt",
    value: 0.02,
    change: -0.01
  }
];
