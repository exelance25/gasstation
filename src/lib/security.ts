import { isAddress, keccak256, slice, toBytes } from "viem";

export type WalletMode = "evm" | "svm";

export function assertValidAddress(
  value: string | undefined,
): value is `0x${string}` {
  return typeof value === "string" && isAddress(value);
}

/** Simüle adres — slice zaten 0x ile döner (çift 0x hatası önlenir) */
function deriveSimulatedAddress(
  seed: string,
  namespace: string,
): `0x${string}` {
  const hash = keccak256(toBytes(`${namespace}:${seed.toLowerCase()}`));
  const sliced = slice(hash, 12);
  if (!sliced.startsWith("0x")) {
    throw new Error("Invalid derived address");
  }
  if (!isAddress(sliced)) {
    throw new Error("Derived address failed validation");
  }
  return sliced;
}

export function deriveSimulatedMonadAddress(
  sourceAddress: `0x${string}`,
): `0x${string}` {
  return deriveSimulatedAddress(sourceAddress, "pumpstation:monad:v1");
}

export function deriveSimulatedSvmAddress(
  seed: string,
): `0x${string}` {
  return deriveSimulatedAddress(seed, "pumpstation:svm:v1");
}

export function toSafeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const name = error.name;
    if (name === "UserRejectedRequestError" || name === "UserRejected") {
      return "İşlem cüzdanda reddedildi.";
    }
    if (name === "ConnectorNotFoundError") {
      return "Tarayıcı cüzdanı bulunamadı. MetaMask veya Rabby yükleyin.";
    }
    return error.message.slice(0, 200);
  }
  return "Beklenmeyen bir hata oluştu.";
}
