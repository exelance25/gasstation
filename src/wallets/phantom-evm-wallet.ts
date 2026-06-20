import { phantomWallet } from "@rainbow-me/rainbowkit/wallets";
import type { Wallet } from "@rainbow-me/rainbowkit";
import type { CreateConnectorFn } from "wagmi";
import {
  forceEvmConnectPopup,
  revokePhantomEvmSession,
  revokeProviderPermissions,
} from "@/lib/injected-provider";
import { purgeWalletPersistence } from "@/lib/wallet-session";

/** Phantom EVM — kullanıcı bağlantısında onay popup; Solana'yı gereksiz kesmez */
export function phantomEvmWallet(): Wallet {
  const base = phantomWallet();
  const originalCreateConnector = base.createConnector;

  return {
    ...base,
    createConnector: (walletDetails) => {
      const innerCreateConnectorFn = originalCreateConnector(
        walletDetails,
      ) as CreateConnectorFn;

      const wrappedFn: CreateConnectorFn = (config) => {
        const connector = innerCreateConnectorFn(config);
        const origConnect = connector.connect.bind(connector);
        const origDisconnect = connector.disconnect?.bind(connector);

        return {
          ...connector,
          async connect(parameters) {
            const provider = await connector.getProvider?.();
            const userInitiated = parameters?.isReconnecting === false;

            if (userInitiated && provider) {
              await revokeProviderPermissions(provider);
              await forceEvmConnectPopup(provider);
              return origConnect({
                ...parameters,
                isReconnecting: false,
              });
            }

            return origConnect({
              ...parameters,
              isReconnecting: parameters?.isReconnecting ?? true,
            });
          },
          async disconnect(...args) {
            try {
              await origDisconnect?.(...args);
            } finally {
              await revokePhantomEvmSession();
              purgeWalletPersistence();
            }
          },
        };
      };

      return wrappedFn;
    },
  };
}
