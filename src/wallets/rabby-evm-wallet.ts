import { rabbyWallet } from "@rainbow-me/rainbowkit/wallets";
import type { Wallet } from "@rainbow-me/rainbowkit";
import type { CreateConnectorFn } from "wagmi";
import { forceEvmConnectPopup, getRabbyEthereumProvider, revokeProviderPermissions } from "@/lib/injected-provider";

/** Rabby EVM — always listed when extension is installed */
export function rabbyEvmWallet(): Wallet {
  const base = rabbyWallet();
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

        return {
          ...connector,
          async connect(parameters) {
            const provider =
              (await connector.getProvider?.()) ?? getRabbyEthereumProvider();
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
        };
      };

      return wrappedFn;
    },
  };
}

export function isRabbyInstalled(): boolean {
  return Boolean(getRabbyEthereumProvider());
}
