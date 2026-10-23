"use client";

import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { useRef } from "react";
import { sfx } from "@/lib/sound";
import { chogImage } from "@/lib/verse/chogs";
import { useNow } from "@/lib/verse/clock";
import { countdown, num } from "@/lib/verse/format";
import { ENTRY_FEE, FUD_STAKE, PAYOUT, ROLES, ROLE_INFO, ROLLOVER, WHALE_BANK } from "@/lib/verse/roles";
import { seasonClock } from "@/lib/verse/season";
import { useGame } from "@/lib/verse/api";
import { DEMO } from "@/lib/verse/mode";
import type { Role } from "@/lib/verse/types";
import { ModeSwitch } from "../ModeSwitch";
import { VaultDoor } from "../VaultDoor";

const CineCity = dynamic(() => import("./CineCity").then((m) => m.CineCity), { ssr: false });

const ROLE_FACES: Record<Role, number> = { whale: 561, trader: 70, rugger: 196, fudder: 61 };
const ROLE_GRADE: Record<Role, string> = {
  whale: "linear-gradient(180deg, rgba(63,217,255,0) 50%, rgba(20,60,140,0.85) 80%, #070a24 100%)",
  trader: "linear-gradient(180deg, rgba(47,245,168,0) 50%, rgba(10,90,80,0.85) 80%, #04140f 100%)",
  rugger: "linear-gradient(180deg, rgba(255,59,107,0) 50%, rgba(120,10,50,0.88) 80%, #16040c 100%)",
  fudder: "linear-gradient(180deg, rgba(255,138,61,0) 50%, rgba(130,50,10,0.88) 80%, #160904 100%)",
};

const rise = {
  initial: { opacity: 0, y: 50, filter: "blur(10px)" },
  whileInView: { opacity: 1, y: 0, filter: "blur(0px)" },
  viewport: { once: true, margin: "-100px" },
  transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] as const },
};

