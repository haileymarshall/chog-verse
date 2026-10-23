import { bigserial, doublePrecision, index, integer, jsonb, pgTable, primaryKey, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

// A player is one Chog played by one wallet. Holders own the Chog on Monad mainnet,
// guests play a loaned demo Chog, bots fill empty seats.
export const players = pgTable(
  "players",
  {
    id: serial("id").primaryKey(),
    chogId: integer("chog_id").notNull(),
    wallet: text("wallet").notNull(),
    kind: text("kind").$type<"holder" | "guest" | "bot">().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("players_wallet_chog").on(t.wallet, t.chogId)],
);

export const crews = pgTable(
  "crews",
  {
    id: serial("id").primaryKey(),
    season: integer("season").notNull(),
    name: text("name").notNull(),
    kind: text("kind").$type<"live" | "bot">().notNull(),
    createdBy: integer("created_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("crews_season_name").on(t.season, t.name)],
);

export const crewMembers = pgTable(
  "crew_members",
  {
    crewId: integer("crew_id").notNull(),
    season: integer("season").notNull(),
    role: text("role").$type<"whale" | "trader" | "rugger" | "fudder">().notNull(),
    playerId: integer("player_id").notNull(),
    joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.crewId, t.role] }), uniqueIndex("members_season_player").on(t.season, t.playerId)],
);

/** Round n locks at SEASON_ONE_LOCK + (n-1) days and is scored 24h later */
export const rounds = pgTable("rounds", {
  id: integer("id").primaryKey(),
  season: integer("season").notNull(),
  day: integer("day").notNull(),
  lockedAt: timestamp("locked_at", { withTimezone: true }),
  scoredAt: timestamp("scored_at", { withTimezone: true }),
  builtAt: timestamp("built_at", { withTimezone: true }).defaultNow().notNull(),
});

export const roundTokens = pgTable(
  "round_tokens",
  {
    roundId: integer("round_id").notNull(),
    address: text("address").notNull(),
    symbol: text("symbol").notNull(),
    name: text("name").notNull(),
    image: text("image"),
    rank: integer("rank").notNull(),
    priceOpen: doublePrecision("price_open").notNull(),
    priceLock: doublePrecision("price_lock"),
    priceClose: doublePrecision("price_close"),
    spark: jsonb("spark").$type<number[]>().notNull(),
  },
  (t) => [primaryKey({ columns: [t.roundId, t.address] })],
);

export const plans = pgTable(
  "plans",
  {
    crewId: integer("crew_id").notNull(),
    roundId: integer("round_id").notNull(),
    trader: text("trader"),
    rugger: text("rugger"),
    splitTrader: integer("split_trader"),
    splitRugger: integer("split_rugger"),
    fudCrew: integer("fud_crew"),
    fudSide: text("fud_side").$type<"trader" | "rugger">(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.crewId, t.roundId] })],
);

export const scores = pgTable(
  "scores",
  {
    crewId: integer("crew_id").notNull(),
    roundId: integer("round_id").notNull(),
    season: integer("season").notNull(),
    trader: doublePrecision("trader").notNull(),
    rugger: doublePrecision("rugger").notNull(),
    fud: doublePrecision("fud").notNull(),
    total: doublePrecision("total").notNull(),
  },
  (t) => [primaryKey({ columns: [t.crewId, t.roundId] }), index("scores_season").on(t.season)],
);

export const chat = pgTable(
  "chat",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    channel: text("channel").notNull(),
    playerId: integer("player_id").notNull(),
    text: text("text").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("chat_channel_id").on(t.channel, t.id)],
);

/** One row per Chog that paid the $CHOG entry for a season */
export const entries = pgTable(
  "entries",
  {
    season: integer("season").notNull(),
    playerId: integer("player_id").notNull(),
    amount: integer("amount").notNull(),
    txHash: text("tx_hash"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.season, t.playerId] })],
);

/** Small key/value store for locks and caches that must survive restarts */
export const meta = pgTable("meta", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
