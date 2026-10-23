// Season clock, shared by server and client.
// Round n locks at SEASON_ONE_LOCK + (n-1) days (15:00 UTC) and is scored 24h later on real prices.
// Picks for a round are open from the previous lock until 14:00; the Whale and FUDder get the last hour.
// NEXT_PUBLIC_ROUND_MS shortens a "day" for testing and fast demo seasons; picks go public 1/24 of a round before lock.
export const DAY_MS = Number(process.env.NEXT_PUBLIC_ROUND_MS) || 86_400_000;
export const HOUR_MS = DAY_MS / 24;
export const DAYS_PER_SEASON = 7;

export const SEASON_ONE_LOCK = Date.parse(process.env.NEXT_PUBLIC_SEASON_ONE_LOCK ?? "2026-10-16T15:00:00Z");

export type Phase = "picks" | "backing";

export const lockAt = (round: number) => SEASON_ONE_LOCK + (round - 1) * DAY_MS;
export const scoreAt = (round: number) => lockAt(round) + DAY_MS;
export const backingAt = (round: number) => lockAt(round) - HOUR_MS;
export const seasonOf = (round: number) => Math.ceil(round / DAYS_PER_SEASON);
export const dayOf = (round: number) => ((round - 1) % DAYS_PER_SEASON) + 1;
export const firstRound = (season: number) => (season - 1) * DAYS_PER_SEASON + 1;
export const lastRound = (season: number) => season * DAYS_PER_SEASON;
/** The vault opens once the season's last round is scored */
export const vaultOpensAt = (season: number) => scoreAt(lastRound(season));

/** The round currently taking picks */
export function currentRound(now: number) {
  return Math.max(1, Math.floor((now - SEASON_ONE_LOCK) / DAY_MS) + 2);
}

export function seasonClock(now: number) {
  const round = currentRound(now);
  const season = seasonOf(round);
  const nextLock = lockAt(round);
  const back = backingAt(round);
  const phase: Phase = now >= back ? "backing" : "picks";
  return { round, season, day: dayOf(round), phase, nextLock, backingAt: back, vaultOpensAt: vaultOpensAt(season) };
}
