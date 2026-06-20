import { config } from "dotenv";
import { privateKeyToAccount } from "viem/accounts";
import { createPublicClient, formatEther, http } from "viem";
import { sepolia } from "viem/chains";

config({ path: ".env.local" });

const pk = process.env.EVM_OPERATOR_PRIVATE_KEY?.trim();
const collector = process.env.COLLECTOR_ADDRESS?.trim();

if (!pk?.startsWith("0x")) {
  console.log("HATA: EVM_OPERATOR_PRIVATE_KEY eksik veya hatali");
  process.exit(1);
}

const operator = privateKeyToAccount(pk);
const match = operator.address.toLowerCase() === collector?.toLowerCase();

console.log("operator_address:", operator.address);
console.log("collector_address:", collector);
console.log("addresses_match:", match);

const client = createPublicClient({
  chain: sepolia,
  transport: http(process.env.NEXT_PUBLIC_ETH_SEPOLIA_RPC || "https://ethereum-sepolia-rpc.publicnode.com"),
});

const balance = await client.getBalance({ address: operator.address });
console.log("sepolia_eth:", formatEther(balance));
