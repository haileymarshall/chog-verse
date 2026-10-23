import "server-only";
import { and, eq } from "drizzle-orm";
import { ROLES } from "@/lib/verse/roles";
import { BOTS, DEMO } from "@/lib/verse/mode";
import { backingAt, currentRound, lockAt, seasonClock } from "@/lib/verse/season";
import type { Role } from "@/lib/verse/types";
import { db, schema } from "./db";
import { fail, seatOf } from "./http";
import { tokensFor, upsertPlan } from "./game";

const { crews, crewMembers, players, plans } = schema;

export const isRole = (r: unknown): r is Role => ROLES.includes(r as Role);

export function cleanName(raw: unknown) {
  const name = String(raw ?? "").replace(/\s+/g, " ").trim();
  if (name.length < 3 || name.length > 24 || !/^[\p{L}\p{N} '.\-!&]+$/u.test(name)) fail(400, "Crew names are 3-24 letters or numbers");
  return name;
}

export async function createCrew(playerId: number, rawName: unknown, role: unknown) {
  if (!isRole(role)) fail(400, "Pick a role");
  const name = cleanName(rawName);
  const { season } = seasonClock(Date.now());
  if (await seatOf(playerId, season)) fail(409, "You're already in a crew this season");
  const d = await db();
  const crew = await d.transaction(async (tx) => {
    const [crew] = await tx.insert(crews).values({ season, name, kind: "live", createdBy: playerId }).onConflictDoNothing().returning();
    if (!crew) fail(409, "That crew name is taken this season");
    await tx.insert(crewMembers).values({ crewId: crew.id, season, role: role as Role, playerId });
    return crew;
  });
  // In the demo you only fill one seat: bots take the other three
  if (DEMO) await fillWithBots(playerId);
  return crew;
}

export async function joinCrew(playerId: number, crewId: number, role: unknown) {
  if (!isRole(role)) fail(400, "Pick a role");
  const { season } = seasonClock(Date.now());
  if (await seatOf(playerId, season)) fail(409, "You're already in a crew this season");
  const d = await db();
  const [crew] = await d.select().from(crews).where(eq(crews.id, crewId));
  if (!crew || crew.season !== season || crew.kind !== "live") fail(404, "That crew isn't recruiting");
  const [seat] = await d
    .select({ playerId: crewMembers.playerId, kind: players.kind })
    .from(crewMembers)
    .innerJoin(players, eq(players.id, crewMembers.playerId))
    .where(and(eq(crewMembers.crewId, crewId), eq(crewMembers.role, role as Role)));
  if (seat && seat.kind !== "bot") fail(409, "Someone already took that seat");
  await d.transaction(async (tx) => {
    if (seat) await tx.delete(crewMembers).where(and(eq(crewMembers.crewId, crewId), eq(crewMembers.role, role as Role)));
    await tx.insert(crewMembers).values({ crewId, season, role: role as Role, playerId });
  });
  return crew;
}

export async function leaveCrew(playerId: number) {
  const { season } = seasonClock(Date.now());
  const seat = (await seatOf(playerId, season)) ?? fail(404, "You're not in a crew");
  const d = await db();
  await d.transaction(async (tx) => {
    await tx.delete(crewMembers).where(and(eq(crewMembers.crewId, seat.crewId), eq(crewMembers.role, seat.role)));
    // A crew with no humans left is disbanded, unless it already has scores on the board
    const left = await tx
      .select({ kind: players.kind })
      .from(crewMembers)
      .innerJoin(players, eq(players.id, crewMembers.playerId))
      .where(eq(crewMembers.crewId, seat.crewId));
    if (!left.some((m) => m.kind !== "bot")) {
      const [hasScores] = await tx.select().from(schema.scores).where(eq(schema.scores.crewId, seat.crewId)).limit(1);
      if (!hasScores) {
        await tx.delete(crewMembers).where(eq(crewMembers.crewId, seat.crewId));
        await tx.delete(plans).where(eq(plans.crewId, seat.crewId));
        await tx.delete(crews).where(eq(crews.id, seat.crewId));
      }
    }
  });
}

/** Fills empty seats with bots so a crew can play before it finds teammates */
export async function fillWithBots(playerId: number) {
  if (!BOTS) fail(403, "Bots are off");
  const { season } = seasonClock(Date.now());
  const seat = (await seatOf(playerId, season)) ?? fail(404, "You're not in a crew");
  const d = await db();
  const taken = await d.select({ role: crewMembers.role }).from(crewMembers).where(eq(crewMembers.crewId, seat.crewId));
  const empty = ROLES.filter((r) => !taken.some((t) => t.role === r));
  const [me] = await d.select().from(players).where(eq(players.id, playerId));
  await d.transaction(async (tx) => {
    for (const [i, role] of empty.entries()) {
      const chogId = 1 + ((me.chogId * 7 + i * 389 + seat.crewId * 31) % 1863);
      const [bot] = await tx
        .insert(players)
        .values({ chogId, wallet: `bot:crew${seat.crewId}${role}`, kind: "bot" })
        .onConflictDoUpdate({ target: [players.wallet, players.chogId], set: { kind: "bot" } })
        .returning();
      await tx.insert(crewMembers).values({ crewId: seat.crewId, season, role, playerId: bot.id }).onConflictDoNothing();
    }
  });
}

type PlanInput = { trader?: string; rugger?: string; split?: { trader: number; rugger: number }; fud?: { crewId: number; side: "trader" | "rugger" } };

/** A Chog can make its own role's move, plus the moves of any bot seats in its crew */
export async function setPlan(playerId: number, input: PlanInput) {
  const now = Date.now();
  const round = currentRound(now);
  const { season } = seasonClock(now);
  if (now >= lockAt(round)) fail(409, "Locked. Wait for the next round.");
  const seat = (await seatOf(playerId, season)) ?? fail(403, "Join a crew first");
  const d = await db();
  const seats = await d
    .select({ role: crewMembers.role, kind: players.kind, playerId: players.id })
    .from(crewMembers)
    .innerJoin(players, eq(players.id, crewMembers.playerId))
    .where(eq(crewMembers.crewId, seat.crewId));
  const canAct = (role: Role) => {
    const s = seats.find((x) => x.role === role);
    return s?.playerId === playerId || s?.kind === "bot";
  };
  const toks = await tokensFor(round);
  const onList = (a: unknown) => typeof a === "string" && toks.some((t) => t.address === a.toLowerCase());
  const picksOpen = now < backingAt(round);
  const patch: Partial<typeof plans.$inferInsert> = {};

  if (input.trader !== undefined) {
    if (!canAct("trader")) fail(403, "Only the Trader picks the pump");
    if (!picksOpen) fail(409, "Picks closed at 14:00 UTC");
    if (!onList(input.trader)) fail(400, "Pick a token from today's list");
    patch.trader = input.trader.toLowerCase();
  }
  if (input.rugger !== undefined) {
    if (!canAct("rugger")) fail(403, "Only the Rugger picks the crash");
    if (!picksOpen) fail(409, "Picks closed at 14:00 UTC");
    if (!onList(input.rugger)) fail(400, "Pick a token from today's list");
    patch.rugger = input.rugger.toLowerCase();
  }
  if (input.split !== undefined) {
    if (!canAct("whale")) fail(403, "Only the Whale places the bag");
    const t = Math.round(Number(input.split.trader));
    const r = Math.round(Number(input.split.rugger));
    if (!(t >= 0 && r >= 0 && t + r <= 10_000 && t % 500 === 0 && r % 500 === 0)) fail(400, "Split the $10,000 in $500 steps");
    patch.splitTrader = t;
    patch.splitRugger = r;
  }
  if (input.fud !== undefined) {
    if (!canAct("fudder")) fail(403, "Only the FUDder spreads FUD");
    if (picksOpen) fail(409, "FUD opens at 14:00 UTC when picks go public");
    const { crewId, side } = input.fud;
    if (crewId === seat.crewId) fail(400, "You can't FUD your own crew");
    if (side !== "trader" && side !== "rugger") fail(400, "Pick the Trader or Rugger pick");
    const [target] = await d.select().from(plans).where(and(eq(plans.crewId, crewId), eq(plans.roundId, round)));
    if (!target?.[side]) fail(400, "That crew has no pick there");
    patch.fudCrew = crewId;
    patch.fudSide = side;
  }
  if (!Object.keys(patch).length) fail(400, "Nothing to save");
  await upsertPlan(seat.crewId, round, patch);
  return { crewId: seat.crewId, round };
}
