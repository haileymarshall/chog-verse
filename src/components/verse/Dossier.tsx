"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, useBoard } from "@/lib/verse/api";
import { TIER_COLOR, chogImage, chogInfo } from "@/lib/verse/chogs";
import { usd } from "@/lib/verse/format";
import { ROLES, ROLE_INFO } from "@/lib/verse/roles";
import type { Role } from "@/lib/verse/types";
import { Icon, RoleIcon } from "./icons";

const HIDDEN_TRAITS = ["Tier", "Naked", "Form", "Base", "Side"];

// Player file: every Chog carries its own record
export function Dossier({ id, onClose }: { id: number; onClose: () => void }) {
  const { data: board } = useBoard();
  const { data: meta } = useQuery({ queryKey: ["chog", id], queryFn: () => api<{ tier: string; traits: Record<string, string> }>(`/api/chog/${id}`), staleTime: Infinity });
  const info = meta ?? chogInfo(id);
  const crew = board?.rows.find((c) => Object.values(c.members).some((m) => m?.chogId === id && m.kind !== "bot")) ?? null;
  const role: Role | null = crew ? (ROLES.find((r) => crew.members[r]?.chogId === id) ?? null) : null;
  const total = crew?.total ?? 0;
  const best = crew?.days.length ? Math.max(...crew.days) : 0;
  const titles = [
    info.tier === "Legendary" || info.tier === "Epic" ? "Big Fish" : null,
    total > 6000 ? "Vault Contender" : null,
    role === "rugger" ? "Professional Pessimist" : null,
    role === "fudder" ? "Licensed Menace" : null,
    role === "whale" ? "Moneybags" : null,
    role === "trader" ? "Chart Whisperer" : null,
    "Season 1 Rookie",
  ].filter(Boolean) as string[];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <motion.div className="fixed inset-0 z-[60] grid place-items-center overflow-y-auto bg-ink/70 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div
        role="dialog"
        aria-label={`Chog #${id} dossier`}
        className="card relative my-8 w-full max-w-2xl overflow-hidden"
        initial={{ y: 60, rotate: -3, scale: 0.9 }}
        animate={{ y: 0, rotate: 0, scale: 1 }}
        exit={{ y: 40, opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b-[3px] border-ink bg-ink px-5 py-2 text-paper">
          <span className="font-mono text-xs font-bold tracking-[0.25em]">CHOG VERSE · PLAYER FILE</span>
          <button onClick={onClose} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-full bg-paper text-ink transition hover:rotate-90">
            <Icon name="close" className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-5 p-5 sm:grid-cols-[240px_1fr]">
          <div>
            {/* Mugshot with height chart */}
            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border-[3px] border-ink bg-[#d9d2ef]">
              <div className="absolute inset-0" style={{ backgroundImage: "repeating-linear-gradient(to bottom, transparent 0 23px, rgba(22,15,46,0.35) 23px 25px)" }} />
              {[6, 5, 4, 3].map((ft, i) => (
                <span key={ft} className="absolute left-1.5 font-mono text-[10px] font-bold text-ink/60" style={{ top: 8 + i * 50 }}>
                  {ft}&apos;
                </span>
              ))}
              <div className="absolute inset-x-4 bottom-12 top-6">
                <Image src={chogImage(id)} alt={`Chog #${id}`} fill sizes="240px" className="rounded-xl object-cover" />
              </div>
              <div className="absolute inset-x-3 bottom-2 rounded-md border-2 border-ink bg-ink px-2 py-1 text-center font-mono text-sm font-bold text-paper">
                CHOG #{String(id).padStart(4, "0")}
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="chip" style={{ background: TIER_COLOR[info.tier] }}>
                {info.tier}
              </span>
              {role && (
                <span className="chip" style={{ background: ROLE_INFO[role].color }}>
                  <RoleIcon role={role} className="h-3.5 w-3.5" /> {ROLE_INFO[role].name}
                </span>
              )}
            </div>
          </div>

          <div className="min-w-0">
            <h2 className="font-display text-4xl leading-none">Chog #{id}</h2>
            <p className="mt-1 font-semibold text-ink/60">{crew ? <>Member of <b className="text-ink">{crew.name}</b></> : "Not in a crew this season. Free agent."}</p>

            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                ["Season P&L", crew ? usd(total, true) : "-", total >= 0 ? "#1f9e5a" : "#c92536"],
                ["Best day", crew?.days.length ? usd(best, true) : "-", "#160f2e"],
                ["Seasons", "1", "#160f2e"],
              ].map(([k, v, c]) => (
                <div key={k} className="rounded-xl border-[2.5px] border-ink bg-cream px-2 py-2 text-center">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-ink/50">{k}</div>
                  <div className="font-mono text-base font-bold" style={{ color: c }}>
                    {v}
                  </div>
                </div>
              ))}
            </div>

            <h3 className="mt-5 font-display text-lg">Known titles</h3>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {titles.map((t) => (
                <span key={t} className="chip bg-gold">
                  ★ {t}
                </span>
              ))}
            </div>

            <h3 className="mt-5 font-display text-lg">Distinguishing marks</h3>
            <dl className="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              {Object.keys(info.traits).filter((t) => !HIDDEN_TRAITS.includes(t)).map((t) => (
                <div key={t} className="flex justify-between gap-2 border-b border-dashed border-ink/20 py-0.5">
                  <dt className="font-bold text-ink/50">{t}</dt>
                  <dd className="truncate text-right font-extrabold">{info.traits[t]}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
        <div className="caution h-4" />
      </motion.div>
    </motion.div>
  );
}
