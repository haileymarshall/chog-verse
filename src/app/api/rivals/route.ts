import { backingAt, seasonClock } from "@/lib/verse/season";
import { getSession } from "@/server/session";
import { route, seatOf } from "@/server/http";
import { rivalPicks } from "@/server/views";

// Picks go public at 14:00 UTC; before that, nobody sees anyone's picks
export const GET = route(async () => {
  const now = Date.now();
  const { round, season } = seasonClock(now);
  const opensAt = backingAt(round);
  if (now < opensAt) return { open: false, opensAt, picks: [] };
  const s = await getSession();
  const seat = s?.playerId ? await seatOf(s.playerId, season) : null;
  return { open: true, opensAt, picks: await rivalPicks(round, seat?.crewId ?? null) };
});
