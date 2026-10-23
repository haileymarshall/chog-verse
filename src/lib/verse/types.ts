export type Role = "whale" | "trader" | "rugger" | "fudder";

export type Token = {
  symbol: string;
  name: string;
  color: string;
  price: number;
  change24h: number;
  /** 24 hourly closes, oldest first */
  spark: number[];
  fresh?: boolean;
};

export type Split = { trader: number; rugger: number; cash: number };

export type FudTarget = { crewId: number; side: "trader" | "rugger" };

export type CrewPlan = {
  trader: string | null;
  rugger: string | null;
  split: Split | null;
  fud: FudTarget | null;
};

export type Crew = {
  id: number;
  name: string;
  /** Chog token IDs by role */
  members: Record<Role, number>;
  /** paper $ profit per finished day */
  days: number[];
  plan: CrewPlan;
};

export type ChatMessage = {
  id: string;
  chogId: number;
  role?: Role;
  text: string;
  at: number;
  me?: boolean;
  system?: boolean;
};
