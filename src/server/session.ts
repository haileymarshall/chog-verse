import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

// Signed cookie session. The wallet is proven by a signature at login; the Chog is checked on-chain when chosen.
export type Session = {
  /** lowercase 0x address, or "guest:<id>" for guest passes */
  wallet: string;
  kind: "holder" | "guest";
  /** the player (Chog) currently being played */
  playerId?: number;
  exp: number;
};

const COOKIE = "verse_session";
const NONCE_COOKIE = "verse_nonce";
const TTL = 30 * 86_400_000;

function secret() {
  const s = process.env.SESSION_SECRET;
  if (s) return s;
  if (process.env.NODE_ENV === "production") throw new Error("SESSION_SECRET is not set");
  return "dev-only-chog-verse-secret";
}

function sign(data: string) {
  return createHmac("sha256", secret()).update(data).digest("base64url");
}

export function encode(s: Session) {
  const body = Buffer.from(JSON.stringify(s)).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function decode(raw: string | undefined): Session | null {
  if (!raw) return null;
  const [body, mac] = raw.split(".");
  if (!body || !mac) return null;
  const want = Buffer.from(sign(body));
  const got = Buffer.from(mac);
  if (want.length !== got.length || !timingSafeEqual(want, got)) return null;
  try {
    const s = JSON.parse(Buffer.from(body, "base64url").toString()) as Session;
    return s.exp > Date.now() ? s : null;
  } catch {
    return null;
  }
}

export async function getSession() {
  return decode((await cookies()).get(COOKIE)?.value);
}

export async function setSession(s: Omit<Session, "exp">) {
  (await cookies()).set(COOKIE, encode({ ...s, exp: Date.now() + TTL }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TTL / 1000,
  });
}

export async function clearSession() {
  (await cookies()).delete(COOKIE);
}

export async function newNonce() {
  const nonce = randomBytes(12).toString("hex");
  (await cookies()).set(NONCE_COOKIE, `${nonce}.${sign(nonce)}`, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 600 });
  return nonce;
}

export async function takeNonce() {
  const jar = await cookies();
  const raw = jar.get(NONCE_COOKIE)?.value;
  jar.delete(NONCE_COOKIE);
  if (!raw) return null;
  const [nonce, mac] = raw.split(".");
  return nonce && mac === sign(nonce) ? nonce : null;
}

export { loginMessage } from "@/lib/verse/login";
