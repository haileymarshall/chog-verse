import "server-only";
import { and, desc, eq, ne, sql } from "drizzle-orm";
import snapshot from "../../data/chogs.json";
import { isChogId } from "@/lib/verse/chogs";
import type { ChogCard } from "@/lib/verse/chogid";
import type { Role } from "@/lib/verse/types";
import { db, schema } from "./db";
import { seasonTotals } from "./game";

const chogs = snapshot as { tokenId: number; traits: Record<string, string> }[];
// Hidden from the card: always-there values that say nothing about the Chog
const HIDE = new Set(["Retard"]); // trait values we won't print on a shareable card
const skip = (k: string, v: string) => HIDE.has(v) || k === "Tier" || k === "Naked" || (k === "Form" && v === "Chog") || (k === "Base" && v === "Origin");
const TIER_BONUS: Record<string, number> = { Legendary: 10, Epic: 1, Rare: 0.5 };

// How many of the 1,969 Chogs share each trait value, and a rarity rank from that
const counts = new Map<string, number>();
for (const c of chogs) for (const [k, v] of Object.entries(c.traits)) counts.set(`${k}:${v}`, (counts.get(`${k}:${v}`) ?? 0) + 1);
const score = (c: (typeof chogs)[number]) =>
  Object.entries(c.traits).reduce((s, [k, v]) => (skip(k, v) ? s : s + 1 / (counts.get(`${k}:${v}`) ?? 1)), TIER_BONUS[c.traits.Tier] ?? 0);
const rank = new Map(
  chogs
    .map((c) => [c.tokenId, score(c)] as const)
    .sort((a, b) => b[1] - a[1])
    .map(([id], i) => [id, i + 1]),
);

export async function chogCard(id: number): Promise<ChogCard | null> {
  if (!isChogId(id)) return null;
  const c = chogs[id - 1];
  if (!c || c.tokenId !== id) return null;
  const traits = Object.entries(c.traits)
    .filter(([k, v]) => !skip(k, v))
    .map(([type, value]) => ({ type: value === "1:1" ? "Edition" : type, value: value === "1:1" ? "1 of 1" : value, count: counts.get(`${type}:${value}`) ?? 1 }))
    .sort((a, b) => a.count - b.count);

  const d = await db();
  const [seat] = await d
    .select({ season: schema.crewMembers.season, role: schema.crewMembers.role, crewId: schema.crews.id, crew: schema.crews.name })
    .from(schema.crewMembers)
    .innerJoin(schema.players, eq(schema.players.id, schema.crewMembers.playerId))
    .innerJoin(schema.crews, eq(schema.crews.id, schema.crewMembers.crewId))
    .where(and(eq(schema.players.chogId, id), ne(schema.players.kind, "bot")))
    .orderBy(desc(schema.crewMembers.season))
    .limit(1);
  const [{ n: seasons }] = await d
    .select({ n: sql<number>`count(distinct ${schema.crewMembers.season})::int` })
    .from(schema.crewMembers)
    .innerJoin(schema.players, eq(schema.players.id, schema.crewMembers.playerId))
    .where(and(eq(schema.players.chogId, id), ne(schema.players.kind, "bot")));
  const [{ n: messages }] = await d
    .select({ n: sql<number>`count(*)::int` })
    .from(schema.chat)
    .innerJoin(schema.players, eq(schema.players.id, schema.chat.playerId))
    .where(and(eq(schema.players.chogId, id), ne(schema.players.kind, "bot")));

  let crew: ChogCard["crew"] = null;
  if (seat) {
    const days = (await seasonTotals(seat.season)).get(seat.crewId);
    crew = { name: seat.crew, role: seat.role as Role, season: seat.season, profit: days ? [...days.values()].reduce((a, b) => a + b, 0) : 0 };
  }
  return { id, tier: c.traits.Tier ?? "Common", rank: rank.get(id) ?? 1969, traits, crew, seasons, messages };
}
