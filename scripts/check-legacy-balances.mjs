import { createPublicClient, formatEther, formatUnits, getAddress, http, parseAbi } from "viem";
import { sepolia, baseSepolia } from "viem/chains";
import { defineChain } from "viem";

const OLD_EVM = getAddress("0x1c841C9f93AF21a278C00C37851f44CC68A46eAD");
const NEW_EVM = getAddress("0x28Be8f458b2b950233d2C7645f36ED3Ebc861e73");
const SEPOLIA_USDC = getAddress("0x1c7D4B196Cb0C7B4d1570db724C8a581A04De0e4");

const monad = defineChain({
  id: 10143,
  name: "Monad Testnet",
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpcUrls: { default: { http: ["https://testnet-rpc.monad.xyz"] } },
});

const abi = parseAbi(["function balanceOf(address) view returns (uint256)"]);

async function evm(chain, rpc, usdc) {
  const c = createPublicClient({ chain, transport: http(rpc) });
  const eth = await c.getBalance({ address: OLD_EVM });
  let usdcBal = 0n;
  try {
    usdcBal = await c.readContract({
      address: usdc,
      abi,
      functionName: "balanceOf",
      args: [OLD_EVM],
    });
  } catch {
    /* skip */
  }
  console.log(chain.name, "ETH/MON:", formatEther(eth), "USDC:", formatUnits(usdcBal, 6));
}

console.log("Eski kasa:", OLD_EVM);
console.log("Yeni kasa:", NEW_EVM);
await evm(sepolia, "https://ethereum-sepolia-rpc.publicnode.com", SEPOLIA_USDC);
await evm(baseSepolia, "https://sepolia.base.org", getAddress("0x036CbD53842c5426634e7929541eC2318f3dCF7e"));
await evm(monad, "https://testnet-rpc.monad.xyz", getAddress("0x534b2f3A21130d7a60830c2Df862319e593943A3"));
