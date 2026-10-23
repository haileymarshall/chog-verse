import { lastPayout } from "@/server/payout";
import { route } from "@/server/http";

// The latest season the Bank paid out, for the Vault screen
export const GET = route(async () => ({ payout: await lastPayout() }));
