"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useNow } from "@/lib/verse/clock";
import { countdown, num } from "@/lib/verse/format";
import { ENTRY_FEE, PAYOUT, ROLLOVER } from "@/lib/verse/roles";
import { seasonClock } from "@/lib/verse/season";
import { useQuery } from "@tanstack/react-query";
import { api, useGame, type Payout } from "@/lib/verse/api";
import { Icon } from "./icons";
import { DEMO } from "@/lib/verse/mode";
import { PayEntry } from "./PayEntry";
import { VaultDoor } from "./VaultDoor";

export function Vault() {
  const { data: g } = useGame();
  const now = useNow();
  const clock = now ? seasonClock(now) : null;
  const pot = g?.pot ?? 0;
  const left = clock ? countdown(clock.vaultOpensAt - now) : null;
  const { data: paid } = useQuery({ queryKey: ["payout"], queryFn: () => api<{ payout: Payout | null }>("/api/payout"), enabled: !DEMO, staleTime: 60_000 });

  return (
    <div>
      <span className="tape">Monad Bank · Basement level</span>
      <h1 className="text-outline mt-3 font-display text-5xl text-paper sm:text-6xl">The Vault</h1>

      <section className="mt-8 grid items-center gap-8 lg:grid-cols-[1fr_1.1fr]">
        <div className="relative mx-auto w-full max-w-md">
          <div className="absolute inset-[8%] rounded-full bg-gold/30 blur-3xl" />
          <motion.div initial={{ scale: 0.7, rotate: -40, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 90, damping: 14 }}>
            <VaultDoor className="relative w-full drop-shadow-[10px_14px_0_rgba(0,0,0,0.35)]" />
          </motion.div>
        </div>

        <div className="space-y-5">
          <div className="card overflow-hidden">
            <div className="caution h-4" />
            <div className="p-6">
              <div className="font-mono text-xs font-bold uppercase tracking-widest text-ink/50">Locked inside</div>
              <div className="font-mono text-5xl font-bold tabular-nums sm:text-6xl">{num(pot)}</div>
              <div className="font-display text-2xl text-monad-deep">$CHOG</div>
              <div className="mt-5 grid grid-cols-4 gap-1.5 text-center">
                {(left ? [
                  [left.d, "days"],
                  [left.h, "hrs"],
                  [left.m, "min"],
                  [left.s, "sec"],
                ] : [["-", "days"], ["-", "hrs"], ["-", "min"], ["-", "sec"]]).map(([v, l]) => (
                  <div key={l as string} className="rounded-xl border-[3px] border-ink bg-ink py-2 text-paper">
                    <div className="font-mono text-2xl font-bold tabular-nums">{typeof v === "number" ? String(v).padStart(2, "0") : v}</div>
                    <div className="text-[10px] font-extrabold uppercase tracking-widest text-paper/50">{l}</div>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-center text-xs font-bold text-ink/50">
                {DEMO ? "until the vault opens. Demo crews play for the leaderboard only." : "until the vault opens and the Bank pays the top 3 crews where all 4 Chogs paid in"}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="panel p-4">
              <div className="font-display text-xl text-paper">Your entry</div>
              {g?.entryPaid ? (
                <div className="mt-2 flex items-center gap-2 font-bold text-green">
                  <Icon name="check" className="h-5 w-5" /> {DEMO ? "Demo entry (free)" : g.session?.kind === "guest" ? "Guest pass entry (free)" : `${ENTRY_FEE} $CHOG deposited`}
                </div>
              ) : g?.crew && g.session?.kind === "holder" ? (
                <div className="mt-2 text-paper">
                  <PayEntry g={g} compact />
                </div>
              ) : (
                <div className="mt-2 text-sm font-semibold text-paper/70">
                  Not in yet.{" "}
                  <Link href="/hideout" className="font-extrabold text-gold underline decoration-2 underline-offset-2">
                    Join a crew
                  </Link>{" "}
                  for {ENTRY_FEE} $CHOG.
                </div>
              )}
            </div>
            <div className="panel p-4">
              <div className="font-display text-xl text-paper">Rollover</div>
              <div className="mt-2 text-sm font-semibold text-paper/70">
                {Math.round(ROLLOVER * 100)}% ({num(pot * ROLLOVER)} $CHOG) seeds next week&apos;s vault, plus any place no paid-up crew claims.
              </div>
            </div>
          </div>

          <div className="panel p-4">
            <div className="font-display text-xl text-paper">The split</div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {PAYOUT.map((p, i) => (
                <div key={i} className="rounded-2xl border-[3px] border-ink p-3 text-center text-ink" style={{ background: ["#ffd23f", "#d9d4f5", "#f0a868"][i] }}>
                  <div className="font-display text-2xl leading-none">{["1st", "2nd", "3rd"][i]}</div>
                  <div className="mt-1 font-mono text-sm font-bold">{num(pot * p)}</div>
                  <div className="text-[10px] font-extrabold uppercase">$CHOG · {p * 100}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {paid?.payout && <LastPayout p={paid.payout} />}
    </div>
  );
}

const PLACE_BG = ["#ffd23f", "#d9d4f5", "#f0a868"];

function LastPayout({ p }: { p: Payout }) {
  return (
    <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="card mt-10 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-[3px] border-ink bg-ink px-5 py-3 text-paper">
        <div className="font-display text-2xl">Season {p.season} payout</div>
        <a href={`https://testnet.monadexplorer.com/tx/${p.txHash}`} target="_blank" rel="noreferrer" className="font-mono text-xs font-bold text-gold underline underline-offset-2">
          See it on-chain ↗
        </a>
      </div>
      <div className="p-5">
        {p.winners.length ? (
          <div className="grid gap-3 sm:grid-cols-3">
            {p.winners.map((w) => (
              <div key={w.crewId} className="rounded-2xl border-[3px] border-ink p-4 text-ink" style={{ background: PLACE_BG[w.place - 1] }}>
                <div className="font-display text-xl leading-none">{["1st", "2nd", "3rd"][w.place - 1]} · {w.name}</div>
                <div className="mt-1 font-mono text-sm font-bold">{w.each.toLocaleString("en-US", { maximumFractionDigits: 2 })} $CHOG each</div>
                <div className="mt-2 space-y-0.5 font-mono text-[11px] text-ink/70">
                  {w.wallets.map((a) => (
                    <div key={a}>{a.slice(0, 6)}…{a.slice(-4)}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="font-semibold text-ink/70">No crew had all 4 Chogs paid in, so nobody was paid.</p>
        )}
        <p className="mt-4 text-sm font-semibold text-ink/60">
          Vault: {num(p.pot)} $CHOG. {num(p.rolledOver)} $CHOG rolled into season {p.season + 1}.
        </p>
      </div>
    </motion.section>
  );
}
