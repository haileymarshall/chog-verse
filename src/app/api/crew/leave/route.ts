import { leaveCrew } from "@/server/crew";
import { requirePlayer, route } from "@/server/http";

export const POST = route(async () => {
  const { player } = await requirePlayer();
  await leaveCrew(player.id);
  return { ok: true };
});
