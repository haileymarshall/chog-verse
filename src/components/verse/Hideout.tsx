"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useConnect, useConnectors, useSignMessage } from "wagmi";
import { sfx } from "@/lib/sound";
import { api, useCall, useGame, useRecruiting, type ChatMsg, type GameState, type Recruit } from "@/lib/verse/api";
import { CHOG_COUNT, TIER_COLOR, chogInfo, chogTier } from "@/lib/verse/chogs";
import { loginMessage } from "@/lib/verse/login";
import { ENTRY_FEE, ROLES, ROLE_INFO } from "@/lib/verse/roles";
import { CHECK_OWNERSHIP, DEMO } from "@/lib/verse/mode";
import type { Role } from "@/lib/verse/types";
import { ChogAvatar, RoleChip } from "./bits";
import { Icon, RoleIcon } from "./icons";
import { useToast } from "./providers";
import { VaultDoor } from "./VaultDoor";

type Pending = { kind: "join"; crew: Recruit; role: Role } | { kind: "start" };

export function Hideout() {
  const { data: g, isLoading } = useGame();
  const [pending, setPending] = useState<Pending | null>(null);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="tape">The lobby · Monad City</span>
          <h1 className="text-outline mt-3 font-display text-5xl text-paper sm:text-6xl">The Hideout</h1>
          <p className="mt-2 max-w-xl font-semibold text-paper/70">Where Chogs meet, talk trash, and form crews for the week. Find three partners.</p>
        </div>
        {g?.crew && (
          <Link href="/hq" className="btn btn-gold" onClick={() => sfx.whoosh()}>
            Go to Crew HQ →
          </Link>
        )}
      </div>

      {isLoading || !g ? (
        <div className="panel mt-8 h-64 animate-pulse" />
      ) : !g.session ? (
        <SignIn />
      ) : !g.me ? (
        <PickChog kind={g.session.kind} />
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-[1.35fr_1fr]">
          <Chat g={g} />
          <div className="space-y-6">
            {g.crew ? <MyCrewCard g={g} /> : <StartCrewCard onStart={() => setPending({ kind: "start" })} />}
            <Recruiting g={g} onJoin={(crew, role) => setPending({ kind: "join", crew, role })} />
          </div>
        </div>
      )}

      <AnimatePresence>{pending && g && <EntryModal g={g} pending={pending} onClose={() => setPending(null)} />}</AnimatePresence>
    </div>
  );
}

/* ---------- Step 1: sign in ---------- */

