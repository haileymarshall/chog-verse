import { db, schema } from "@/server/db";
import { seasonClock } from "@/lib/verse/season";
import { body, fail, requirePlayer, route, seatOf } from "@/server/http";
import { getSession } from "@/server/session";
import { chatSince } from "@/server/views";

const g = globalThis as unknown as { __chatAt?: Map<number, number> };
const lastPost = (g.__chatAt ??= new Map());

async function channelFor(name: string | null, playerId: number | undefined) {
  if (name !== "crew") return "lobby";
  if (!playerId) fail(401, "Sign in first");
  const seat = (await seatOf(playerId!, seasonClock(Date.now()).season)) ?? fail(403, "Join a crew first");
  return `crew:${seat.crewId}`;
}

// Polled every few seconds by the Hideout and crew radio
export const GET = route(async (req: Request) => {
  const url = new URL(req.url);
  const s = await getSession();
  const channel = await channelFor(url.searchParams.get("channel"), s?.playerId);
  return { messages: await chatSince(channel, Number(url.searchParams.get("after")) || 0, seasonClock(Date.now()).season) };
});

export const POST = route(async (req: Request) => {
  const { player } = await requirePlayer();
  const { channel: name, text } = await body<{ channel?: string; text: string }>(req);
  const clean = String(text ?? "").replace(/\s+/g, " ").trim();
  if (!clean) fail(400, "Say something");
  if (clean.length > 200) fail(400, "Keep it under 200 characters");
  if (Date.now() - (lastPost.get(player.id) ?? 0) < 1500) fail(429, "Slow down a little");
  lastPost.set(player.id, Date.now());
  const channel = await channelFor(name ?? null, player.id);
  const d = await db();
  const [m] = await d.insert(schema.chat).values({ channel, playerId: player.id, text: clean }).returning();
  return { id: m.id };
});
