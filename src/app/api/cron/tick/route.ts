import { tick } from "@/server/game";
import { fail, route } from "@/server/http";

// Called by Vercel Cron a few minutes after 15:00 UTC; every API call also ticks lazily
export const GET = route(async (req: Request) => {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) fail(401, "Nope");
  await tick(true);
  return { ok: true, at: Date.now() };
});