export function CineLanding() {
  const { data: g } = useGame();
  const now = useNow();
  const clock = now ? seasonClock(now) : null;
  const pot = g?.pot ?? 0;

  return (
    <div className="relative overflow-x-clip text-paper">
      {/* ================= HERO ================= */}
      <section className="relative flex min-h-[100dvh] flex-col overflow-hidden">
        <CineCity className="absolute inset-0" />
        {/* Colour grade over the 3D scene */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_55%,rgba(7,6,26,0.55),transparent_60%)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#07061a] via-[#07061a]/40 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-[#07061a]/80 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 left-0 w-2/3 bg-gradient-to-r from-[#07061a]/70 via-[#07061a]/25 to-transparent" />

        {/* Letterbox: the opening shot */}
        <motion.div className="pointer-events-none absolute inset-x-0 top-0 z-20 bg-black" initial={{ height: "50vh" }} animate={{ height: "5vh" }} transition={{ duration: 1.8, ease: [0.7, 0, 0.2, 1], delay: 0.2 }} />
        <motion.div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-black" initial={{ height: "50vh" }} animate={{ height: "5vh" }} transition={{ duration: 1.8, ease: [0.7, 0, 0.2, 1], delay: 0.2 }} />

        <nav className="absolute inset-x-0 top-[5vh] z-30 mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-[#ffe08a] via-[#ffb14a] to-[#ff5e8a] font-display text-lg text-[#1a0b1f] shadow-[0_0_24px_rgba(255,110,140,0.6)]">C</span>
            <span className="whitespace-nowrap font-display text-lg tracking-[0.12em] sm:text-xl">CHOG VERSE</span>
          </div>
          <div className="hidden items-center gap-8 font-mono text-[11px] uppercase tracking-[0.3em] text-paper/70 md:flex">
            <a href="#story" className="transition hover:text-paper">How it works</a>
            <a href="#crew" className="transition hover:text-paper">Crew</a>
            <a href="#split" className="transition hover:text-paper">The split</a>
          </div>
          <div className="flex items-center gap-2">
            <ModeSwitch />
            <span className="hidden sm:block">
              <Link href="/hideout" onClick={() => sfx.whoosh()} className="btn btn-gold whitespace-nowrap !py-2 !text-sm">
                {DEMO ? "Play demo" : "Play"}
              </Link>
            </span>
          </div>
        </nav>

        <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center px-5 pb-8 pt-[calc(5vh+6.5rem)]">
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.4, duration: 0.8 }} className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.4em] text-gold">
            <span className="h-px w-10 bg-gradient-to-r from-transparent to-gold" /> Season 01 · Monad City
          </motion.div>
          <h1 className="title-xl mt-4 font-display uppercase leading-[0.9]">
            <motion.span initial={{ opacity: 0, y: 80, filter: "blur(20px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ delay: 1.5, duration: 1.1, ease: [0.16, 1, 0.3, 1] }} className="block text-[clamp(3.25rem,11vw,7.25rem)] text-paper drop-shadow-[0_10px_40px_rgba(0,0,0,0.6)]">
              Chog
            </motion.span>
            <motion.span initial={{ opacity: 0, y: 80, filter: "blur(20px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ delay: 1.7, duration: 1.1, ease: [0.16, 1, 0.3, 1] }} className="relative block text-[clamp(3.25rem,11vw,7.25rem)]">
              <span className="bg-gradient-to-b from-[#fff3c4] via-[#ffb14a] to-[#ff3f8e] bg-clip-text text-transparent drop-shadow-[0_8px_40px_rgba(255,80,140,0.55)]">Verse</span>
              <span className="cine-sweep pointer-events-none absolute inset-0 bg-clip-text text-transparent" aria-hidden>
                Verse
              </span>
            </motion.span>
          </h1>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2.1, duration: 0.8 }} className="mt-5 max-w-xl">
            <p className="text-base leading-relaxed text-paper/70 sm:text-lg">
              Team up with three other Chogs, out-trade every crew in the city, and get the <span className="text-gold">$CHOG</span> out of the vault in the bank. The vault opens every 7 days.
            </p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2.3, duration: 0.8 }} className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/hideout" onClick={() => sfx.whoosh()} className="btn btn-gold btn-big">
              Join a crew
            </Link>
            <a href="#story" className="btn btn-big">
              How it works
            </a>
          </motion.div>
        </div>

        {/* HUD strip */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2.5, duration: 0.8 }} className="relative z-30 mb-[5vh]">
          <div className="mx-auto grid max-w-7xl grid-cols-3 gap-px px-5 pb-5">
            <Hud label="In the vault" value={num(pot)} unit="$CHOG" accent />
            <Hud label="Crews racing" value={g ? `${g.crewCount}` : "–"} />
            <Hud label="Vault opens" value={clock ? countdown(clock.vaultOpensAt - now).text : "--:--:--"} />
          </div>
        </motion.div>
      </section>

      {/* ================= STORY ================= */}
      <section id="story" className="relative mx-auto max-w-7xl px-5 py-28 sm:py-40">
        <Kicker>How it works</Kicker>
        <div className="mt-16 space-y-28 sm:space-y-40">
          <Chapter n="01" title="The Bank holds the $CHOG." body="Every Chog that enters pays 100 $CHOG into the Bank. It all sits in one vault at the end of Monad Avenue.">
            <div className="relative grid aspect-[16/10] place-items-center overflow-hidden rounded-3xl border border-white/10 bg-[#0b0820]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_55%,rgba(255,200,90,0.35),transparent_55%)]" />
              <motion.div initial={{ rotate: -40, scale: 0.8 }} whileInView={{ rotate: 0, scale: 1 }} viewport={{ once: true }} transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }} className="relative w-[58%] drop-shadow-[0_0_60px_rgba(255,190,90,0.45)]">
                <VaultDoor className="w-full" />
              </motion.div>
            </div>
          </Chapter>
          <Chapter n="02" title="Four Chogs team up." body="Your Chog NFT is your player. Find three others in the lobby and split the jobs: Whale, Trader, Rugger and FUDder." flip>
            <div className="relative grid aspect-[16/10] grid-cols-4 overflow-hidden rounded-3xl border border-white/10">
              {ROLES.map((r, i) => (
                <motion.div key={r} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.12, duration: 0.8 }} className="relative overflow-hidden">
                  <Image src={chogImage(ROLE_FACES[r])} alt="" fill sizes="200px" className="object-cover" />
                  <div className="absolute inset-0" style={{ background: ROLE_GRADE[r] }} />
                  <div className="absolute inset-x-0 bottom-3 text-center font-display text-sm uppercase tracking-[0.2em] sm:text-lg">{ROLE_INFO[r].name}</div>
                </motion.div>
              ))}
            </div>
          </Chapter>
          <Chapter n="03" title="The best crews get it out." body="Every day your crew trades on real prices with paper money. When the vault opens, the top 3 crews on the board split what's inside.">
            <div className="relative aspect-[16/10] overflow-hidden rounded-3xl border border-white/10 bg-[#0b0820]">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_10%,rgba(47,245,168,0.25),transparent_60%)]" />
              <svg viewBox="0 0 400 250" className="absolute inset-0 h-full w-full">
                <defs>
                  <linearGradient id="climb" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0" stopColor="#7c5cff" />
                    <stop offset="1" stopColor="#2ff5a8" />
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="4" result="b" />
                    <feMerge>
                      <feMergeNode in="b" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                {Array.from({ length: 9 }, (_, i) => (
                  <line key={i} x1="0" x2="400" y1={i * 30 + 10} y2={i * 30 + 10} stroke="rgba(255,255,255,0.05)" />
                ))}
                <motion.path d="M10 220 L60 200 L100 208 L150 160 L200 170 L250 110 L290 120 L340 60 L390 40" fill="none" stroke="url(#climb)" strokeWidth="4" strokeLinejoin="round" filter="url(#glow)" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 2.2, ease: "easeInOut" }} />
              </svg>
              <div className="absolute right-5 top-5 rounded-full border border-[#2ff5a8]/50 bg-[#2ff5a8]/10 px-3 py-1 font-mono text-xs uppercase tracking-[0.3em] text-[#7dffcb]">Top crew +$7,449</div>
            </div>
          </Chapter>
        </div>
      </section>

      {/* ================= CREW ================= */}
      <section id="crew" className="relative py-24 sm:py-32">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(124,92,255,0.22),transparent_60%)]" />
        <div className="relative mx-auto max-w-7xl px-5">
          <Kicker>Choose your role</Kicker>
          <motion.h2 {...rise} className="mt-5 font-display text-[clamp(3rem,8vw,7rem)] uppercase leading-[0.9]">
            Four Chogs.
            <br />
            <span className="bg-gradient-to-r from-[#ffe08a] via-[#ff8a5c] to-[#ff4fd8] bg-clip-text text-transparent">Four jobs.</span>
          </motion.h2>
          <motion.p {...rise} className="mt-5 max-w-xl text-lg text-paper/65">
            Any Chog can take any role. All trading is paper money on real prices. The only real money is the {ENTRY_FEE} $CHOG to get in.
          </motion.p>
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {ROLES.map((r, i) => (
              <RoleCard key={r} role={r} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ================= DAY ================= */}
      <section className="relative mx-auto max-w-7xl px-5 py-24">
        <Kicker>Every day, 4 moves</Kicker>
        <div className="relative mt-14">
          <div className="absolute left-0 right-0 top-[22px] hidden h-px bg-gradient-to-r from-transparent via-white/25 to-transparent lg:block" />
          <div className="grid gap-10 lg:grid-cols-4">
            {[
              ["Before 14:00 UTC", "Trader & Rugger pick", "One token to pump, one to crash, from the day's list of 20.", "trader"],
              ["14:00 UTC", "Picks go public", "Every crew sees every pick. The FUDders start hunting.", "fudder"],
              ["14:00 – 15:00", "Whale backs the plan", `The Whale splits $${num(WHALE_BANK)}. The FUDder stakes $${num(FUD_STAKE)} against a rival.`, "whale"],
              ["15:00 UTC", "Locked", "Real prices decide. Scored 24 hours later. Seven days make a season.", "rugger"],
            ].map(([time, title, body, role], i) => (
              <motion.div key={time} {...rise} transition={{ ...rise.transition, delay: i * 0.1 }}>
                <span className="relative grid h-11 w-11 place-items-center rounded-full border border-white/20 bg-[#0e0b26] font-mono text-sm" style={{ boxShadow: `0 0 0 6px #07061a, 0 0 30px ${ROLE_INFO[role as Role].color}88` }}>
                  <span className="absolute inset-1.5 rounded-full opacity-30" style={{ background: ROLE_INFO[role as Role].color }} />
                  <span className="relative">0{i + 1}</span>
                </span>
                <div className="mt-6 font-mono text-[11px] uppercase tracking-[0.3em] text-gold">{time}</div>
                <div className="mt-2 font-display text-3xl uppercase">{title}</div>
                <p className="mt-2 text-paper/60">{body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= SPLIT ================= */}
      <section id="split" className="relative overflow-hidden py-28">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-full bg-[radial-gradient(ellipse_70%_60%_at_50%_100%,rgba(255,92,120,0.35),transparent_70%)]" />
        <div className="relative mx-auto max-w-7xl px-5">
          <Kicker>Who walks away with it</Kicker>
          <div className="mt-6 flex flex-wrap items-end gap-x-6 gap-y-2">
            <motion.div {...rise} className="font-display text-[clamp(3.5rem,11vw,9rem)] leading-none">
              <span className="bg-gradient-to-b from-[#fff3c4] to-[#ffb14a] bg-clip-text text-transparent">{num(pot)}</span>
            </motion.div>
            <div className="pb-3 font-display text-2xl uppercase tracking-[0.2em] text-paper/60 sm:pb-6">$CHOG in the vault</div>
          </div>
          <div className="mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 lg:grid-cols-4">
            {[
              ["1st crew", PAYOUT[0], "#ffc85a"],
              ["2nd crew", PAYOUT[1], "#d9d4f5"],
              ["3rd crew", PAYOUT[2], "#ff9a6a"],
              ["Rolls to next week", ROLLOVER, "#9a7bff"],
            ].map(([label, share, color], i) => (
              <motion.div key={label as string} {...rise} transition={{ ...rise.transition, delay: i * 0.08 }} className="relative bg-[#0b0820]/90 p-6 sm:p-8">
                <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-paper/50">{label}</div>
                <div className="mt-3 font-display text-6xl sm:text-7xl" style={{ color: color as string, textShadow: `0 0 40px ${color}66` }}>
                  {Math.round((share as number) * 100)}%
                </div>
                <div className="mt-2 font-mono text-sm text-paper/60">≈ {num(Math.round(pot * (share as number)))} $CHOG</div>
                <div className="absolute inset-x-0 bottom-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= FINAL ================= */}
      <section className="relative overflow-hidden">
        <div className="relative mx-auto flex max-w-5xl flex-col items-center px-5 py-36 text-center">
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,120,90,0.45),rgba(255,63,142,0.15)_45%,transparent_70%)] blur-2xl" />
          <motion.h2 {...rise} className="relative font-display text-[clamp(3rem,9vw,8rem)] uppercase leading-[0.88]">
            The vault won&apos;t
            <br />
            <span className="bg-gradient-to-b from-[#fff3c4] via-[#ffb14a] to-[#ff3f8e] bg-clip-text text-transparent">open itself.</span>
          </motion.h2>
          <motion.div {...rise} className="relative mt-12">
            <Link href="/hideout" onClick={() => sfx.whoosh()} className="btn btn-gold btn-big">
              Enter the Hideout
            </Link>
          </motion.div>
          <p className="relative mt-16 font-mono text-[10px] uppercase tracking-[0.4em] text-paper/35">Built for Chogathon 2026 · Demo season with sample data</p>
        </div>
      </section>
    </div>
  );
}

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <motion.div {...rise} className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.4em] text-gold">
      <span className="h-px w-10 bg-gradient-to-r from-transparent to-gold" />
      {children}
    </motion.div>
  );
}

