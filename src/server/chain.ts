import "server-only";
import { createPublicClient, http, parseAbi, type Address } from "viem";
import { monad } from "viem/chains";

// Chog Genesis on Monad mainnet. Not ERC-721 Enumerable, so a wallet's Chogs are found by reading ownerOf for every ID.
export const CHOG_NFT = "0xc96d31F8626c6D03Fae5dCD3d61e3FB9F4a73763" as const;
export const CHOG_SUPPLY = 1969;
const abi = parseAbi(["function ownerOf(uint256 tokenId) view returns (address)"]);

export const mainnet = createPublicClient({ chain: monad, transport: http(process.env.MONAD_RPC ?? monad.rpcUrls.default.http[0]), batch: { multicall: { batchSize: 1024 * 64 } } });

const OWNERS_TTL = 5 * 60_000;
const g = globalThis as unknown as { __owners?: { at: number; map: Map<number, string> }; __ownersLoading?: Promise<Map<number, string>> };

async function loadOwners() {
  const ids = Array.from({ length: CHOG_SUPPLY }, (_, i) => i + 1);
  const map = new Map<number, string>();
  // 4 multicalls of ~500 reads keeps us well under the public RPC limit
  for (let i = 0; i < ids.length; i += 500) {
    const chunk = ids.slice(i, i + 500);
    const res = await mainnet.multicall({ contracts: chunk.map((id) => ({ address: CHOG_NFT, abi, functionName: "ownerOf", args: [BigInt(id)] })), allowFailure: true });
    res.forEach((r, k) => {
      if (r.status === "success") map.set(chunk[k], (r.result as string).toLowerCase());
    });
  }
  g.__owners = { at: Date.now(), map };
  return map;
}

async function owners() {
  if (g.__owners && Date.now() - g.__owners.at < OWNERS_TTL) return g.__owners.map;
  g.__ownersLoading ??= loadOwners().finally(() => (g.__ownersLoading = undefined));
  // Serve a stale map while refreshing, if we have one
  return g.__owners?.map ?? g.__ownersLoading;
}

/** Chog IDs held by a wallet (cached for a few minutes) */
export async function chogsOf(wallet: string) {
  const w = wallet.toLowerCase();
  const map = await owners();
  return [...map].filter(([, o]) => o === w).map(([id]) => id);
}

/** Fresh on-chain check, used before a Chog joins the game */
export async function ownsChog(wallet: string, id: number) {
  if (!Number.isInteger(id) || id < 1 || id > CHOG_SUPPLY) return false;
  try {
    const owner = await mainnet.readContract({ address: CHOG_NFT, abi, functionName: "ownerOf", args: [BigInt(id)] });
    return (owner as Address).toLowerCase() === wallet.toLowerCase();
  } catch {
    return false;
  }
}
