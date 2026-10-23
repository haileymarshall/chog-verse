import "server-only";
import { and, eq, isNotNull, isNull, lt, sql } from "drizzle-orm";
import { CHOG_POOL } from "@/lib/verse/chogs";
import { rng } from "@/lib/verse/format";
import { FUD_STAKE, ROLES, WHALE_BANK } from "@/lib/verse/roles";
import { BOTS } from "@/lib/verse/mode";
import { currentRound, dayOf, scoreAt, seasonOf } from "@/lib/verse/season";
import type { Role } from "@/lib/verse/types";
import { db, schema } from "./db";
import { buildDailyList, nadPaused, pricesFor, spark } from "./tokens";

const { players, crews, crewMembers, rounds, roundTokens, plans, scores } = schema;

export const MOVE_CAP = 100;
export const clampMove = (m: number) => Math.max(-MOVE_CAP, Math.min(MOVE_CAP, m));

/* ------------------------------------------------------------------ */
/* Rounds                                                              */
/* ------------------------------------------------------------------ */

/** Creates the round and its token list the first time anyone needs it */
export async function ensureRound(round: number) {
  const d = await db();
  const [existing] = await d.select().from(rounds).where(eq(rounds.id, round));
  if (existing) return existing;

  const list = await buildDailyList();
  if (list.length < 5) throw new Error("token list unavailable");
  const season = seasonOf(round);
  await d.transaction(async (tx) => {
    const inserted = await tx.insert(rounds).values({ id: round, season, day: dayOf(round) }).onConflictDoNothing().returning();
    if (!inserted.length) return;
    await tx.insert(roundTokens).values(list.map((t) => ({ roundId: round, address: t.address, symbol: t.symbol, name: t.name, image: t.image, rank: t.rank, priceOpen: t.price, spark: t.spark.length ? t.spark : [t.price, t.price] })));
  });
  if (BOTS) {
    await ensureBotCrews(season);
    await botPlans(round);
  }
  const [row] = await d.select().from(rounds).where(eq(rounds.id, round));
  return row;
}

export async function tokensFor(round: number) {
  const d = await db();
  return d.select().from(roundTokens).where(eq(roundTokens.roundId, round)).orderBy(roundTokens.rank);
}

const g = globalThis as unknown as { __tickAt?: number; __ticking?: Promise<void> };

/** Idempotent clock tick: open today's round, lock yesterday's, score the one before. Safe to call often. */
export function tick(force = false) {
  const now = Date.now();
  if (!force && g.__tickAt && now - g.__tickAt < 30_000) return g.__ticking ?? Promise.resolve();
  g.__tickAt = now;
  g.__ticking = runTick(now).catch((e) => {
    // Retry on the next request instead of waiting out the throttle
    g.__tickAt = undefined;
    console.error("[tick]", e);
  });
  return g.__ticking;
}

async function runTick(now: number) {
  const d = await db();
  const cur = currentRound(now);
  await ensureRound(cur);

  // Anything past its lock but not locked yet (normally just cur-1)
  const open = await d.select().from(rounds).where(and(isNull(rounds.lockedAt), lt(rounds.id, cur)));
  for (const r of open) await lockRound(r.id);

  const unscored = await d.select().from(rounds).where(and(isNull(rounds.scoredAt), isNotNull(rounds.lockedAt)));
  for (const r of unscored) if (scoreAt(r.id) <= now) await scoreRound(r.id);

  // Pay the top 3 crews once a season's vault opens (live mode only). Imported lazily: payout imports views, which imports this file.
  await (await import("./payout")).settleDue(cur).catch((e) => console.error("[payout]", e));

  void fillSparks(cur);
}

const gs = globalThis as unknown as { __sparking?: boolean };

/** Fetches missing 24h charts one at a time, stopping whenever nad.fun asks us to slow down */
async function fillSparks(round: number) {
  if (gs.__sparking) return;
  gs.__sparking = true;
  try {
    const d = await db();
    for (const t of await tokensFor(round)) {
      if (t.spark.length > 2) continue;
      if (nadPaused()) break;
      const s = await spark(t.address);
      if (s === null) break;
      if (s.length > 1) await d.update(roundTokens).set({ spark: s }).where(and(eq(roundTokens.roundId, round), eq(roundTokens.address, t.address)));
      await new Promise((r) => setTimeout(r, 1500));
    }
  } finally {
    gs.__sparking = false;
  }
}

async function lockRound(round: number) {
  const d = await db();
  const toks = await tokensFor(round);
  const prices = await pricesFor(toks.map((t) => t.address));
  if (prices.size < toks.length * 0.6) throw new Error(`lock ${round}: only ${prices.size}/${toks.length} prices`);
  await fillBotSeats(round);
  await d.transaction(async (tx) => {
    for (const t of toks) {
      // A token with no price at lock is treated as flat from its last known price
      await tx.update(roundTokens).set({ priceLock: prices.get(t.address) ?? t.priceOpen }).where(and(eq(roundTokens.roundId, round), eq(roundTokens.address, t.address)));
    }
    await tx.update(rounds).set({ lockedAt: new Date() }).where(eq(rounds.id, round));
  });
}