function Hud({ label, value, unit, accent }: { label: string; value: string; unit?: string; accent?: boolean }) {
  return (
    <div className="border-l border-white/15 px-3 py-1 sm:px-5">
      <div className="font-mono text-[9px] uppercase tracking-[0.3em] text-paper/50 sm:text-[10px]">{label}</div>
      <div className={`mt-1 whitespace-nowrap font-display text-lg tabular-nums sm:text-4xl ${accent ? "text-gold" : "text-paper"}`}>
        {value}
        {unit && <span className="ml-2 hidden font-mono text-xs tracking-widest text-paper/50 sm:inline">{unit}</span>}
      </div>
    </div>
  );
}

function Chapter({ n, title, body, flip, children }: { n: string; title: string; body: string; flip?: boolean; children: React.ReactNode }) {
  return (
    <div className={`grid items-center gap-10 lg:grid-cols-2 lg:gap-16 ${flip ? "lg:[&>*:first-child]:order-2" : ""}`}>
      <motion.div {...rise}>
        <div className="font-display text-[clamp(5rem,12vw,10rem)] leading-none text-transparent" style={{ backgroundImage: "linear-gradient(135deg, #ffd36e, #ff5e8a)", WebkitBackgroundClip: "text", backgroundClip: "text", filter: "drop-shadow(0 0 24px rgba(255,120,120,0.35))" }}>
          {n}
        </div>
        <h3 className="-mt-4 font-display text-[clamp(2.5rem,5.5vw,4.5rem)] uppercase leading-[0.92]">{title}</h3>
        <p className="mt-5 max-w-md text-lg leading-relaxed text-paper/65">{body}</p>
      </motion.div>
      <motion.div {...rise} transition={{ ...rise.transition, delay: 0.15 }}>
        {children}
      </motion.div>
    </div>
  );
}

