"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { useSyncExternalStore, type ReactNode } from "react";
import { isMuted, setMuted, sfx, subscribeMuted } from "@/lib/sound";
import { useNow } from "@/lib/verse/clock";
import { countdown, num } from "@/lib/verse/format";
import { seasonClock } from "@/lib/verse/season";
import { useBoard, useGame, type BoardRow, type GameState } from "@/lib/verse/api";
import { ChogAvatar } from "./bits";
import { Icon, SoundIcon } from "./icons";
import { ModeSwitch } from "./ModeSwitch";
import { Skyline } from "./Skyline";

const NAV = [
  { href: "/hideout", label: "Hideout", icon: "chat" },
  { href: "/hq", label: "Crew HQ", icon: "hq" },
  { href: "/board", label: "Leaderboard", icon: "board" },
  { href: "/vault", label: "Vault", icon: "vault" },
] as const;


// Live headlines from the real game state
function tickerLines(g: GameState | undefined, rows: BoardRow[] | undefined) {
  const out = ["Picks lock every day at 15:00 UTC", "Picks go public at 14:00 UTC. FUDders, get ready"];
  if (g) {
    out.push(`Season ${g.clock.season}, day ${g.clock.day} of 7`);
    out.push(`${g.pot.toLocaleString("en-US")} $CHOG in the vault`);
    const movers = [...g.tokens].sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h)).slice(0, 2);
    for (const t of movers) out.push(`$${t.symbol} ${t.change24h >= 0 ? "up" : "down"} ${Math.abs(t.change24h).toFixed(1)}% in 24h`);
  }
  if (rows?.length) {
    out.push(`${rows.length} crews on the board`);
    const top = rows[0];
    if (top.total !== 0) out.push(`${top.name} lead with ${top.total >= 0 ? "+" : "-"}$${Math.abs(Math.round(top.total)).toLocaleString("en-US")}`);
    const hot = [...rows].sort((a, b) => b.live - a.live)[0];
    if (hot?.live > 0) out.push(`${hot.name} are up $${Math.round(hot.live).toLocaleString("en-US")} on today's locked picks`);
  }
  return out;
}

export function GameShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const { data: g } = useGame();
  const { data: board } = useBoard();
  const ticker = tickerLines(g, board?.rows);
  const now = useNow();
  const clock = now ? seasonClock(now) : null;
  const muted = useSyncExternalStore(subscribeMuted, isMuted, () => false);

  return (
    <div className="relative flex min-h-dvh flex-col">
      <Skyline className="pointer-events-none fixed inset-x-0 bottom-0 -z-10 h-[38vh] w-full opacity-60" lights={false} />

      <header className="sticky top-0 z-40 border-b-[3px] border-ink bg-night/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5">
          <Link href="/play" className="group flex shrink-0 items-center gap-2" onClick={() => sfx.pop()}>
            <span className="grid h-10 w-10 place-items-center rounded-xl border-[3px] border-ink bg-gold text-ink shadow-sticker-sm transition group-hover:-rotate-6">
              <Icon name="vault" className="h-6 w-6" />
            </span>
            <span className="text-outline-sm hidden whitespace-nowrap font-display text-2xl leading-none text-paper sm:block">
              Chog <span className="text-gold">Verse</span>
            </span>
          </Link>

          <nav className="ml-4 hidden items-center gap-1 lg:flex">
            {NAV.map((n) => {
              const active = path.startsWith(n.href);
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  onClick={() => sfx.tick()}
                  className={`relative flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 font-display text-base transition ${active ? "nav-on text-ink" : "text-paper/75 hover:text-paper"}`}
                >
                  {active && <motion.span layoutId="nav-pill" className="nav-pill absolute inset-0 rounded-full border-[3px] border-ink bg-paper shadow-sticker-sm" transition={{ type: "spring", stiffness: 400, damping: 30 }} />}
                  <span className="relative flex items-center gap-1.5">
                    <Icon name={n.icon} className="h-4 w-4" />
                    {n.label}
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <ModeSwitch />
            <Link href="/vault" className="hidden items-center gap-2 rounded-full border-[3px] border-ink bg-gold py-1 pl-1 pr-3 sm:flex text-ink shadow-sticker-sm transition hover:-translate-y-0.5">
              <span className="grid h-7 w-7 place-items-center rounded-full border-2 border-ink bg-paper">
                <Icon name="lock" className="h-4 w-4" />
              </span>
              <span className="font-mono text-sm font-bold">{num(g?.pot ?? 0)}</span>
              <span className="hidden font-display text-sm sm:inline">$CHOG</span>
            </Link>
            <div className="hidden items-center gap-1.5 rounded-full border-[3px] border-ink bg-night-3 px-3 py-1 text-paper 2xl:flex" title="Vault opens at the end of Day 7">
              <Icon name="clock" className="h-4 w-4 text-gold" />
              <span className="whitespace-nowrap font-mono text-sm font-bold tabular-nums">{clock ? countdown(clock.vaultOpensAt - now).text : "--:--:--"}</span>
            </div>
            <button
              type="button"
              aria-label={muted ? "Turn sound on" : "Turn sound off"}
              onClick={() => {
                setMuted(!muted);
                if (muted) sfx.pop();
              }}
              className="grid h-10 w-10 place-items-center rounded-full border-[3px] border-ink bg-paper text-ink shadow-sticker-sm transition hover:-translate-y-0.5"
            >
              <SoundIcon on={!muted} />
            </button>
            {g?.me ? (
              <ChogAvatar id={g.me.chogId} size={38} role={g.me.role ?? undefined} />
            ) : (
              <Link href="/hideout" className="btn btn-purple !px-4 !py-1.5 !text-base">
                Play
              </Link>
            )}
          </div>
        </div>

        <div className="overflow-hidden border-t-2 border-ink/60 bg-ink py-1">
          <div className="marquee flex w-max gap-10 whitespace-nowrap font-mono text-[11px] font-bold uppercase tracking-widest text-gold/90">
            {[...ticker, ...ticker].map((t, i) => (
              <span key={i} className="flex items-center gap-2">
                <span className="text-red">●</span> {t}
              </span>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-28 pt-6 lg:pb-16">{children}</main>

      <nav className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-4 gap-1 rounded-[22px] border-[3px] border-ink bg-paper p-1.5 text-ink shadow-sticker lg:hidden">
        {NAV.map((n) => {
          const active = path.startsWith(n.href);
          return (
            <Link key={n.href} href={n.href} onClick={() => sfx.tick()} className={`relative flex flex-col items-center gap-0.5 rounded-2xl py-1.5 ${active ? "nav-on" : ""}`}>
              {active && <motion.span layoutId="mnav-pill" className="nav-pill absolute inset-0 rounded-2xl border-[2.5px] border-ink bg-gold" transition={{ type: "spring", stiffness: 400, damping: 30 }} />}
              <Icon name={n.icon} className="relative h-5 w-5" />
              <span className="relative font-display text-[11px] leading-none">{n.label.replace("Leaderboard", "Board").replace("Crew ", "")}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
