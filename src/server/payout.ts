import "server-only";
import { eq, like } from "drizzle-orm";
import { createPublicClient, createWalletClient, formatEther, http, parseEventLogs, zeroAddress } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { monadTestnet } from "viem/chains";
import { BANK_ADDRESS, bankAbi, bankLive } from "@/lib/verse/bank";
import { DEMO } from "@/lib/verse/mode";
import { ROLES } from "@/lib/verse/roles";
import { lastRound, seasonOf } from "@/lib/verse/season";
import { db, schema } from "./db";
import { seasonTotals } from "./game";
import { crewsWithMembers } from "./views";

const { rounds, meta } = schema;
const testnet = createPublicClient({ chain: monadTestnet, transport: http(process.env.MONAD_TESTNET_RPC) });

export type Payout = {
  season: number;
  txHash: string;
  pot: number;
  rolledOver: number;
  winners: { place: number; crewId: number; name: string; total: number; wallets: string[]; each: number }[];
  at: number;
};

const PLACE_BPS = [5000, 3000, 1500];
const key = (season: number) => `payout:${season}`;

/** Crews ranked by season profit, tie-broken by their best single day */
export async function standings(season: number) {
  const totals = await seasonTotals(season);
  return [...totals]
    .map(([crewId, days]) => {
      const v = [...days.values()];
      return { crewId, total: v.reduce((a, b) => a + b, 0), best: v.length ? Math.max(...v) : 0 };
    })
    .sort((a, b) => b.total - a.total || b.best - a.best);
}

/** The top 3 crews where all 4 Chogs paid into the Bank, with the wallets that paid (read on-chain) */
export async function winnersFor(season: number) {
  const ranked = await standings(season);
  const crews = await crewsWithMembers(ranked.map((r) => r.crewId));
  const out: Payout["winners"] = [];
  for (const r of ranked) {
    if (out.length === 3) break;
    const c = crews.get(r.crewId);
    if (!c || c.kind !== "live") continue;
    const chogs = ROLES.map((role) => c.members[role]).filter((m) => m && m.kind !== "bot").map((m) => m!.chogId);
    if (chogs.length !== ROLES.length) continue;
    const payers = await Promise.all(chogs.map((id) => testnet.readContract({ address: BANK_ADDRESS as `0x${string}`, abi: bankAbi, functionName: "entrant", args: [BigInt(season), BigInt(id)] })));
    if (payers.some((a) => a === zeroAddress)) continue;
    out.push({ place: out.length + 1, crewId: c.id, name: c.name, total: r.total, wallets: payers, each: 0 });
  }
  return out;
}

/** Pays every season whose vault has opened and isn't paid yet. Safe to call on every tick. */
export async function settleDue(currentRound: number) {
  const pk = process.env.SETTLER_KEY;
  if (DEMO || !bankLive() || !pk) return;
  const d = await db();
  const done = new Set((await d.select({ key: meta.key }).from(meta).where(like(meta.key, "payout:%"))).map((r) => r.key));
  for (let season = 1; season < seasonOf(currentRound); season++) {
    if (done.has(key(season))) continue;
    const [last] = await d.select().from(rounds).where(eq(rounds.id, lastRound(season)));
    if (last && !last.scoredAt) continue; // the last day isn't scored yet
    await settleSeason(season, pk as `0x${string}`);
  }
}

async function settleSeason(season: number, pk: `0x${string}`) {
  const d = await db();
  // Claim the season first so two servers never send the payout twice
  const claim = `settling:${season}`;
  const [mine] = await d.insert(meta).values({ key: claim, value: { at: Date.now() } }).onConflictDoNothing().returning();
  if (!mine) return;
  try {
    const bank = BANK_ADDRESS as `0x${string}`;
    let txHash = "";
    let winners: Payout["winners"] = [];
    if (await testnet.readContract({ address: bank, abi: bankAbi, functionName: "settled", args: [BigInt(season)] })) {
      txHash = "already-settled";
    } else {
      winners = await winnersFor(season);
      const lists = [0, 1, 2].map((i) => (winners[i]?.wallets ?? []) as `0x${string}`[]) as [`0x${string}`[], `0x${string}`[], `0x${string}`[]];
      const wallet = createWalletClient({ account: privateKeyToAccount(pk), chain: monadTestnet, transport: http(process.env.MONAD_TESTNET_RPC) });
      txHash = await wallet.writeContract({ address: bank, abi: bankAbi, functionName: "settle", args: [BigInt(season), lists] });
      const receipt = await testnet.waitForTransactionReceipt({ hash: txHash as `0x${string}`, timeout: 60_000 });
      if (receipt.status !== "success") throw new Error(`settle ${season} reverted`);
      const ev = parseEventLogs({ abi: bankAbi, logs: receipt.logs, eventName: "Settled" })[0];
      const pot = Number(formatEther(ev.args.pot));
      for (const w of winners) w.each = Math.round(((pot * PLACE_BPS[w.place - 1]) / 10_000 / w.wallets.length) * 100) / 100;
      const payout: Payout = { season, txHash, pot, rolledOver: Number(formatEther(ev.args.rolledOver)), winners, at: Date.now() };
      await d.insert(meta).values({ key: key(season), value: payout }).onConflictDoUpdate({ target: meta.key, set: { value: payout, updatedAt: new Date() } });
      console.log(`[payout] season ${season} paid in ${txHash}`);
      return;
    }
    await d.insert(meta).values({ key: key(season), value: { season, txHash, pot: 0, rolledOver: 0, winners, at: Date.now() } }).onConflictDoNothing();
  } catch (e) {
    // Let a later tick try again
    await d.delete(meta).where(eq(meta.key, claim));
    throw e;
  }
}

/** The most recent paid-out season, for the Vault screen */
export async function lastPayout(): Promise<Payout | null> {
  const d = await db();
  const rows = await d.select().from(meta).where(like(meta.key, "payout:%"));
  const all = rows.map((r) => r.value as Payout).filter((p) => p.txHash !== "already-settled");
  return all.sort((a, b) => b.season - a.season)[0] ?? null;
}
