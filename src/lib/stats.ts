// Turns a Chog's on-chain traits into its Garden stats and perks.
// Rules (approved 2026-10-14):
// - Tier sets the total stat budget (Common 40 → Legendary 50). Every stat starts at 5.
// - Themed traits steer the remaining points toward Trader / Farmer / Banker / Explorer.
// - Rare traits grant perks, not raw power.

export type Traits = Record<string, string>;
export type StatKey = "trader" | "farmer" | "banker" | "explorer";
export type Stats = Record<StatKey, number>;
export type Element = "fire" | "water" | "wind" | "bloom" | "storm";

export type Perk = {
  id: string;
  name: string;
  description: string;
};

export const STAT_KEYS: StatKey[] = ["trader", "farmer", "banker", "explorer"];

export const TIER_BUDGET: Record<string, number> = {
  Common: 40,
  Uncommon: 42,
  Rare: 45,
  Epic: 48,
  Legendary: 50,
};

const STAT_FLOOR = 5;

// trait type -> stat -> keywords (matched case-insensitively as substrings)
const AFFINITY: Record<string, Partial<Record<StatKey, string[]>>> = {
  Eyes: {
    trader: ["green laser", "purple laser", "btc glass", "visor", "mog", "viper", "tired"],
    farmer: ["happy", "heart", "round eye"],
    banker: ["retro glass", "3d glass", "anime glass", "smirk"],
    explorer: ["frog", "side eye", "dead", "fire laser", "cyan laser", "vr"],
  },
  Mouth: {
    trader: ["btc coin", "mon coin", "grit", "worried"],
    banker: ["gold tooth"],
  },
  Head: {
    trader: ["btc", "dollar", "jeet", "wagmi", "10k tps", "mega chog", "buttcoin", "eth cap"],
    farmer: ["bucket", "cloud", "peace", "star cap"],
    banker: ["crown", "wreath", "wizard hat", "holy seal", "diamond", "mafia hat"],
    explorer: [
      "spartan", "russian", "robber", "plumber", "headband", "horn", "thorn",
      "bandana", "durag", "3rd eye", "shroom",
    ],
  },
  Body: {
    trader: ["jersey", "six seven", "hoodie", "trackset", "black shirt", "fire shirt"],
    farmer: ["farmer", "hawaiian", "banana", "duck float", "yukata", "tank", "sleeveless", "toad"],
    banker: ["kings robe", "ceo vest", "golden armor", "tuxedo", "gangster", "mafia", "white pure"],
    explorer: [
      "astro", "sci fi", "dragon", "shark", "wizard", "squid game", "inmate", "prisoner",
      "homeless", "army", "mummy", "gojo", "guko", "jacket",
    ],
  },
  Accessory: {
    trader: ["candle", "coin"],
    farmer: ["fwog", "pepe", "heart"],
    banker: ["cigar", "sb"],
    explorer: ["knife"],
  },
  Background: {
    farmer: ["green", "mint", "lemon", "sunlight", "lime"],
    banker: ["gold", "royal", "noble", "supreme"],
  },
};

const TRAIT_WEIGHT: Record<string, number> = {
  Accessory: 4,
  Body: 3,
  Head: 3,
  Eyes: 3,
  Mouth: 3,
  Background: 1,
};

const ELEMENT_KEYWORDS: [Element, string[]][] = [
  ["storm", ["electric", "white"]],
  ["fire", ["burning", "fiery", "fire"]],
  ["water", ["aqua", "cool", "royal blue"]],
  ["wind", ["wind", "smoke", "clean"]],
  ["bloom", ["rose", "mint", "purple", "violet", "yellow", "green", "pink", "royal"]],
];

function matches(value: string, keywords: string[] | undefined) {
  if (!keywords) return false;
  const v = value.toLowerCase();
  return keywords.some((k) => v.includes(k));
}

export function computeStats(traits: Traits): Stats {
  const budget = TIER_BUDGET[traits.Tier] ?? TIER_BUDGET.Common;
  const weights: Stats = { trader: 1, farmer: 1, banker: 1, explorer: 1 };

  for (const [type, value] of Object.entries(traits)) {
    const affinity = AFFINITY[type];
    if (!affinity) continue;
    for (const stat of STAT_KEYS) {
      if (matches(value, affinity[stat])) weights[stat] += TRAIT_WEIGHT[type] ?? 1;
    }
  }

  // Split the free points by weight, largest remainder gets the rounding
  const free = budget - STAT_FLOOR * STAT_KEYS.length;
  const totalWeight = STAT_KEYS.reduce((s, k) => s + weights[k], 0);
  const raw = STAT_KEYS.map((k) => ({ k, v: (free * weights[k]) / totalWeight }));
  const stats = Object.fromEntries(
    raw.map(({ k, v }) => [k, STAT_FLOOR + Math.floor(v)])
  ) as Stats;
  let left = free - raw.reduce((s, { v }) => s + Math.floor(v), 0);
  for (const { k } of [...raw].sort((a, b) => (b.v % 1) - (a.v % 1))) {
    if (left-- <= 0) break;
    stats[k] += 1;
  }
  return stats;
}

export function elementOf(traits: Traits): Element | null {
  const aura = traits.Aura;
  if (!aura) return null;
  for (const [element, keywords] of ELEMENT_KEYWORDS) {
    if (matches(aura, keywords)) return element;
  }
  return null;
}

// traitCounts: "Type:Value" -> how many Chogs share it (for the ≤5 legend perk)
export function computePerks(traits: Traits, traitCounts: Record<string, number>): Perk[] {
  const perks: Perk[] = [];

  perks.push(
    traits.Side === "Left"
      ? { id: "contrarian", name: "Contrarian", description: "+10% on short calls in the Trenches." }
      : { id: "bull", name: "Born Bullish", description: "+10% on long calls in the Trenches." }
  );

  if (traits.Base === "Skull" || traits.Form === "Skull") {
    perks.push({ id: "undead", name: "Undead", description: "Bank seeds survive one storm or rug." });
  }
  if (traits.Base === "Radioactive") {
    perks.push({ id: "glow", name: "Radioactive Glow", description: "Extra loot roll on every expedition." });
  }
  if (traits.Base === "1:1") {
    perks.push({ id: "landmark", name: "Living Landmark", description: "Appears as a named landmark on the Garden map." });
  }
  if (traits.Naked === "Yes") {
    perks.push({ id: "nothing-to-lose", name: "Nothing To Lose", description: "Defaulting on a loan hurts credit half as much." });
  }

  const element = elementOf(traits);
  if (element) {
    perks.push({ id: `element-${element}`, name: `${element[0].toUpperCase()}${element.slice(1)} Aura`, description: "Reacts to garden weather in its own way." });
  }

  const legendTraits = Object.entries(traits).filter(
    ([type, value]) => !["Tier", "Side", "Naked", "Form", "Base"].includes(type) && (traitCounts[`${type}:${value}`] ?? 99) <= 5
  );
  if (legendTraits.length) {
    perks.push({
      id: "legend",
      name: "Legend Of The Wilds",
      description: `Unlocks secret expedition stories (${legendTraits.map(([, v]) => v).join(", ")}).`,
    });
  }

  return perks;
}

// Ties go to the job the Chog is least likely to get otherwise, so neutral Chogs spread out
const TIE_ORDER: StatKey[] = ["banker", "explorer", "farmer", "trader"];

export function topStat(stats: Stats): StatKey {
  return TIE_ORDER.reduce((best, k) => (stats[k] > stats[best] ? k : best), TIE_ORDER[0]);
}
