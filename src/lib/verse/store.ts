"use client";

import { useSyncExternalStore } from "react";
import { crewBy, CREWS } from "./crews";
import { ENTRY_FEE } from "./roles";
import type { ChatMessage, Crew, CrewPlan, FudTarget, Role, Split } from "./types";

// Demo game state, kept in the browser until the real backend lands
export type VerseState = {
  myChog: number | null;
  myRole: Role | null;
  crew: { id: number; name: string; members: Record<Role, number>; days: number[]; team: CrewPlan } | null;
  entryPaid: boolean;
  mine: CrewPlan;
  chat: ChatMessage[];
};

export const MY_CREW_ID = 0;
const KEY = "verse:v1";
const EMPTY_PLAN: CrewPlan = { trader: null, rugger: null, split: null, fud: null };
const INITIAL: VerseState = { myChog: null, myRole: null, crew: null, entryPaid: false, mine: EMPTY_PLAN, chat: [] };

let state: VerseState = INITIAL;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) state = { ...INITIAL, ...JSON.parse(raw) };
  } catch {}
}

function set(patch: Partial<VerseState> | ((s: VerseState) => Partial<VerseState>)) {
  load();
  state = { ...state, ...(typeof patch === "function" ? patch(state) : patch) };
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {}
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useVerse() {
  return useSyncExternalStore(
    subscribe,
    () => {
      load();
      return state;
    },
    () => INITIAL,
  );
}

export function getVerse() {
  load();
  return state;
}

export const actions = {
  chooseChog: (id: number) => set({ myChog: id }),
  payEntry: () => set({ entryPaid: true }),
  joinCrew: (crewId: number, role: Role) =>
    set((s) => {
      const c = crewBy(crewId);
      if (!c || s.myChog == null) return {};
      return {
        myRole: role,
        mine: EMPTY_PLAN,
        crew: { id: c.id, name: c.name, members: { ...c.members, [role]: s.myChog }, days: c.days, team: c.plan },
      };
    }),
  startCrew: (name: string, role: Role, recruits: Record<Role, number>) =>
    set((s) => {
      if (s.myChog == null) return {};
      const team: CrewPlan = { trader: "WAGMI", rugger: "COPE", split: { trader: 5000, rugger: 3000, cash: 2000 }, fud: { crewId: 1, side: "trader" } };
      return {
        myRole: role,
        mine: EMPTY_PLAN,
        crew: { id: MY_CREW_ID, name, members: { ...recruits, [role]: s.myChog }, days: [1840, 2960, 980], team },
      };
    }),
  switchRole: (role: Role) =>
    set((s) => {
      if (!s.crew || !s.myRole || s.myChog == null || role === s.myRole) return {};
      const members = { ...s.crew.members, [s.myRole]: s.crew.members[role], [role]: s.myChog };
      return { myRole: role, crew: { ...s.crew, members } };
    }),
  pick: (role: "trader" | "rugger", symbol: string | null) => set((s) => ({ mine: { ...s.mine, [role]: symbol } })),
  setSplit: (split: Split | null) => set((s) => ({ mine: { ...s.mine, split } })),
  setFud: (fud: FudTarget | null) => set((s) => ({ mine: { ...s.mine, fud } })),
  say: (msg: ChatMessage) => set((s) => ({ chat: [...s.chat.slice(-40), msg] })),
  reset: () => set({ ...INITIAL }),
};

/** The plan the crew will lock: teammates' moves plus yours */
export function crewPlan(s: VerseState): CrewPlan | null {
  if (!s.crew || !s.myRole) return null;
  const plan = { ...s.crew.team };
  if (s.myRole === "trader") plan.trader = s.mine.trader;
  if (s.myRole === "rugger") plan.rugger = s.mine.rugger;
  if (s.myRole === "whale") plan.split = s.mine.split;
  if (s.myRole === "fudder") plan.fud = s.mine.fud;
  return plan;
}

/** Leaderboard rows, with your crew placed among the rivals */
export function standings(s: VerseState): (Crew & { mine?: boolean; total: number })[] {
  const rows: (Crew & { mine?: boolean; total: number })[] = CREWS.filter((c) => c.id !== s.crew?.id).map((c) => ({
    ...c,
    total: c.days.reduce((a, b) => a + b, 0),
  }));
  if (s.crew && s.myRole) {
    const plan = crewPlan(s) ?? s.crew.team;
    rows.push({ id: s.crew.id, name: s.crew.name, members: s.crew.members, days: s.crew.days, plan, mine: true, total: s.crew.days.reduce((a, b) => a + b, 0) });
  }
  return rows.sort((a, b) => b.total - a.total);
}

/** $CHOG locked in the vault this season */
export function potSize(s: VerseState) {
  return CREWS.length * 4 * ENTRY_FEE + (s.crew?.id === MY_CREW_ID ? 4 * ENTRY_FEE : 0);
}
