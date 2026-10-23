import { seasonClock } from "@/lib/verse/season";
import { tick } from "@/server/game";
import { route } from "@/server/http";
import { board, potFor } from "@/server/views";

export const GET = route(async (req: Request) => {
  await tick();
  const { season } = seasonClock(Date.now());
  const s = Number(new URL(req.url).searchParams.get("season")) || season;
  return { season: s, pot: await potFor(s), rows: await board(s) };
});
