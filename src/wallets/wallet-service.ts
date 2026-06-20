export type WalletKind = "ethereum" | "solana";

export type WalletConnection = {
  address: string;
  kind: WalletKind;
  provider: string;
  chainId: string | number;
  connectedAt: string;
};

export type WalletSnapshot = {
  evmAddress?: string;
  solanaAddress?: string;
  updatedAt: string;
};

const STORAGE_KEY = "onebalance.wallet";

export const walletService = {
  save(snapshot: WalletSnapshot) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  },

  load(): WalletSnapshot | null {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as WalletSnapshot) : null;
  },

  persist(connection: WalletConnection) {
    const existing = walletService.load();
    walletService.save({
      evmAddress: connection.kind === "ethereum" ? connection.address : existing?.evmAddress,
      solanaAddress: connection.kind === "solana" ? connection.address : existing?.solanaAddress,
      updatedAt: new Date().toISOString()
    });
  },

  restore() {
    return walletService.load();
  },

  clear() {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(STORAGE_KEY);
  }
};
