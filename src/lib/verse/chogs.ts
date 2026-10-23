import tiers from "./chog-tiers.json";
import pool from "./demo-chogs.json";

export type DemoChog = { id: number; tier: string; traits: Record<string, string> };

export const CHOG_POOL = pool as DemoChog[];
const byId = new Map(CHOG_POOL.map((c) => [c.id, c]));

export const CHOG_COUNT = 1969;
export const isChogId = (id: number) => Number.isInteger(id) && id >= 1 && id <= CHOG_COUNT;

const TIER: Record<string, string> = { C: "Common", U: "Uncommon", R: "Rare", E: "Epic", L: "Legendary" };
export const chogTier = (id: number) => TIER[(tiers as string)[id - 1]] ?? "Common";

export function chogInfo(id: number): DemoChog {
  return byId.get(id) ?? { id, tier: chogTier(id), traits: {} };
}

export const chogImage = (id: number) => `/chogs/${id}.webp`;

export const TIER_COLOR: Record<string, string> = {
  Common: "#e9dfcc",
  Uncommon: "#3ddc84",
  Rare: "#4cc9f0",
  Epic: "#b9a8ff",
  Legendary: "#ffd23f",
};

/** The demo wallet: three Chogs a judge can play as */
export const DEMO_WALLET = [CHOG_POOL.find((c) => c.tier === "Legendary")?.id ?? 196, 70, 61];
