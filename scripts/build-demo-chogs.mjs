// Picks a varied pool of demo Chogs (images already mirrored) into a small client-safe JSON file.
// Run: node scripts/build-demo-chogs.mjs
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const chogs = JSON.parse(readFileSync(new URL("../data/chogs.json", import.meta.url)));
const have = chogs.filter((c) => existsSync(new URL(`../public/chogs/${c.tokenId}.webp`, import.meta.url)));

const rare = have.filter((c) => !["Common", "Uncommon"].includes(c.traits.Tier));
const rest = have.filter((c) => !rare.includes(c));
const step = Math.max(1, Math.floor(rest.length / (120 - rare.length)));
const pool = [...rare, ...rest.filter((_, i) => i % step === 0)].slice(0, 120).sort((a, b) => a.tokenId - b.tokenId);

const out = pool.map((c) => ({ id: c.tokenId, tier: c.traits.Tier ?? "Common", traits: c.traits }));
writeFileSync(new URL("../src/lib/verse/demo-chogs.json", import.meta.url), JSON.stringify(out));
console.log(`wrote ${out.length} demo Chogs`);
