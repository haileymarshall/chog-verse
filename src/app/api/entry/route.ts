import { createPublicClient, http, parseEventLogs } from "viem";
import { monadTestnet } from "viem/chains";
import { BANK_ADDRESS, bankAbi, bankLive } from "@/lib/verse/bank";
import { DEMO } from "@/lib/verse/mode";
import { ENTRY_FEE } from "@/lib/verse/roles";
import { seasonClock } from "@/lib/verse/season";
import { db, schema } from "@/server/db";
import { body, fail, requirePlayer, route } from "@/server/http";

const testnet = createPublicClient({ chain: monadTestnet, transport: http() });

// The demo and guest passes enter free and cannot win. In the live game, players pay $CHOG into the Bank contract; we check the receipt on-chain.
export const POST = route(async (req: Request) => {
  const { player, session } = await requirePlayer();
  const season = seasonClock(Date.now()).season;
  const d = await db();

  if (DEMO || player.kind === "guest") {
    await d.insert(schema.entries).values({ season, playerId: player.id, amount: 0 }).onConflictDoNothing();
    return { ok: true };
  }
  if (!bankLive()) fail(503, "The Bank contract isn't deployed yet");
  const { txHash } = await body<{ txHash: `0x${string}` }>(req);
  if (!/^0x[0-9a-fA-F]{64}$/.test(txHash ?? "")) fail(400, "Missing transaction");

  const receipt = await testnet.waitForTransactionReceipt({ hash: txHash, timeout: 30_000 }).catch(() => fail(404, "Transaction not found on Monad testnet"));
  if (receipt.status !== "success") fail(400, "That transaction failed");
  const entered = parseEventLogs({ abi: bankAbi, logs: receipt.logs, eventName: "Entered" }).find(
    (l) => l.address.toLowerCase() === BANK_ADDRESS.toLowerCase() && l.args.season === BigInt(season) && l.args.chogId === BigInt(player.chogId) && l.args.player.toLowerCase() === session.wallet,
  );
  if (!entered) fail(400, `No entry for Chog #${player.chogId} in season ${season} in that transaction`);
  await d.insert(schema.entries).values({ season, playerId: player.id, amount: ENTRY_FEE, txHash }).onConflictDoNothing();
  return { ok: true };
});
