import { fillWithBots } from "@/server/crew";
import { requirePlayer, route } from "@/server/http";

export const POST = route(async () => {
  const { player } = await requirePlayer();
  await fillWithBots(player.id);
  return { ok: true };
});
