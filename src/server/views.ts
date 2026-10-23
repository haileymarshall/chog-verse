import "server-only";
import { and, desc, eq, gt, inArray, sql } from "drizzle-orm";
import { createPublicClient, formatEther, http } from "viem";
import { monadTestnet } from "viem/chains";
import { BANK_ADDRESS, bankAbi, bankLive } from "@/lib/verse/bank";
import { DEMO } from "@/lib/verse/mode";
import { ENTRY_FEE, ROLES, ROLLOVER } from "@/lib/verse/roles";
import { currentRound, firstRound, seasonClock, seasonOf } from "@/lib/verse/season";
import type { Role } from "@/lib/verse/types";
import { db, schema } from "./db";
import { effectiveSplit, livePlansScored, seasonTotals, tokensFor } from "./game";

const { players, crews, crewMembers, plans, entries, chat } = schema;

export type Member = { playerId: number; chogId: number; kind: "holder" | "guest" | "bot" };
export type CrewView = { id: number; name: string; kind: "live" | "bot"; members: Partial<Record<Role, Member>> };

export async function crewsWithMembers(ids: number[]): Promise<Map<number, CrewView>> {
  const d = await db();
  if (!ids.length) return new Map();
  const cs = await d.select().from(crews).where(inArray(crews.id, ids));
  const ms = await d
    .select({ crewId: crewMembers.crewId, role: crewMembers.role, playerId: players.id, chogId: players.chogId, kind: players.kind })
    .from(crewMembers)
    .innerJoin(players, eq(players.id, crewMembers.playerId))
    .where(inArray(crewMembers.crewId, ids));
  const out = new Map<number, CrewView>(cs.map((c) => [c.id, { id: c.id, name: c.name, kind: c.kind, members: {} }]));
  for (const m of ms) out.get(m.crewId)!.members[m.role] = { playerId: m.playerId, chogId: m.chogId, kind: m.kind };
  return out;
}

const testnet = createPublicClient({ chain: monadTestnet, transport: http(process.env.MONAD_TESTNET_RPC) });

const tokenView = (t: Awaited<ReturnType<typeof tokensFor>>[number]) => ({
  address: t.address,
  symbol: t.symbol,
  name: t.name,
  image: t.image,
  price: t.priceOpen,
  change24h: t.spark.length > 1 ? (t.spark[t.spark.length - 1] / t.spark[0] - 1) * 100 : 0,
  spark: t.spark,
});
export type TokenView = ReturnType<typeof tokenView>;

const planView = (p: typeof plans.$inferSelect | undefined) => ({
  trader: p?.trader ?? null,
  rugger: p?.rugger ?? null,
  split: p?.splitTrader != null && p?.splitRugger != null ? { trader: p.splitTrader, rugger: p.splitRugger, cash: 10_000 - p.splitTrader - p.splitRugger } : null,
  fud: p?.fudCrew && p.fudSide ? { crewId: p.fudCrew, side: p.fudSide } : null,
});

const gp = globalThis as unknown as { __pot?: Map<number, { at: number; value: number }> };

/** The vault for a season. In the live game it's read from the Bank contract (includes rollover); otherwise from entries. */
export async function potFor(season: number) {
  if (!DEMO && bankLive()) {
    gp.__pot ??= new Map();
    const hit = gp.__pot.get(season);
    if (hit && Date.now() - hit.at < 30_000) return hit.value;
    try {
      const wei = await testnet.readContract({ address: BANK_ADDRESS as `0x${string}`, abi: bankAbi, functionName: "pot", args: [BigInt(season)] });
      const value = Math.round(Number(formatEther(wei)));
      gp.__pot.set(season, { at: Date.now(), value });
      return value;
    } catch {
      // Fall back to our own records if the RPC is down
    }
  }
  const d = await db();
  const [{ n }] = await d.select({ n: sql<number>`coalesce(sum(${entries.amount}), 0)::int` }).from(entries).where(eq(entries.season, season));
  const [{ prev }] = await d.select({ prev: sql<number>`coalesce(sum(${entries.amount}), 0)::int` }).from(entries).where(eq(entries.season, season - 1));
  return Math.round(n + prev * ROLLOVER);
}

