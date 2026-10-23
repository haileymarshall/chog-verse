import "server-only";
import { and, desc, eq, gt, inArray, sql } from "drizzle-orm";
import { HANGOUT_ROOMS, type HangoutRoom } from "@/lib/verse/hangout";
import { isChogId } from "@/lib/verse/chogs";
import { BOTS } from "@/lib/verse/mode";
import { seasonClock } from "@/lib/verse/season";
import { db, schema } from "./db";
import { fail } from "./http";
import { chatSince } from "./views";

const { chat, groups, groupMembers, players, presence } = schema;
const ONLINE_MS = 60_000;
const MAX_GROUP = 12;

export const channelOf = (room: string) => (room.startsWith("g") && /^g\d+$/.test(room) ? `group:${room.slice(1)}` : `hang:${room}`);

/** Throws unless the room exists and this Chog may read it */
export async function checkRoom(room: string, chogId: number | null) {
  if (HANGOUT_ROOMS.some((r) => r.key === room)) return;
  const id = /^g(\d+)$/.exec(room)?.[1];
  if (!id) fail(404, "No such room");
  if (!chogId) fail(401, "Pick your Chog first");
  const d = await db();
  const [m] = await d.select().from(groupMembers).where(and(eq(groupMembers.groupId, Number(id)), eq(groupMembers.chogId, chogId!)));
  if (!m) fail(403, "You're not in this group");
}

export async function myGroups(chogId: number) {
  const d = await db();
  const mine = await d.select({ id: groupMembers.groupId }).from(groupMembers).where(eq(groupMembers.chogId, chogId));
  if (!mine.length) return [];
  const ids = mine.map((m) => m.id);
  const [rows, members, last] = await Promise.all([
    d.select().from(groups).where(inArray(groups.id, ids)),
    d.select().from(groupMembers).where(inArray(groupMembers.groupId, ids)),
    d
      .select({ channel: chat.channel, last: sql<number>`max(${chat.id})::int` })
      .from(chat)
      .where(inArray(chat.channel, ids.map((id) => `group:${id}`)))
      .groupBy(chat.channel),
  ]);
  const lastBy = new Map(last.map((l) => [l.channel, l.last]));
  return rows
    .map((g) => ({
      key: `g${g.id}`,
      name: g.name,
      chogs: members.filter((m) => m.groupId === g.id).map((m) => m.chogId),
      lastId: lastBy.get(`group:${g.id}`) ?? 0,
      createdAt: g.createdAt.getTime(),
    }))
    .sort((a, b) => b.lastId - a.lastId || b.createdAt - a.createdAt);
}

export async function lastIds() {
  const d = await db();
  const rows = await d
    .select({ channel: chat.channel, last: sql<number>`max(${chat.id})::int` })
    .from(chat)
    .where(inArray(chat.channel, HANGOUT_ROOMS.map((r) => `hang:${r.key}`)))
    .groupBy(chat.channel);
  return Object.fromEntries(rows.map((r) => [r.channel.slice(5), r.last]));
}

export async function touch(playerId: number, room: string) {
  const d = await db();
  await d
    .insert(presence)
    .values({ playerId, room, seenAt: new Date() })
    .onConflictDoUpdate({ target: presence.playerId, set: { room, seenAt: new Date() } });
}

export async function online() {
  const d = await db();
  const rows = await d
    .select({ playerId: players.id, chogId: players.chogId, kind: players.kind, room: presence.room, seenAt: presence.seenAt })
    .from(presence)
    .innerJoin(players, eq(players.id, presence.playerId))
    .where(gt(presence.seenAt, new Date(Date.now() - ONLINE_MS)))
    .orderBy(desc(presence.seenAt))
    .limit(80);
  // Group chats stay private: everyone else just sees "in a group"
  return rows.map((r) => ({ playerId: r.playerId, chogId: r.chogId, kind: r.kind, room: /^g\d+$/.test(r.room) ? "group" : r.room }));
}

export async function messages(room: string, after: number) {
  return chatSince(channelOf(room), after, seasonClock(Date.now()).season);
}

export async function post(playerId: number, room: string, text: string) {
  const d = await db();
  const [m] = await d.insert(chat).values({ channel: channelOf(room), playerId, text }).returning();
  return m.id;
}

export async function createGroup(me: { id: number; chogId: number }, name: string, chogIds: number[]) {
  const ids = [...new Set([me.chogId, ...chogIds.map(Number)])].filter(isChogId);
  if (ids.length < 2) fail(400, "Add at least one other Chog");
  if (ids.length > MAX_GROUP) fail(400, `Groups hold up to ${MAX_GROUP} Chogs`);
  const clean = name.replace(/\s+/g, " ").trim().slice(0, 32) || ids.filter((id) => id !== me.chogId).slice(0, 3).map((id) => `#${id}`).join(", ");
  const d = await db();
  const [g] = await d.insert(groups).values({ name: clean, createdBy: me.id }).returning();
  await d.insert(groupMembers).values(ids.map((chogId) => ({ groupId: g.id, chogId })));
  await d.insert(chat).values({ channel: `group:${g.id}`, playerId: me.id, text: `started "${clean}"` });
  return `g${g.id}`;
}

