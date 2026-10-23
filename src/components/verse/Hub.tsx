"use client";

import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { sfx } from "@/lib/sound";
import { chogImage } from "@/lib/verse/chogs";
import { useNow } from "@/lib/verse/clock";
import { countdown, num } from "@/lib/verse/format";
import { seasonClock } from "@/lib/verse/season";
import { useGame } from "@/lib/verse/api";
import { ModeSwitch } from "./ModeSwitch";

const CineCity = dynamic(() => import("./cine/CineCity").then((m) => m.CineCity), { ssr: false });

type Door = {
  n: string;
  href: string;
  kicker: string;
  title: string;
  body: string;
  cta: string;
  color: string;
  glow: string;
  chogs: number[];
  stat?: { label: string; value: string };
};

/** The front door of Chog Verse: the game, the Hangout and Chog ID. */
export function Hub() {
  const { data: g } = useGame();
  const now = useNow();
  const clock = now ? seasonClock(now) : null;

  const doors: Door[] = [
    {
      n: "01",
      href: "/play",
      kicker: "The game",
      title: "Play",
      body: "Crews of 4 Chogs out-trade the city on real nad.fun prices. Top 3 crews take the vault.",
      cta: "Enter the city",
      color: "#ffc85a",
      glow: "rgba(255,200,90,0.45)",
      chogs: [1798, 561, 900, 1002],
      stat: { label: "Vault opens in", value: clock ? countdown(clock.vaultOpensAt - now).text : "--:--:--" },
    },
    {
      n: "02",
      href: "/hangout",
      kicker: "Rooms & group chats",
      title: "Hangout",
      body: "Drop into #general, start a group chat with your Chogs, and see who's online.",
      cta: "Pull up",
      color: "#ff4fd8",
      glow: "rgba(255,79,216,0.4)",
      chogs: [1481, 1667, 942, 1514],
      stat: { label: "Public rooms", value: "4 + your groups" },
    },
    {
      n: "03",
      href: "/id",
      kicker: "Your Chog's card",
      title: "Chog ID",
      body: "Pick any of the 1,969 Chogs and get a card with its tier and traits. Download it, post it.",
      cta: "Make my card",
      color: "#3fd9ff",
      glow: "rgba(63,217,255,0.4)",
      chogs: [1002, 658, 1047, 1436],
      stat: { label: "Chogs", value: "1,969" },
    },
  ];

  return (
    <div className="relative min-h-dvh overflow-x-clip bg-[#07061a] text-paper">
      <div className="fixed inset-0">
        <CineCity className="absolute inset-0" />
        <div className="absolute inset-0 bg-[#07061a]/55" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,transparent_20%,#07061a_85%)]" />
      </div>

      <nav className="relative z-30 mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-5">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-[#ffe08a] via-[#ffb14a] to-[#ff5e8a] font-display text-lg text-[#1a0b1f] shadow-[0_0_24px_rgba(255,110,140,0.6)]">C</span>
          <span className="whitespace-nowrap font-display text-lg tracking-[0.12em] sm:text-xl">CHOG VERSE</span>
        </Link>
        <ModeSwitch />
      </nav>

      <main className="relative z-10 mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-5 sm:pt-12">
        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2, duration: 0.8 }} className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.4em] text-gold">
          <span className="h-px w-10 bg-gradient-to-r from-transparent to-gold" /> Monad City · Season 01
        </motion.div>
        <h1 className="mt-4 font-display uppercase leading-[0.9]">
          <motion.span initial={{ opacity: 0, y: 60, filter: "blur(16px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ delay: 0.3, duration: 1, ease: [0.16, 1, 0.3, 1] }} className="block text-[clamp(2.6rem,8vw,5.5rem)]">
            Where the Chogs
          </motion.span>
          <motion.span initial={{ opacity: 0, y: 60, filter: "blur(16px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ delay: 0.45, duration: 1, ease: [0.16, 1, 0.3, 1] }} className="block text-[clamp(2.6rem,8vw,5.5rem)]">
            <span className="bg-gradient-to-b from-[#fff3c4] via-[#ffb14a] to-[#ff3f8e] bg-clip-text text-transparent drop-shadow-[0_8px_40px_rgba(255,80,140,0.45)]">come alive</span>
          </motion.span>
        </h1>
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.8 }} className="mt-5 max-w-xl text-base leading-relaxed text-paper/70 sm:text-lg">
          Play the crew game for the <span className="text-gold">$CHOG</span> vault, hang out with other Chogs, and flex your Chog&apos;s card. Pick a door.
        </motion.p>

        <div className="mt-10 grid gap-5 md:grid-cols-3 sm:mt-14">
          {doors.map((d, i) => (
            <DoorCard key={d.n} door={d} index={i} />
          ))}
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }} className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-6 font-mono text-[10px] uppercase tracking-[0.3em] text-paper/40">
          <span>Built for Chogathon 2026 · Powered by Monad</span>
          <span>{g && g.pot > 0 ? `${num(g.pot)} $CHOG in the vault` : ""}</span>
        </motion.div>
      </main>
    </div>
  );
}

