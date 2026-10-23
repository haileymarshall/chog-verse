import { joinCrew } from "@/server/crew";
import { body, requirePlayer, route } from "@/server/http";

export const POST = route(async (req: Request) => {
  const { player } = await requirePlayer();
  const { crewId, role } = await body<{ crewId: number; role: string }>(req);
  return { crew: await joinCrew(player.id, Number(crewId), role) };
});
