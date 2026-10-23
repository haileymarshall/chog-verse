"use client";

import { useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import { useCallback, useSyncExternalStore } from "react";
import type { Role } from "./types";

// Client side of the game API. Every screen reads from these hooks; writes go through `call` and refresh state.

export type Member = { playerId: number; chogId: number; kind: "holder" | "guest" | "bot" };
export type Members = Partial<Record<Role, Member>>;
export type GameToken = { address: string; symbol: string; name: string; image: string | null; price: number; change24h: number; spark: number[] };
export type Split = { trader: number; rugger: number; cash: number };
export type Plan = { trader: string | null; rugger: string | null; split: Split | null; fud: { crewId: number; side: "trader" | "rugger" } | null };
export type Score = { trader: number; rugger: number; fud: number; total: number };

export type Payout = {
  season: number;
  txHash: string;
  pot: number;
  rolledOver: number;
  winners: { place: number; crewId: number; name: string; total: number; wallets: string[]; each: number }[];
  at: number;
};

export type GameState = {
  session: { wallet: string; kind: "holder" | "guest"; playerId: number | null } | null;
  now: number;
  clock: { round: number; season: number; day: number; phase: "picks" | "backing"; nextLock: number; backingAt: number; vaultOpensAt: number };
  pot: number;
  crewCount: number;
  entryFee: number;
  tokens: GameToken[];
  liveTokens: GameToken[];
  me: { id: number; chogId: number; wallet: string; kind: "holder" | "guest" | "bot"; role: Role | null } | null;
  crew: { id: number; name: string; kind: "live" | "bot"; members: Members; days: { round: number; total: number }[]; total: number; rank: number; of: number } | null;
  plan: Plan;
  live: (Plan & { round: number; score: Score | null; moves: Record<string, number> }) | null;
  entryPaid: boolean;
};

export type BoardRow = { id: number; name: string; kind: "live" | "bot"; members: Members; days: number[]; total: number; live: number; full: boolean };
export type Recruit = { id: number; name: string; kind: "live"; members: Members; open: Role[] };
export type RivalPick = { crewId: number; name: string; kind: "live" | "bot"; members: Members; trader: string | null; rugger: string | null };
export type ChatMsg = { id: number; text: string; at: number; chogId: number; playerId: number; kind: "holder" | "guest" | "bot"; role: Role | null };

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function api<T = unknown>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(path, body === undefined ? { cache: "no-store" } : { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, (data as { error?: string }).error ?? "Something went wrong");
  return data as T;
}

const noop = () => () => {};
/** False on the server and during hydration, so the first client render matches the server's loading state */
export const useHydrated = () => useSyncExternalStore(noop, () => true, () => false);

function useGated<T>(q: UseQueryResult<T>) {
  const hydrated = useHydrated();
  return hydrated ? q : ({ ...q, data: undefined, isLoading: true } as UseQueryResult<T>);
}

export function useGame() {
  return useGated(useQuery({ queryKey: ["state"], queryFn: () => api<GameState>("/api/state"), refetchInterval: 20_000 }));
}

export function useBoard() {
  return useGated(useQuery({ queryKey: ["board"], queryFn: () => api<{ season: number; pot: number; rows: BoardRow[] }>("/api/board"), refetchInterval: 30_000 }));
}

export function useRecruiting() {
  return useGated(useQuery({ queryKey: ["crews"], queryFn: () => api<{ crews: Recruit[] }>("/api/crews"), refetchInterval: 15_000 }));
}

export function useRivals(enabled = true) {
  return useGated(useQuery({ queryKey: ["rivals"], queryFn: () => api<{ open: boolean; opensAt: number; picks: RivalPick[] }>("/api/rivals"), refetchInterval: 30_000, enabled }));
}

/** POST, then refresh everything that might have changed */
export function useCall() {
  const qc = useQueryClient();
  return useCallback(
    async <T = unknown>(path: string, body: unknown = {}) => {
      const out = await api<T>(path, body);
      await qc.invalidateQueries();
      return out;
    },
    [qc],
  );
}

/** Look up a token on today's list or the live round's list */
export function tokenOf(state: GameState | undefined, address: string | null | undefined) {
  if (!state || !address) return null;
  return state.tokens.find((t) => t.address === address) ?? state.liveTokens.find((t) => t.address === address) ?? null;
}
