import "server-only";
import { and, eq } from "drizzle-orm";
import { db, schema } from "./db";
import { getSession, type Session } from "./session";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export const fail = (status: number, message: string): never => {
  throw new HttpError(status, message);
};

/** Wraps a route handler: JSON in, JSON out, HttpErrors become clean responses */
export function route<A extends unknown[]>(fn: (...args: A) => Promise<unknown>) {
  return async (...args: A) => {
    try {
      const out = await fn(...args);
      return out instanceof Response ? out : Response.json(out ?? { ok: true });
    } catch (e) {
      if (e instanceof HttpError) return Response.json({ error: e.message }, { status: e.status });
      console.error(e);
      return Response.json({ error: "Something broke. Try again." }, { status: 500 });
    }
  };
}

export async function body<T>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    return fail(400, "Bad request");
  }
}

export async function requireSession(): Promise<Session> {
  return (await getSession()) ?? fail(401, "Sign in first");
}

/** The signed-in player (one Chog) and their crew seat for a season, if any */
export async function requirePlayer() {
  const s = await requireSession();
  if (!s.playerId) fail(401, "Choose your Chog first");
  const d = await db();
  const [p] = await d.select().from(schema.players).where(eq(schema.players.id, s.playerId!));
  if (!p || p.wallet !== s.wallet) fail(401, "Choose your Chog again");
  return { session: s, player: p };
}

export async function seatOf(playerId: number, season: number) {
  const d = await db();
  const [m] = await d
    .select()
    .from(schema.crewMembers)
    .where(and(eq(schema.crewMembers.playerId, playerId), eq(schema.crewMembers.season, season)));
  return m ?? null;
}
