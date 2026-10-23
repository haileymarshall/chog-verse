import type { Role } from "./types";

export const ROLES: Role[] = ["whale", "trader", "rugger", "fudder"];

export const ROLE_INFO: Record<Role, { name: string; color: string; deep: string; tagline: string; job: string; wins: string }> = {
  whale: {
    name: "Whale",
    color: "#4cc9f0",
    deep: "#1b8fb8",
    tagline: "The boss with the bag",
    job: "Holds the crew's $10,000 and decides how much backs each pick.",
    wins: "Back the right picks and the crew's profit multiplies.",
  },
  trader: {
    name: "Trader",
    color: "#3ddc84",
    deep: "#1f9e5a",
    tagline: "Finds the pump",
    job: "Picks the one token that will rise the most today.",
    wins: "Scores on the token's % gain.",
  },
  rugger: {
    name: "Rugger",
    color: "#ff4d5e",
    deep: "#c92536",
    tagline: "Bets on disaster",
    job: "Picks the token that will crash the hardest today.",
    wins: "Scores on the token's % drop.",
  },
  fudder: {
    name: "FUDder",
    color: "#ff9f1c",
    deep: "#d17600",
    tagline: "Spreads chaos",
    job: "Bets $1,000 against one rival crew's pick.",
    wins: "Scores when a rival Trader pick dumps or a rival Rugger pick pumps.",
  },
};

export const WHALE_BANK = 10_000;
export const FUD_STAKE = 1_000;
export const ENTRY_FEE = 100;
export const PAYOUT = [0.5, 0.3, 0.15] as const;
export const ROLLOVER = 0.05;
