import { isAddress, verifyMessage } from "viem";
import { body, fail, route } from "@/server/http";
import { loginMessage, setSession, takeNonce } from "@/server/session";

// Proves wallet ownership with a free signature, then starts a session
export const POST = route(async (req: Request) => {
  const { address, signature } = await body<{ address: string; signature: `0x${string}` }>(req);
  if (!isAddress(address) || typeof signature !== "string") fail(400, "Bad signature");
  const nonce = (await takeNonce()) ?? fail(400, "Login expired. Try again.");
  const ok = await verifyMessage({ address: address as `0x${string}`, message: loginMessage(address, nonce), signature }).catch(() => false);
  if (!ok) fail(401, "Signature does not match this wallet");
  await setSession({ wallet: address.toLowerCase(), kind: "holder" });
  return { wallet: address.toLowerCase() };
});
