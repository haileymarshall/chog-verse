import { tick } from "@/server/game";
import { route } from "@/server/http";
import { getSession } from "@/server/session";
import { stateFor } from "@/server/views";

export const GET = route(async () => {
  const s = await getSession();
  await tick();
  return { session: s ? { wallet: s.wallet, kind: s.kind, playerId: s.playerId ?? null } : null, ...(await stateFor(s?.playerId ?? null)) };
});
