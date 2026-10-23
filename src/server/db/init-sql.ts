// Idempotent schema, run on first connection. Keep in sync with schema.ts.
export const INIT_SQL = /* sql */ `
CREATE TABLE IF NOT EXISTS players (
  id serial PRIMARY KEY,
  chog_id integer NOT NULL,
  wallet text NOT NULL,
  kind text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS players_wallet_chog ON players (wallet, chog_id);
CREATE UNIQUE INDEX IF NOT EXISTS players_holder_chog ON players (chog_id) WHERE kind = 'holder';

CREATE TABLE IF NOT EXISTS crews (
  id serial PRIMARY KEY,
  season integer NOT NULL,
  name text NOT NULL,
  kind text NOT NULL,
  created_by integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS crews_season_name ON crews (season, name);

CREATE TABLE IF NOT EXISTS crew_members (
  crew_id integer NOT NULL,
  season integer NOT NULL,
  role text NOT NULL,
  player_id integer NOT NULL,
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (crew_id, role)
);
CREATE UNIQUE INDEX IF NOT EXISTS members_season_player ON crew_members (season, player_id);

CREATE TABLE IF NOT EXISTS rounds (
  id integer PRIMARY KEY,
  season integer NOT NULL,
  day integer NOT NULL,
  locked_at timestamptz,
  scored_at timestamptz,
  built_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS round_tokens (
  round_id integer NOT NULL,
  address text NOT NULL,
  symbol text NOT NULL,
  name text NOT NULL,
  image text,
  rank integer NOT NULL,
  price_open double precision NOT NULL,
  price_lock double precision,
  price_close double precision,
  spark jsonb NOT NULL,
  PRIMARY KEY (round_id, address)
);

CREATE TABLE IF NOT EXISTS plans (
  crew_id integer NOT NULL,
  round_id integer NOT NULL,
  trader text,
  rugger text,
  split_trader integer,
  split_rugger integer,
  fud_crew integer,
  fud_side text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (crew_id, round_id)
);

CREATE TABLE IF NOT EXISTS scores (
  crew_id integer NOT NULL,
  round_id integer NOT NULL,
  season integer NOT NULL,
  trader double precision NOT NULL,
  rugger double precision NOT NULL,
  fud double precision NOT NULL,
  total double precision NOT NULL,
  PRIMARY KEY (crew_id, round_id)
);
CREATE INDEX IF NOT EXISTS scores_season ON scores (season);

CREATE TABLE IF NOT EXISTS chat (
  id bigserial PRIMARY KEY,
  channel text NOT NULL,
  player_id integer NOT NULL,
  text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS chat_channel_id ON chat (channel, id);

CREATE TABLE IF NOT EXISTS entries (
  season integer NOT NULL,
  player_id integer NOT NULL,
  amount integer NOT NULL,
  tx_hash text,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (season, player_id)
);

CREATE TABLE IF NOT EXISTS meta (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
`;
