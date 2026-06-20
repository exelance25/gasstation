import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  getSolanaCollectorAddress,
  getSolanaRpcUrl,
  getSolanaUsdcMint,
} from "@/config/solana-usdc";

const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey(
  "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL",
);

export async function deriveAssociatedTokenAddress(
  owner: PublicKey,
  mint: PublicKey,
): Promise<PublicKey> {
  const [ata] = await PublicKey.findProgramAddress(
    [owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID,
  );
  return ata;
}

export async function fetchSolanaUsdcBalance(ownerAddress: string): Promise<number> {
  const connection = new Connection(getSolanaRpcUrl(), "confirmed");
  const owner = new PublicKey(ownerAddress);
  const mint = new PublicKey(getSolanaUsdcMint());
  const accounts = await connection.getParsedTokenAccountsByOwner(owner, { mint });
  let total = 0;
  for (const { account } of accounts.value) {
    const parsed = account.data.parsed;
    if (parsed?.type === "account" && parsed.info?.tokenAmount?.uiAmount != null) {
      total += Number(parsed.info.tokenAmount.uiAmount);
    }
  }
  return total;
}

function createTransferInstruction(
  source: PublicKey,
  destination: PublicKey,
  owner: PublicKey,
  amount: bigint,
): TransactionInstruction {
  const data = Buffer.alloc(9);
  data.writeUInt8(3, 0);
  data.writeBigUInt64LE(amount, 1);
  return new TransactionInstruction({
    programId: TOKEN_PROGRAM_ID,
    keys: [
      { pubkey: source, isSigner: false, isWritable: true },
      { pubkey: destination, isSigner: false, isWritable: true },
      { pubkey: owner, isSigner: true, isWritable: false },
    ],
    data,
  });
}

function createAssociatedTokenAccountInstruction(
  payer: PublicKey,
  ata: PublicKey,
  owner: PublicKey,
  mint: PublicKey,
): TransactionInstruction {
  return new TransactionInstruction({
    programId: ASSOCIATED_TOKEN_PROGRAM_ID,
    keys: [
      { pubkey: payer, isSigner: true, isWritable: true },
      { pubkey: ata, isSigner: false, isWritable: true },
      { pubkey: owner, isSigner: false, isWritable: false },
      { pubkey: mint, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ],
    data: Buffer.alloc(0),
  });
}

/** SPL USDC transfer — collector ATA yoksa oluşturur */
export async function buildSolanaUsdcTransferTransaction(params: {
  sender: PublicKey;
  amountMicroUsdc: bigint;
}): Promise<Transaction> {
  const collector = getSolanaCollectorAddress();
  if (!collector) throw new Error("Solana collector adresi yapılandırılmamış");

  const connection = new Connection(getSolanaRpcUrl(), "confirmed");
  const mint = new PublicKey(getSolanaUsdcMint());
  const collectorPk = new PublicKey(collector);

  const senderAta = await deriveAssociatedTokenAddress(params.sender, mint);
  const collectorAta = await deriveAssociatedTokenAddress(collectorPk, mint);

  const tx = new Transaction();
  const collectorAtaInfo = await connection.getAccountInfo(collectorAta);
  if (!collectorAtaInfo) {
    tx.add(
      createAssociatedTokenAccountInstruction(
        params.sender,
        collectorAta,
        collectorPk,
        mint,
      ),
    );
  }

  tx.add(
    createTransferInstruction(
      senderAta,
      collectorAta,
      params.sender,
      params.amountMicroUsdc,
    ),
  );

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  tx.recentBlockhash = blockhash;
  tx.lastValidBlockHeight = lastValidBlockHeight;
  tx.feePayer = params.sender;

  return tx;
}
