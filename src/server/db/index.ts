import "server-only";
import * as schema from "./schema";
import { INIT_SQL } from "./init-sql";

// Postgres everywhere: Neon (or any Postgres) when DATABASE_URL is set, an embedded PGlite file otherwise.
type DB = ReturnType<typeof import("drizzle-orm/pglite").drizzle<typeof schema>>;

const g = globalThis as unknown as { __verseDb?: Promise<DB> };

async function connect(): Promise<DB> {
  const url = process.env.DATABASE_URL;
  if (url) {
    const { default: postgres } = await import("postgres");
    const { drizzle } = await import("drizzle-orm/postgres-js");
    const client = postgres(url, { max: 5, prepare: false });
    await client.unsafe(INIT_SQL);
    return drizzle(client, { schema }) as unknown as DB;
  }
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const { mkdirSync } = await import("node:fs");
  const dir = process.env.PGLITE_DIR ?? ".data/pglite";
  mkdirSync(dir, { recursive: true });
  const client = new PGlite(dir);
  await client.exec(INIT_SQL);
  return drizzle(client, { schema });
}

export function db(): Promise<DB> {
  g.__verseDb ??= connect().catch((e) => {
    g.__verseDb = undefined;
    throw e;
  });
  return g.__verseDb;
}

export { schema };