function DoorCard({ door: d, index }: { door: Door; index: number }) {
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const rx = useSpring(useTransform(my, [0, 1], [7, -7]), { stiffness: 200, damping: 20 });
  const ry = useSpring(useTransform(mx, [0, 1], [-7, 7]), { stiffness: 200, damping: 20 });
  const light = useTransform([mx, my], ([x, y]: number[]) => `radial-gradient(circle at ${x * 100}% ${y * 100}%, rgba(255,255,255,0.14), transparent 55%)`);

  return (
    <motion.div
      initial={{ opacity: 0, y: 60, filter: "blur(10px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ delay: 0.8 + index * 0.15, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      style={{ perspective: 1200 }}
    >
      <motion.div
        style={{ rotateX: rx, rotateY: ry }}
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          mx.set((e.clientX - r.left) / r.width);
          my.set((e.clientY - r.top) / r.height);
        }}
        onPointerLeave={() => {
          mx.set(0.5);
          my.set(0.5);
        }}
      >
        <Link
          href={d.href}
          onMouseEnter={() => sfx.pop()}
          onClick={() => sfx.whoosh()}
          className="group relative flex min-h-[25rem] flex-col overflow-hidden rounded-[28px] border border-white/12 bg-[#0e0b26]/75 p-6 backdrop-blur-md transition duration-300 hover:border-white/30 sm:min-h-[30rem] sm:p-7"
          style={{ boxShadow: `0 30px 80px rgba(0,0,0,0.5), 0 0 0 1px ${d.color}22` }}
        >
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-60 blur-3xl transition duration-500 group-hover:opacity-100" style={{ background: d.glow }} />
          <motion.div className="pointer-events-none absolute inset-0" style={{ background: light }} />
          <div className="absolute inset-x-0 top-0 h-[3px]" style={{ background: `linear-gradient(90deg, transparent, ${d.color}, transparent)` }} />

          <div className="relative flex items-start justify-between">
            <span className="font-mono text-[11px] uppercase tracking-[0.35em]" style={{ color: d.color }}>
              {d.n} · {d.kicker}
            </span>
            <span className="grid h-10 w-10 place-items-center rounded-full border border-white/15 text-lg transition duration-300 group-hover:translate-x-1 group-hover:border-white/40">→</span>
          </div>

          <div className="relative mt-8 flex">
            {d.chogs.map((id, j) => (
              <span key={id} className="relative -ml-5 first:ml-0 transition duration-500 group-hover:-translate-y-2" style={{ transitionDelay: `${j * 50}ms`, zIndex: 10 - j }}>
                <Image src={chogImage(id)} alt={`Chog #${id}`} width={88} height={88} className="h-[4.5rem] w-[4.5rem] rounded-full border-[3px] border-[#0e0b26] object-cover sm:h-[5.5rem] sm:w-[5.5rem]" style={{ boxShadow: `0 0 0 2px ${d.color}66` }} />
              </span>
            ))}
          </div>

          <h2 className="relative mt-8 font-display text-5xl uppercase leading-none sm:text-6xl" style={{ color: d.color, textShadow: `0 0 40px ${d.glow}` }}>
            {d.title}
          </h2>
          <p className="relative mt-4 text-[15px] leading-relaxed text-paper/70">{d.body}</p>

          <div className="relative mt-auto flex items-end justify-between gap-4 pt-8">
            {d.stat && (
              <div>
                <div className="font-mono text-[9px] uppercase tracking-[0.3em] text-paper/45">{d.stat.label}</div>
                <div className="mt-1 whitespace-nowrap font-display text-xl tabular-nums sm:text-2xl">{d.stat.value}</div>
              </div>
            )}
            <span className="whitespace-nowrap rounded-full px-5 py-2.5 font-display text-sm uppercase tracking-wider text-[#160f2e] transition duration-300 group-hover:scale-105" style={{ background: d.color }}>
              {d.cta}
            </span>
          </div>
        </Link>
      </motion.div>
    </motion.div>
  );
}
