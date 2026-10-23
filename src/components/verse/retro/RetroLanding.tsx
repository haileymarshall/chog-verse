"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { sfx } from "@/lib/sound";
import { chogImage } from "@/lib/verse/chogs";
import { useNow } from "@/lib/verse/clock";
import { CREWS, CREW_COUNT, crewTotal } from "@/lib/verse/crews";
import { countdown, num, usd } from "@/lib/verse/format";
import { ENTRY_FEE, FUD_STAKE, PAYOUT, ROLES, ROLE_INFO, ROLLOVER, WHALE_BANK } from "@/lib/verse/roles";
import { seasonClock } from "@/lib/verse/season";
import { potSize, useVerse } from "@/lib/verse/store";
import type { Role } from "@/lib/verse/types";
import { RoleIcon } from "../icons";
import { PixelCity } from "./PixelCity";

const ROLE_FACES: Record<Role, number> = { whale: 561, trader: 70, rugger: 196, fudder: 61 };
const ROLE_STATS: Record<Role, [string, number][]> = {
  whale: [
    ["BAG", 10],
    ["BRAIN", 7],
    ["RISK", 4],
    ["CHAOS", 2],
  ],
  trader: [
    ["BAG", 4],
    ["BRAIN", 8],
    ["RISK", 7],
    ["CHAOS", 4],
  ],
  rugger: [
    ["BAG", 3],
    ["BRAIN", 6],
    ["RISK", 9],
    ["CHAOS", 8],
  ],
  fudder: [
    ["BAG", 2],
    ["BRAIN", 5],
    ["RISK", 6],
    ["CHAOS", 10],
  ],
};

const STORY = [
  "HEH HEH... I RUGGED MONAD. EVERY $CHOG IN THE CITY IS MINE NOW.",
  "IT'S LOCKED IN THE BANK VAULT. THE DOOR OPENS ONCE EVERY 7 DAYS.",
  "FORM A CREW OF 4 CHOGS. OUT-TRADE EVERYONE. MAYBE YOU'LL GET IT BACK.",
  "...BUT NOBODY HAS EVER SEEN MY FACE. CATCH ME IF YOU CAN.",
];

const TOP = [...CREWS].sort((a, b) => crewTotal(b) - crewTotal(a)).slice(0, 5);

