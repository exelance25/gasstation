export const WALLET_ICON_MAP: Record<string, string> = {
  MetaMask: "/wallets/metamask.svg",
  Rabby: "/wallets/rabby.svg",
  Phantom: "/wallets/phantom.svg",
  Solflare: "/wallets/solflare.svg",
  "Trust Wallet": "/wallets/trust.svg",
  "OKX Wallet": "/wallets/okx.svg",
  "Coinbase Wallet": "/wallets/coinbase.svg",
  Base: "/wallets/base.svg",
  WalletConnect: "/wallets/walletconnect.svg",
  Rainbow: "/wallets/rainbow.svg",
};

export function getWalletIconPath(label: string): string | null {
  return WALLET_ICON_MAP[label] ?? null;
}
