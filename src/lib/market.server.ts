import "server-only";
import { cacheLife } from "next/cache";
import { CHOG_TOKEN, weatherFor, type Market } from "./market";

type DexPair = {
  chainId: string;
  priceUsd?: string;
  liquidity?: { usd?: number };
  priceChange?: { h1?: number; h24?: number };
};

export async function fetchChogMarket(): Promise<Market | null> {
  "use cache";
  cacheLife("minutes");
  try {
    const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${CHOG_TOKEN}`);
    if (!res.ok) return null;
    const data: { pairs?: DexPair[] } = await res.json();
    const pair = (data.pairs ?? [])
      .filter((p) => p.chainId === "monad" && p.priceUsd)
      .sort((a, b) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0))[0];
    if (!pair) return null;
    const change1h = pair.priceChange?.h1 ?? 0;
    const change24h = pair.priceChange?.h24 ?? 0;
    return {
      priceUsd: Number(pair.priceUsd),
      change1h,
      change24h,
      weather: weatherFor(change1h, change24h),
      updatedAt: Date.now(),
    };
  } catch {
    return null;
  }
}
