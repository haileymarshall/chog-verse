"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { sfx } from "@/lib/sound";
import { ModeSwitch } from "./ModeSwitch";

const LINKS = [
  { href: "/play", label: "Play", color: "#ffc85a" },
  { href: "/hangout", label: "Hangout", color: "#ff4fd8" },
  { href: "/id", label: "Chog ID", color: "#3fd9ff" },
];

/** Top bar for the hub's non-game sections (Hangout, Chog ID) */
export function SiteNav() {
  const path = usePathname();
  return (
    <nav className="relative z-30 mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-5">
      <Link href="/" className="flex shrink-0 items-center gap-2.5" onClick={() => sfx.pop()}>
        <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-[#ffe08a] via-[#ffb14a] to-[#ff5e8a] font-display text-lg text-[#1a0b1f] shadow-[0_0_24px_rgba(255,110,140,0.6)]">C</span>
        <span className="hidden whitespace-nowrap font-display text-lg tracking-[0.12em] sm:inline">CHOG VERSE</span>
      </Link>
      <div className="flex items-center gap-1 rounded-full border border-white/10 bg-[#0e0b26]/70 p-1 backdrop-blur">
        {LINKS.map((l) => {
          const on = path.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => sfx.tick()}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 font-display text-xs uppercase tracking-wider transition sm:px-4 sm:text-sm ${on ? "text-[#160f2e]" : "text-paper/60 hover:text-paper"}`}
              style={on ? { background: l.color } : undefined}
            >
              {l.label}
            </Link>
          );
        })}
      </div>
      <span className="hidden md:block">
        <ModeSwitch />
      </span>
    </nav>
  );
}
