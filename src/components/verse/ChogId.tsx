"use client";

import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { useState } from "react";
import { sfx } from "@/lib/sound";
import { api, useGame } from "@/lib/verse/api";
import { cardImage, cardPage, type ChogCard } from "@/lib/verse/chogid";
import { CHOG_COUNT, TIER_COLOR, chogImage, chogTier, isChogId } from "@/lib/verse/chogs";
import { num, usd } from "@/lib/verse/format";
import { ROLE_INFO } from "@/lib/verse/roles";
import { useToast } from "./providers";
import { SiteNav } from "./SiteNav";

const LEGENDS = Array.from({ length: CHOG_COUNT }, (_, i) => i + 1).filter((id) => chogTier(id) === "Legendary");
const pctOf = (n: number) => `${((n / CHOG_COUNT) * 100).toFixed(n < 20 ? 2 : 1)}%`;

export function ChogId({ initialId }: { initialId?: number }) {
  const toast = useToast();
  const { data: g } = useGame();
  const [picked, setPicked] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const id = picked ?? initialId ?? g?.me?.chogId ?? 561;
  const { data: card } = useQuery({ queryKey: ["card", id], queryFn: () => api<ChogCard>(`/api/chog/${id}/card`) });

  const pick = (n: number) => {
    if (!isChogId(n)) return toast({ title: "No such Chog", body: "Chogs are numbered 1 to 1969.", tone: "red" });
    sfx.whoosh();
    setPicked(n);
    window.history.replaceState(null, "", cardPage(n));
  };

  const link = () => `${window.location.origin}${cardPage(id)}`;
  const share = () => {
    const text = `Chog #${id} · ${card?.tier ?? chogTier(id)}${card ? ` · rarity #${card.rank} of 1,969` : ""}\n\nGet your Chog ID on Chog Verse 👇`;
    window.open(`https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(link())}`, "_blank", "noopener");
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link());
      toast({ title: "Link copied", body: "Paste it anywhere. It shows the card as a preview.", tone: "green" });
    } catch {
      toast({ title: "Couldn't copy", body: link(), tone: "red" });
    }
  };

  return (
    <div className="relative min-h-dvh overflow-x-clip bg-[#07061a] text-paper">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_80%_0%,rgba(63,217,255,0.16),transparent_50%),radial-gradient(ellipse_at_10%_100%,rgba(124,92,255,0.22),transparent_55%)]" />
      <SiteNav />
      <main className="relative z-10 mx-auto max-w-7xl px-4 pb-16 sm:px-5">
        <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.4em] text-sky">
          <span className="h-px w-10 bg-gradient-to-r from-transparent to-sky" /> 03 · Your Chog&apos;s card
        </div>
        <h1 className="mt-2 font-display text-5xl uppercase leading-none sm:text-6xl">
          <span className="bg-gradient-to-b from-[#d9f7ff] to-[#3fd9ff] bg-clip-text text-transparent">Chog ID</span>
        </h1>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.45fr_1fr]">
          <div>
            <Card id={id} card={card} />
            <div className="mt-5 flex flex-wrap gap-3">
              <a href={cardImage(id)} download={`chog-${id}.png`} onClick={() => sfx.pop()} className="rounded-full bg-sky px-6 py-3 font-display text-sm uppercase tracking-wider text-[#160f2e] transition hover:brightness-110">
                Download PNG
              </a>
              <button type="button" onClick={share} className="rounded-full bg-[#f6f1ff] px-6 py-3 font-display text-sm uppercase tracking-wider text-[#160f2e] transition hover:brightness-95">
                Post on 𝕏
              </button>
              <button type="button" onClick={copy} className="rounded-full border border-white/20 px-6 py-3 font-display text-sm uppercase tracking-wider text-paper/80 transition hover:border-white/50">
                Copy link
              </button>
            </div>
          </div>

          <div className="space-y-5">
            <section className="glass p-5">
              <Label>Pick a Chog</Label>
              <form
                className="mt-3 flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  pick(Number(input.replace("#", "")));
                }}
              >
                <input value={input} onChange={(e) => setInput(e.target.value)} inputMode="numeric" placeholder="Chog # (1 to 1969)" className="h-12 min-w-0 flex-1 rounded-full border border-white/12 bg-white/[0.06] px-5 text-paper placeholder:text-paper/35 focus:border-sky/70 focus:outline-none" />
                <button type="submit" className="rounded-full bg-sky px-5 font-display text-sm uppercase text-[#160f2e]">
                  Show
                </button>
              </form>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={() => pick(1 + Math.floor(Math.random() * CHOG_COUNT))} className="rounded-full border border-white/15 px-4 py-2 text-sm font-bold transition hover:border-white/40">
                  🎲 Random
                </button>
                {g?.me && (
                  <button type="button" onClick={() => pick(g.me!.chogId)} className="rounded-full border border-white/15 px-4 py-2 text-sm font-bold transition hover:border-white/40">
                    My Chog #{g.me.chogId}
                  </button>
                )}
              </div>
              <div className="mt-4">
                <Label>Legendaries</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {LEGENDS.map((n) => (
                    <button key={n} type="button" onClick={() => pick(n)} aria-label={`Chog #${n}`} className={`rounded-full transition hover:scale-110 ${n === id ? "ring-2 ring-gold ring-offset-2 ring-offset-[#0e0b26]" : ""}`}>
                      <Image src={chogImage(n)} alt="" width={40} height={40} className="h-10 w-10 rounded-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <section className="glass p-5">
              <Label>Traits · how many Chogs share it</Label>
              <div className="mt-3 space-y-2.5">
                {!card && <div className="h-32 animate-pulse rounded-2xl bg-white/5" />}
                {card?.traits.map((t) => (
                  <div key={t.type}>
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="font-mono text-[10px] uppercase tracking-widest text-paper/45">{t.type}</span>
                      <span className="min-w-0 flex-1 truncate font-bold">{t.value}</span>
                      <span className={`font-mono text-xs ${t.count <= 20 ? "text-gold" : "text-paper/50"}`}>
                        {num(t.count)} · {pctOf(t.count)}
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/8">
                      <div className="h-full rounded-full bg-gradient-to-r from-sky to-[#7c5cff]" style={{ width: `${Math.max(3, 100 - (t.count / 400) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="glass p-5">
              <Label>In Chog Verse</Label>
              {card && (
                <div className="mt-3 grid grid-cols-3 gap-3 text-center">
                  <Stat label="Seasons" value={num(card.seasons)} />
                  <Stat label="Season P&L" value={card.crew ? usd(card.crew.profit, true) : "–"} tone={card.crew ? (card.crew.profit >= 0 ? "text-green" : "text-red") : ""} />
                  <Stat label="Messages" value={num(card.messages)} />
                </div>
              )}
              {card?.crew && (
                <div className="mt-4 flex items-center gap-2 text-sm">
                  <span className="rounded-full px-3 py-1 font-display text-xs uppercase text-[#160f2e]" style={{ background: ROLE_INFO[card.crew.role].color }}>
                    {ROLE_INFO[card.crew.role].name}
                  </span>
                  <span className="font-bold">{card.crew.name}</span>
                  <span className="text-paper/40">· season {card.crew.season}</span>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

/** The same card as the PNG, live: tilts with the pointer and catches the light */
function Card({ id, card }: { id: number; card?: ChogCard }) {
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const rx = useSpring(useTransform(my, [0, 1], [8, -8]), { stiffness: 180, damping: 18 });
  const ry = useSpring(useTransform(mx, [0, 1], [-10, 10]), { stiffness: 180, damping: 18 });
  const foil = useTransform([mx, my], ([x, y]: number[]) => `linear-gradient(${105 + x * 40}deg, transparent ${20 + y * 20}%, rgba(255,255,255,0.1) ${35 + x * 20}%, rgba(255,79,216,0.08) ${45 + x * 20}%, rgba(63,217,255,0.08) ${55 + x * 20}%, transparent ${70 + y * 20}%)`);
  const tier = card?.tier ?? chogTier(id);
  const color = TIER_COLOR[tier] ?? "#e9dfcc";
  const role = card?.crew ? ROLE_INFO[card.crew.role] : null;
  const legend = tier === "Legendary";

  return (
    <div style={{ perspective: 1400 }}>
      <motion.div
        key={id}
        initial={{ rotateY: -25, opacity: 0, scale: 0.94 }}
        animate={{ rotateY: 0, opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 160, damping: 18 }}
        style={{ rotateX: rx, rotateY: ry, containerType: "inline-size" }}
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          mx.set((e.clientX - r.left) / r.width);
          my.set((e.clientY - r.top) / r.height);
        }}
        onPointerLeave={() => {
          mx.set(0.5);
          my.set(0.5);
        }}
        className="relative aspect-[1200/630] w-full overflow-hidden rounded-[3cqw] bg-[#07061a]"
      >
        <div className="absolute rounded-full" style={{ left: "-13cqw", top: "-10cqw", width: "68cqw", height: "68cqw", background: `radial-gradient(circle, ${color}55 0%, transparent 62%)` }} />
        <div className="absolute rounded-full" style={{ right: "-17cqw", bottom: "-22cqw", width: "63cqw", height: "63cqw", background: "radial-gradient(circle, rgba(124,92,255,0.35) 0%, transparent 65%)" }} />
        <div className="absolute rounded-[3cqw]" style={{ inset: "1.5cqw", border: `0.17cqw solid ${color}66`, boxShadow: legend ? `inset 0 0 4cqw ${color}44` : undefined }} />

        <div className="absolute flex items-center justify-center" style={{ left: 0, top: 0, bottom: 0, width: "45cqw" }}>
          <div className="relative overflow-hidden rounded-full" style={{ width: "36cqw", height: "36cqw", border: `1cqw solid ${color}`, boxShadow: `0 0 6.6cqw ${color}99` }}>
            <Image src={chogImage(id)} alt={`Chog #${id}`} fill sizes="440px" className="object-cover" priority />
          </div>
        </div>

        <div className="absolute flex flex-col justify-center" style={{ left: "45cqw", right: "5.8cqw", top: 0, bottom: 0 }}>
          <div className="font-mono uppercase text-gold" style={{ fontSize: "1.65cqw", letterSpacing: "0.5cqw" }}>
            Chog Verse · Chog ID
          </div>
          <div className="whitespace-nowrap font-display uppercase leading-none" style={{ fontSize: "6.8cqw", marginTop: "1.3cqw" }}>
            Chog #{id}
          </div>
          <div className="flex items-center" style={{ marginTop: "1.8cqw", gap: "1.5cqw" }}>
            <span className="rounded-full font-mono uppercase text-[#160f2e]" style={{ background: color, fontSize: "1.8cqw", padding: "0.6cqw 1.6cqw", letterSpacing: "0.25cqw" }}>
              {tier}
            </span>
            <span className="font-mono text-[#cfc6f5]" style={{ fontSize: "1.8cqw" }}>
              {card ? `RARITY #${card.rank} / 1,969` : "…"}
            </span>
          </div>
          <div className="flex flex-col" style={{ marginTop: "2.4cqw", gap: "0.8cqw" }}>
            {card?.traits.slice(0, 4).map((t) => (
              <div key={t.type} className="flex items-center font-mono" style={{ fontSize: "1.75cqw" }}>
                <span className="uppercase text-[#8f88bd]" style={{ width: "12.5cqw", letterSpacing: "0.15cqw" }}>
                  {t.type}
                </span>
                <span className="min-w-0 flex-1 truncate">{t.value}</span>
                <span className={t.count <= 20 ? "text-gold" : "text-[#8f88bd]"}>{pctOf(t.count)}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center border-t border-white/12 font-mono" style={{ marginTop: "2.4cqw", paddingTop: "1.8cqw", fontSize: "1.75cqw", gap: "1.2cqw" }}>
            {card?.crew && role ? (
              <>
                <span className="rounded-full uppercase text-[#160f2e]" style={{ background: role.color, padding: "0.5cqw 1.3cqw" }}>
                  {role.name}
                </span>
                <span className="truncate">{card.crew.name}</span>
                <span className={card.crew.profit >= 0 ? "text-green" : "text-red"}>{usd(card.crew.profit, true)}</span>
              </>
            ) : (
              <span className="text-[#8f88bd]">{card ? "NO CREW YET · FREE AGENT" : ""}</span>
            )}
          </div>
        </div>

        <motion.div className="pointer-events-none absolute inset-0 mix-blend-screen" style={{ background: foil }} />
        {legend && <div className="foil-sweep pointer-events-none absolute inset-0" />}
      </motion.div>
    </div>
  );
}

function Stat({ label, value, tone = "" }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-2xl bg-white/[0.04] px-2 py-3">
      <div className={`font-display text-xl tabular-nums ${tone}`}>{value}</div>
      <div className="mt-0.5 font-mono text-[9px] uppercase tracking-widest text-paper/40">{label}</div>
    </div>
  );
}

const Label = ({ children }: { children: React.ReactNode }) => <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-paper/45">{children}</div>;

