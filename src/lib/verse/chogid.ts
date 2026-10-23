import type { Role } from "./types";

export type ChogCard = {
  id: number;
  tier: string;
  /** Rarity rank among all 1,969 Chogs (1 = rarest), from how few Chogs share each trait */
  rank: number;
  traits: { type: string; value: string; count: number }[];
  crew: { name: string; role: Role; season: number; profit: number } | null;
  seasons: number;
  messages: number;
};

export const cardImage = (id: number) => `/api/card/${id}`;
export const cardPage = (id: number) => `/id/${id}`;
