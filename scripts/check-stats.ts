// Prints how stats and perks spread across the whole collection
import { readFileSync } from "node:fs";
import { computePerks, computeStats, STAT_KEYS, topStat, type Traits } from "../src/lib/stats.ts";

const chogs: { tokenId: number; traits: Traits }[] = JSON.parse(
  readFileSync(new URL("../data/chogs.json", import.meta.url), "utf8")
);

const traitCounts: Record<string, number> = {};
for (const c of chogs) for (const [t, v] of Object.entries(c.traits)) traitCounts[`${t}:${v}`] = (traitCounts[`${t}:${v}`] ?? 0) + 1;

const tops: Record<string, number> = {};
const perkCounts: Record<string, number> = {};
const maxStat: Record<string, number> = {};
let neutral = 0;
for (const c of chogs) {
  const s = computeStats(c.traits);
  const t = topStat(s);
  if (STAT_KEYS.every((k) => s[k] === s.trader)) neutral++;
  tops[t] = (tops[t] ?? 0) + 1;
  for (const k of STAT_KEYS) maxStat[k] = Math.max(maxStat[k] ?? 0, s[k]);
  for (const p of computePerks(c.traits, traitCounts)) perkCounts[p.id] = (perkCounts[p.id] ?? 0) + 1;
}
console.log("top stat:", tops, "fully neutral:", neutral);
console.log("max per stat:", maxStat);
console.log("perks:", perkCounts);
for (const id of [1, 42, 777, 1969]) {
  const c = chogs[id - 1];
  console.log(id, c.traits.Tier, computeStats(c.traits));
}
