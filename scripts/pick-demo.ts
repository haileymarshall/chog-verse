// Picks a varied demo roster: every tier, every top stat, a few perks
import { readFileSync } from "node:fs";
import { computeStats, topStat, type Traits } from "../src/lib/stats.ts";
const chogs: { tokenId: number; traits: Traits }[] = JSON.parse(readFileSync(new URL("../data/chogs.json", import.meta.url), "utf8"));
const picked = new Map<number, string>();
const want = (label: string, f: (c: (typeof chogs)[number]) => boolean) => {
  const c = chogs.find((c) => f(c) && !picked.has(c.tokenId));
  if (c) picked.set(c.tokenId, label);
};
for (const tier of ["Legendary", "Epic", "Rare"]) want(tier, (c) => c.traits.Tier === tier);
for (const s of ["trader", "farmer", "banker", "explorer"] as const)
  for (const tier of ["Common", "Uncommon"]) want(`${tier} ${s}`, (c) => c.traits.Tier === tier && topStat(computeStats(c.traits)) === s);
want("Skull", (c) => c.traits.Form === "Skull");
want("Radioactive", (c) => c.traits.Base === "Radioactive");
console.log(JSON.stringify([...picked.keys()]));
for (const [id, l] of picked) console.log(id, l);
