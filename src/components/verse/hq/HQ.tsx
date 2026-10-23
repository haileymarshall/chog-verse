"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { sfx } from "@/lib/sound";
import { tokenOf, useGame, useRivals, type GameState, type Plan } from "@/lib/verse/api";
import { useNow } from "@/lib/verse/clock";
import { countdown, pct, usd } from "@/lib/verse/format";
import { FUD_STAKE, ROLES, ROLE_INFO, WHALE_BANK } from "@/lib/verse/roles";
import type { Role } from "@/lib/verse/types";
import { ChogAvatar, RoleChip, TokenIcon } from "../bits";
import { Icon, RoleIcon } from "../icons";
import { PayEntry } from "../PayEntry";
import { FudPanel } from "./FudPanel";
import { TokenBoard } from "./TokenBoard";
import { WhalePanel } from "./WhalePanel";

export function HQ() {
  const { data: g, isLoading } = useGame();
  const now = useNow();
  const [acting, setActing] = useState<Role | null>(null);

  if (isLoading || !g) return <div className="panel h-96 animate-pulse" />;
  if (!g.crew || !g.me?.role) return <NoCrew />;

  const crew = g.crew;
  const myRole = g.me.role;
  // You make your own move, and the moves of any bot seats in your crew
  const canAct = (r: Role) => r === myRole || crew.members[r]?.kind === "bot";
  const role = acting && canAct(acting) ? acting : myRole;
  const clock = now ? g.clock : null;

  return (
    <div className="space-y-6">
      {/* ---------- Header ---------- */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="tape">Crew HQ</span>
            <RoleChip role={myRole} />
          </div>
          <h1 className="text-outline mt-3 font-display text-5xl leading-none text-paper sm:text-6xl">{crew.name}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="chip !bg-gold !text-base">
              #{crew.rank} <span className="font-semibold text-ink/60">of {crew.of}</span>
            </span>
            <span className={`chip !text-base ${crew.total >= 0 ? "!bg-green" : "!bg-red"}`}>{usd(crew.total, true)} this season</span>
            {crew.rank <= 3 && crew.days.length > 0 && <span className="chip !bg-pink">In the money</span>}
            {g.session?.kind === "guest" && <span className="chip">Guest crew</span>}
          </div>
        </div>
        <DayTracker g={g} />
      </div>

      <PayEntry g={g} />
      <PhaseBar g={g} now={now} />

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-6">
          <PlanTable g={g} plan={g.plan} myRole={myRole} />

          {/* ---------- Your move ---------- */}
          <section className="panel overflow-hidden">
            <div className="flex flex-wrap items-center gap-3 border-b-[3px] border-ink px-5 py-3" style={{ background: `linear-gradient(90deg, ${ROLE_INFO[role].color}, ${ROLE_INFO[role].deep})` }}>
              <span className="grid h-11 w-11 place-items-center rounded-full border-[3px] border-ink bg-paper text-ink">
                <RoleIcon role={role} className="h-6 w-6" />
              </span>
              <div className="text-ink">
                <div className="font-mono text-[11px] font-bold uppercase tracking-widest">
                  {role === myRole ? "Your move" : "Bot seat"} · {ROLE_INFO[role].name}
                </div>
                <div className="font-display text-2xl leading-none">{MOVE_TITLE[role]}</div>
              </div>
              {clock && (
                <span className="ml-auto flex items-center gap-1.5 rounded-full border-[3px] border-ink bg-paper px-3 py-1 font-mono text-sm font-bold text-ink">
                  <Icon name="clock" className="h-4 w-4" />
                  {role === "trader" || role === "rugger" ? countdown(Math.max(0, clock.backingAt - now)).text : countdown(clock.nextLock - now).text}
                </span>
              )}
            </div>
            <div className="p-4 sm:p-5">
              {role === "trader" && <TokenBoard key="trader" g={g} role="trader" />}
              {role === "rugger" && <TokenBoard key="rugger" g={g} role="rugger" />}
              {role === "whale" && <WhalePanel key={JSON.stringify(g.plan.split)} g={g} />}
              {role === "fudder" && <FudPanel key="fud" g={g} />}
            </div>
          </section>
        </div>

        <aside className="min-w-0 space-y-6">
          <Receipt g={g} />
          <Seats g={g} myRole={myRole} active={role} canAct={canAct} onPick={(r) => (sfx.whoosh(), setActing(r))} />
          <CrewRadio g={g} />
        </aside>
      </div>
    </div>
  );
}

const MOVE_TITLE: Record<Role, string> = {
  trader: "Pick today's pump",
  rugger: "Pick today's crash",
  whale: "Place the bag",
  fudder: "Choose your target",
};

/* ---------- Pieces ---------- */

function NoCrew() {
  return (
    <div className="mx-auto mt-10 max-w-xl text-center">
      <div className="card p-8">
        <Icon name="users" className="mx-auto h-14 w-14 text-monad" />
        <h1 className="mt-3 font-display text-4xl">No crew, no way in</h1>
        <p className="mt-2 font-semibold text-ink/60">Head to the Hideout, pick your Chog, and join or start a crew of 4.</p>
        <Link href="/hideout" onClick={() => sfx.whoosh()} className="btn btn-gold btn-big mt-6">
          Go to the Hideout
        </Link>
      </div>
    </div>
  );
}

function DayTracker({ g }: { g: GameState }) {
  const byDay = new Map(g.crew!.days.map((d) => [((d.round - 1) % 7) + 1, d.total]));
  const liveDay = g.live ? ((g.live.round - 1) % 7) + 1 : null;
  return (
    <div className="panel px-4 py-3">
      <div className="flex items-center justify-between gap-6">
        <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-paper/60">Season {g.clock.season}</span>
        <span className="font-display text-xl text-gold">Day {g.clock.day} / 7</span>
      </div>
      <div className="mt-2 flex gap-1.5">
        {Array.from({ length: 7 }, (_, i) => {
          const day = i + 1;
          const v = byDay.get(day) ?? (day === liveDay ? (g.live?.score?.total ?? null) : null);
          const today = day === g.clock.day;
          const live = day === liveDay;
          return (
            <div key={i} className="flex flex-col items-center gap-1">
              <div
                className={`grid h-11 w-9 place-items-center rounded-lg border-[3px] border-ink text-ink ${today ? "ring-4 ring-gold/60" : ""}`}
                style={{ background: v == null ? "rgba(255,255,255,0.08)" : v >= 0 ? "var(--green)" : "var(--red)", opacity: live ? 0.8 : 1 }}
              >
                {v == null ? <Icon name="lock" className="h-4 w-4 text-paper/30" /> : <span className="font-display text-sm">{v >= 0 ? "▲" : "▼"}</span>}
              </div>
              <span className={`font-mono text-[10px] font-bold ${today ? "text-gold" : live ? "text-sky" : "text-paper/45"}`}>{today ? "NOW" : live ? "LIVE" : `D${day}`}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PhaseBar({ g, now }: { g: GameState; now: number }) {
  const clock = now ? g.clock : null;
  const steps = [
    { key: "picks", label: "Picks open", sub: "Trader & Rugger choose", at: "until 14:00" },
    { key: "backing", label: "Picks public", sub: "Whale backs, FUDder strikes", at: "14:00–15:00" },
    { key: "locked", label: "Locked", sub: "Real prices decide", at: "15:00 UTC" },
    { key: "scored", label: "Scored", sub: "Profit hits the board", at: "+24h" },
  ];
  const current = clock && now >= clock.backingAt ? 1 : 0;
  return (
    <div className="panel grid grid-cols-2 gap-2 p-2 sm:grid-cols-4">
      {steps.map((st, i) => {
        const active = i === current;
        const done = i < current;
        return (
          <div key={st.key} className={`relative flex items-center gap-2.5 rounded-2xl px-3 py-2.5 ${active ? "bg-gold text-ink" : done ? "bg-white/10 text-paper/60" : "text-paper/60"}`}>
            <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border-[3px] border-ink font-display ${active ? "bg-paper" : "bg-night-3 text-paper"}`}>{done ? <Icon name="check" className="h-4 w-4" /> : i + 1}</span>
            <div className="min-w-0">
              <div className="font-display text-base leading-tight">{st.label}</div>
              <div className="truncate text-[11px] font-bold opacity-75">{active && clock ? `${i === 0 ? "Public in" : "Locks in"} ${countdown((i === 0 ? clock.backingAt : clock.nextLock) - now).text}` : `${st.at} · ${st.sub}`}</div>
            </div>
            {active && <span className="absolute right-2 top-2 h-2.5 w-2.5 animate-ping rounded-full bg-red" />}
          </div>
        );
      })}
    </div>
  );
}

// Top-down table with the four crew seats and today's plan
function PlanTable({ g, plan, myRole }: { g: GameState; plan: Plan; myRole: Role }) {
  const crew = g.crew!;
  const seats: { role: Role; pos: string }[] = [
    { role: "whale", pos: "sm:col-start-1 sm:row-start-1" },
    { role: "trader", pos: "sm:col-start-2 sm:row-start-1" },
    { role: "rugger", pos: "sm:col-start-1 sm:row-start-2" },
    { role: "fudder", pos: "sm:col-start-2 sm:row-start-2" },
  ];

  return (
    <section
      className="relative overflow-hidden rounded-[26px] border-[3px] border-ink p-4 shadow-sticker-lg sm:p-6"
      style={{
        background: "#1d3b8f",
        backgroundImage: "linear-gradient(rgba(255,255,255,0.09) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.09) 1px, transparent 1px), linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
        backgroundSize: "80px 80px, 80px 80px, 16px 16px, 16px 16px",
      }}
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-2xl text-paper">Today&apos;s plan</h2>
        <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-paper/60">
          Season {g.clock.season} · Day {g.clock.day}
        </span>
      </div>

      <div className="relative grid grid-cols-1 gap-3 sm:grid-cols-2 sm:grid-rows-2 sm:gap-4">
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 hidden -translate-x-1/2 -translate-y-1/2 sm:block">
          <div className="grid h-24 w-24 place-items-center rounded-full border-[3px] border-ink bg-gold shadow-sticker">
            <Icon name="vault" className="h-12 w-12 text-ink" />
          </div>
        </div>

        {seats.map(({ role, pos }) => {
          const me = role === myRole;
          const m = crew.members[role];
          return (
            <motion.div key={role} layout className={`${pos} relative min-w-0 rounded-2xl border-[3px] border-ink bg-paper p-3 text-ink sm:p-4`} style={{ boxShadow: me ? "0 0 0 4px var(--gold), 5px 5px 0 4px var(--ink)" : "4px 4px 0 0 var(--ink)" }}>
              {me && <span className="absolute -top-3 left-3 rounded-full border-[2.5px] border-ink bg-gold px-2 font-display text-sm">YOU</span>}
              <div className="flex items-center gap-3">
                {m ? <ChogAvatar id={m.chogId} size={52} role={role} ring={me ? "#ffd23f" : undefined} /> : <span className="grid h-[52px] w-[52px] place-items-center rounded-full border-[3px] border-dashed border-ink font-display text-xl text-ink/40">?</span>}
                <div className="min-w-0">
                  <div className="font-display text-lg leading-none" style={{ color: ROLE_INFO[role].deep }}>
                    {ROLE_INFO[role].name}
                  </div>
                  <div className="truncate text-xs font-bold text-ink/50">{m ? `Chog #${m.chogId}${m.kind === "bot" ? " · bot" : ""}` : "Empty seat"}</div>
                </div>
              </div>
              <div className="mt-3 min-h-[44px] rounded-xl border-2 border-dashed border-ink/25 bg-cream/70 px-2.5 py-2">
                <SeatStatus g={g} role={role} plan={plan} />
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

function Waiting({ text }: { text: string }) {
  return (
    <span className="flex items-center gap-1.5 text-sm font-bold text-ink/45">
      <span className="flex gap-0.5">
        {[0, 1, 2].map((i) => (
          <motion.span key={i} className="h-1.5 w-1.5 rounded-full bg-ink/40" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }} />
        ))}
      </span>
      {text}
    </span>
  );
}

function SeatStatus({ g, role, plan }: { g: GameState; role: Role; plan: Plan }) {
  const { data: rivals } = useRivals(role === "fudder" && !!plan.fud);
  if (role === "trader" || role === "rugger") {
    const tok = tokenOf(g, plan[role]);
    if (!tok) return <Waiting text="Studying charts" />;
    return (
      <span className="flex items-center gap-2">
        <TokenIcon token={tok} size={26} />
        <span className="font-display text-base">${tok.symbol}</span>
        <span className="ml-auto text-xs font-black uppercase" style={{ color: ROLE_INFO[role].deep }}>
          {role === "trader" ? "to pump ▲" : "to crash ▼"}
        </span>
      </span>
    );
  }
  if (role === "whale") {
    if (!plan.split) return <Waiting text="Counting the bag" />;
    const { trader, rugger, cash } = plan.split;
    return (
      <div>
        <div className="flex h-3 overflow-hidden rounded-full border-2 border-ink">
          <div className="bg-green" style={{ width: `${(trader / WHALE_BANK) * 100}%` }} />
          <div className="bg-red" style={{ width: `${(rugger / WHALE_BANK) * 100}%` }} />
          <div className="bg-steel" style={{ width: `${(cash / WHALE_BANK) * 100}%` }} />
        </div>
        <div className="mt-1 flex justify-between font-mono text-[10px] font-bold">
          <span className="text-[#1f9e5a]">{usd(trader)}</span>
          <span className="text-[#c92536]">{usd(rugger)}</span>
          <span className="text-ink/50">{usd(cash)}</span>
        </div>
      </div>
    );
  }
  if (!plan.fud) return <Waiting text="Sharpening FUD" />;
  const target = rivals?.picks.find((p) => p.crewId === plan.fud!.crewId);
  const tok = target ? tokenOf(g, target[plan.fud.side]) : null;
  return (
    <span className="flex items-center gap-2 text-sm font-bold">
      <RoleIcon role="fudder" className="h-4 w-4 text-[#d17600]" />
      <span className="truncate">
        vs {target?.name ?? "a rival"}&apos;s <b>{tok ? `$${tok.symbol}` : "pick"}</b>
      </span>
    </span>
  );
}

// Paper receipt for the round in play: locked yesterday, scored at the next lock
function Receipt({ g }: { g: GameState }) {
  const live = g.live;
  const sc = live?.score;
  const split = live?.split ?? { trader: 0, rugger: 0, cash: WHALE_BANK };
  const tTok = tokenOf(g, live?.trader);
  const rTok = tokenOf(g, live?.rugger);
  const move = (a: string | null | undefined) => (a && live ? (live.moves[a] ?? null) : null);
  const rows: [string, string, number | null, number][] = [
    ["Trader", tTok ? `${usd(split.trader)} on $${tTok.symbol}` : "no pick", move(live?.trader), sc?.trader ?? 0],
    ["Rugger", rTok ? `${usd(split.rugger)} vs $${rTok.symbol}` : "no pick", move(live?.rugger) != null ? -move(live?.rugger)! : null, sc?.rugger ?? 0],
    ["FUDder", live?.fud ? `${usd(FUD_STAKE)} vs a rival` : "no target", null, sc?.fud ?? 0],
    ["Cash", `${usd(split.cash)} kept safe`, null, 0],
  ];
  const total = sc?.total ?? 0;

  return (
    <section className="relative">
      <div className="card relative rounded-b-none border-b-0 px-5 pb-6 pt-5 font-mono" style={{ borderRadius: "18px 18px 0 0" }}>
        <div className="text-center">
          <div className="font-display text-2xl">Yesterday&apos;s plan, live</div>
          <div className="text-[11px] font-bold uppercase tracking-widest text-ink/50">{live ? `Scores at the next lock · real prices` : "Appears after your first lock"}</div>
        </div>
        <div className="my-3 border-t-2 border-dashed border-ink/30" />
        {live ? (
          <ul className="space-y-2.5">
            {rows.map(([k, desc, mv, val]) => (
              <li key={k} className="flex items-start justify-between gap-2 text-sm">
                <div className="min-w-0">
                  <div className="font-bold">{k}</div>
                  <div className="truncate text-[11px] text-ink/55">{desc}</div>
                </div>
                <div className="text-right">
                  <div className={`font-bold tabular-nums ${val > 0 ? "text-[#1f9e5a]" : val < 0 ? "text-[#c92536]" : "text-ink/40"}`}>{k === "Cash" ? "$0" : usd(val, true)}</div>
                  {mv != null && <div className="text-[11px] text-ink/50">{pct(mv)}</div>}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-4 text-center text-sm font-semibold text-ink/55">Make today&apos;s moves. At 15:00 UTC they lock, and this receipt tracks them live on real prices for 24 hours.</p>
        )}
        <div className="my-3 border-t-2 border-dashed border-ink/30" />
        <div className="flex items-center justify-between">
          <span className="font-display text-xl">Crew total</span>
          <AnimatePresence mode="popLayout">
            <motion.span key={Math.round(total)} initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className={`text-2xl font-bold tabular-nums ${total >= 0 ? "text-[#1f9e5a]" : "text-[#c92536]"}`}>
              {usd(total, true)}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>
      <div className="h-4 w-full" style={{ background: "linear-gradient(-45deg, transparent 8px, var(--paper) 0) 0 0 / 16px 16px repeat-x, linear-gradient(45deg, transparent 8px, var(--paper) 0) 0 0 / 16px 16px repeat-x", filter: "drop-shadow(0 3px 0 var(--ink))" }} />
    </section>
  );
}

function Seats({ g, myRole, active, canAct, onPick }: { g: GameState; myRole: Role; active: Role; canAct: (r: Role) => boolean; onPick: (r: Role) => void }) {
  const bots = ROLES.filter((r) => r !== myRole && canAct(r));
  return (
    <section className="panel p-4">
      <h3 className="font-display text-xl text-paper">Crew seats</h3>
      <p className="mt-1 text-sm font-semibold text-paper/60">{bots.length ? "Bots hold some seats. Make their moves, or they pick at random when it locks." : "Every seat has a player. Coordinate in the crew chat."}</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {ROLES.map((r) => {
          const m = g.crew!.members[r];
          return (
            <button
              key={r}
              type="button"
              disabled={!canAct(r) || r === active}
              onClick={() => onPick(r)}
              className="flex items-center gap-2 rounded-2xl border-[3px] border-ink px-2.5 py-2 text-left font-display text-base text-ink transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-default"
              style={{ background: ROLE_INFO[r].color, opacity: canAct(r) || r === active ? 1 : 0.45, boxShadow: r === active ? "0 0 0 3px var(--gold)" : undefined }}
            >
              <RoleIcon role={r} className="h-5 w-5" />
              <span className="leading-none">
                {ROLE_INFO[r].name}
                <span className="block font-sans text-[10px] font-bold opacity-70">{r === myRole ? "you" : m?.kind === "bot" ? "bot · you play it" : m ? `Chog #${m.chogId}` : "empty"}</span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function CrewRadio({ g }: { g: GameState }) {
  const crew = g.crew!;
  const items: { role: Role; text: string }[] = [];
  const plan = g.plan;
  const t = tokenOf(g, plan.trader);
  const r = tokenOf(g, plan.rugger);
  if (t) items.push({ role: "trader", text: `locked $${t.symbol}. "Trust me, it sends."` });
  if (r) items.push({ role: "rugger", text: `is betting $${r.symbol} faceplants.` });
  if (plan.split) items.push({ role: "whale", text: `placed the bag: ${Math.round(plan.split.trader / 100)}% Trader, ${Math.round(plan.split.rugger / 100)}% Rugger.` });
  if (plan.fud) items.push({ role: "fudder", text: "has a rival in the crosshairs." });
  const last = crew.days[crew.days.length - 1];
  if (last) items.push({ role: "whale", text: `Last scored day: ${usd(last.total, true)}.` });
  if (!items.length) items.push({ role: g.me!.role!, text: "Nothing locked yet today. Make your move." });

  return (
    <section className="panel p-4">
      <h3 className="flex items-center gap-2 font-display text-xl text-paper">
        <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red" /> Crew radio
      </h3>
      <ul className="mt-3 space-y-2.5">
        {items.map((it, i) => {
          const m = crew.members[it.role];
          return (
            <motion.li key={`${it.role}-${it.text}`} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="flex items-start gap-2.5">
              {m ? <ChogAvatar id={m.chogId} size={30} /> : <span className="h-[30px] w-[30px] rounded-full bg-white/10" />}
              <p className="text-sm font-semibold leading-snug text-paper/85">
                <b style={{ color: ROLE_INFO[it.role].color }}>{it.role === g.me!.role ? "You" : ROLE_INFO[it.role].name}</b> {it.text}
              </p>
            </motion.li>
          );
        })}
      </ul>
    </section>
  );
}
