import "server-only";
import snapshot from "../../data/chogs.json";
import { computePerks, computeStats, elementOf, topStat, type Element, type Perk, type StatKey, type Stats, type Traits } from "./stats";

export type GardenChog = {
  tokenId: number;
  name: string;
  image: string;
  tier: string;
  traits: Traits;
  stats: Stats;
  perks: Perk[];
  element: Element | null;
  job: StatKey;
};

const chogs = snapshot as { tokenId: number; name: string; image: string; traits: Traits }[];

const traitCounts: Record<string, number> = {};
for (const c of chogs) {
  for (const [t, v] of Object.entries(c.traits)) traitCounts[`${t}:${v}`] = (traitCounts[`${t}:${v}`] ?? 0) + 1;
}

export function getChog(tokenId: number): GardenChog | null {
  const c = chogs[tokenId - 1];
  if (!c) return null;
  const stats = computeStats(c.traits);
  return {
    tokenId: c.tokenId,
    name: `Chog #${c.tokenId}`,
    image: `/chogs/${c.tokenId}.webp`,
    tier: c.traits.Tier ?? "Common",
    traits: c.traits,
    stats,
    perks: computePerks(c.traits, traitCounts),
    element: elementOf(c.traits),
    job: topStat(stats),
  };
}

// Varied demo crew: every tier, every job, plus Skull and Radioactive perks
export const DEMO_CREW = [561, 70, 61, 6, 5, 3, 4, 111, 196];

export function getDemoCrew(): GardenChog[] {
  return DEMO_CREW.map(getChog).filter((c): c is GardenChog => c !== null);
}
