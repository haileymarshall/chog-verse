import { randomBytes } from "node:crypto";
import { DEMO } from "@/lib/verse/mode";
import { fail, route } from "@/server/http";
import { setSession } from "@/server/session";

// Guest pass: demo mode only. Play any free Chog without a wallet.
export const POST = route(async () => {
  if (!DEMO) fail(403, "Guest passes are only in the demo. Connect a wallet to play.");
  await setSession({ wallet: `guest:${randomBytes(8).toString("hex")}`, kind: "guest" });
  return { ok: true };
});
