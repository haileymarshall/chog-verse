import { chogCard } from "@/server/chogid";
import { fail, route } from "@/server/http";

// Everything the Chog ID card shows: traits with rarity, rank, and Chog Verse stats
export const GET = route(async (_req: Request, ctx: RouteContext<"/api/chog/[id]/card">) => {
  return (await chogCard(Number((await ctx.params).id))) ?? fail(404, "No such Chog");
});
