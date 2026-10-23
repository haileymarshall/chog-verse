"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { sfx } from "@/lib/sound";
import { price } from "@/lib/verse/format";
import { tokenOf, useCall, type GameState } from "@/lib/verse/api";
import { useNow } from "@/lib/verse/clock";
import { ROLE_INFO } from "@/lib/verse/roles";
import { Delta, Sparkline, TokenIcon } from "../bits";
import { Icon, RoleIcon } from "../icons";
import { useToast } from "../providers";

type Filter = "all" | "up" | "down" | "top";

// The daily list. Trader hunts the pump, Rugger hunts the crash.
export function TokenBoard({ g, role }: { g: GameState; role: "trader" | "rugger" }) {
  const toast = useToast();
  const call = useCall();
  const picked = g.plan[role];
  const teammatePick = g.plan[role === "trader" ? "rugger" : "trader"];
  const now = useNow();
  const closed = now >= g.clock.backingAt;
  const [filter, setFilter] = useState<Filter>("all");
  const [hover, setHover] = useState<string | null>(picked);
  const [saving, setSaving] = useState(false);
  const info = ROLE_INFO[role];
  const selected = tokenOf(g, hover);

  const list = g.tokens.filter((t, i) => (filter === "up" ? t.change24h > 0 : filter === "down" ? t.change24h < 0 : filter === "top" ? i < 5 : true));

  const lock = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await call("/api/plan", { [role]: selected.address });
      sfx.stamp();
      toast({
        title: `$${selected.symbol} locked in`,
        body: role === "trader" ? "Now pray it pumps. Every crew sees it at 14:00." : "Now pray it crashes. Every crew sees it at 14:00.",
        tone: role === "trader" ? "green" : "red",
      });
    } catch (e) {
      sfx.fail();
      toast({ title: "Pick not saved", body: (e as Error).message, tone: "red" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-full border-[3px] border-ink bg-night/60 p-1">
          {(
            [
              ["all", `All ${g.tokens.length}`],
              ["up", "Pumping"],
              ["down", "Dumping"],
              ["top", "Top 5"],
            ] as [Filter, string][]
          ).map(([f, label]) => (
            <button
              key={f}
              type="button"
              onClick={() => (sfx.tick(), setFilter(f))}
              className={`relative rounded-full px-3 py-1 font-display text-sm transition ${filter === f ? "text-ink" : "text-paper/70 hover:text-paper"}`}
            >
              {filter === f && <motion.span layoutId={`filter-${role}`} className="absolute inset-0 rounded-full bg-paper" transition={{ type: "spring", stiffness: 400, damping: 30 }} />}
              <span className="relative">{label}</span>
            </button>
          ))}
        </div>
        <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-paper/50">Today&apos;s list · live from nad.fun</span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-4">
        <AnimatePresence mode="popLayout">
          {list.map((t) => {
            const isSel = hover === t.address;
            const isLocked = picked === t.address;
            return (
              <motion.button
                layout
                key={t.address}
                type="button"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => (sfx.tick(), setHover(t.address))}
                className="relative rounded-2xl border-[3px] border-ink bg-paper p-2.5 text-left text-ink transition-shadow"
                style={{ boxShadow: isSel ? `0 0 0 4px ${info.color}, 5px 5px 0 4px var(--ink)` : "3px 3px 0 0 var(--ink)" }}
              >
                <div className="flex items-center gap-2">
                  <TokenIcon token={t} size={30} />
                  <div className="min-w-0">
                    <div className="font-display text-base leading-none">${t.symbol}</div>
                    <div className="truncate text-[11px] font-bold text-ink/50">{t.name}</div>
                  </div>
                </div>
                <div className="mt-2 flex items-end justify-between gap-1">
                  <div>
                    <div className="font-mono text-[11px] font-bold text-ink/60">{price(t.price)}</div>
                    <Delta value={t.change24h} className={`text-xs ${t.change24h >= 0 ? "!text-[#1f9e5a]" : "!text-[#c92536]"}`} />
                  </div>
                  <Sparkline data={t.spark} width={64} height={26} />
                </div>
                {teammatePick === t.address && (
                  <span className="absolute -left-2 -top-2 rounded-full border-2 border-ink px-1.5 text-[9px] font-black uppercase" style={{ background: ROLE_INFO[role === "trader" ? "rugger" : "trader"].color }}>
                    {role === "trader" ? "Rugger's" : "Trader's"}
                  </span>
                )}
                {isLocked && (
                  <motion.span initial={{ scale: 2.2, opacity: 0, rotate: -30 }} animate={{ scale: 1, opacity: 1, rotate: -12 }} className="stamp absolute right-1 top-8 bg-paper/80 text-sm" style={{ color: info.deep }}>
                    Picked
                  </motion.span>
                )}
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>

      <div className="sticky bottom-24 z-10 mt-5 lg:bottom-4">
        <div className="flex flex-wrap items-center gap-3 rounded-[22px] border-[3px] border-ink bg-paper p-3 text-ink shadow-sticker-lg">
          {selected ? (
            <>
              <TokenIcon token={selected} size={44} />
              <div className="min-w-0 flex-1">
                <div className="font-display text-xl leading-none">
                  {role === "trader" ? "Pump pick:" : "Crash pick:"} ${selected.symbol}
                </div>
                <div className="text-sm font-bold text-ink/55">{role === "trader" ? "Scores on % gain over the next 24h." : "Scores on % drop over the next 24h."}</div>
              </div>
              {closed ? (
                <span className="rounded-full border-[3px] border-ink bg-cream px-4 py-2 font-display text-base">Picks closed at 14:00</span>
              ) : picked === selected.address ? (
                <span className="flex items-center gap-1.5 rounded-full border-[3px] border-ink px-4 py-2 font-display text-lg" style={{ background: info.color }}>
                  <Icon name="check" className="h-5 w-5" /> Locked
                </span>
              ) : (
                <button type="button" onClick={lock} disabled={saving} className={`btn ${role === "trader" ? "!bg-green" : "btn-red"}`}>
                  <RoleIcon role={role} /> {picked ? "Switch pick" : "Lock pick"}
                </button>
              )}
            </>
          ) : (
            <div className="flex-1 py-1 text-center font-display text-lg text-ink/60">{role === "trader" ? "Tap the token you think will pump hardest" : "Tap the token you think will crash hardest"}</div>
          )}
        </div>
      </div>
    </div>
  );
}
