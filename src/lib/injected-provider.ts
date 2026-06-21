import { getAddress, UserRejectedRequestError, type Address } from "viem";

type RequestProvider = {
  request?: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
};

export function getRabbyEthereumProvider(): RequestProvider | undefined {
  if (typeof window === "undefined") return undefined;
  const w = window as Window & {
    rabby?: RequestProvider;
    ethereum?: RequestProvider & { isRabby?: boolean };
  };
  if (w.rabby?.request) return w.rabby;
  if (w.ethereum?.isRabby && w.ethereum.request) return w.ethereum;
  return undefined;
}

export function getPhantomEthereumProvider(): RequestProvider | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as Window & { phantom?: { ethereum?: RequestProvider } }).phantom
    ?.ethereum;
}

export function getPhantomSolanaProvider(): {
  disconnect?: () => Promise<void>;
  connect?: (opts?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: { toString: () => string } }>;
  request?: (args: { method: string; params?: unknown }) => Promise<unknown>;
  isConnected?: boolean;
} | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as Window & {
    phantom?: {
      solana?: {
        disconnect?: () => Promise<void>;
        connect?: (opts?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: { toString: () => string } }>;
        request?: (args: { method: string; params?: unknown }) => Promise<unknown>;
        isConnected?: boolean;
      };
    };
  }).phantom?.solana;
}

function isUserRejection(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const code = (error as { code?: number }).code;
  return code === 4001 || code === UserRejectedRequestError.code;
}

function withTimeout<T>(fn: () => Promise<T>, ms: number): Promise<T | undefined> {
  return Promise.race([
    fn(),
    new Promise<undefined>((resolve) => {
      window.setTimeout(() => resolve(undefined), ms);
    }),
  ]);
}

export async function readProviderAccounts(provider: unknown): Promise<Address[]> {
  const eth = provider as RequestProvider | undefined;
  if (!eth?.request) return [];

  try {
    const raw = await eth.request({ method: "eth_accounts" });
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((a): a is string => typeof a === "string" && a.startsWith("0x"))
      .map((a) => getAddress(a));
  } catch {
    return [];
  }
}

/** Tek provider — site iznini iptal et */
export async function revokeProviderPermissions(
  provider: unknown,
  timeoutMs = 2_500,
): Promise<void> {
  const eth = provider as RequestProvider | undefined;
  if (!eth?.request) return;

  try {
    await withTimeout(
      () =>
        eth.request!({
          method: "wallet_revokePermissions",
          params: [{ eth_accounts: {} }],
        }) as Promise<unknown>,
      timeoutMs,
    );
  } catch {
    /* desteklenmiyor */
  }
}

/** Kullanıcı modalden bağlanırken her zaman Phantom / MetaMask onayı */
export async function forceEvmConnectPopup(provider: unknown): Promise<void> {
  const eth = provider as RequestProvider | undefined;
  if (!eth?.request) return;

  try {
    await eth.request({ method: "eth_requestAccounts" });
  } catch (error) {
    if (isUserRejection(error)) {
      throw new UserRejectedRequestError(error as Error);
    }
    throw error;
  }

  await promptEvmAccountPickerIfAuthorized(provider);
}

/**
 * Phantom / MetaMask çoklu hesap — site zaten yetkiliyse hesap seçici.
 */
export async function promptEvmAccountPickerIfAuthorized(provider: unknown): Promise<void> {
  const existing = await readProviderAccounts(provider);
  if (existing.length === 0) return;

  const eth = provider as RequestProvider | undefined;
  if (!eth?.request) return;

  try {
    await eth.request({
      method: "wallet_requestPermissions",
      params: [{ eth_accounts: {} }],
    });
  } catch (error) {
    if (isUserRejection(error)) {
      throw new UserRejectedRequestError(error as Error);
    }
  }
}

/** Bağlıyken hesap değiştir + wagmi'yi provider ile senkronla */
export async function switchEvmWalletAccount(
  provider: unknown,
  reconnect: () => Promise<unknown>,
): Promise<void> {
  await promptEvmAccountPickerIfAuthorized(provider);
  await reconnect();
}

export async function disconnectPhantomSolanaFully(): Promise<void> {
  const phantomSol = getPhantomSolanaProvider();
  if (!phantomSol) return;
  if (phantomSol.isConnected === false) return;

  for (let attempt = 0; attempt < 2; attempt++) {
    if (phantomSol.isConnected === false) break;
    try {
      await phantomSol.disconnect?.();
    } catch {
      /* WalletDisconnectedError — zaten kopuk */
    }
    try {
      await phantomSol.request?.({ method: "disconnect" });
    } catch {
      /* ignore */
    }
    if (phantomSol.isConnected === false) break;
    await new Promise((resolve) => window.setTimeout(resolve, 200));
  }
}

/** Yalnızca Phantom EVM oturumu — Solana'yı kesmez (hibrit akış) */
export async function revokePhantomEvmSession(): Promise<void> {
  const phantomEth = getPhantomEthereumProvider();
  await revokeProviderPermissions(phantomEth, 2_500);
}

/** Tam Phantom kopuşu — Disconnect butonu */
export async function disconnectPhantomExtension(): Promise<void> {
  await revokePhantomEvmSession();
  await disconnectPhantomSolanaFully();
}

/** Phantom hâlâ isConnected ise popup açılmaz — onlyIfTrusted: false zorunlu */
export async function promptSolanaAccountPicker(): Promise<void> {
  const phantom = getPhantomSolanaProvider();
  if (!phantom?.connect) {
    throw new Error("Phantom Solana bulunamadı");
  }

  await disconnectPhantomSolanaFully();
  await new Promise((resolve) => window.setTimeout(resolve, 300));

  try {
    await phantom.connect({ onlyIfTrusted: false });
  } catch (error) {
    if (isUserRejection(error)) {
      throw new UserRejectedRequestError(error as Error);
    }
    throw error;
  }
}
