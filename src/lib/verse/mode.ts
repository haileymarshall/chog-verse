// Which version of Chog Verse this deploy is. Each mode is its own deploy with its own database.
// demo: guest passes, any Chog, bots fill the other 3 seats, free entry, fast days. For trying the game solo.
// live: the real game on Monad testnet. Wallet login, no bots, crews need 4 people, entry paid in test $CHOG.
export type Mode = "demo" | "live";
export const MODE: Mode = process.env.NEXT_PUBLIC_MODE === "demo" ? "demo" : "live";
export const DEMO = MODE === "demo";

/** Bot crews and bot seat-fillers only ever exist in demo mode */
export const BOTS = DEMO;

/** Off for now: any of the 1,969 Chogs can be picked. Turn on to require holding the Chog on Monad mainnet. */
export const CHECK_OWNERSHIP = process.env.NEXT_PUBLIC_CHECK_OWNERSHIP === "1";

/** Where the other mode lives, for the switch in the top bar */
export const OTHER_MODE_URL = (DEMO ? process.env.NEXT_PUBLIC_LIVE_URL : process.env.NEXT_PUBLIC_DEMO_URL) ?? "";
