"use client";

import "@/localization/i18n";
import "@rainbow-me/rainbowkit/styles.css";
import "@solana/wallet-adapter-react-ui/styles.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { useMemo, useState, type ReactNode } from "react";
import { useWalletConnectErrorGuard } from "@/hooks/useWalletConnectErrorGuard";
import { I18nextProvider } from "react-i18next";
import i18n from "@/localization/i18n";
import { wagmiConfig, walletAppName } from "@config/web3";
import { getSolanaConnection, getSolanaWallets, SOLANA_WALLET_STORAGE_KEY } from "@/wallets/solana-config";
import { WalletProvider } from "@/providers/WalletContext";
import { ToastProvider } from "@/providers/ToastProvider";
import { GasModeProvider } from "@/providers/GasModeProvider";
import { clientEnv } from "@/config/client-env";

export function AppProviders({ children }: { children: ReactNode }) {
  useWalletConnectErrorGuard();
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, refetchOnWindowFocus: false },
        },
      }),
  );

  const solanaEndpoint = useMemo(
    () => getSolanaConnection(clientEnv.NEXT_PUBLIC_APP_ENV === "mainnet" ? "mainnet" : "testnet"),
    [],
  );
  const solanaWallets = useMemo(() => getSolanaWallets(), []);

  return (
    <I18nextProvider i18n={i18n}>
      <WagmiProvider config={wagmiConfig} reconnectOnMount={false}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider
            appInfo={{ appName: walletAppName }}
            theme={darkTheme({
              accentColor: "#10B981",
              borderRadius: "large",
            })}
            modalSize="compact"
          >
            <ConnectionProvider endpoint={solanaEndpoint}>
              <SolanaWalletProvider
                wallets={solanaWallets}
                autoConnect={false}
                localStorageKey={SOLANA_WALLET_STORAGE_KEY}
              >
                <WalletModalProvider>
                  <WalletProvider>
                    <ToastProvider>
                      <GasModeProvider>{children}</GasModeProvider>
                    </ToastProvider>
                  </WalletProvider>
                </WalletModalProvider>
              </SolanaWalletProvider>
            </ConnectionProvider>
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </I18nextProvider>
  );
}