export function RetroLanding() {
  const s = useVerse();
  const now = useNow();
  const clock = now ? seasonClock(now) : null;
  const pot = potSize(s);
  const [role, setRole] = useState<Role>("whale");

  return (
    <div className="relative overflow-x-clip text-paper">
      {/* ================= ATTRACT SCREEN ================= */}
      <section className="relative flex min-h-[100dvh] flex-col overflow-hidden border-b-4 border-black">
        <PixelCity className="absolute inset-0 h-full w-full" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(11,15,42,0.75)_0%,rgba(11,15,42,0.1)_45%,transparent_70%)]" />

        <div className="relative z-10 mx-auto grid w-full max-w-7xl grid-cols-3 px-4 pt-4 font-mono text-xl uppercase sm:text-2xl">
          <div>
            <div className="text-red">1UP</div>
            <div>{String(s.myChog ?? 0).padStart(6, "0")}</div>
          </div>
          <div className="text-center">
            <div className="text-red">HI-SCORE</div>
            <div className="text-gold">{String(pot).padStart(6, "0")}</div>
          </div>
          <div className="text-right">
            <div className="text-red">VAULT</div>
            <div>{clock ? countdown(clock.vaultOpensAt - now).text : "--:--:--"}</div>
          </div>
        </div>

        <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-start px-4 pt-[6vh] text-center">
          <motion.div initial={{ y: -200 }} animate={{ y: 0 }} transition={{ type: "spring", stiffness: 120, damping: 10, delay: 0.2 }}>
            <h1 className="text-outline font-display text-[clamp(4rem,14vw,11rem)] leading-[0.95] text-gold">
              CHOG
              <br />
              <span className="text-paper">VERSE</span>
            </h1>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }} className="mt-6">
            <span className="tape !text-base sm:!text-lg">★ THE GREAT RUG ★</span>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }} className="mt-10 flex flex-col items-center gap-5">
            <Link href="/hideout" onClick={() => sfx.whoosh()} className="btn btn-gold btn-big">
              ▶ PRESS START
            </Link>
            <div className="px-blink font-mono text-2xl uppercase text-paper sm:text-3xl">INSERT COIN · {ENTRY_FEE} $CHOG</div>
          </motion.div>
        </div>

        <div className="relative z-10 mx-auto mb-24 grid w-full max-w-3xl grid-cols-3 gap-3 px-4">
          {[
            ["IN VAULT", num(pot)],
            ["CREWS", String(CREW_COUNT)],
            ["CREDITS", "00"],
          ].map(([l, v]) => (
            <div key={l} className="border-4 border-black bg-black px-3 py-2 text-center shadow-[4px_4px_0_#000]">
              <div className="whitespace-nowrap font-mono text-sm text-sky sm:text-lg">{l}</div>
              <div className="font-display text-lg text-gold sm:text-3xl">{v}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ================= STORY: dialogue box ================= */}
      <section className="relative mx-auto max-w-5xl px-4 py-20">
        <SectionTitle n="1">STORY</SectionTitle>
        <Dialogue />
      </section>

      {/* ================= CHARACTER SELECT ================= */}
      <section className="relative border-y-4 border-black bg-[#1d2b53] py-20">
        <div className="mx-auto max-w-7xl px-4">
          <SectionTitle n="2">SELECT YOUR ROLE</SectionTitle>
          <p className="mt-2 text-center font-mono text-2xl text-paper/70">ANY CHOG · ANY ROLE · PAPER MONEY ON REAL PRICES</p>

          <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
            <div className="grid grid-cols-2 gap-4">
              {ROLES.map((r) => {
                const on = role === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onMouseEnter={() => {
                      if (role !== r) sfx.tick();
                      setRole(r);
                    }}
                    onClick={() => {
                      sfx.pop();
                      setRole(r);
                    }}
                    className={`relative border-4 border-black p-2 text-left shadow-[6px_6px_0_#000] ${on ? "bg-gold text-black" : "bg-black text-paper"}`}
                  >
                    {on && <span className="px-blink absolute -left-7 top-1/2 -translate-y-1/2 font-display text-3xl text-gold">▶</span>}
                    <div className="relative aspect-square overflow-hidden border-4 border-black" style={{ background: ROLE_INFO[r].color }}>
                      <Image src={chogImage(ROLE_FACES[r])} alt={ROLE_INFO[r].name} fill sizes="40px" className="object-cover" />
                    </div>
                    <div className="mt-2 flex items-center justify-between font-display text-xl uppercase sm:text-2xl">
                      {ROLE_INFO[r].name}
                      <RoleIcon role={r} className="h-6 w-6" />
                    </div>
                  </button>
                );
              })}
            </div>

            <AnimatePresence mode="wait">
              <motion.div key={role} initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -30, opacity: 0 }} transition={{ duration: 0.15 }} className="card p-6 sm:p-8">
                <div className="flex items-start gap-5">
                  <div className="relative h-28 w-28 shrink-0 border-4 border-black sm:h-36 sm:w-36" style={{ background: ROLE_INFO[role].color }}>
                    <Image src={chogImage(ROLE_FACES[role])} alt="" fill sizes="48px" className="object-cover" />
                  </div>
                  <div>
                    <div className="font-mono text-xl text-red">P1 · {ROLE_INFO[role].tagline.toUpperCase()}</div>
                    <div className="font-display text-5xl uppercase leading-none">{ROLE_INFO[role].name}</div>
                    <p className="mt-3 text-lg leading-snug">{ROLE_INFO[role].job}</p>
                  </div>
                </div>
                <div className="mt-6 space-y-2">
                  {ROLE_STATS[role].map(([k, v]) => (
                    <div key={k} className="flex items-center gap-3">
                      <span className="w-20 font-mono text-2xl">{k}</span>
                      <div className="flex flex-1 gap-1">
                        {Array.from({ length: 10 }, (_, i) => (
                          <motion.span key={i} initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: i * 0.03 }} className="h-5 flex-1 border-2 border-black" style={{ background: i < v ? ROLE_INFO[role].color : "#c2c3c7" }} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 border-4 border-dashed border-black bg-cream px-4 py-3 font-mono text-xl uppercase">WIN CONDITION: {ROLE_INFO[role].wins}</div>
                <Link href="/hideout" onClick={() => sfx.whoosh()} className="btn btn-red mt-6 w-full">
                  ▶ PLAY AS {ROLE_INFO[role].name.toUpperCase()}
                </Link>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* ================= STAGES ================= */}
      <section className="mx-auto max-w-7xl px-4 py-20">
        <SectionTitle n="3">DAILY STAGES</SectionTitle>
        <div className="relative mt-12 grid gap-6 md:grid-cols-4">
          <div className="absolute left-[12%] right-[12%] top-10 hidden border-t-4 border-dashed border-paper/40 md:block" />
          {[
            ["1-1", "<14:00 UTC", "PICK", "Trader & Rugger lock one token each from the list of 20.", "trader"],
            ["1-2", "14:00 UTC", "REVEAL", "All picks go public. FUDders hunt for prey.", "fudder"],
            ["1-3", "14:00-15:00", "BACK IT", `Whale splits $${num(WHALE_BANK)}. FUDder stakes $${num(FUD_STAKE)}.`, "whale"],
            ["1-4", "15:00 UTC", "LOCKED", "Real prices decide. 7 stages = 1 season.", "rugger"],
          ].map(([stage, time, title, body, r], i) => (
            <motion.div key={stage} initial={{ y: 30, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true, amount: 0.1 }} transition={{ delay: i * 0.1, type: "spring", stiffness: 300, damping: 18 }} className="relative text-center">
              <div className="mx-auto grid h-20 w-20 place-items-center border-4 border-black font-display text-2xl text-black shadow-[6px_6px_0_#000]" style={{ background: ROLE_INFO[r as Role].color }}>
                {stage}
              </div>
              <div className="mt-4 font-mono text-xl text-sky">{time}</div>
              <div className="font-display text-3xl">{title}</div>
              <p className="mx-auto mt-1 max-w-[16rem] text-paper/75">{body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ================= HIGH SCORES ================= */}
      <section className="border-t-4 border-black bg-black py-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 lg:grid-cols-2">
          <div>
            <SectionTitle n="4">HIGH SCORES</SectionTitle>
            <div className="mt-8 space-y-1 font-mono text-2xl uppercase sm:text-3xl">
              {TOP.map((c, i) => (
                <div key={c.id} className={`flex justify-between gap-4 ${["text-gold", "text-paper", "text-orange", "text-sky", "text-pink"][i]}`}>
                  <span>{["1ST", "2ND", "3RD", "4TH", "5TH"][i]}</span>
                  <span className="flex-1 truncate">{c.name}</span>
                  <span>{usd(crewTotal(c))}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <SectionTitle n="5">PRIZE TABLE</SectionTitle>
            <div className="mt-8 space-y-4">
              {[
                ["1ST CREW", PAYOUT[0], "#ffec27"],
                ["2ND CREW", PAYOUT[1], "#c2c3c7"],
                ["3RD CREW", PAYOUT[2], "#ffa300"],
                ["NEXT WEEK", ROLLOVER, "#8f6bff"],
              ].map(([label, share, color], i) => (
                <div key={label as string}>
                  <div className="flex justify-between font-mono text-2xl">
                    <span>{label}</span>
                    <span>{Math.round((share as number) * 100)}%</span>
                  </div>
                  <div className="mt-1 flex h-6 gap-[3px] border-4 border-paper bg-black p-[2px]">
                    {Array.from({ length: 20 }, (_, k) => (
                      <motion.span key={k} className="flex-1" style={{ background: k < (share as number) * 40 ? (color as string) : "transparent" }} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.15 + k * 0.03, duration: 0 }} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mx-auto mt-20 max-w-3xl px-4 text-center">
          <div className="text-outline font-display text-5xl text-paper sm:text-7xl">
            GAME <span className="text-red">START?</span>
          </div>
          <Link href="/hideout" onClick={() => sfx.whoosh()} className="btn btn-gold btn-big mt-10">
            ▶ ENTER THE HIDEOUT
          </Link>
          <div className="mt-12 font-mono text-xl text-paper/50">© 2026 CHOG VERSE · CHOGATHON EDITION · DEMO DATA</div>
        </div>
      </section>
    </div>
  );
}

function SectionTitle({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <div className="text-center">
      <div className="font-mono text-2xl text-red">— LEVEL {n} —</div>
      <h2 className="text-outline-sm mt-1 font-display text-4xl text-paper sm:text-6xl">{children}</h2>
    </div>
  );
}

// RPG-style dialogue: The Rugger talks, text types out, click to advance
function Dialogue() {
  const [line, setLine] = useState(0);
  const [shown, setShown] = useState(0);
  const text = STORY[line];
  const done = shown >= text.length;

  useEffect(() => {
    if (done) return;
    const id = setTimeout(() => setShown((n) => n + 1), 28);
    return () => clearTimeout(id);
  }, [shown, done]);

  const next = () => {
    if (!done) return setShown(text.length);
    sfx.tick();
    setLine((l) => (l + 1) % STORY.length);
    setShown(0);
  };

  return (
    <button type="button" onClick={next} className="mt-10 block w-full text-left">
      <div className="flex items-end gap-4">
        <div className="relative hidden h-32 w-32 shrink-0 border-4 border-black bg-[#7e2553] shadow-[6px_6px_0_#000] sm:block">
          <Image src={chogImage(61)} alt="" fill sizes="24px" className="object-cover" style={{ filter: "brightness(0) saturate(0)" }} />
          <span className="absolute left-[34%] top-[42%] h-2 w-2 bg-red" />
          <span className="absolute left-[56%] top-[42%] h-2 w-2 bg-red" />
          <span className="absolute inset-x-0 bottom-0 bg-black py-0.5 text-center font-mono text-lg text-red">???</span>
        </div>
        <div className="relative flex-1 border-4 border-paper bg-black p-5 shadow-[0_0_0_4px_#000,8px_8px_0_4px_#000] sm:p-7">
          <div className="absolute -top-5 left-4 border-4 border-black bg-red px-3 font-display text-lg text-paper">THE RUGGER</div>
          <p className="min-h-[5.5rem] font-mono text-2xl leading-snug sm:text-3xl">
            {text.slice(0, shown)}
            {!done && <span className="px-blink">█</span>}
          </p>
          <div className="mt-2 flex items-center justify-between font-mono text-xl text-paper/50">
            <span>
              {line + 1}/{STORY.length}
            </span>
            {done && <span className="px-blink text-gold">▼ CLICK</span>}
          </div>
        </div>
      </div>
    </button>
  );
}
