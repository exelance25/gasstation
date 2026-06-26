import "server-only";

import {
  createPublicClient,
  createWalletClient,
  defineChain,
  getAddress,
  http,
  isAddress,
  type Address,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import {
  pumpPaymasterBytecode,
  pumpPaymasterConstructorAbi,
} from "@/server/contracts/pump-paymaster-artifact";
import { getServerCollectorAddress } from "@/config/operator-env";

const monadTestnet = defineChain({
  id: 10143,
  name: "Monad Testnet",
  nativeCurrency: { name: "Monad", symbol: "MON", decimals: 18 },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_MONAD_TESTNET_RPC ?? "https://testnet-rpc.monad.xyz"],
    },
  },
});

const DEFAULT_ENTRY_POINT =
  "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789" as Address;

function operatorPrivateKey(): Hex {
  const raw =
    process.env.EVM_OPERATOR_PRIVATE_KEY?.trim() ??
    process.env.OPERATOR_PRIVATE_KEY?.trim();
  if (!raw) throw new Error("EVM_OPERATOR_PRIVATE_KEY yapılandırılmamış");
  return (raw.startsWith("0x") ? raw : `0x${raw}`) as Hex;
}

function entryPointAddress(): Address {
  const raw =
    process.env.ENTRY_POINT_ADDRESS?.trim() ??
    process.env.NEXT_PUBLIC_ENTRY_POINT_ADDRESS?.trim() ??
    DEFAULT_ENTRY_POINT;
  if (!isAddress(raw)) return DEFAULT_ENTRY_POINT;
  return getAddress(raw);
}

function priceSignerAddress(): Address {
  const raw = process.env.PRICE_SIGNER_ADDRESS?.trim();
  if (raw && isAddress(raw)) return getAddress(raw);
  return getServerCollectorAddress();
}

export async function deployPumpPaymasterOnMonadTestnet(): Promise<{
  address: Address;
  txHash: Hex;
  entryPoint: Address;
  priceSigner: Address;
  deployer: Address;
}> {
  const account = privateKeyToAccount(operatorPrivateKey());
  const entryPoint = entryPointAddress();
  const priceSigner = priceSignerAddress();
  const transport = http(monadTestnet.rpcUrls.default.http[0]);
  const publicClient = createPublicClient({ chain: monadTestnet, transport });
  const walletClient = createWalletClient({ chain: monadTestnet, transport, account });

  const balance = await publicClient.getBalance({ address: account.address });
  if (balance === 0n) {
    throw new Error("Deploy cüzdanında MON yok — Monad testnet faucet gerekli");
  }

  const hash = await walletClient.deployContract({
    abi: pumpPaymasterConstructorAbi,
    bytecode: pumpPaymasterBytecode,
    args: [entryPoint, priceSigner],
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  const address = receipt.contractAddress;
  if (!address || receipt.status !== "success") {
    throw new Error("Kontrat deploy başarısız");
  }

  const code = await publicClient.getBytecode({ address });
  if (!code || code === "0x") {
    throw new Error("Deploy adresinde bytecode yok");
  }

  return {
    address,
    txHash: hash,
    entryPoint,
    priceSigner,
    deployer: account.address,
  };
}
