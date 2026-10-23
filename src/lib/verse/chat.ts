import { CHOG_POOL } from "./chogs";
import type { ChatMessage, Role } from "./types";

const lines: [Role | undefined, string][] = [
  ["fudder", "anyone need a FUDder? i will ruin your rivals' week. professionally."],
  ["trader", "Trader LF crew. 3 green days last season, ask about my GIGA call"],
  [undefined, "how do we even crack the Bank lol"],
  ["whale", "Whale here, i only back picks with conviction. no vibes-only traders"],
  ["rugger", "i can smell a rug from 3 blocks away. need a crew"],
  [undefined, "top 3 crews last week pulled out 95k. let's go"],
  ["trader", "WAGMI looking spicy for today's list ngl"],
  ["fudder", "Midnight Raccoons picked BLOB again. free money for FUDders"],
  ["whale", "Velvet Syndicate recruiting a Rugger. must be evil"],
  [undefined, "vault is at 98k $CHOG already 👀"],
  ["rugger", "COPE is going to zero and i will be rich (on paper)"],
  [undefined, "gm crews. picks lock at 15:00 UTC, don't sleep"],
  ["trader", "who's long MON today"],
  ["fudder", "i FUDded the #1 crew yesterday and won. ask me anything"],
];

export const CHAT_SEED: ChatMessage[] = lines.slice(0, 8).map(([role, text], i) => ({
  id: `seed-${i}`,
  chogId: CHOG_POOL[(i * 13 + 5) % CHOG_POOL.length].id,
  role,
  text,
  at: i,
}));

export const CHAT_BOT = lines.slice(8);
