import { and, eq, gt, ne } from "drizzle-orm";
import { DEMO_WALLET, isChogId } from "@/lib/verse/chogs";
import { CHECK_OWNERSHIP } from "@/lib/verse/mode";
import { seasonClock } from "@/lib/verse/season";
import { ownsChog } from "@/server/chain";
import { db, schema } from "@/server/db";
import { body, fail, requireSession, route, seatOf } from "@/server/http";
import { setSession } from "@/server/session";

const { players } = schema;

// Pick which Chog you play as.
// With ownership checks, holders are checked on-chain and the seat belongs to the Chog: a new owner takes over its seat.
// Without, any Chog works, but only one wallet can play a given Chog and each wallet plays one Chog.
export const POST = route(async (req: Request) => {
  const s = await requireSession();
  const chogId = Number((await body<{ chogId: number }>(req)).chogId);
  if (!isChogId(chogId)) fail(400, "No such Chog");
  const d = await db();
  let player: typeof players.$inferSelect | undefined;

  if (CHECK_OWNERSHIP) {
    if (s.kind === "guest") {
      if (!DEMO_WALLET.includes(chogId)) fail(403, "Guests play one of the loaner Chogs");
    } else if (!(await ownsChog(s.wallet, chogId))) {
      fail(403, "This wallet doesn't hold that Chog");
    }
    if (s.kind === "holder") {
      [player] = await d.update(players).set({ wallet: s.wallet }).where(and(eq(players.chogId, chogId), eq(players.kind, "holder"))).returning();
    }
  } else {
    const [other] = await d.select().from(players).where(and(eq(players.chogId, chogId), ne(players.wallet, s.wallet), ne(players.kind, "bot"))).limit(1);
    if (other) fail(409, `Someone else is already playing Chog #${chogId}`);
    const [current] = await d.select().from(players).where(eq(players.wallet, s.wallet)).limit(1);
    if (current && current.chogId !== chogId) {
      const season = seasonClock(Date.now()).season;
      if (await seatOf(current.id, season)) fail(409, `You're in a crew as Chog #${current.chogId}. Leave it to switch Chogs.`);
      // The Bank pays whoever paid for a Chog, so a paid-up Chog is yours for the season
      const [paid] = await d.select().from(schema.entries).where(and(eq(schema.entries.playerId, current.id), eq(schema.entries.season, season), gt(schema.entries.amount, 0)));
      if (paid) fail(409, `You paid entry as Chog #${current.chogId} this season, so you play it until the vault opens.`);
      [player] = await d.update(players).set({ chogId }).where(eq(players.id, current.id)).returning();
    }
  }
  player ??= (await d.insert(players).values({ chogId, wallet: s.wallet, kind: s.kind }).onConflictDoUpdate({ target: [players.wallet, players.chogId], set: { kind: s.kind } }).returning())[0];

  await setSession({ wallet: s.wallet, kind: s.kind, playerId: player.id });
  return { playerId: player.id, chogId };
});
