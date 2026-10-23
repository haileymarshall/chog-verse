import { seasonClock } from "@/lib/verse/season";
import { createCrew } from "@/server/crew";
import { body, requirePlayer, route } from "@/server/http";
import { recruiting } from "@/server/views";

export const GET = route(async () => ({ crews: await recruiting(seasonClock(Date.now()).season) }));

export const POST = route(async (req: Request) => {
  const { player } = await requirePlayer();
  const { name, role } = await body<{ name: string; role: string }>(req);
  return { crew: await createCrew(player.id, name, role) };
});