// Character-select card with a 3D tilt that follows the pointer
function RoleCard({ role, index }: { role: Role; index: number }) {
  const info = ROLE_INFO[role];
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [10, -10]), { stiffness: 200, damping: 20 });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-12, 12]), { stiffness: 200, damping: 20 });
  const glareX = useTransform(mx, [-0.5, 0.5], ["0%", "100%"]);

  return (
    <motion.div {...rise} transition={{ ...rise.transition, delay: index * 0.1 }} style={{ perspective: 1000 }}>
      <motion.div
        ref={ref}
        onPointerMove={(e) => {
          const b = ref.current!.getBoundingClientRect();
          mx.set((e.clientX - b.left) / b.width - 0.5);
          my.set((e.clientY - b.top) / b.height - 0.5);
        }}
        onPointerLeave={() => {
          mx.set(0);
          my.set(0);
        }}
        style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }}
        className="group relative aspect-[3/4.3] overflow-hidden rounded-3xl border border-white/10 bg-[#0b0820] shadow-[0_40px_80px_-30px_rgba(0,0,0,0.9)]"
      >
        <Image src={chogImage(ROLE_FACES[role])} alt={`${info.name} Chog`} fill sizes="(max-width: 1024px) 50vw, 25vw" className="object-cover transition duration-700 group-hover:scale-110" />
        <div className="absolute inset-0" style={{ background: ROLE_GRADE[role] }} />
        <div className="absolute inset-0 opacity-0 mix-blend-overlay transition group-hover:opacity-100" style={{ background: `radial-gradient(circle at 50% 30%, ${info.color}, transparent 60%)` }} />
        <motion.div className="pointer-events-none absolute inset-0 opacity-0 transition group-hover:opacity-100" style={{ background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.22) 50%, transparent 60%)", backgroundSize: "250% 100%", backgroundPositionX: glareX }} />
        <div className="absolute left-5 top-5 font-mono text-[11px] uppercase tracking-[0.3em] text-paper/70">0{index + 1}</div>
        <div className="absolute inset-x-0 bottom-0 p-5" style={{ transform: "translateZ(40px)" }}>
          <div className="font-mono text-[10px] uppercase tracking-[0.3em]" style={{ color: info.color }}>
            {info.tagline}
          </div>
          <div className="mt-1 font-display text-5xl uppercase leading-none">{info.name}</div>
          <p className="mt-3 text-sm leading-snug text-paper/75">{info.job}</p>
          <div className="mt-4 h-px w-full" style={{ background: `linear-gradient(90deg, ${info.color}, transparent)` }} />
          <p className="mt-3 text-xs font-semibold text-paper/60">{info.wins}</p>
        </div>
      </motion.div>
    </motion.div>
  );
}
