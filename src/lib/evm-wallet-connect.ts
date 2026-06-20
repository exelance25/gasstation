import type { Connector } from "wagmi";
import { readProviderAccounts } from "@/lib/injected-provider";
import { delay } from "@/lib/wallet-session";

export function isConnectorAlreadyConnectedError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return /already connected/i.test(msg);
}

export type ConnectEvmOptions = {
  /** Phantom hibrit: connector.disconnect çağırma (Solana korunur) */
  preserveSolana?: boolean;
  /** Phantom wrapper connect içinde popup gösterir — çift popup önlenir */
  deferPopupToConnector?: boolean;
};

async function hardResetConnector(
  connector: Connector,
  disconnectEvm: (args?: { connector?: Connector }) => Promise<unknown>,
  options?: ConnectEvmOptions,
): Promise<void> {
  if (!options?.preserveSolana) {
    try {
      await connector.disconnect?.();
    } catch {
      /* ignore */
    }
  }
  try {
    await disconnectEvm({ connector });
  } catch {
    /* ignore */
  }
  await delay(options?.preserveSolana ? 120 : 280);
}

export async function connectEvmConnectorSafe(
  connector: Connector,
  connectAsync: (args: { connector: Connector; isReconnecting: boolean }) => Promise<unknown>,
  disconnectEvm: (args?: { connector?: Connector }) => Promise<unknown>,
  syncFromProvider: () => Promise<unknown>,
  options?: ConnectEvmOptions,
): Promise<void> {
  if (options?.deferPopupToConnector) {
    await hardResetConnector(connector, disconnectEvm, options);
  }

  try {
    await connectAsync({ connector, isReconnecting: false });
  } catch (error) {
    if (!isConnectorAlreadyConnectedError(error)) {
      throw error;
    }
    if (options?.deferPopupToConnector) {
      await hardResetConnector(connector, disconnectEvm, options);
      await connectAsync({ connector, isReconnecting: false });
    }
  }

  const provider = await connector.getProvider?.();
  const accounts = await readProviderAccounts(provider);
  if (accounts.length === 0) {
    throw new Error("EVM cüzdan onayı alınamadı. MetaMask'ta bağlantıyı onaylayın.");
  }

  await syncFromProvider();
}
