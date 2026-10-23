import { and, eq, ne } from "drizzle-orm";
import { DEMO_WALLET } from "@/lib/verse/chogs";
import { CHECK_OWNERSHIP } from "@/lib/verse/mode";
import { chogsOf } from "@/server/chain";
import { db, schema } from "@/server/db";
import { requireSession, route } from "@/server/http";

const { players } = schema;

// The Chogs this session can play. With ownership checks: on-chain holdings (or the loaner Chogs for guests).
// Without: any Chog nobody else is playing, with the one this wallet already plays first.
export const GET = route(async () => {
  const s = await requireSession();
  if (CHECK_OWNERSHIP) {
    if (s.kind === "guest") return { wallet: s.wallet, kind: s.kind, any: false, chogs: DEMO_WALLET, taken: [] };
    return { wallet: s.wallet, kind: s.kind, any: false, chogs: (await chogsOf(s.wallet)).sort((a, b) => a - b), taken: [] };
  }
  const d = await db();
  const mine = await d.select({ chogId: players.chogId }).from(players).where(eq(players.wallet, s.wallet));
  const others = await d.selectDistinct({ chogId: players.chogId }).from(players).where(and(ne(players.wallet, s.wallet), ne(players.kind, "bot")));
  return { wallet: s.wallet, kind: s.kind, any: true, chogs: mine.map((m) => m.chogId), taken: others.map((o) => o.chogId) };
});
