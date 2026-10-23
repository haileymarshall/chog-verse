"use client";

import { usePathname } from "next/navigation";
import { sfx } from "@/lib/sound";
import { MODE, OTHER_MODE_URL, type Mode } from "@/lib/verse/mode";

const LABEL: Record<Mode, string> = { demo: "Demo", live: "Testnet" };
const HINT: Record<Mode, string> = {
  demo: "Solo demo: bots fill your crew, short days, free",
  live: "The real game on Monad testnet: 4 people per crew, no bots",
};

/** Demo / Testnet toggle. Each mode is its own site, so the other side is a link to it. */
export function ModeSwitch({ className = "" }: { className?: string }) {
  const path = usePathname();
  return (
    <div className={`flex shrink-0 items-center rounded-full border-[3px] border-ink bg-night-3 p-0.5 font-display text-xs sm:text-sm ${className}`}>
      {(["demo", "live"] as const).map((m) =>
        m === MODE ? (
          <span key={m} title={HINT[m]} className={`rounded-full px-2.5 py-1 text-ink ${m === "demo" ? "bg-gold" : "bg-green"}`}>
            {LABEL[m]}
          </span>
        ) : OTHER_MODE_URL ? (
          <a key={m} href={`${OTHER_MODE_URL}${path}`} title={HINT[m]} onClick={() => sfx.whoosh()} className="rounded-full px-2.5 py-1 text-paper/60 transition hover:text-paper">
            {LABEL[m]}
          </a>
        ) : (
          <span key={m} title={`${HINT[m]} (not linked yet)`} className="cursor-not-allowed rounded-full px-2.5 py-1 text-paper/30">
            {LABEL[m]}
          </span>
        ),
      )}
    </div>
  );
}
