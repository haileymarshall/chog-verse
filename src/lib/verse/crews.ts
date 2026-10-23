import { CHOG_POOL } from "./chogs";
import { rng } from "./format";
import { ROLES } from "./roles";
import { TOKENS } from "./tokens";
import type { Crew, Role } from "./types";

const ADJ = ["Purple", "Midnight", "Feral", "Sneaky", "Golden", "Rabid", "Chaotic", "Sleepy", "Velvet", "Cursed", "Lucky", "Toxic", "Moon", "Neon", "Silent", "Greasy", "Wild", "Salty", "Cosmic", "Broke"];
const NOUN = ["Bandits", "Goblins", "Raccoons", "Syndicate", "Cartel", "Gang", "Rascals", "Mob", "Outlaws", "Pirates", "Gremlins", "Hustlers", "Degens", "Jesters", "Bears", "Snipers", "Wolves", "Phantoms", "Chogs", "Cowboys"];

export const CREW_COUNT = 250;
export const DAYS_DONE = 3;

function makeCrews(): Crew[] {
  const r = rng(42);
  const names = new Set<string>();
  const ids = CHOG_POOL.map((c) => c.id);
  const crews: Crew[] = [];
  for (let i = 0; i < CREW_COUNT; i++) {
    let name = "";
    do name = `${ADJ[Math.floor(r() * ADJ.length)]} ${NOUN[Math.floor(r() * NOUN.length)]}`;
    while (names.has(name) && names.size < ADJ.length * NOUN.length);
    names.add(name);
    const members = {} as Record<Role, number>;
    ROLES.forEach((role, k) => {
      members[role] = i < 28 ? ids[(i * 4 + k) % ids.length] : ids[Math.floor(r() * ids.length)];
    });
    const skill = r();
    const days = Array.from({ length: DAYS_DONE }, () => Math.round((r() - 0.5 + skill * 0.22) * 4400));
    const pick = () => TOKENS[Math.floor(r() * TOKENS.length)].symbol;
    const t = Math.round(r() * 8) * 1000;
    const rug = Math.round(r() * ((10_000 - t) / 1000)) * 1000;
    crews.push({
      id: i + 1,
      name,
      members,
      days,
      plan: {
        trader: pick(),
        rugger: pick(),
        split: { trader: t, rugger: rug, cash: 10_000 - t - rug },
        fud: { crewId: 1 + Math.floor(r() * CREW_COUNT), side: r() > 0.5 ? "trader" : "rugger" },
      },
    });
  }
  return crews;
}

export const CREWS = makeCrews();
export const crewBy = (id: number) => CREWS.find((c) => c.id === id) ?? null;
export const crewTotal = (c: Crew) => c.days.reduce((a, b) => a + b, 0);

/** Open crews in the Hideout, each missing one or two roles */
export const RECRUITING = CREWS.slice(40, 52).map((c, i) => {
  const open: Role[] = [ROLES[i % 4]];
  if (i % 3 === 0) open.push(ROLES[(i + 2) % 4]);
  return { crew: c, open };
});