export function SignIn() {
  const toast = useToast();
  const call = useCall();
  const connectors = useConnectors();
  const { mutateAsync: connect } = useConnect();
  const { mutateAsync: sign } = useSignMessage();
  const [busy, setBusy] = useState<"wallet" | "guest" | null>(null);

  const withWallet = async () => {
    const connector = connectors[0];
    if (!connector || typeof window === "undefined" || !("ethereum" in window)) {
      toast({ title: "No wallet found", body: DEMO ? "Install MetaMask or Rabby, or play with a guest pass." : "Install MetaMask or Rabby to play.", tone: "red" });
      return;
    }
    setBusy("wallet");
    try {
      const { accounts } = await connect({ connector });
      const address = accounts[0];
      const { nonce } = await api<{ nonce: string }>("/api/auth/nonce", {});
      const signature = await sign({ message: loginMessage(address, nonce), account: address });
      await call("/api/auth/verify", { address, signature });
      sfx.chime();
    } catch (e) {
      toast({ title: "Sign in didn't finish", body: (e as Error).message.split("\n")[0].slice(0, 120), tone: "red" });
    } finally {
      setBusy(null);
    }
  };

  const asGuest = async () => {
    setBusy("guest");
    try {
      await call("/api/auth/guest");
      sfx.chime();
    } finally {
      setBusy(null);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="panel mt-8 grid gap-8 p-6 sm:p-10 lg:grid-cols-[1.2fr_1fr]">
      <div>
        <div className="font-mono text-xs font-bold uppercase tracking-widest text-gold">Step 1 of 3</div>
        <h2 className="mt-1 font-display text-4xl text-paper">{DEMO ? "Try Chog Verse" : "Show up with a Chog"}</h2>
        <p className="mt-2 max-w-md font-semibold text-paper/70">
          {DEMO
            ? "This is the demo. Grab a guest pass, pick any Chog, and bots fill the other three seats of your crew. Days are short so you see scores fast."
            : "Connect a wallet and sign a free message. No transaction, no gas. Then pick your Chog and find three more Chogs to fill your crew."}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          {DEMO && (
            <button type="button" onClick={asGuest} disabled={!!busy} className="btn btn-gold btn-big">
              {busy === "guest" ? "Getting your pass…" : "Guest pass"}
            </button>
          )}
          <button type="button" onClick={withWallet} disabled={!!busy} className={`btn btn-big ${DEMO ? "" : "btn-gold"}`}>
            {busy === "wallet" ? "Check your wallet…" : "Connect wallet"}
          </button>
        </div>
        <p className="mt-4 text-sm font-semibold text-paper/50">
          {DEMO ? "Demo crews play free and can't win the vault." : "Entry is 100 test $CHOG on Monad testnet, free from the faucet in your Crew HQ."}
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {[561, 70, 196, 61].map((id, i) => (
          <motion.div key={id} initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 + i * 0.08 }}>
            <ChogAvatar id={id} size={i % 2 ? 72 : 88} role={ROLES[i]} clickable={false} bob />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

/* ---------- Step 2: choose your Chog ---------- */

const TIERS = ["Legendary", "Epic", "Rare", "Uncommon", "Common"];
const PAGE = 24;

type MyChogs = { wallet: string; any: boolean; chogs: number[]; taken: number[] };

export function PickChog({ kind }: { kind: "holder" | "guest" }) {
  const toast = useToast();
  const call = useCall();
  const [busy, setBusy] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [tier, setTier] = useState<string | null>(null);
  const [shown, setShown] = useState(PAGE);
  const { data, isLoading, error } = useQuery({ queryKey: ["mychogs"], queryFn: () => api<MyChogs>("/api/me/chogs") });

  const choose = async (id: number) => {
    setBusy(id);
    try {
      await call("/api/me/chog", { chogId: id });
      sfx.chime();
      toast({ title: `You are Chog #${id}`, body: "Now find a crew or start your own.", tone: "gold" });
    } catch (e) {
      toast({ title: "Can't play that Chog", body: (e as Error).message, tone: "red" });
    } finally {
      setBusy(null);
    }
  };

  const taken = new Set(data?.taken ?? []);
  const ids = !data
    ? []
    : !data.any
      ? data.chogs
      : (() => {
          const q = search.replace(/\D/g, "");
          const all = Array.from({ length: CHOG_COUNT }, (_, i) => i + 1).filter((id) => (!q || String(id).includes(q)) && (!tier || chogTier(id) === tier));
          // Your current Chog first, then free Chogs, then the taken ones
          return [...data.chogs.filter((id) => all.includes(id)), ...all.filter((id) => !data.chogs.includes(id) && !taken.has(id)), ...all.filter((id) => taken.has(id))];
        })();

  const random = () => {
    const free = Array.from({ length: CHOG_COUNT }, (_, i) => i + 1).filter((id) => !taken.has(id));
    sfx.tick();
    setTier(null);
    setShown(PAGE);
    setSearch(String(free[Math.floor(Math.random() * free.length)]));
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="panel mt-8 p-6 sm:p-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="font-mono text-xs font-bold uppercase tracking-widest text-gold">Step 2 of 3</div>
          <h2 className="font-display text-4xl text-paper">Who are you playing as?</h2>
          <p className="font-semibold text-paper/70">
            {data?.any ? "Pick any Chog that nobody else is playing. It becomes your player." : kind === "guest" ? "Pick a loaner Chog for your guest pass." : "These Chogs are in your wallet on Monad."}
          </p>
        </div>
        {data && (
          <span className="chip !bg-night-3 !text-paper">
            <span className="h-2 w-2 rounded-full bg-green" /> {kind === "guest" ? "Guest pass" : `${data.wallet.slice(0, 6)}…${data.wallet.slice(-4)}`}
          </span>
        )}
      </div>

      {data?.any && (
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <input
            value={search}
            inputMode="numeric"
            placeholder="Chog #"
            aria-label="Search by Chog number"
            onChange={(e) => (setSearch(e.target.value), setShown(PAGE))}
            className="h-11 w-40 rounded-2xl border-[3px] border-ink bg-white px-4 font-display text-lg text-ink focus:outline-none focus:ring-4 focus:ring-gold/60"
          />
          <button type="button" onClick={random} className="btn">
            🎲 Random
          </button>
          <div className="flex flex-wrap gap-1.5">
            {TIERS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => (sfx.tick(), setTier(tier === t ? null : t), setShown(PAGE))}
                className={`chip transition ${tier === t ? "-translate-y-0.5 shadow-sticker-sm" : "opacity-60 hover:opacity-100"}`}
                style={{ background: TIER_COLOR[t] }}
              >
                {t}
              </button>
            ))}
          </div>
          <span className="ml-auto font-mono text-xs font-bold text-paper/50">{ids.length.toLocaleString()} Chogs</span>
        </div>
      )}

      {isLoading ? (
        <div className="mt-8 flex items-center gap-3 font-semibold text-paper/60">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-paper/30 border-t-gold" /> {CHECK_OWNERSHIP ? "Reading the Chog contract on Monad…" : "Loading the Chogs…"}
        </div>
      ) : error ? (
        <p className="mt-8 font-semibold text-red">{(error as Error).message}</p>
      ) : !ids.length ? (
        <div className="mt-8 rounded-2xl border border-white/10 p-6">
          {data?.any ? (
            <div className="font-display text-2xl text-paper">No Chog matches that</div>
          ) : (
            <>
              <div className="font-display text-2xl text-paper">No Chogs in this wallet</div>
              <p className="mt-1 font-semibold text-paper/60">{DEMO ? "Grab one on OpenSea, or play now with a guest pass." : "Grab one on OpenSea to play."}</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <a href="https://opensea.io/collection/chog" target="_blank" rel="noreferrer" className="btn btn-gold">
                  Get a Chog
                </a>
                {DEMO && (
                  <button type="button" className="btn" onClick={() => call("/api/auth/guest")}>
                    Use a guest pass
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      ) : (
        <>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {ids.slice(0, shown).map((id, i) => {
              const info = chogInfo(id);
              const isTaken = taken.has(id);
              const isMine = !!data?.any && data.chogs.includes(id);
              return (
                <motion.button
                  key={id}
                  type="button"
                  disabled={busy != null || isTaken}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i % PAGE, 12) * 0.04, type: "spring", stiffness: 200, damping: 16 }}
                  whileHover={isTaken ? undefined : { y: -8 }}
                  whileTap={isTaken ? undefined : { scale: 0.97 }}
                  onClick={() => choose(id)}
                  className={`card group overflow-hidden text-left ${isTaken ? "cursor-not-allowed opacity-45 grayscale" : ""}`}
                >
                  <div className="relative grid place-items-center border-b-[3px] border-ink py-6" style={{ background: `radial-gradient(circle at 50% 40%, ${TIER_COLOR[info.tier]}55, transparent 70%)` }}>
                    <ChogAvatar id={id} size={110} clickable={false} />
                    {isMine && <span className="chip absolute left-2 top-2 !bg-green">Yours</span>}
                  </div>
                  <div className="flex items-center justify-between p-3">
                    <div className="font-display text-xl leading-none">Chog #{id}</div>
                    <span className="chip" style={{ background: TIER_COLOR[info.tier] }}>
                      {info.tier}
                    </span>
                  </div>
                  <div className={`border-t-[3px] border-ink py-2 text-center font-display text-base ${isTaken ? "bg-cream" : "bg-gold"}`}>
                    {busy === id ? "Checking…" : isTaken ? "Taken" : "Play as this Chog"}
                  </div>
                </motion.button>
              );
            })}
          </div>
          {ids.length > shown && (
            <button type="button" onClick={() => (sfx.tick(), setShown(shown + PAGE))} className="btn mx-auto mt-6 flex">
              Show more Chogs
            </button>
          )}
        </>
      )}
    </motion.div>
  );
}

/* ---------- Chat ---------- */

function Chat({ g }: { g: GameState }) {
  const toast = useToast();
  const [channel, setChannel] = useState<"lobby" | "crew">("lobby");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const ch = g.crew ? channel : "lobby";
  const { data, refetch } = useQuery({ queryKey: ["chat", ch], queryFn: () => api<{ messages: ChatMsg[] }>(`/api/chat?channel=${ch}`), refetchInterval: 3_000 });
  const messages = data?.messages ?? [];
  const last = messages[messages.length - 1]?.id;

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [last]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = text.trim();
    if (!t || sending) return;
    setSending(true);
    try {
      await api("/api/chat", { channel: ch, text: t });
      setText("");
      sfx.pop();
      await refetch();
    } catch (err) {
      toast({ title: "Not sent", body: (err as Error).message, tone: "red" });
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="panel flex h-[640px] flex-col overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b-[3px] border-ink bg-night/70 px-4 py-3">
        <div className="flex items-center gap-1">
          {(["lobby", "crew"] as const).map((c) => (
            <button
              key={c}
              type="button"
              disabled={c === "crew" && !g.crew}
              onClick={() => (sfx.tick(), setChannel(c))}
              className={`rounded-full px-3 py-1 font-display text-lg transition disabled:opacity-30 ${ch === c ? "bg-white/10 text-paper" : "text-paper/50 hover:text-paper"}`}
            >
              # {c === "lobby" ? "hideout" : "crew"}
            </button>
          ))}
        </div>
        <span className="chip !bg-green">
          <span className="h-2 w-2 animate-pulse rounded-full bg-ink" /> live
        </span>
      </div>

      <div ref={listRef} className="thin-scroll flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {!messages.length && <div className="grid h-full place-items-center text-center font-semibold text-paper/40">{ch === "crew" ? "Only your crew sees this channel. Plan here." : "Quiet in here. Say gm and find a crew."}</div>}
        <AnimatePresence initial={false}>
          {messages.map((m) => {
            const mine = m.playerId === g.me?.id;
            return (
              <motion.div key={m.id} layout initial={{ opacity: 0, y: 16, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: "spring", stiffness: 400, damping: 30 }} className={`flex items-end gap-2.5 ${mine ? "flex-row-reverse" : ""}`}>
                <ChogAvatar id={m.chogId} size={38} />
                <div className={`flex max-w-[78%] flex-col ${mine ? "items-end" : "items-start"}`}>
                  <div className={`mb-1 flex items-center gap-1.5 text-xs font-extrabold text-paper/60 ${mine ? "flex-row-reverse" : ""}`}>
                    <span>{mine ? "You" : `Chog #${m.chogId}`}</span>
                    {m.kind === "guest" && <span className="text-[10px] uppercase text-paper/35">guest</span>}
                    {m.role && (
                      <span className="flex items-center gap-1 rounded-full border-2 border-ink px-1.5 text-[10px] text-ink" style={{ background: ROLE_INFO[m.role].color }}>
                        <RoleIcon role={m.role} className="h-3 w-3" />
                        {ROLE_INFO[m.role].name}
                      </span>
                    )}
                  </div>
                  <div className={`rounded-2xl border-[2.5px] border-ink px-3.5 py-2 text-[15px] font-semibold text-ink shadow-sticker-sm ${mine ? "rounded-br-sm bg-gold" : "rounded-bl-sm bg-paper"}`}>{m.text}</div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <form onSubmit={send} className="flex items-center gap-2 border-t-[3px] border-ink bg-night/70 p-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={ch === "crew" ? "Talk to your crew…" : g.crew ? "Talk trash, recruit, plot…" : "Say you're looking for a crew…"}
          maxLength={200}
          className="h-12 min-w-0 flex-1 rounded-full border-[3px] border-ink bg-paper px-5 font-semibold text-ink placeholder:text-ink/40 focus:outline-none focus:ring-4 focus:ring-gold/60"
        />
        <button type="submit" disabled={sending} aria-label="Send" className="grid h-12 w-12 shrink-0 place-items-center rounded-full border-[3px] border-ink bg-gold text-ink shadow-sticker-sm transition hover:-translate-y-0.5 active:translate-y-0.5">
          <Icon name="send" className="h-5 w-5" />
        </button>
      </form>
    </section>
  );
}

/* ---------- Crews ---------- */

function StartCrewCard({ onStart }: { onStart: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card relative overflow-hidden p-5">
      <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-gold/40 blur-2xl" />
      <div className="font-mono text-xs font-bold uppercase tracking-widest text-monad-deep">Step 3 of 3</div>
      <h2 className="font-display text-3xl leading-tight">Get a crew</h2>
      <p className="mt-1 font-semibold text-ink/65">Join a crew below that needs your role, or start your own and recruit.</p>
      <button type="button" onClick={() => (sfx.pop(), onStart())} className="btn btn-purple mt-4 w-full">
        <Icon name="users" className="h-5 w-5" /> Start a crew
      </button>
    </motion.div>
  );
}

function MyCrewCard({ g }: { g: GameState }) {
  const toast = useToast();
  const call = useCall();
  const [busy, setBusy] = useState(false);
  if (!g.crew || !g.me?.role) return null;
  const crew = g.crew;
  const empty = ROLES.filter((r) => !crew.members[r]);

  const run = async (path: string, done: string) => {
    setBusy(true);
    try {
      await call(path);
      sfx.pop();
      toast({ title: done, tone: "purple" });
    } catch (e) {
      toast({ title: "Didn't work", body: (e as Error).message, tone: "red" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card overflow-hidden">
      <div className="flex items-center justify-between border-b-[3px] border-ink bg-gold px-5 py-3">
        <div>
          <div className="font-mono text-[10px] font-bold uppercase tracking-widest">Your crew</div>
          <div className="font-display text-2xl leading-none">{crew.name}</div>
        </div>
        <RoleChip role={g.me.role} />
      </div>
      <div className="grid grid-cols-4 gap-2 p-4">
        {ROLES.map((r) => {
          const m = crew.members[r];
          return (
            <div key={r} className="flex flex-col items-center gap-1.5">
              {m ? (
                <ChogAvatar id={m.chogId} size={58} role={r} ring={r === g.me!.role ? "#ffd23f" : undefined} />
              ) : (
                <span className="grid h-[58px] w-[58px] animate-pulse place-items-center rounded-full border-[3px] border-dashed border-ink bg-cream font-display text-2xl text-ink/40">?</span>
              )}
              <span className="text-xs font-extrabold">{r === g.me!.role ? "You" : m?.kind === "bot" ? `${ROLE_INFO[r].name} · bot` : m ? ROLE_INFO[r].name : `Need ${ROLE_INFO[r].name}`}</span>
            </div>
          );
        })}
      </div>
      <div className="space-y-2 px-4 pb-4">
        {DEMO && empty.length > 0 && (
          <button type="button" disabled={busy} onClick={() => run("/api/crew/bots", "Bots took the empty seats")} className="btn w-full">
            Fill {empty.length} empty seat{empty.length > 1 ? "s" : ""} with bots
          </button>
        )}
        <Link href="/hq" onClick={() => sfx.whoosh()} className="btn btn-gold w-full">
          Plan today&apos;s move →
        </Link>
        <button type="button" disabled={busy} onClick={() => confirm("Leave this crew?") && run("/api/crew/leave", "You left the crew")} className="w-full py-1 text-center text-xs font-bold text-ink/45 underline-offset-2 hover:underline">
          Leave crew
        </button>
      </div>
    </motion.div>
  );
}

function Recruiting({ g, onJoin }: { g: GameState; onJoin: (crew: Recruit, role: Role) => void }) {
  const { data } = useRecruiting();
  const list = (data?.crews ?? []).filter((c) => c.id !== g.crew?.id);
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-2xl text-paper">Crews recruiting</h2>
        <span className="font-mono text-xs font-bold text-paper/50">{list.length} open</span>
      </div>
      {!list.length && <div className="panel p-5 text-center font-semibold text-paper/50">No open crews yet. Start one and post in the chat.</div>}
      <div className="thin-scroll max-h-[440px] space-y-3 overflow-y-auto pr-1">
        {list.map((crew, i) => (
          <motion.div key={crew.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }} className="card flex flex-wrap items-center gap-3 p-3" style={{ borderRadius: 18 }}>
            <div className="flex -space-x-3">
              {ROLES.map((r) =>
                crew.members[r] && crew.members[r]!.kind !== "bot" ? (
                  <ChogAvatar key={r} id={crew.members[r]!.chogId} size={34} />
                ) : (
                  <span key={r} className="relative grid h-[34px] w-[34px] place-items-center rounded-full border-[3px] border-dashed border-ink bg-cream font-display text-ink/40">
                    ?
                  </span>
                ),
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate font-display text-lg leading-tight">{crew.name}</div>
              <div className="font-mono text-xs font-bold text-ink/50">needs {crew.open.length}</div>
            </div>
            <div className="flex flex-col gap-1 max-sm:w-full max-sm:flex-row max-sm:flex-wrap">
              {crew.open.map((r) => (
                <button
                  key={r}
                  type="button"
                  disabled={!!g.crew}
                  onClick={() => (sfx.pop(), onJoin(crew, r))}
                  className="flex items-center gap-1 rounded-full border-[2.5px] border-ink px-2.5 py-0.5 text-xs font-extrabold text-ink shadow-sticker-sm transition hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
                  style={{ background: ROLE_INFO[r].color }}
                >
                  <RoleIcon role={r} className="h-3.5 w-3.5" /> Join as {ROLE_INFO[r].name}
                </button>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ---------- Start or join ---------- */

const CREW_NAMES = ["Purple Bandits", "Velvet Rascals", "Midnight Cartel", "Cereal Killers", "Vault Runners", "Sneaky Syndicate", "Chaos Committee"];

function EntryModal({ g, pending, onClose }: { g: GameState; pending: Pending; onClose: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const call = useCall();
  const [name, setName] = useState(CREW_NAMES[(g.me?.chogId ?? 0) % CREW_NAMES.length]);
  const [role, setRole] = useState<Role>(pending.kind === "join" ? pending.role : "trader");
  const [stage, setStage] = useState<"form" | "working">("form");
  const free = DEMO || g.session?.kind === "guest";

  const go = async () => {
    setStage("working");
    sfx.coin();
    try {
      if (pending.kind === "start") await call("/api/crews", { name: name.trim(), role });
      else await call("/api/crew/join", { crewId: pending.crew.id, role });
      if (free && !g.entryPaid) await call("/api/entry");
      sfx.lock();
      toast({ title: pending.kind === "start" ? `${name.trim()} is live` : `Welcome to ${pending.crew.name}`, body: `You're the ${ROLE_INFO[role].name}.`, tone: "gold" });
      // In the demo bots fill the crew at once, so go straight to planning
      router.push(pending.kind === "start" && !DEMO ? "/hideout" : "/hq");
      onClose();
    } catch (e) {
      sfx.fail();
      setStage("form");
      toast({ title: "Didn't work", body: (e as Error).message, tone: "red" });
    }
  };

  return (
    <motion.div className="fixed inset-0 z-[60] grid place-items-center bg-ink/75 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={stage === "form" ? onClose : undefined}>
      <motion.div className="card w-full max-w-lg overflow-hidden" initial={{ y: 60, scale: 0.9 }} animate={{ y: 0, scale: 1 }} exit={{ y: 40, opacity: 0 }} transition={{ type: "spring", stiffness: 260, damping: 22 }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b-[3px] border-ink bg-ink px-5 py-2.5 text-paper">
          <span className="font-display text-xl">{pending.kind === "join" ? `Join ${pending.crew.name}` : "Start a crew"}</span>
          {stage === "form" && (
            <button onClick={onClose} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-full bg-paper text-ink">
              <Icon name="close" className="h-4 w-4" />
            </button>
          )}
        </div>

        {stage === "form" ? (
          <div className="p-5">
            {pending.kind === "start" && (
              <>
                <label className="font-display text-lg" htmlFor="crew-name">
                  Crew name
                </label>
                <div className="mt-1 flex gap-2">
                  <input id="crew-name" value={name} maxLength={24} onChange={(e) => setName(e.target.value)} className="h-12 min-w-0 flex-1 rounded-2xl border-[3px] border-ink bg-white px-4 font-display text-xl focus:outline-none focus:ring-4 focus:ring-gold/60" />
                  <button type="button" onClick={() => (sfx.tick(), setName(CREW_NAMES[(CREW_NAMES.indexOf(name) + 1) % CREW_NAMES.length]))} className="btn !px-3" aria-label="Random name">
                    🎲
                  </button>
                </div>
                <div className="mt-5 font-display text-lg">Your role</div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {ROLES.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => (sfx.tick(), setRole(r))}
                      className={`flex items-center gap-2 rounded-2xl border-[3px] border-ink p-2.5 text-left transition ${role === r ? "-translate-y-0.5 shadow-sticker" : "bg-white opacity-75 hover:opacity-100"}`}
                      style={role === r ? { background: ROLE_INFO[r].color } : undefined}
                    >
                      <span className="grid h-9 w-9 place-items-center rounded-full border-[2.5px] border-ink bg-paper">
                        <RoleIcon role={r} />
                      </span>
                      <span>
                        <span className="block font-display text-lg leading-none">{ROLE_INFO[r].name}</span>
                        <span className="text-[11px] font-bold text-ink/70">{ROLE_INFO[r].tagline}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
            {pending.kind === "join" && (
              <div className="flex items-center gap-4 rounded-2xl border-[3px] border-ink p-4" style={{ background: ROLE_INFO[role].color }}>
                <span className="grid h-14 w-14 place-items-center rounded-full border-[3px] border-ink bg-paper">
                  <RoleIcon role={role} className="h-8 w-8" />
                </span>
                <div>
                  <div className="font-display text-2xl leading-none">You&apos;ll be the {ROLE_INFO[role].name}</div>
                  <p className="mt-1 text-sm font-bold text-ink/80">{ROLE_INFO[role].job}</p>
                </div>
              </div>
            )}

            <div className="mt-5 flex items-center gap-4 rounded-2xl border-[3px] border-dashed border-ink bg-cream p-4">
              <VaultDoor className="h-16 w-16 shrink-0" spinning={false} />
              <div className="flex-1">
                <div className="font-display text-lg leading-tight">{free ? (DEMO ? "Demo entry: free" : "Guest pass entry: free") : `Entry: ${ENTRY_FEE} test $CHOG`}</div>
                <p className="text-sm font-semibold text-ink/65">{DEMO
                    ? pending.kind === "start"
                      ? "Bots take the other three seats. Demo crews can't win the vault."
                      : "Demo crews play free and can't win the vault."
                    : "Pay into the Bank from your Crew HQ. Only crews where all 4 Chogs paid can win the vault."}</p>
              </div>
            </div>
            <button type="button" onClick={go} className="btn btn-gold btn-big mt-5 w-full">
              {pending.kind === "join" ? "Join the crew" : "Start the crew"}
            </button>
          </div>
        ) : (
          <div className="grid place-items-center px-5 py-12">
            <VaultDoor className="h-36 w-36" />
            <div className="mt-6 font-display text-2xl">{pending.kind === "join" ? "Taking your seat…" : "Setting up your crew…"}</div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