export async function addToGroup(me: { id: number; chogId: number }, room: string, chogId: number) {
  await checkRoom(room, me.chogId);
  if (!room.startsWith("g")) fail(400, "Only group chats take invites");
  if (!isChogId(chogId)) fail(400, "Chogs are numbered 1 to 1969");
  const groupId = Number(room.slice(1));
  const d = await db();
  const [{ n }] = await d.select({ n: sql<number>`count(*)::int` }).from(groupMembers).where(eq(groupMembers.groupId, groupId));
  if (n >= MAX_GROUP) fail(400, `Groups hold up to ${MAX_GROUP} Chogs`);
  const added = await d.insert(groupMembers).values({ groupId, chogId }).onConflictDoNothing().returning();
  if (!added.length) fail(400, `Chog #${chogId} is already here`);
  await d.insert(chat).values({ channel: `group:${groupId}`, playerId: me.id, text: `added Chog #${chogId}` });
}

export async function leaveGroup(me: { id: number; chogId: number }, room: string) {
  await checkRoom(room, me.chogId);
  if (!room.startsWith("g")) fail(400, "You can't leave a public room");
  const d = await db();
  await d.delete(groupMembers).where(and(eq(groupMembers.groupId, Number(room.slice(1))), eq(groupMembers.chogId, me.chogId)));
  await d.insert(chat).values({ channel: channelOf(room), playerId: me.id, text: "left the group" });
}

/* ---------- Demo: a few bot Chogs keep the public rooms from feeling empty ---------- */

const BOT_CHOGS = [1481, 942, 1514, 1667, 420, 777, 88, 1234, 333, 1900];
const BOT_LINES: Record<string, string[]> = {
  general: ["gm Chogs ☀️", "who's here from the Monad discord", "first time in the Hangout, this is cozy", "gm gm. coffee and charts", "the city looks unreal at night", "anyone else stay up for the vault opening?"],
  alpha: ["$MOE up double digits again, watching it", "nad.fun top 20 is getting spicy today", "my Trader pick is locked. not saying which 👀", "volume on $CHOG picking up", "rugger picks are free money this week ngl"],
  memes: ["me after my Rugger pick pumped 40%: 🫠", "Chog sees red candle. Chog buys more.", "whale: 'trust the process'. the process: 📉", "POV: you FUDded the #1 crew and won"],
  crews: ["Trader LF crew, 3 green days last season", "need a Whale with conviction, DM me", "Rugger here. i smell rugs from 3 blocks away", "our crew needs a FUDder, must be evil"],
};
const g = globalThis as unknown as { __hangBot?: Map<string, number> };
const lastBot = (g.__hangBot ??= new Map());

async function botPlayers() {
  const d = await db();
  return Promise.all(
    BOT_CHOGS.map(async (chogId) => {
      const [p] = await d
        .insert(players)
        .values({ chogId, wallet: "bot:hangout", kind: "bot" })
        .onConflictDoUpdate({ target: [players.wallet, players.chogId], set: { kind: "bot" } })
        .returning();
      return p;
    }),
  );
}

/** Demo only: seed empty rooms, sometimes post a line, keep a few bots "online" */
export async function demoLife(room: HangoutRoom["key"] | string) {
  if (!BOTS) return;
  const now = Date.now();
  if (now - (lastBot.get("tick") ?? 0) < 8_000) return;
  lastBot.set("tick", now);
  const bots = await botPlayers();
  const d = await db();
  await Promise.all(bots.slice(0, 5 + (Math.floor(now / 60_000) % 4)).map((b, i) => touch(b.id, HANGOUT_ROOMS[i % HANGOUT_ROOMS.length].key)));
  const lines = BOT_LINES[room];
  if (!lines) return;
  const [last] = await d.select({ at: chat.createdAt }).from(chat).where(eq(chat.channel, `hang:${room}`)).orderBy(desc(chat.id)).limit(1);
  if (!last) {
    await d.insert(chat).values(lines.slice(0, 4).map((text, i) => ({ channel: `hang:${room}`, playerId: bots[(i * 3 + room.length) % bots.length].id, text, createdAt: new Date(now - (4 - i) * 90_000) })));
    return;
  }
  if (now - last.at.getTime() > 45_000 && Math.random() < 0.35) {
    const text = lines[Math.floor(Math.random() * lines.length)];
    await d.insert(chat).values({ channel: `hang:${room}`, playerId: bots[Math.floor(Math.random() * bots.length)].id, text });
  }
}
