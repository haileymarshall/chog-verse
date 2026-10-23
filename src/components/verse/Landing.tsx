"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { sfx } from "@/lib/sound";
import { useNow } from "@/lib/verse/clock";
import { CREW_COUNT } from "@/lib/verse/crews";
import { countdown, num } from "@/lib/verse/format";
import { FUD_STAKE, PAYOUT, ROLES, ROLE_INFO, ROLLOVER, WHALE_BANK, ENTRY_FEE } from "@/lib/verse/roles";
import { seasonClock } from "@/lib/verse/season";
import { potSize, useVerse } from "@/lib/verse/store";
import { ChogAvatar } from "./bits";
import { Icon, RoleIcon } from "./icons";
import { useToast } from "./providers";
import { Skyline } from "./Skyline";
import { VaultDoor } from "./VaultDoor";
import { WantedPoster } from "./Wanted";

const ROLE_FACES: Record<string, number> = { whale: 561, trader: 70, rugger: 196, fudder: 61 };

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { type: "spring" as const, stiffness: 120, damping: 18 },
};

export function Landing() {
  const s = useVerse();
  const now = useNow();
  const clock = now ? seasonClock(now) : null;
  const toast = useToast();
  const pot = potSize(s);

  const connect = () => {
    sfx.pop();
    toast({ title: "Wallet connect is coming", body: "Use the demo wallet for now. It holds 3 real Chogs.", tone: "purple" });
  };

  return (
    <div className="relative overflow-x-clip">
      {/* ---------- HERO ---------- */}
      <section className="relative min-h-[100dvh] overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute right-[8%] top-[10%] h-28 w-28 rounded-full bg-[#fff3c4] shadow-[0_0_80px_30px_rgba(255,236,170,0.35)]" />
          {Array.from({ length: 40 }, (_, i) => (
            <span
              key={i}
              className="twinkle absolute h-1 w-1 rounded-full bg-white"
              style={{ left: `${(i * 37) % 100}%`, top: `${(i * 53) % 55}%`, animationDelay: `-${(i % 7) * 0.4}s`, opacity: 0.8 }}
            />
          ))}
          <Skyline className="absolute inset-x-0 bottom-0 h-[46vh] w-full" />
        </div>

        <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <span className="grid h-11 w-11 place-items-center rounded-xl border-[3px] border-ink bg-gold text-ink shadow-sticker-sm">
              <Icon name="vault" className="h-6 w-6" />
            </span>
            <span className="text-outline-sm font-display text-2xl text-paper">
              Chog <span className="text-gold">Verse</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={connect} className="btn hidden !py-1.5 !text-base sm:inline-flex">
              Connect wallet
            </button>
            <Link href="/hideout" onClick={() => sfx.whoosh()} className="btn btn-gold !py-1.5 !text-base">
              Play demo
            </Link>
          </div>
        </nav>

        <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-10 px-4 pb-40 pt-6 lg:grid-cols-[1.1fr_1fr] lg:pt-12">
          <div>
            <motion.div initial={{ opacity: 0, rotate: -8, y: -10 }} animate={{ opacity: 1, rotate: -3, y: 0 }} transition={{ delay: 0.1 }}>
              <span className="tape">Season 1 · The Great Rug</span>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, scale: 0.6, rotate: -6 }}
              animate={{ opacity: 1, scale: 1, rotate: -2 }}
              transition={{ type: "spring", stiffness: 180, damping: 12, delay: 0.15 }}
              className="text-outline mt-4 font-display text-[clamp(3.5rem,11vw,8.5rem)] leading-[0.85] text-paper"
            >
              Chog
              <br />
              <span className="text-gold">Verse</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="mt-6 max-w-lg text-lg font-semibold leading-relaxed text-paper/85 sm:text-xl">
              A villain called <b className="text-red">The Rugger</b> drained Monad and locked every <b className="text-gold">$CHOG</b> in the vault. Form a crew of 4 Chogs, out-trade every other crew, and win it back.
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/hideout" onClick={() => sfx.whoosh()} className="btn btn-gold btn-big">
                Join the heist
                <Icon name="spark" className="h-6 w-6" />
              </Link>
              <a href="#story" className="btn btn-big !bg-transparent !text-paper !shadow-none hover:!bg-white/10">
                How it works
              </a>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="mt-10 flex flex-wrap gap-3">
              <Stat label="In the vault" value={`${num(pot)}`} unit="$CHOG" accent="text-gold" />
              <Stat label="Crews racing" value={`${CREW_COUNT}`} unit="crews" />
              <Stat label="Vault opens in" value={clock ? countdown(clock.vaultOpensAt - now).text : "--:--:--"} />
            </motion.div>
          </div>

          <div className="relative mx-auto w-full max-w-[520px]">
            <motion.div initial={{ scale: 0.6, rotate: -30, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 90, damping: 14, delay: 0.2 }} className="relative">
              <div className="absolute inset-[10%] rounded-full bg-gold/30 blur-3xl" />
              <VaultDoor className="relative w-full drop-shadow-[10px_14px_0_rgba(0,0,0,0.35)]" />
            </motion.div>

            {ROLES.map((r, i) => {
              const pos = [
                "left-[-4%] top-[6%]",
                "right-[-2%] top-[2%]",
                "left-[2%] bottom-[2%]",
                "right-[4%] bottom-[-2%]",
              ][i];
              return (
                <motion.div key={r} className={`absolute ${pos}`} initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 260, damping: 14, delay: 0.6 + i * 0.12 }}>
                  <ChogAvatar id={ROLE_FACES[r]} size={86} role={r} bob />
                </motion.div>
              );
            })}

            <motion.div initial={{ x: 80, rotate: 20, opacity: 0 }} animate={{ x: 0, rotate: 8, opacity: 1 }} transition={{ type: "spring", stiffness: 120, damping: 14, delay: 1 }} className="absolute -right-6 top-[38%] hidden xl:block">
              <WantedPoster className="!w-40" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ---------- STORY ---------- */}
      <section id="story" className="relative border-y-[3px] border-ink bg-night-2">
        <div className="caution h-5" />
        <div className="mx-auto max-w-7xl px-4 py-20">
          <motion.div {...fadeUp} className="text-center">
            <span className="tape">Case file #001</span>
            <h2 className="text-outline mt-4 font-display text-5xl text-paper sm:text-6xl">The Great Rug</h2>
          </motion.div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <StoryPanel n={1} title="Monad got rugged" rotate={-1.5}>
              <svg viewBox="0 0 200 110" className="h-full w-full">
                <path d="M10 30 L40 22 L60 34 L85 18 L110 26 L120 24 L135 96 L190 102" fill="none" stroke="#ff4d5e" strokeWidth="7" strokeLinejoin="round" strokeLinecap="round" />
                <path d="M10 30 L40 22 L60 34 L85 18 L110 26 L120 24" fill="none" stroke="#3ddc84" strokeWidth="7" strokeLinejoin="round" strokeLinecap="round" />
                <circle cx="120" cy="24" r="7" fill="#ffd23f" stroke="#160f2e" strokeWidth="3" />
              </svg>
              <span className="stamp absolute right-3 top-3 rotate-[-14deg] text-xl text-red">Rugged</span>
            </StoryPanel>
            <StoryPanel n={2} title="The loot is in the vault" rotate={1}>
              <div className="flex h-full items-center justify-center gap-4">
                <VaultDoor className="h-28 w-28" />
                <div className="font-mono text-sm font-bold text-ink">
                  OPENS EVERY
                  <div className="font-display text-4xl leading-none">7 DAYS</div>
                </div>
              </div>
            </StoryPanel>
            <StoryPanel n={3} title="Crews of 4 take it back" rotate={-0.5}>
              <div className="flex h-full items-center justify-center gap-2">
                {ROLES.map((r) => (
                  <ChogAvatar key={r} id={ROLE_FACES[r]} size={52} role={r} clickable={false} />
                ))}
              </div>
            </StoryPanel>
          </div>

          <motion.p {...fadeUp} className="mx-auto mt-10 max-w-2xl text-center text-lg font-semibold text-paper/80">
            Every week the vault opens. The <b className="text-gold">top 3 crews</b> split everything inside. Every day a new clue about The Rugger drops. On day 7, he&apos;s unmasked.
          </motion.p>
        </div>
      </section>

      {/* ---------- ROLES ---------- */}
      <section className="mx-auto max-w-7xl px-4 py-20">
        <motion.div {...fadeUp} className="text-center">
          <span className="tape">The crew</span>
          <h2 className="text-outline mt-4 font-display text-5xl text-paper sm:text-6xl">Four Chogs. Four jobs.</h2>
          <p className="mx-auto mt-3 max-w-xl font-semibold text-paper/70">Your Chog NFT is your player. Any Chog can take any role. All trading is paper money on real prices.</p>
        </motion.div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {ROLES.map((r, i) => {
            const info = ROLE_INFO[r];
            return (
              <motion.div key={r} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.08 }} whileHover={{ y: -8, rotate: i % 2 ? 1.5 : -1.5 }} className="card relative overflow-hidden">
                <div className="relative h-32 border-b-[3px] border-ink" style={{ background: `linear-gradient(160deg, ${info.color}, ${info.deep})` }}>
                  <div className="absolute inset-0 opacity-25" style={{ backgroundImage: "radial-gradient(#160f2e 1.5px, transparent 1.5px)", backgroundSize: "14px 14px" }} />
                  <RoleIcon role={r} className="absolute right-3 top-3 h-12 w-12 text-ink/30" />
                  <div className="absolute -bottom-10 left-5">
                    <ChogAvatar id={ROLE_FACES[r]} size={84} />
                  </div>
                </div>
                <div className="p-5 pt-12">
                  <div className="font-display text-3xl leading-none">{info.name}</div>
                  <div className="mt-1 text-sm font-extrabold uppercase tracking-wide" style={{ color: info.deep }}>
                    {info.tagline}
                  </div>
                  <p className="mt-3 text-[15px] font-semibold leading-snug text-ink/80">{info.job}</p>
                  <p className="mt-3 rounded-xl border-2 border-dashed border-ink/30 bg-cream/70 px-3 py-2 text-sm font-bold">{info.wins}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ---------- DAY + PAYOUT ---------- */}
      <section className="mx-auto grid max-w-7xl gap-6 px-4 pb-24 lg:grid-cols-[1.3fr_1fr]">
        <motion.div {...fadeUp} className="panel p-6 sm:p-8">
          <h3 className="font-display text-3xl text-paper">A day in the heist</h3>
          <ol className="mt-6 space-y-4">
            {[
              ["Until 14:00 UTC", "Trader & Rugger pick", "One token to pump, one to crash, from the daily list of 20.", "trader"],
              ["14:00 UTC", "Picks go public", "Every crew can see every pick. FUDders start hunting.", "fudder"],
              ["14:00 - 15:00", "Whale backs, FUDder strikes", `The Whale splits $${num(WHALE_BANK)}. The FUDder bets $${num(FUD_STAKE)} against a rival.`, "whale"],
              ["15:00 UTC", "Locked", "Real prices decide. Scored 24 hours later. 7 days = 1 season.", "rugger"],
            ].map(([time, title, body, role], i) => (
              <li key={time} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border-[3px] border-ink font-display text-lg text-ink" style={{ background: ROLE_INFO[role as keyof typeof ROLE_INFO].color }}>
                    {i + 1}
                  </span>
                  {i < 3 && <span className="w-[3px] flex-1 bg-ink/60" />}
                </div>
                <div className="pb-2">
                  <div className="font-mono text-xs font-bold uppercase tracking-widest text-gold">{time}</div>
                  <div className="font-display text-xl text-paper">{title}</div>
                  <p className="text-sm font-semibold text-paper/70">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </motion.div>

        <motion.div {...fadeUp} className="card p-6 sm:p-8">
          <h3 className="font-display text-3xl">Who gets the vault</h3>
          <p className="mt-1 font-semibold text-ink/60">Every Chog pays {ENTRY_FEE} $CHOG to enter. That is the only real money. The rest is paper.</p>
          <div className="mt-6 space-y-3">
            {[
              ["1st crew", PAYOUT[0], "#ffd23f"],
              ["2nd crew", PAYOUT[1], "#d9d4f5"],
              ["3rd crew", PAYOUT[2], "#f0a868"],
              ["Next week's vault", ROLLOVER, "#836ef9"],
            ].map(([label, share, color], i) => (
              <div key={label as string}>
                <div className="flex justify-between font-display text-lg">
                  <span>{label}</span>
                  <span className="font-mono">{Math.round((share as number) * 100)}%</span>
                </div>
                <div className="mt-1 h-5 overflow-hidden rounded-full border-[2.5px] border-ink bg-cream">
                  <motion.div
                    className="h-full border-r-[2.5px] border-ink"
                    style={{ background: color as string }}
                    initial={{ width: 0 }}
                    whileInView={{ width: `${(share as number) * 100 * 2}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.9, delay: i * 0.12, ease: "easeOut" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ---------- FINAL CTA ---------- */}
      <section className="relative border-t-[3px] border-ink bg-night-2">
        <div className="caution h-5" />
        <div className="mx-auto flex max-w-4xl flex-col items-center px-4 py-20 text-center">
          <h2 className="text-outline font-display text-5xl text-paper sm:text-7xl">
            The vault won&apos;t
            <br />
            <span className="text-gold">open itself.</span>
          </h2>
          <Link href="/hideout" onClick={() => sfx.whoosh()} className="btn btn-gold btn-big mt-10">
            Enter the Hideout
          </Link>
          <p className="mt-10 font-mono text-xs font-bold uppercase tracking-widest text-paper/40">Built for Chogathon 2026 · Demo season with sample data</p>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, unit, accent = "text-paper" }: { label: string; value: string; unit?: string; accent?: string }) {
  return (
    <div className="rounded-2xl border-[3px] border-ink bg-night-3/90 px-4 py-2.5 shadow-sticker">
      <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-paper/55">{label}</div>
      <div className={`font-mono text-2xl font-bold tabular-nums ${accent}`}>
        {value} {unit && <span className="font-display text-sm text-paper/70">{unit}</span>}
      </div>
    </div>
  );
}

function StoryPanel({ n, title, rotate, children }: { n: number; title: string; rotate: number; children: React.ReactNode }) {
  return (
    <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: n * 0.1 }} className="card relative p-4" style={{ rotate }}>
      <span className="absolute -left-3 -top-4 grid h-11 w-11 place-items-center rounded-full border-[3px] border-ink bg-gold font-display text-2xl shadow-sticker-sm">{n}</span>
      <div className="relative h-40 overflow-hidden rounded-xl border-[3px] border-ink bg-[#e8e0ff]" style={{ backgroundImage: "radial-gradient(rgba(22,15,46,0.15) 1.5px, transparent 1.5px)", backgroundSize: "12px 12px" }}>
        {children}
      </div>
      <div className="mt-3 font-display text-2xl">{title}</div>
    </motion.div>
  );
}