async function scoreRound(round: number) {
  const d = await db();
  const toks = await tokensFor(round);
  const prices = await pricesFor(toks.map((t) => t.address));
  if (prices.size < toks.length * 0.6) throw new Error(`score ${round}: only ${prices.size}/${toks.length} prices`);
  const moves = new Map<string, number>();
  for (const t of toks) {
    const close = prices.get(t.address) ?? t.priceLock ?? t.priceOpen;
    const lock = t.priceLock ?? t.priceOpen;
    moves.set(t.address, clampMove((close / lock - 1) * 100));
  }
  const all = await d.select().from(plans).where(eq(plans.roundId, round));
  const byCrew = new Map(all.map((p) => [p.crewId, p]));
  const season = seasonOf(round);
  const rows = all.map((p) => ({ crewId: p.crewId, roundId: round, season, ...scorePlan(p, byCrew, moves) }));
  await d.transaction(async (tx) => {
    for (const t of toks) {
      const close = prices.get(t.address);
      if (close) await tx.update(roundTokens).set({ priceClose: close }).where(and(eq(roundTokens.roundId, round), eq(roundTokens.address, t.address)));
    }
    if (rows.length) await tx.insert(scores).values(rows).onConflictDoNothing();
    await tx.update(rounds).set({ scoredAt: new Date() }).where(eq(rounds.id, round));
  });
}

type PlanRow = typeof plans.$inferSelect;

/** Paper $ profit for one crew's plan, given each token's % move since lock */
export function scorePlan(p: PlanRow, byCrew: Map<number, PlanRow>, moves: Map<string, number>) {
  const split = effectiveSplit(p);
  const tMove = p.trader ? (moves.get(p.trader) ?? 0) : 0;
  const rMove = p.rugger ? (moves.get(p.rugger) ?? 0) : 0;
  const trader = (split.trader * tMove) / 100;
  const rugger = (split.rugger * -rMove) / 100;
  let fud = 0;
  if (p.fudCrew && p.fudSide) {
    const target = byCrew.get(p.fudCrew);
    const sym = target ? target[p.fudSide] : null;
    if (sym) {
      const m = moves.get(sym) ?? 0;
      fud = (FUD_STAKE * (p.fudSide === "trader" ? -m : m)) / 100;
    }
  }
  return { trader, rugger, fud, total: trader + rugger + fud };
}

/** A missed Whale split defaults to 50/50; money behind a missing pick stays as cash */
export function effectiveSplit(p: Pick<PlanRow, "splitTrader" | "splitRugger" | "trader" | "rugger">) {
  let t = p.splitTrader ?? WHALE_BANK / 2;
  let r = p.splitRugger ?? WHALE_BANK / 2;
  if (!p.trader) t = 0;
  if (!p.rugger) r = 0;
  return { trader: t, rugger: r, cash: WHALE_BANK - t - r };
}

/* ------------------------------------------------------------------ */
/* Bots: rival crews so the city is never empty, and seat-fillers     */
/* ------------------------------------------------------------------ */

const ADJ = ["Purple", "Midnight", "Feral", "Sneaky", "Golden", "Rabid", "Chaotic", "Velvet", "Cursed", "Lucky", "Toxic", "Neon", "Silent", "Salty", "Cosmic", "Broke"];
const NOUN = ["Bandits", "Goblins", "Raccoons", "Syndicate", "Cartel", "Gang", "Rascals", "Outlaws", "Pirates", "Gremlins", "Hustlers", "Degens", "Wolves", "Phantoms"];
export const BOT_CREWS = 24;

async function botPlayer(tx: Parameters<Parameters<Awaited<ReturnType<typeof db>>["transaction"]>[0]>[0], tag: string, chogId: number) {
  const [p] = await tx
    .insert(players)
    .values({ chogId, wallet: `bot:${tag}`, kind: "bot" })
    .onConflictDoUpdate({ target: [players.wallet, players.chogId], set: { kind: "bot" } })
    .returning();
  return p;
}

export async function ensureBotCrews(season: number) {
  const d = await db();
  const [{ n }] = await d.select({ n: sql<number>`count(*)::int` }).from(crews).where(and(eq(crews.season, season), eq(crews.kind, "bot")));
  if (n >= BOT_CREWS) return;
  const r = rng(season * 7919);
  const ids = CHOG_POOL.map((c) => c.id);
  await d.transaction(async (tx) => {
    for (let i = n; i < BOT_CREWS; i++) {
      const name = `${ADJ[Math.floor(r() * ADJ.length)]} ${NOUN[Math.floor(r() * NOUN.length)]}`;
      const [crew] = await tx.insert(crews).values({ season, name, kind: "bot" }).onConflictDoNothing().returning();
      if (!crew) continue;
      for (const [k, role] of ROLES.entries()) {
        const p = await botPlayer(tx, `s${season}c${crew.id}${role}`, ids[(i * 4 + k + season * 13) % ids.length]);
        await tx.insert(crewMembers).values({ crewId: crew.id, season, role, playerId: p.id });
      }
    }
  });
}

