import type { Wallet } from "@rainbow-me/rainbowkit";
import type { CreateConnectorFn } from "wagmi";
import {
  promptEvmAccountPickerIfAuthorized,
  readProviderAccounts,
} from "@/lib/injected-provider";
import { purgeWalletPersistence } from "@/lib/wallet-session";

/**
 * MetaMask / Rabby vb. — Phantom resmi akışı:
 * yetkili hesap varsa wallet_requestPermissions + isReconnecting:true
 */
export function wrapWalletForceApproval(wallet: Wallet): Wallet {
  const originalCreateConnector = wallet.createConnector;
  return {
    ...wallet,
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
            const existing = await readProviderAccounts(provider);
            const userInitiated = parameters?.isReconnecting === false;

            if (existing.length > 0) {
              await promptEvmAccountPickerIfAuthorized(provider);
              return origConnect({
                ...parameters,
                // Kullanıcı modalden bağlanıyorsa popup zorunlu; sessiz reconnect yok.
                isReconnecting: userInitiated ? false : true,
              });
            }

            return origConnect({
              ...parameters,
              isReconnecting: false,
            });
          },
          async disconnect(...args) {
            try {
              await origDisconnect?.(...args);
            } finally {
              purgeWalletPersistence();
            }
          },
        };
      };

      return wrappedFn;
    },
  };
}

export function wrapWalletFactory(factory: () => Wallet): () => Wallet {
  return () => wrapWalletForceApproval(factory());
}
