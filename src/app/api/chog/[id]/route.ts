import snapshot from "../../../../../data/chogs.json";
import { fail, route } from "@/server/http";

const chogs = snapshot as { tokenId: number; traits: Record<string, string> }[];

// Traits for any of the 1,969 Chogs, from the on-chain metadata snapshot
export const GET = route(async (_req: Request, ctx: RouteContext<"/api/chog/[id]">) => {
  const id = Number((await ctx.params).id);
  const c = chogs[id - 1];
  if (!c || c.tokenId !== id) fail(404, "No such Chog");
  return { id, tier: c.traits.Tier ?? "Common", traits: c.traits };
});
