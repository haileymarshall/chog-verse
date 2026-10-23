import { eq } from "drizzle-orm";
import { db, schema } from "@/server/db";
import { addToGroup, checkRoom, createGroup, demoLife, lastIds, leaveGroup, messages, myGroups, online, post, touch } from "@/server/hangout";
import { body, fail, requirePlayer, route } from "@/server/http";
import { getSession } from "@/server/session";

const g = globalThis as unknown as { __hangAt?: Map<number, number> };
const lastPost = (g.__hangAt ??= new Map());

async function softPlayer() {
  const s = await getSession();
  if (!s?.playerId) return null;
  const d = await db();
  const [p] = await d.select().from(schema.players).where(eq(schema.players.id, s.playerId));
  return p && p.wallet === s.wallet ? p : null;
}

// Polled every few seconds by the Hangout: rooms, my groups, who's online, and new messages
export const GET = route(async (req: Request) => {
  const url = new URL(req.url);
  const room = url.searchParams.get("room") || "general";
  const me = await softPlayer();
  await checkRoom(room, me?.chogId ?? null);
  if (me) await touch(me.id, room);
  await demoLife(room);
  const [last, groups, who, msgs] = await Promise.all([lastIds(), me ? myGroups(me.chogId) : [], online(), messages(room, Number(url.searchParams.get("after")) || 0)]);
  return { me: me && { id: me.id, chogId: me.chogId, kind: me.kind }, last, groups, online: who, messages: msgs };
});

type Action =
  | { action: "send"; room: string; text: string }
  | { action: "create"; name?: string; chogs: number[] }
  | { action: "add"; room: string; chog: number }
  | { action: "leave"; room: string };

export const POST = route(async (req: Request) => {
  const { player } = await requirePlayer();
  const a = await body<Action>(req);
  if (a.action === "send") {
    const clean = String(a.text ?? "").replace(/\s+/g, " ").trim();
    if (!clean) fail(400, "Say something");
    if (clean.length > 280) fail(400, "Keep it under 280 characters");
    if (Date.now() - (lastPost.get(player.id) ?? 0) < 1200) fail(429, "Slow down a little");
    lastPost.set(player.id, Date.now());
    await checkRoom(a.room, player.chogId);
    return { id: await post(player.id, a.room, clean) };
  }
  if (a.action === "create") return { room: await createGroup(player, String(a.name ?? ""), Array.isArray(a.chogs) ? a.chogs : []) };
  if (a.action === "add") return addToGroup(player, a.room, Number(a.chog));
  if (a.action === "leave") return leaveGroup(player, a.room);
  return fail(400, "Unknown action");
});
