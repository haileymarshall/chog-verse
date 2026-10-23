import { setPlan } from "@/server/crew";
import { body, requirePlayer, route } from "@/server/http";

export const POST = route(async (req: Request) => {
  const { player } = await requirePlayer();
  return setPlan(player.id, await body(req));
});