function randomPlan(r: () => number, toks: { address: string }[], rivals: number[]) {
  const pick = () => toks[Math.floor(r() * toks.length)].address;
  const t = Math.round(r() * 8) * 1000;
  const rug = Math.round(r() * ((WHALE_BANK - t) / 1000)) * 1000;
  return {
    trader: pick(),
    rugger: pick(),
    splitTrader: t,
    splitRugger: rug,
    fudCrew: rivals.length ? rivals[Math.floor(r() * rivals.length)] : null,
    fudSide: (r() > 0.5 ? "trader" : "rugger") as "trader" | "rugger",
  };
}

async function botPlans(round: number) {
  const d = await db();
  const season = seasonOf(round);
  const toks = await tokensFor(round);
  if (!toks.length) return;
  const bots = await d.select({ id: crews.id }).from(crews).where(and(eq(crews.season, season), eq(crews.kind, "bot")));
  const all = (await d.select({ id: crews.id }).from(crews).where(eq(crews.season, season))).map((c) => c.id);
  const r = rng(round * 104729);
  const rows = bots.map((b) => ({ crewId: b.id, roundId: round, ...randomPlan(r, toks, all.filter((x) => x !== b.id)) }));
  if (rows.length) await d.insert(plans).values(rows).onConflictDoNothing();
}

/** At lock, bot-held seats in player crews make their move if nobody did it for them */
async function fillBotSeats(round: number) {
  const d = await db();
  const season = seasonOf(round);
  const toks = await tokensFor(round);
  const seats = await d
    .select({ crewId: crewMembers.crewId, role: crewMembers.role })
    .from(crewMembers)
    .innerJoin(players, eq(players.id, crewMembers.playerId))
    .innerJoin(crews, eq(crews.id, crewMembers.crewId))
    .where(and(eq(crewMembers.season, season), eq(players.kind, "bot"), eq(crews.kind, "live")));
  if (!seats.length) return;
  const all = (await d.select({ id: crews.id }).from(crews).where(eq(crews.season, season))).map((c) => c.id);
  const r = rng(round * 31337);
  const byCrew = new Map<number, Role[]>();
  for (const s of seats) byCrew.set(s.crewId, [...(byCrew.get(s.crewId) ?? []), s.role]);
  for (const [crewId, roles] of byCrew) {
    const [cur] = await d.select().from(plans).where(and(eq(plans.crewId, crewId), eq(plans.roundId, round)));
    const rand = randomPlan(r, toks, all.filter((x) => x !== crewId));
    const patch: Partial<PlanRow> = {};
    if (roles.includes("trader") && !cur?.trader) patch.trader = rand.trader;
    if (roles.includes("rugger") && !cur?.rugger) patch.rugger = rand.rugger;
    if (roles.includes("whale") && cur?.splitTrader == null) Object.assign(patch, { splitTrader: rand.splitTrader, splitRugger: rand.splitRugger });
    if (roles.includes("fudder") && !cur?.fudCrew) Object.assign(patch, { fudCrew: rand.fudCrew, fudSide: rand.fudSide });
    if (Object.keys(patch).length) await upsertPlan(crewId, round, patch);
  }
}

export async function upsertPlan(crewId: number, round: number, patch: Partial<PlanRow>) {
  const d = await db();
  await d
    .insert(plans)
    .values({ crewId, roundId: round, ...patch })
    .onConflictDoUpdate({ target: [plans.crewId, plans.roundId], set: { ...patch, updatedAt: new Date() } });
}

/* ------------------------------------------------------------------ */
/* Live scores for the round in play (locked, not yet scored)         */
/* ------------------------------------------------------------------ */

export async function liveMoves(round: number) {
  const toks = await tokensFor(round);
  if (!toks.length || toks.some((t) => t.priceLock == null)) return null;
  const prices = await pricesFor(toks.map((t) => t.address));
  const moves = new Map<string, number>();
  for (const t of toks) moves.set(t.address, clampMove(((prices.get(t.address) ?? t.priceLock!) / t.priceLock! - 1) * 100));
  return moves;
}

export async function livePlansScored(round: number) {
  const d = await db();
  const moves = await liveMoves(round);
  if (!moves) return null;
  const all = await d.select().from(plans).where(eq(plans.roundId, round));
  const byCrew = new Map(all.map((p) => [p.crewId, p]));
  return { moves, scores: new Map(all.map((p) => [p.crewId, scorePlan(p, byCrew, moves)])) };
}

export async function seasonTotals(season: number) {
  const d = await db();
  const rows = await d
    .select({ crewId: scores.crewId, roundId: scores.roundId, total: scores.total })
    .from(scores)
    .where(eq(scores.season, season));
  const out = new Map<number, Map<number, number>>();
  for (const r of rows) {
    if (!out.has(r.crewId)) out.set(r.crewId, new Map());
    out.get(r.crewId)!.set(r.roundId, r.total);
  }
  return out;
}

