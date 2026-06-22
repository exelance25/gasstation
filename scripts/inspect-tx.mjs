import { createPublicClient, formatEther, http, parseEther } from "viem";
import { sepolia } from "viem/chains";

const txHash =
  "0x834fb9243074cc71019c98fc08b3f51106ae0fdc19c1a162281209f333f42d47";
const treasury = "0x28Be8f458b2b950233d2C7645f36ED3Ebc861e73";

const client = createPublicClient({
  chain: sepolia,
  transport: http("https://ethereum-sepolia-rpc.publicnode.com"),
});

const [tx, receipt] = await Promise.all([
  client.getTransaction({ hash: txHash }),
  client.getTransactionReceipt({ hash: txHash }),
]);

console.log(JSON.stringify({
  status: receipt?.status,
  from: tx?.from,
  to: tx?.to,
  valueEth: tx ? formatEther(tx.value) : null,
  valueWei: tx?.value?.toString(),
  isNativeToTreasury: tx?.to?.toLowerCase() === treasury.toLowerCase(),
  block: receipt?.blockNumber?.toString(),
}, null, 2));
