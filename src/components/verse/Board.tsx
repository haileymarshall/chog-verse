"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { sfx } from "@/lib/sound";
import { num, usd } from "@/lib/verse/format";
import { PAYOUT, ROLES } from "@/lib/verse/roles";
import { useBoard, useGame } from "@/lib/verse/api";
import { ChogAvatar } from "./bits";
import { Icon } from "./icons";

const PAGE = 25;
const MEDAL = ["#ffd23f", "#d9d4f5", "#f0a868"];

export function Board() {
  const { data: g } = useGame();
  const { data, isLoading } = useBoard();
  const [query, setQuery] = useState("");
  const [shown, setShown] = useState(PAGE);
  if (isLoading || !data) return <div className="panel h-96 animate-pulse" />;
  const pot = data.pot;
  const rows = data.rows.map((r) => ({ ...r, mine: r.id === g?.crew?.id }));
  const myIndex = rows.findIndex((r) => r.mine);
  const filtered = rows.map((r, i) => ({ ...r, rank: i + 1 })).filter((r) => r.name.toLowerCase().includes(query.toLowerCase()));
  const maxAbs = Math.max(1, ...rows.flatMap((r) => r.days.map(Math.abs)));

  return (
    <div>
      <span className="tape">Season {data.season} · Day {g?.clock.day ?? 1} of 7</span>
      <h1 className="text-outline mt-3 font-display text-5xl text-paper sm:text-6xl">Leaderboard</h1>
      <p className="mt-2 max-w-xl font-semibold text-paper/70">Top 3 crews when the vault opens split {num(pot * 0.95)} $CHOG. Everyone else goes home with a story.</p>

      {/* ---------- Podium ---------- */}
      <div className="mt-10 grid grid-cols-3 items-end gap-2 sm:gap-5">
        {[1, 0, 2].map((i) => {
          const c = rows[i];
          if (!c) return <div key={i} />;
          const h = ["h-44 sm:h-56", "h-32 sm:h-40", "h-24 sm:h-32"][i];
          return (
            <motion.div key={c.id} initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 120, damping: 16, delay: [0.2, 0.05, 0.35][i] }} className="flex flex-col items-center">
              {i === 0 && (
                <motion.svg viewBox="0 0 64 40" className="mb-1 w-14 sm:w-20" animate={{ rotate: [-4, 4, -4] }} transition={{ duration: 3, repeat: Infinity }}>
                  <path d="M4 36 L8 8 L22 22 L32 4 L42 22 L56 8 L60 36 Z" fill="#ffd23f" stroke="#160f2e" strokeWidth="4" strokeLinejoin="round" />
                  <circle cx="32" cy="24" r="4" fill="#ff4d5e" stroke="#160f2e" strokeWidth="2.5" />
                </motion.svg>
              )}
              <div className="grid grid-cols-2 gap-1 sm:flex sm:-space-x-3 sm:gap-0">
                {ROLES.map((r) => (c.members[r] ? <ChogAvatar key={r} id={c.members[r]!.chogId} size={i === 0 ? 50 : 42} role={r} bob={i === 0} /> : null))}
              </div>
              <div className="mt-3 text-center">
                <div className={`font-display text-base leading-tight sm:text-xl ${c.mine ? "text-gold" : "text-paper"}`}>{c.name}</div>
                <div className={`font-mono text-sm font-bold ${c.total >= 0 ? "text-green" : "text-red"}`}>{usd(c.total, true)}</div>
              </div>
              <div className={`mt-3 flex w-full flex-col items-center justify-start rounded-t-2xl border-[3px] border-b-0 border-ink pt-3 ${h}`} style={{ background: `linear-gradient(180deg, ${MEDAL[i]}, ${MEDAL[i]}cc)` }}>
                <span className="text-outline-sm font-display text-5xl text-paper sm:text-6xl">{i + 1}</span>
                <span className="mt-1 rounded-full border-2 border-ink bg-paper px-2 font-mono text-[11px] font-bold text-ink sm:text-sm">{num(pot * PAYOUT[i])} $CHOG</span>
              </div>
            </motion.div>
          );
        })}
      </div>
      <div className="h-3 rounded-b-xl border-[3px] border-ink bg-night-3" />

      {/* ---------- Your crew ---------- */}
      {myIndex >= 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="card mt-8 flex flex-wrap items-center gap-4 p-4">
          <span className="grid h-14 w-14 place-items-center rounded-2xl border-[3px] border-ink bg-gold font-display text-2xl">#{myIndex + 1}</span>
          <div className="flex-1">
            <div className="font-display text-2xl leading-none">{rows[myIndex].name}</div>
            <div className="mt-1 font-semibold text-ink/60">
              {myIndex < 3 ? "You're in the money. Hold the line." : `${usd(rows[2].total - rows[myIndex].total)} behind 3rd place. Catch up before the vault opens.`}
            </div>
          </div>
          <div className="font-mono text-2xl font-bold text-[#1f9e5a]">{usd(rows[myIndex].total, true)}</div>
        </motion.div>
      )}

      {/* ---------- Table ---------- */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-3xl text-paper">All crews</h2>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Find a crew…"
          className="h-11 w-full rounded-full border-[3px] border-ink bg-paper px-4 font-semibold text-ink placeholder:text-ink/40 focus:outline-none focus:ring-4 focus:ring-gold/60 sm:w-64"
        />
      </div>
      <div className="panel mt-4 overflow-hidden">
        <div className="grid grid-cols-[52px_1fr_auto] items-center gap-3 border-b-[3px] border-ink bg-night/70 px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-widest text-paper/50 sm:grid-cols-[52px_1fr_150px_160px_120px]">
          <span>Rank</span>
          <span>Crew</span>
          <span className="hidden sm:block">Members</span>
          <span className="hidden sm:block">Days</span>
          <span className="text-right">Week P&L</span>
        </div>
        {filtered.slice(0, shown).map((c, i) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: Math.min(i, 20) * 0.015 }}
            className={`grid grid-cols-[52px_1fr_auto] items-center gap-3 border-b-2 border-ink/40 px-4 py-2.5 sm:grid-cols-[52px_1fr_150px_160px_120px] ${c.mine ? "bg-gold/25" : i % 2 ? "bg-white/[0.03]" : ""}`}
          >
            <span className={`grid h-9 w-9 place-items-center rounded-full border-[2.5px] border-ink font-display ${c.rank <= 3 ? "text-ink" : "bg-night-3 text-paper"}`} style={c.rank <= 3 ? { background: MEDAL[c.rank - 1] } : undefined}>
              {c.rank}
            </span>
            <span className={`truncate font-display text-lg ${c.mine ? "text-gold" : "text-paper"}`}>
              {c.name} {c.mine && <span className="ml-1 rounded-full bg-gold px-2 align-middle font-mono text-[10px] text-ink">YOU</span>}
              {c.kind === "bot" && <span className="ml-1 rounded-full bg-white/10 px-2 align-middle font-mono text-[10px] text-paper/50">BOT</span>}
            </span>
            <span className="hidden -space-x-2 sm:flex">
              {ROLES.map((r) => (c.members[r] ? <ChogAvatar key={r} id={c.members[r]!.chogId} size={28} /> : null))}
            </span>
            <span className="hidden h-9 items-center gap-1.5 sm:flex">
              {c.days.map((d, k) => (
                <span key={k} className="flex h-full w-8 items-center justify-center">
                  <span className="w-5 rounded-sm border-2 border-ink" style={{ height: `${Math.max(12, (Math.abs(d) / maxAbs) * 100)}%`, background: d >= 0 ? "var(--green)" : "var(--red)" }} />
                </span>
              ))}
            </span>
            <span className={`text-right font-mono font-bold tabular-nums ${c.total >= 0 ? "text-green" : "text-red"}`}>{usd(c.total, true)}</span>
          </motion.div>
        ))}
        {shown < filtered.length && (
          <div className="p-4 text-center">
            <button type="button" onClick={() => (sfx.pop(), setShown((n) => n + PAGE))} className="btn">
              <Icon name="board" className="h-5 w-5" /> Show more crews
            </button>
          </div>
        )}
        {filtered.length === 0 && <div className="p-8 text-center font-display text-xl text-paper/50">No crew by that name</div>}
      </div>
    </div>
  );
}
