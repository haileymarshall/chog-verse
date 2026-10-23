"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { sfx } from "@/lib/sound";
import { tokenOf, useCall, useRivals, type GameState } from "@/lib/verse/api";
import { useNow } from "@/lib/verse/clock";
import { countdown, usd } from "@/lib/verse/format";
import { FUD_STAKE, ROLE_INFO } from "@/lib/verse/roles";
import type { FudTarget } from "@/lib/verse/types";
import { ChogAvatar, TokenIcon } from "../bits";
import { Icon, RoleIcon } from "../icons";
import { useToast } from "../providers";

const SHOUTS = ["SCAM!", "NGMI", "RUG INCOMING", "DEV SOLD", "JEETS!", "FUD!", "IT'S OVER"];

// The FUDder bets $1,000 against one rival crew's public pick
export function FudPanel({ g }: { g: GameState }) {
  const toast = useToast();
  const call = useCall();
  const now = useNow();
  const locked = g.plan.fud;
  const { data } = useRivals();
  const [query, setQuery] = useState("");
  const [target, setTarget] = useState<FudTarget | null>(locked);
  const [blast, setBlast] = useState(0);

  if (data && !data.open) {
    return (
      <div className="grid place-items-center rounded-2xl border border-white/10 px-4 py-14 text-center">
        <RoleIcon role="fudder" className="h-12 w-12 text-orange" />
        <div className="mt-3 font-display text-3xl text-paper">FUD opens at 14:00 UTC</div>
        <p className="mt-1 max-w-sm font-semibold text-paper/60">That&apos;s when every crew&apos;s picks go public. Come back and bet {usd(FUD_STAKE)} against a rival&apos;s pick.</p>
        {now > 0 && <div className="mt-4 font-mono text-2xl font-bold text-gold">{countdown(data.opensAt - now).text}</div>}
      </div>
    );
  }

  const rivals = (data?.picks ?? []).filter((c) => c.name.toLowerCase().includes(query.toLowerCase())).slice(0, 30);
  const tCrew = target ? (data?.picks.find((c) => c.crewId === target.crewId) ?? null) : null;
  const tToken = tCrew && target ? tokenOf(g, tCrew[target.side]) : null;
  const same = locked && target && locked.crewId === target.crewId && locked.side === target.side;

  const spread = async () => {
    if (!target || !tCrew) return;
    try {
      await call("/api/plan", { fud: target });
      setBlast((b) => b + 1);
      sfx.whoosh();
      setTimeout(() => sfx.stamp(), 150);
      toast({ title: `FUD deployed on ${tCrew.name}`, body: `${usd(FUD_STAKE)} says their $${tToken?.symbol} goes wrong.`, tone: "red" });
    } catch (e) {
      sfx.fail();
      toast({ title: "FUD didn't land", body: (e as Error).message, tone: "red" });
    }
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search rival crews…"
            className="h-11 min-w-0 flex-1 rounded-full border-[3px] border-ink bg-paper px-4 font-semibold text-ink placeholder:text-ink/40 focus:outline-none focus:ring-4 focus:ring-orange/50"
          />
        </div>
        <div className="thin-scroll mt-3 max-h-[460px] space-y-2 overflow-y-auto pr-1">
          {!rivals.length && <div className="rounded-2xl border border-white/10 p-6 text-center font-semibold text-paper/50">No public picks yet.</div>}
          {rivals.map((c) => {
            const tr = tokenOf(g, c.trader);
            const rg = tokenOf(g, c.rugger);
            return (
              <div key={c.crewId} className="flex flex-wrap items-center gap-2.5 rounded-2xl border-[3px] border-ink bg-paper p-2.5 text-ink shadow-sticker-sm">
                <div className="hidden -space-x-2.5 sm:flex">
                  {(["trader", "rugger"] as const).map((r) => (c.members[r] ? <ChogAvatar key={r} id={c.members[r]!.chogId} size={30} /> : null))}
                </div>
                <div className="min-w-[8rem] flex-1 truncate font-display text-base">{c.name}</div>
                {(["trader", "rugger"] as const).map((side) => {
                  const tok = side === "trader" ? tr : rg;
                  if (!tok) return null;
                  const active = target?.crewId === c.crewId && target.side === side;
                  return (
                    <button
                      key={side}
                      type="button"
                      onClick={() => (sfx.tick(), setTarget({ crewId: c.crewId, side }))}
                      title={`FUD their ${ROLE_INFO[side].name} pick`}
                      className={`flex items-center gap-1 rounded-full border-[2.5px] border-ink py-0.5 pl-0.5 pr-2 text-xs font-extrabold transition ${active ? "-translate-y-0.5 bg-orange shadow-sticker-sm" : "bg-white hover:-translate-y-0.5"}`}
                    >
                      <TokenIcon token={tok} size={20} />
                      <span style={{ color: active ? undefined : ROLE_INFO[side].deep }}>{side === "trader" ? "▲" : "▼"}</span>
                      {tok.symbol}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      <div className="relative">
        <div className="card relative overflow-hidden p-5">
          <div className="flex items-center gap-2">
            <span className="grid h-12 w-12 place-items-center rounded-full border-[3px] border-ink bg-orange">
              <motion.span key={blast} animate={blast ? { rotate: [0, -20, 15, -10, 0], scale: [1, 1.25, 1] } : undefined} transition={{ duration: 0.5 }}>
                <RoleIcon role="fudder" className="h-7 w-7" />
              </motion.span>
            </span>
            <div>
              <div className="font-display text-2xl leading-none">Your target</div>
              <div className="text-sm font-bold text-ink/55">Stake: {usd(FUD_STAKE)} of paper money</div>
            </div>
          </div>

          {tCrew && tToken && target ? (
            <div className="mt-5">
              <div className="rounded-2xl border-[3px] border-ink bg-cream p-4">
                <div className="font-mono text-[11px] font-bold uppercase tracking-widest text-ink/50">{tCrew.name}&apos;s {ROLE_INFO[target.side].name} picked</div>
                <div className="mt-2 flex items-center gap-3">
                  <TokenIcon token={tToken} size={48} />
                  <div>
                    <div className="font-display text-3xl leading-none">${tToken.symbol}</div>
                    <div className="text-sm font-bold" style={{ color: ROLE_INFO[target.side].deep }}>
                      They bet it {target.side === "trader" ? "pumps" : "crashes"}
                    </div>
                  </div>
                </div>
                <p className="mt-3 rounded-xl bg-paper px-3 py-2 text-sm font-bold">
                  You win if <b>${tToken.symbol}</b> {target.side === "trader" ? "drops" : "rises"}. You lose if it {target.side === "trader" ? "pumps" : "crashes"}.
                </p>
              </div>
              {same ? (
                <div className="mt-4 flex items-center justify-center gap-2 rounded-full border-[3px] border-ink bg-orange py-2.5 font-display text-xl">
                  <Icon name="check" className="h-5 w-5" /> FUD is live
                </div>
              ) : (
                <button type="button" onClick={spread} className="btn btn-big mt-4 w-full !bg-orange">
                  Spread the FUD
                </button>
              )}
            </div>
          ) : (
            <div className="mt-5 grid place-items-center rounded-2xl border-[3px] border-dashed border-ink/30 px-4 py-10 text-center">
              <Icon name="eye" className="h-10 w-10 text-ink/30" />
              <p className="mt-2 font-display text-lg text-ink/55">Pick a rival&apos;s pick to attack</p>
              <p className="text-sm font-semibold text-ink/45">Hunt Traders on weak tokens, or Ruggers on tokens that look strong.</p>
            </div>
          )}
        </div>

        <AnimatePresence>
          {blast > 0 &&
            SHOUTS.slice(0, 5).map((w, i) => (
              <motion.span
                key={`${blast}-${i}`}
                className="text-outline-sm pointer-events-none absolute left-1/2 top-1/3 z-10 whitespace-nowrap font-display text-2xl text-orange"
                initial={{ x: 0, y: 0, opacity: 1, scale: 0.4 }}
                animate={{ x: (i - 2) * 70, y: -120 - (i % 2) * 40, opacity: 0, scale: 1.3, rotate: (i - 2) * 10 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
              >
                {SHOUTS[(i + blast) % SHOUTS.length]}
              </motion.span>
            ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
