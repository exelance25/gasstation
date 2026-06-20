import {
  createPublicClient,
  encodeFunctionData,
  formatEther,
  formatUnits,
  http,
  maxUint256,
  type Address,
  type Hex,
} from "viem";
import { clientEnv } from "@/config/client-env";
import { sourceChain, getSourceRpcUrl } from "@/lib/chains";
import { pumpPaymasterAbi, NATIVE_FEE_TOKEN } from "@/lib/contracts/pump-paymaster-abi";
import { getPumpPaymasterAddress, isPaymasterDeployed } from "@/lib/paymaster-config";
import { getDefaultFeeToken } from "@/config/pool-tokens";

export {
  isPaymasterDeployed,
  getPumpPaymasterAddress,
  NATIVE_FEE_TOKEN,
  maxUint256 as MAX_APPROVE,
};

export function getPaymasterReadClient() {
  return createPublicClient({
    chain: sourceChain,
    transport: http(getSourceRpcUrl()),
  });
}

export async function readPaymasterOwner(): Promise<Address | null> {
  const paymaster = getPumpPaymasterAddress();
  if (!paymaster) return null;
  return getPaymasterReadClient().readContract({
    address: paymaster,
    abi: pumpPaymasterAbi,
    functionName: "owner",
  });
}

/** Protokol havuzundaki native gas (ETH) */
export async function readPoolNativeBalance(): Promise<bigint> {
  const paymaster = getPumpPaymasterAddress();
  if (!paymaster) return 0n;
  return getPaymasterReadClient().getBalance({ address: paymaster });
}

export function formatNativeBalance(wei: bigint): string {
  return formatEther(wei);
}

export async function readFeeTokenAllowance(
  user: Address,
  token: Address = getDefaultFeeToken(),
): Promise<bigint> {
  const paymaster = getPumpPaymasterAddress();
  if (!paymaster) return 0n;
  const client = getPaymasterReadClient();
  return client.readContract({
    address: token,
    abi: [
      {
        type: "function",
        name: "allowance",
        stateMutability: "view",
        inputs: [
          { name: "owner", type: "address" },
          { name: "spender", type: "address" },
        ],
        outputs: [{ type: "uint256" }],
      },
    ],
    functionName: "allowance",
    args: [user, paymaster],
  });
}

export function encodeBuyGasManuel(
  tokenPaid: Address,
  amountPaidWei: bigint,
  expectedGasWei: bigint,
  recipient: Address,
): { to: Address; data: Hex; value: bigint } | null {
  const paymaster = getPumpPaymasterAddress();
  if (!paymaster || amountPaidWei <= 0n || expectedGasWei <= 0n) return null;

  const data = encodeFunctionData({
    abi: pumpPaymasterAbi,
    functionName: "buyGasManuel",
    args: [tokenPaid, amountPaidWei, expectedGasWei, recipient],
  });

  return { to: paymaster, data, value: 0n };
}

export function encodeAdminNativeLiquidity(valueWei: bigint): {
  to: Address;
  data: Hex;
  value: bigint;
} | null {
  const paymaster = getPumpPaymasterAddress();
  if (!paymaster || valueWei <= 0n) return null;
  const data = encodeFunctionData({
    abi: pumpPaymasterAbi,
    functionName: "adminAddNativeLiquidity",
    args: [],
  });
  return { to: paymaster, data, value: valueWei };
}

export function encodeAdminTokenLiquidity(
  token: Address,
  amountWei: bigint,
): { to: Address; data: Hex; value: bigint } | null {
  const paymaster = getPumpPaymasterAddress();
  if (!paymaster || amountWei <= 0n) return null;
  const data = encodeFunctionData({
    abi: pumpPaymasterAbi,
    functionName: "adminAddTokenLiquidity",
    args: [token, amountWei],
  });
  return { to: paymaster, data, value: 0n };
}

/** Geriye uyumluluk — eski importlar */
export async function readPaymasterPoolBalance(
  _userAddress: Address,
  _feeToken?: Address,
): Promise<bigint> {
  return readPoolNativeBalance();
}

export function formatPoolBalanceWei(wei: bigint): string {
  return formatNativeBalance(wei);
}

export function encodeAddEthLiquidity(valueWei: bigint) {
  return encodeAdminNativeLiquidity(valueWei);
}

export function encodeAddErc20Liquidity(token: Address, amountWei: bigint) {
  return encodeAdminTokenLiquidity(token, amountWei);
}

export function formatTokenBalance(wei: bigint, decimals: number): string {
  return formatUnits(wei, decimals);
}
