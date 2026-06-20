"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useConnect, useConnectors, useDisconnect } from "wagmi";
import type { Connector } from "wagmi";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import type { WalletName } from "@solana/wallet-adapter-base";
import type { DepotAssetId } from "@/config/depot-assets";
import {
  disconnectPhantomExtension,
  readProviderAccounts,
  switchEvmWalletAccount,
} from "@/lib/injected-provider";
import { getConnectorLabel } from "@/lib/connectors";
import { useEvmProviderAccount } from "@/hooks/useEvmProviderAccount";
import { useWalletIdleDisconnect } from "@/hooks/useWalletIdleDisconnect";
import { delay, hardResetWalletSession, purgeWalletPersistence, clearWalletActiveSession, isWalletActiveSession, touchWalletActiveSession } from "@/lib/wallet-session";
import {
  connectPhantomSolanaWithApproval,
  resetPhantomHybridSession,
} from "@/lib/phantom-hybrid";
import { connectEvmConnectorSafe } from "@/lib/evm-wallet-connect";
import { SOLANA_WALLET_STORAGE_KEY } from "@/wallets/solana-config";

export type WalletFamily = "evm" | "solana";

type WalletContextValue = {
  evmAddress: `0x${string}` | undefined;
  evmConnected: boolean;
  evmChainId: number | undefined;
  solanaAddress: string | undefined;
  solanaConnected: boolean;
  /** Phantom — Solana + EVM birlikte, her seferinde onay popup */
  connectPhantomWallet: (evmConnector: Connector) => Promise<void>;
  /** Doğrudan EVM connector ile bağlan */
  connectEvmConnector: (connector: Connector) => Promise<void>;
  /** Doğrudan Solana cüzdanı ile bağlan */
  connectSolanaWallet: (walletName: WalletName) => Promise<void>;
  connectForAsset: (asset: DepotAssetId) => Promise<void>;
  connectDepositWallet: (family: WalletFamily) => Promise<void>;
  disconnectForAsset: (asset: DepotAssetId) => Promise<void>;
  disconnectAllWallets: () => Promise<void>;
  switchEvmAccount: () => Promise<void>;
  isDeliveryFamily: (asset: DepotAssetId) => WalletFamily;
};

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const {
    address: syncedEvmAddress,
    isConnected: evmConnected,
    chainId: evmChainId,
    connector,
    syncFromProvider,
  } = useEvmProviderAccount();

  const { connectAsync } = useConnect();
  const connectors = useConnectors();
  const { disconnectAsync: disconnectEvm } = useDisconnect();
  const { openConnectModal } = useConnectModal();

  const solana = useWallet();
  const { wallets: solanaWalletList, select: selectSolanaWallet } = solana;
  const { setVisible: setSolanaModalVisible } = useWalletModal();

  const pendingEvmModalRef = useRef(false);
  const pendingSolanaModalRef = useRef(false);
  const [hybridSolPubkey, setHybridSolPubkey] = useState<string | null>(null);
  const [sessionActive, setSessionActive] = useState(false);

  const wagmiSaysConnected = evmConnected && Boolean(syncedEvmAddress);
  const evmUserConnected = wagmiSaysConnected && sessionActive && isWalletActiveSession();

  const resolvedSolanaAddress =
    sessionActive && hybridSolPubkey
      ? hybridSolPubkey
      : sessionActive && solana.connected
        ? solana.publicKey?.toBase58()
        : undefined;
  const resolvedSolanaConnected = Boolean(resolvedSolanaAddress) && sessionActive && isWalletActiveSession();

  const markSessionConnected = useCallback(() => {
    touchWalletActiveSession();
    setSessionActive(true);
  }, []);

  const isDeliveryFamily = useCallback((asset: DepotAssetId): WalletFamily => {
    return asset === "SOL" ? "solana" : "evm";
  }, []);

  const disconnectEvmActive = useCallback(async () => {
    try {
      if (connector) {
        await disconnectEvm({ connector });
      } else {
        await disconnectEvm();
      }
    } catch {
      /* ignore */
    }
    await hardResetWalletSession();
  }, [connector, disconnectEvm]);

  const switchEvmAccount = useCallback(async () => {
    if (!connector) return;
    const provider = await connector.getProvider?.();
    await switchEvmWalletAccount(provider, async () => {
      await connector.connect({ isReconnecting: true });
    });
    await syncFromProvider();
  }, [connector, syncFromProvider]);

  const disconnectAllWallets = useCallback(async () => {
    pendingEvmModalRef.current = false;
    pendingSolanaModalRef.current = false;

    await Promise.all([
      disconnectEvmActive(),
      (async () => {
        try {
          await solana.disconnect();
        } catch {
          /* ignore */
        }
        solana.select(null);
      })(),
    ]);

    localStorage.removeItem(SOLANA_WALLET_STORAGE_KEY);
    purgeWalletPersistence();
    clearWalletActiveSession();
    setHybridSolPubkey(null);
    setSessionActive(false);
    await delay(100);
  }, [disconnectEvmActive, solana]);

  const anyUserConnected = evmUserConnected || resolvedSolanaConnected;

  useWalletIdleDisconnect(anyUserConnected, disconnectAllWallets);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const hasWalletLink = evmConnected || solana.connected || Boolean(hybridSolPubkey);
      if (!isWalletActiveSession()) {
        setSessionActive(false);
        if (hasWalletLink) {
          void disconnectAllWallets();
        }
        return;
      }
      if (!hasWalletLink) {
        clearWalletActiveSession();
        setSessionActive(false);
        return;
      }
      setSessionActive(true);
    }, 350);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount stale oturum temizliği
  }, []);

  const openEvmConnectModal = useCallback(() => {
    openConnectModal?.();
  }, [openConnectModal]);

  useEffect(() => {
    if (!pendingEvmModalRef.current || evmConnected) return;
    pendingEvmModalRef.current = false;
    const timer = window.setTimeout(openEvmConnectModal, 80);
    return () => window.clearTimeout(timer);
  }, [evmConnected, openEvmConnectModal]);

  useEffect(() => {
    if (!pendingSolanaModalRef.current || solana.connected) return;
    pendingSolanaModalRef.current = false;
    const timer = window.setTimeout(() => setSolanaModalVisible(true), 80);
    return () => window.clearTimeout(timer);
  }, [solana.connected, setSolanaModalVisible]);

  const disconnectSolanaActive = useCallback(async () => {
    localStorage.removeItem(SOLANA_WALLET_STORAGE_KEY);
    purgeWalletPersistence();
    setHybridSolPubkey(null);
    await disconnectPhantomExtension();
    try {
      await solana.disconnect();
    } catch {
      /* ignore */
    }
    solana.select(null);
    await delay(200);
  }, [solana]);

  const connectPhantomWallet = useCallback(
    async (evmConnector: Connector) => {
      pendingEvmModalRef.current = false;
      pendingSolanaModalRef.current = false;
      setHybridSolPubkey(null);

      await resetPhantomHybridSession();

      try {
        await solana.disconnect();
      } catch {
        /* ignore */
      }
      solana.select(null);

      if (evmConnected) {
        try {
          await disconnectEvm({ connector: evmConnector });
        } catch {
          /* ignore */
        }
        purgeWalletPersistence();
        await delay(150);
      }

      const phantomAdapter = solanaWalletList.find((w) => w.adapter.name === "Phantom")?.adapter;
      if (!phantomAdapter) {
        throw new Error("Phantom adapter bulunamadı");
      }

      // 1) EVM onayı (Phantom extension — tek popup)
      await connectEvmConnectorSafe(
        evmConnector,
        connectAsync,
        disconnectEvm,
        syncFromProvider,
        { preserveSolana: true, deferPopupToConnector: true },
      );

      // 2) Solana onayı — EVM sonrası; adapter state kaybolmaz
      const pubkey = await connectPhantomSolanaWithApproval(
        selectSolanaWallet,
        phantomAdapter,
      );
      setHybridSolPubkey(pubkey);

      const evmProvider = await evmConnector.getProvider?.();
      const evmAccounts = await readProviderAccounts(evmProvider);
      if (evmAccounts.length === 0) {
        throw new Error("Phantom EVM onayı tamamlanmadı");
      }
      markSessionConnected();
    },
    [
      connectAsync,
      disconnectEvm,
      evmConnected,
      markSessionConnected,
      selectSolanaWallet,
      solana,
      solanaWalletList,
      syncFromProvider,
    ],
  );

  const connectEvmConnector = useCallback(
    async (targetConnector: Connector) => {
      const isPhantom =
        targetConnector.id?.toLowerCase().includes("phantom") ||
        targetConnector.name?.toLowerCase().includes("phantom");

      if (isPhantom) {
        return connectPhantomWallet(targetConnector);
      }

      await disconnectSolanaActive();

      if (evmConnected && connector?.uid === targetConnector.uid) {
        await switchEvmAccount();
        markSessionConnected();
        return;
      }

      if (evmConnected) {
        await disconnectEvmActive();
        await delay(200);
      }

      await connectEvmConnectorSafe(
        targetConnector,
        connectAsync,
        disconnectEvm,
        syncFromProvider,
      );
      markSessionConnected();
    },
    [
      connectAsync,
      connectPhantomWallet,
      connector,
      disconnectEvmActive,
      disconnectSolanaActive,
      evmConnected,
      markSessionConnected,
      switchEvmAccount,
      syncFromProvider,
    ],
  );

  const findPhantomEvmConnector = useCallback((): Connector | null => {
    return (
      connectors.find(
        (c) =>
          getConnectorLabel(c) === "Phantom" ||
          c.id?.toLowerCase().includes("phantom") ||
          c.name?.toLowerCase().includes("phantom"),
      ) ?? null
    );
  }, [connectors]);

  const connectSolanaWallet = useCallback(
    async (walletName: WalletName) => {
      if (walletName === "Phantom") {
        const phantomConnector = findPhantomEvmConnector();
        if (phantomConnector) {
          return connectPhantomWallet(phantomConnector);
        }
      }

      if (evmConnected) {
        await disconnectEvmActive();
        await delay(200);
      }

      await disconnectSolanaActive();
      solana.select(walletName);
      const entry = solanaWalletList.find((w) => w.adapter.name === walletName);
      if (!entry) {
        throw new Error(`${walletName} cüzdanı bulunamadı`);
      }
      await entry.adapter.connect();
      markSessionConnected();
    },
    [
      connectPhantomWallet,
      disconnectEvmActive,
      disconnectSolanaActive,
      evmConnected,
      findPhantomEvmConnector,
      markSessionConnected,
      solana,
      solanaWalletList,
    ],
  );

  const connectDepositWallet = useCallback(
    async (family: WalletFamily) => {
      if (family === "evm") {
        if (evmUserConnected) {
          await switchEvmAccount();
          markSessionConnected();
          return;
        }
        pendingEvmModalRef.current = true;
        openEvmConnectModal();
        return;
      }

      await disconnectSolanaActive();
      pendingSolanaModalRef.current = true;
      setSolanaModalVisible(true);
    },
    [
      disconnectSolanaActive,
      evmUserConnected,
      markSessionConnected,
      openEvmConnectModal,
      setSolanaModalVisible,
      switchEvmAccount,
    ],
  );

  const connectForAsset = useCallback(
    async (asset: DepotAssetId) => {
      return connectDepositWallet(isDeliveryFamily(asset));
    },
    [connectDepositWallet, isDeliveryFamily],
  );

  const disconnectForAsset = useCallback(
    async (asset: DepotAssetId) => {
      if (isDeliveryFamily(asset) === "solana") {
        await disconnectSolanaActive();
      } else {
        await disconnectEvmActive();
      }
    },
    [disconnectEvmActive, disconnectSolanaActive, isDeliveryFamily],
  );

  const value = useMemo<WalletContextValue>(
    () => ({
      evmAddress: evmUserConnected ? syncedEvmAddress : undefined,
      evmConnected: evmUserConnected,
      evmChainId,
      solanaAddress: resolvedSolanaAddress,
      solanaConnected: resolvedSolanaConnected,
      connectPhantomWallet,
      connectEvmConnector,
      connectSolanaWallet,
      connectForAsset,
      connectDepositWallet,
      disconnectForAsset,
      disconnectAllWallets,
      switchEvmAccount,
      isDeliveryFamily,
    }),
    [
      syncedEvmAddress,
      evmUserConnected,
      evmChainId,
      resolvedSolanaAddress,
      resolvedSolanaConnected,
      connectPhantomWallet,
      connectEvmConnector,
      connectSolanaWallet,
      connectForAsset,
      connectDepositWallet,
      disconnectForAsset,
      disconnectAllWallets,
      switchEvmAccount,
      isDeliveryFamily,
    ],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWalletContext(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) {
    throw new Error("useWalletContext — WalletProvider gerekli");
  }
  return ctx;
}
