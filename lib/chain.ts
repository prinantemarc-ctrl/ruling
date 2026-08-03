import {
  createPublicClient,
  decodeEventLog,
  erc20Abi,
  formatUnits,
  http,
  parseAbiItem,
  type Hash,
} from "viem";
import { polygon } from "viem/chains";

const transferEvent = parseAbiItem(
  "event Transfer(address indexed from, address indexed to, uint256 value)"
);

export function getPublicClient() {
  const rpc =
    process.env.RPC_URL ||
    (process.env.ALCHEMY_API_KEY
      ? `https://polygon-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`
      : "https://polygon-rpc.com");
  return createPublicClient({
    chain: polygon,
    transport: http(rpc),
  });
}

export function getUsdcAddress(): `0x${string}` {
  return (process.env.NEXT_PUBLIC_USDC_ADDRESS ||
    "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359") as `0x${string}`;
}

export function getPlatformWallet(): string {
  return (
    process.env.PLATFORM_WALLET_ADDRESS ||
    process.env.NEXT_PUBLIC_PLATFORM_WALLET_ADDRESS ||
    ""
  ).toLowerCase();
}

/** Verify an ERC20 Transfer to the platform wallet; returns on-chain USDC amount. */
export async function verifyUsdcDeposit(params: {
  txHash: string;
  expectedFrom: string;
}): Promise<{ amount: number; from: string; to: string }> {
  const client = getPublicClient();
  const usdc = getUsdcAddress();
  const platform = getPlatformWallet();
  if (!platform) {
    throw new Error("PLATFORM_WALLET_ADDRESS is not configured");
  }

  const receipt = await client.getTransactionReceipt({
    hash: params.txHash as Hash,
  });
  if (receipt.status !== "success") {
    throw new Error("Transaction failed on-chain");
  }

  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== usdc.toLowerCase()) continue;
    try {
      const decoded = decodeEventLog({
        abi: [transferEvent],
        data: log.data,
        topics: log.topics,
      });
      if (decoded.eventName !== "Transfer") continue;
      const { from, to, value } = decoded.args as {
        from: string;
        to: string;
        value: bigint;
      };
      if (
        from.toLowerCase() === params.expectedFrom.toLowerCase() &&
        to.toLowerCase() === platform
      ) {
        return {
          amount: Number(formatUnits(value, 6)),
          from: from.toLowerCase(),
          to: to.toLowerCase(),
        };
      }
    } catch {
      // not a Transfer log
    }
  }

  throw new Error("No matching USDC Transfer to platform wallet found");
}

export { erc20Abi };