/** Everything the HQ and Hideout need for the signed-in player */
export async function stateFor(playerId: number | null) {
  const d = await db();
  const now = Date.now();
  const clock = seasonClock(now);
  const round = clock.round;
  const live = round - 1;
  const tokens = (await tokensFor(round)).map(tokenView);
  const liveTokens = live >= 1 ? (await tokensFor(live)).map(tokenView) : [];
  const pot = await potFor(clock.season);
  const [{ crewCount }] = await d.select({ crewCount: sql<number>`count(*)::int` }).from(crews).where(eq(crews.season, clock.season));

  let me: (typeof players.$inferSelect & { role: Role | null }) | null = null;
  let crew: (CrewView & { days: { round: number; total: number }[]; total: number; rank: number; of: number }) | null = null;
  let plan = planView(undefined);
  let livePlan: (ReturnType<typeof planView> & { round: number; score: { trader: number; rugger: number; fud: number; total: number } | null; moves: Record<string, number> }) | null = null;
  let entryPaid = false;

  if (playerId) {
    const [p] = await d.select().from(players).where(eq(players.id, playerId));
    if (p) {
      const [seat] = await d.select().from(crewMembers).where(and(eq(crewMembers.playerId, p.id), eq(crewMembers.season, clock.season)));
      me = { ...p, role: seat?.role ?? null };
      const [e] = await d.select().from(entries).where(and(eq(entries.season, clock.season), eq(entries.playerId, p.id)));
      entryPaid = !!e;
      if (seat) {
        const view = (await crewsWithMembers([seat.crewId])).get(seat.crewId)!;
        const totals = await seasonTotals(clock.season);
        const mine = totals.get(seat.crewId) ?? new Map();
        const ranked = [...totals].map(([id, m]) => [id, [...m.values()].reduce((a, b) => a + b, 0)] as const).sort((a, b) => b[1] - a[1]);
        const total = [...mine.values()].reduce((a, b) => a + b, 0);
        const idx = ranked.findIndex(([id]) => id === seat.crewId);
        crew = {
          ...view,
          days: [...mine].sort((a, b) => a[0] - b[0]).map(([r, t]) => ({ round: r, total: t })),
          total,
          rank: idx >= 0 ? idx + 1 : ranked.filter(([, t]) => t > 0).length + 1,
          of: crewCount,
        };
        const [cp] = await d.select().from(plans).where(and(eq(plans.crewId, seat.crewId), eq(plans.roundId, round)));
        plan = planView(cp);
        if (live >= 1 && seasonOf(live) === clock.season) {
          const [lp] = await d.select().from(plans).where(and(eq(plans.crewId, seat.crewId), eq(plans.roundId, live)));
          const scored = await livePlansScored(live);
          livePlan = {
            ...planView(lp),
            ...(lp ? { split: effectiveSplit(lp) } : {}),
            round: live,
            score: scored?.scores.get(seat.crewId) ?? null,
            moves: scored ? Object.fromEntries(scored.moves) : {},
          };
        }
      }
    }
  }

  return { now, clock, pot, crewCount, entryFee: ENTRY_FEE, tokens, liveTokens, me, crew, plan, live: livePlan, entryPaid };
}

/** Season leaderboard: realized days plus today's live move */
export async function board(season: number) {
  const d = await db();
  const cs = await d.select({ id: crews.id }).from(crews).where(eq(crews.season, season));
  const views = await crewsWithMembers(cs.map((c) => c.id));
  const totals = await seasonTotals(season);
  const live = currentRound(Date.now()) - 1;
  const liveScores = live >= firstRound(season) ? await livePlansScored(live) : null;
  const rows = [...views.values()].map((c) => {
    const m = totals.get(c.id) ?? new Map<number, number>();
    const days = [...m].sort((a, b) => a[0] - b[0]).map(([, t]) => t);
    return { ...c, days, total: days.reduce((a, b) => a + b, 0), live: liveScores?.scores.get(c.id)?.total ?? 0, full: ROLES.every((r) => c.members[r]) };
  });
  rows.sort((a, b) => b.total - a.total || b.live - a.live);
  return rows;
}

/** Player crews with open seats this season */
export async function recruiting(season: number) {
  const d = await db();
  const cs = await d.select({ id: crews.id }).from(crews).where(and(eq(crews.season, season), eq(crews.kind, "live")));
  const views = await crewsWithMembers(cs.map((c) => c.id));
  return [...views.values()]
    .map((c) => ({ ...c, open: ROLES.filter((r) => !c.members[r] || c.members[r]!.kind === "bot") }))
    .filter((c) => c.open.length > 0)
    .slice(0, 30);
}

/** Every crew's public picks for the round, shown once picks go public */
export async function rivalPicks(round: number, exceptCrew: number | null) {
  const d = await db();
  const ps = await d.select().from(plans).where(eq(plans.roundId, round));
  const views = await crewsWithMembers(ps.map((p) => p.crewId).filter((id) => id !== exceptCrew));
  return ps
    .filter((p) => views.has(p.crewId) && (p.trader || p.rugger))
    .map((p) => ({ crewId: p.crewId, name: views.get(p.crewId)!.name, kind: views.get(p.crewId)!.kind, members: views.get(p.crewId)!.members, trader: p.trader, rugger: p.rugger }));
}

export async function chatSince(channel: string, after: number, season: number) {
  const d = await db();
  const rows = await d
    .select({ id: chat.id, text: chat.text, at: chat.createdAt, chogId: players.chogId, playerId: players.id, kind: players.kind, role: crewMembers.role })
    .from(chat)
    .innerJoin(players, eq(players.id, chat.playerId))
    .leftJoin(crewMembers, and(eq(crewMembers.playerId, players.id), eq(crewMembers.season, season)))
    .where(and(eq(chat.channel, channel), gt(chat.id, after)))
    .orderBy(desc(chat.id))
    .limit(60);
  return rows.reverse().map((r) => ({ ...r, at: r.at.getTime() }));
}
