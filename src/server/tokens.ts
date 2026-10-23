import "server-only";

// Live Monad memecoins from nad.fun: the daily list is the top graduated tokens by market cap.
const API = "https://api.nad.fun";
const LIST_SIZE = 20;
const SKIP = /^(w?mon|usd|usdc|usdt|aus?d|eth|weth|btc|wbtc|sol)$/i;
// Keep slurs off the board even when nad.fun doesn't flag them as NSFW
const BLOCK = /n[i1]gg|f[a@]gg?ot|retard|kike|chink|tranny|hitler|nazi/i;

export type ListToken = { address: string; symbol: string; name: string; image: string | null; rank: number; price: number; spark: number[] };

type NadToken = {
  token_info: { token_id: string; name: string; symbol: string; image_uri?: string; is_graduated?: boolean; is_nsfw?: boolean };
  market_info?: { price_usd?: string };
};

// nad.fun rate-limits hard; after a 429 we back off until it says we can retry
const gl = globalThis as unknown as { __nadPauseUntil?: number };
export const nadPaused = () => (gl.__nadPauseUntil ?? 0) > Date.now();

async function getJson<T>(path: string): Promise<T> {
  if (nadPaused()) throw new Error("nad.fun rate limit");
  const res = await fetch(`${API}${path}`, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(10_000), cache: "no-store" });
  if (res.status === 429) {
    const retry = Number((await res.json().catch(() => ({})))?.retry_after) || 30;
    gl.__nadPauseUntil = Date.now() + retry * 1000;
    throw new Error("nad.fun rate limit");
  }
  if (!res.ok) throw new Error(`nad.fun ${path} ${res.status}`);
  return res.json() as Promise<T>;
}

async function topByMarketCap(limit = 80) {
  const d = await getJson<{ tokens: NadToken[] }>(`/order/market_cap?page=1&limit=${limit}`);
  return d.tokens;
}

/** 24 hourly closes, oldest first. Null when nad.fun couldn't answer (try again later). */
export async function spark(address: string): Promise<number[] | null> {
  const to = Math.floor(Date.now() / 1000);
  try {
    const d = await getJson<{ c?: (string | number)[] }>(`/trade/chart/${address}?resolution=60&from=${to - 86_400}&to=${to}`);
    return (d.c ?? []).map(Number).filter((n) => n > 0).slice(-24);
  } catch {
    return null;
  }
}

export async function buildDailyList(): Promise<ListToken[]> {
  const all = await topByMarketCap();
  const picked = all
    .filter((t) => {
      const i = t.token_info;
      return i.is_graduated && !i.is_nsfw && !SKIP.test(i.symbol) && !BLOCK.test(`${i.symbol} ${i.name}`) && Number(t.market_info?.price_usd) > 0;
    })
    .slice(0, LIST_SIZE);
  // Charts are filled in afterwards, slowly, so the list never waits on nad.fun's rate limit
  return picked.map((t, i) => ({
    address: t.token_info.token_id.toLowerCase(),
    symbol: t.token_info.symbol.slice(0, 12),
    name: t.token_info.name.slice(0, 40),
    image: t.token_info.image_uri ?? null,
    rank: i + 1,
    price: Number(t.market_info!.price_usd),
    spark: [] as number[],
  }));
}

const PRICE_TTL = 60_000;
const g = globalThis as unknown as { __prices?: Map<string, { at: number; price: number }> };
const cache = (g.__prices ??= new Map());

/** USD prices for the given tokens, cached for a minute. Missing tokens are left out. */
export async function pricesFor(addresses: string[]): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  const now = Date.now();
  const stale = addresses.filter((a) => {
    const c = cache.get(a);
    if (c && now - c.at < PRICE_TTL) {
      out.set(a, c.price);
      return false;
    }
    return true;
  });
  if (!stale.length) return out;

  // One call covers most of the list; the rest are fetched one by one
  try {
    for (const t of await topByMarketCap(100)) {
      const a = t.token_info.token_id.toLowerCase();
      const p = Number(t.market_info?.price_usd);
      if (p > 0) cache.set(a, { at: now, price: p });
    }
  } catch {}
  await Promise.all(
    stale.map(async (a) => {
      let c = cache.get(a);
      if (!c || now - c.at >= PRICE_TTL) {
        try {
          const d = await getJson<{ market_info?: { price_usd?: string } }>(`/trade/market/${a}`);
          const p = Number(d.market_info?.price_usd);
          if (p > 0) cache.set(a, (c = { at: now, price: p }));
        } catch {}
      }
      c = cache.get(a);
      if (c) out.set(a, c.price);
    }),
  );
  return out;
}
