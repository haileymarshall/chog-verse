"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { sfx } from "@/lib/sound";
import { usd } from "@/lib/verse/format";
import { tokenOf, useCall, type GameState, type Split } from "@/lib/verse/api";
import { ROLE_INFO, WHALE_BANK } from "@/lib/verse/roles";
import { Delta, Sparkline, TokenIcon } from "../bits";
import { Icon, RoleIcon } from "../icons";
import { useToast } from "../providers";

const STEP = 1000;
const PRESETS: [string, Split][] = [
  ["Balanced", { trader: 5000, rugger: 3000, cash: 2000 }],
  ["Bull mode", { trader: 8000, rugger: 2000, cash: 0 }],
  ["Bear mode", { trader: 2000, rugger: 8000, cash: 0 }],
  ["Scared", { trader: 2000, rugger: 2000, cash: 6000 }],
];

// The Whale splits the crew's $10,000 between the two picks and cash
export function WhalePanel({ g }: { g: GameState }) {
  const toast = useToast();
  const call = useCall();
  const plan = g.plan;
  const locked = plan.split;
  const [split, setSplit] = useState<Split>(locked ?? { trader: 5000, rugger: 5000, cash: 0 });
  const dirty = !locked || locked.trader !== split.trader || locked.rugger !== split.rugger;

  const nudge = (side: "trader" | "rugger", delta: number) => {
    const next = Math.max(0, Math.min(WHALE_BANK, split[side] + delta));
    const other = side === "trader" ? "rugger" : "trader";
    if (next + split[other] > WHALE_BANK) return sfx.fail();
    sfx.coin();
    setSplit({ ...split, [side]: next, cash: WHALE_BANK - next - split[other] });
  };

  const lock = async () => {
    try {
      await call("/api/plan", { split: { trader: split.trader, rugger: split.rugger } });
      sfx.lock();
      toast({ title: "The bag is placed", body: `${usd(split.trader)} on the Trader, ${usd(split.rugger)} on the Rugger, ${usd(split.cash)} safe.`, tone: "gold" });
    } catch (e) {
      sfx.fail();
      toast({ title: "Bag not placed", body: (e as Error).message, tone: "red" });
    }
  };

  return (
    <div>
      <div className="grid gap-4 md:grid-cols-3">
        <Stack label="Trader's pick" role="trader" token={tokenOf(g, plan.trader)} amount={split.trader} onMinus={() => nudge("trader", -STEP)} onPlus={() => nudge("trader", STEP)} />
        <Stack label="Rugger's pick" role="rugger" token={tokenOf(g, plan.rugger)} amount={split.rugger} onMinus={() => nudge("rugger", -STEP)} onPlus={() => nudge("rugger", STEP)} />
        <Stack label="Keep as cash" amount={split.cash} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-paper/50">Quick moves</span>
        {PRESETS.map(([label, p]) => (
          <button key={label} type="button" onClick={() => (sfx.coin(), setSplit(p))} className="chip transition hover:-translate-y-0.5">
            {label}
          </button>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3 rounded-[22px] border-[3px] border-ink bg-paper p-3 text-ink shadow-sticker-lg">
        <div className="h-6 min-w-[200px] flex-1 overflow-hidden rounded-full border-[3px] border-ink bg-cream">
          <div className="flex h-full">
            <motion.div className="h-full bg-green" animate={{ width: `${(split.trader / WHALE_BANK) * 100}%` }} />
            <motion.div className="h-full bg-red" animate={{ width: `${(split.rugger / WHALE_BANK) * 100}%` }} />
            <motion.div className="h-full bg-steel" animate={{ width: `${(split.cash / WHALE_BANK) * 100}%` }} />
          </div>
        </div>
        {dirty ? (
          <button type="button" onClick={lock} className="btn btn-gold">
            <RoleIcon role="whale" /> {locked ? "Update the bag" : "Place the bag"}
          </button>
        ) : (
          <span className="flex items-center gap-1.5 rounded-full border-[3px] border-ink bg-sky px-4 py-2 font-display text-lg">
            <Icon name="check" className="h-5 w-5" /> Bag placed
          </span>
        )}
      </div>
    </div>
  );
}

function Stack({ label, role, token, amount, onMinus, onPlus }: { label: string; role?: "trader" | "rugger"; token?: ReturnType<typeof tokenOf>; amount: number; onMinus?: () => void; onPlus?: () => void }) {
  const bills = Math.round(amount / STEP);
  const color = role ? ROLE_INFO[role].color : "var(--steel)";

  return (
    <div className="card flex flex-col overflow-hidden" style={{ borderRadius: 20 }}>
      <div className="flex items-center gap-2 border-b-[3px] border-ink px-3 py-2" style={{ background: color }}>
        {role ? <RoleIcon role={role} className="h-5 w-5" /> : <Icon name="lock" className="h-5 w-5" />}
        <span className="font-display text-lg">{label}</span>
      </div>

      <div className="flex items-center gap-2 px-3 pt-3">
        {role ? (
          token ? (
            <>
              <TokenIcon token={token} size={34} />
              <div className="flex-1">
                <div className="font-display text-lg leading-none">${token.symbol}</div>
                <Delta value={token.change24h} className={`text-xs ${token.change24h >= 0 ? "!text-[#1f9e5a]" : "!text-[#c92536]"}`} />
              </div>
              <Sparkline data={token.spark} width={60} height={24} />
            </>
          ) : (
            <span className="py-1.5 text-sm font-bold text-ink/50">Waiting for the {ROLE_INFO[role].name}…</span>
          )
        ) : (
          <span className="py-1.5 text-sm font-bold text-ink/50">Safe. Earns nothing, loses nothing.</span>
        )}
      </div>

      {/* Money stack */}
      <div className="relative mx-3 mt-3 h-40 rounded-xl border-[3px] border-dashed border-ink/25 bg-cream/60">
        <div className="absolute inset-x-0 bottom-2 flex flex-col-reverse items-center">
          {Array.from({ length: bills }, (_, i) => (
            <motion.div
              key={i}
              initial={{ y: -40, opacity: 0, rotate: i % 2 ? 6 : -6 }}
              animate={{ y: 0, opacity: 1, rotate: ((i * 7) % 5) - 2 }}
              transition={{ type: "spring", stiffness: 500, damping: 22 }}
              className="-mt-[5px] flex h-[16px] w-24 items-center justify-center rounded-[4px] border-[2.5px] border-ink text-[9px] font-black text-ink/70"
              style={{ background: role === "trader" ? "#8be8b2" : role === "rugger" ? "#ffa3ab" : "#d9d4f5" }}
            >
              $1K
            </motion.div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 p-3">
        {onMinus ? (
          <button type="button" onClick={onMinus} aria-label={`Less on ${label}`} className="grid h-10 w-10 place-items-center rounded-full border-[3px] border-ink bg-white font-display text-2xl shadow-sticker-sm transition active:translate-y-0.5">
            −
          </button>
        ) : (
          <span className="w-10" />
        )}
        <motion.span key={amount} initial={{ scale: 1.3 }} animate={{ scale: 1 }} className="font-mono text-2xl font-bold">
          {usd(amount)}
        </motion.span>
        {onPlus ? (
          <button type="button" onClick={onPlus} aria-label={`More on ${label}`} className="grid h-10 w-10 place-items-center rounded-full border-[3px] border-ink bg-gold font-display text-2xl shadow-sticker-sm transition active:translate-y-0.5">
            +
          </button>
        ) : (
          <span className="w-10" />
        )}
      </div>
    </div>
  );
}
