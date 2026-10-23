import { route } from "@/server/http";
import { newNonce } from "@/server/session";

export const POST = route(async () => ({ nonce: await newNonce() }));
