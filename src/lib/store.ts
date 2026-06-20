"use client";

/** TekBakiye global state — cüzdanlar, GASSTATION toplam bakiye, persist ile takma adlar. */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { fetchAndApplyAggregatedBalance } from "@/lib/gasstation-client";
import { DEMO_WALLETS } from "@/lib/demo-portfolio";
import { hashAddressSync } from "@/lib/wallet-hash";
import type { AppEnv, AppLocale } from "@/types";

export type WalletChain = "evm" | "solana";

export type ConnectedWallet = {
  address: string;
  chain: WalletChain;
  walletName: string;
  nickname?: string;
};

/** Persisted without raw address — hash + metadata only */
export type PersistedWalletMeta = {
  addressHash: string;
  chain: WalletChain;
  walletName: string;
  nickname?: string;
};

export interface AppState {
  env: AppEnv;
  locale: AppLocale;
  sessionToken?: string;
  connectedWallets: ConnectedWallet[];
  persistedWalletMeta: PersistedWalletMeta[];
  totalBalanceUSD: number | null;
  isLoading: boolean;
  hasInitialBalanceLoad: boolean;
  /** True when showing GASSTATION demo data (no real wallet connected) */
  isPreviewMode: boolean;
}

type AppActions = {
  setLocale: (locale: AppLocale) => void;
  setEnv: (env: AppEnv) => void;
  setSessionToken: (token?: string) => void;
  addWallet: (wallet: ConnectedWallet) => void;
  removeWallet: (address: string, chain: WalletChain) => void;
  setTotalBalance: (amount: number | null) => void;
  updateWalletNickname: (address: string, chain: WalletChain, nickname: string) => void;
  fetchTotalBalance: (options?: { silent?: boolean }) => Promise<void>;
  syncPersistedMeta: () => void;
};

export type TekBakiyeStore = AppState & AppActions;

function walletKey(address: string, chain: WalletChain) {
  return `${chain}:${address.toLowerCase()}`;
}

function findNickname(meta: PersistedWalletMeta[], address: string, chain: WalletChain) {
  const hash = hashAddressSync(address);
  return meta.find((m) => m.addressHash === hash && m.chain === chain)?.nickname;
}

function upsertMeta(
  meta: PersistedWalletMeta[],
  wallet: ConnectedWallet
): PersistedWalletMeta[] {
  const hash = hashAddressSync(wallet.address);
  const next = meta.filter((m) => !(m.addressHash === hash && m.chain === wallet.chain));
  next.push({
    addressHash: hash,
    chain: wallet.chain,
    walletName: wallet.walletName,
    nickname: wallet.nickname
  });
  return next;
}

export const useTekBakiyeStore = create<TekBakiyeStore>()(
  persist(
    (set, get) => ({
      env: "development",
      locale: "tr",
      sessionToken: undefined,
      connectedWallets: [],
      persistedWalletMeta: [],
      totalBalanceUSD: null,
      isLoading: false,
      hasInitialBalanceLoad: false,
      isPreviewMode: false,

      setLocale: (locale) => set({ locale }),
      setEnv: (env) => set({ env }),
      setSessionToken: (token) => set({ sessionToken: token }),

      syncPersistedMeta: () => {
        set((state) => ({
          persistedWalletMeta: state.connectedWallets.map((w) => ({
            addressHash: hashAddressSync(w.address),
            chain: w.chain,
            walletName: w.walletName,
            nickname: w.nickname
          }))
        }));
      },

      addWallet: (wallet) => {
        const nickname =
          wallet.nickname ?? findNickname(get().persistedWalletMeta, wallet.address, wallet.chain);
        const enriched = { ...wallet, nickname };
        const key = walletKey(wallet.address, wallet.chain);

        set((state) => {
          const exists = state.connectedWallets.some((w) => walletKey(w.address, w.chain) === key);
          const connectedWallets = exists
            ? state.connectedWallets.map((w) =>
                walletKey(w.address, w.chain) === key ? { ...w, ...enriched } : w
              )
            : [...state.connectedWallets, enriched];
          return {
            connectedWallets,
            persistedWalletMeta: upsertMeta(state.persistedWalletMeta, enriched)
          };
        });

        void get().fetchTotalBalance({ silent: get().hasInitialBalanceLoad });
      },

      removeWallet: (address, chain) => {
        const hash = hashAddressSync(address);
        set((state) => ({
          connectedWallets: state.connectedWallets.filter(
            (w) => walletKey(w.address, w.chain) !== walletKey(address, chain)
          ),
          persistedWalletMeta: state.persistedWalletMeta.filter(
            (m) => !(m.addressHash === hash && m.chain === chain)
          )
        }));
        void get().fetchTotalBalance({ silent: get().hasInitialBalanceLoad });
      },

      setTotalBalance: (amount) => set({ totalBalanceUSD: amount }),

      updateWalletNickname: (address, chain, nickname) => {
        const key = walletKey(address, chain);
        set((state) => {
          const wallet = state.connectedWallets.find((w) => walletKey(w.address, w.chain) === key);
          const connectedWallets = state.connectedWallets.map((w) =>
            walletKey(w.address, w.chain) === key ? { ...w, nickname } : w
          );
          const persistedWalletMeta = wallet
            ? upsertMeta(state.persistedWalletMeta, { ...wallet, nickname })
            : state.persistedWalletMeta;
          return { connectedWallets, persistedWalletMeta };
        });
      },

      fetchTotalBalance: async (options) => {
        const connected = get().connectedWallets;
        const wallets = connected.length > 0 ? connected : DEMO_WALLETS;
        const isPreviewMode = connected.length === 0;

        const silent = options?.silent ?? get().hasInitialBalanceLoad;
        await fetchAndApplyAggregatedBalance(
          wallets,
          {
            onLoading: (isLoading) => {
              if (!silent) set({ isLoading });
            },
            onBalance: (totalUsd) => set({ totalBalanceUSD: totalUsd })
          },
          { silent }
        );
        set({ hasInitialBalanceLoad: true, isPreviewMode });
      }
    }),
    {
      name: "tekbakiye-v1",
      partialize: (state) => ({
        persistedWalletMeta: state.persistedWalletMeta,
        locale: state.locale
      })
    }
  )
);

export const useAppStore = useTekBakiyeStore;
