"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { sfx } from "@/lib/sound";
import { api, useGame, type ChatMsg } from "@/lib/verse/api";
import { isChogId } from "@/lib/verse/chogs";
import { HANGOUT_ROOMS, type HangoutGroup, type OnlineChog } from "@/lib/verse/hangout";
import { ChogAvatar } from "./bits";
import { PickChog, SignIn } from "./Hideout";
import { Icon } from "./icons";
import { useToast } from "./providers";
import { SiteNav } from "./SiteNav";

type Feed = {
  me: { id: number; chogId: number; kind: string } | null;
  last: Record<string, number>;
  groups: HangoutGroup[];
  online: OnlineChog[];
  messages: ChatMsg[];
};

const READ_KEY = "hangout-read";
function loadRead(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(READ_KEY) ?? "{}");
  } catch {
    return {};
  }
}

export function Hangout() {
  const { data: g, isLoading } = useGame();

  return (
    <div className="relative min-h-dvh overflow-x-clip bg-[#07061a] text-paper">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_15%_0%,rgba(255,79,216,0.18),transparent_50%),radial-gradient(ellipse_at_90%_100%,rgba(124,92,255,0.22),transparent_55%)]" />
      <SiteNav />
      <main className="relative z-10 mx-auto max-w-7xl px-4 pb-6 sm:px-5">
        {isLoading || !g ? (
          <div className="h-[70vh] animate-pulse rounded-[28px] bg-white/5" />
        ) : !g.session ? (
          <Gate title="Pull up to the Hangout" body="Sign in and pick your Chog. Your Chog is your face in every room." >
            <SignIn />
          </Gate>
        ) : !g.me ? (
          <Gate title="Who's pulling up?" body="Pick the Chog you'll hang out as.">
            <PickChog kind={g.session.kind} />
          </Gate>
        ) : (
          <Rooms myChog={g.me.chogId} />
        )}
      </main>
    </div>
  );
}

function Gate({ title, body, children }: { title: string; body: string; children: React.ReactNode }) {
  return (
    <div>
      <Header />
      <h2 className="mt-6 font-display text-3xl uppercase sm:text-4xl">{title}</h2>
      <p className="mt-2 text-paper/60">{body}</p>
      {children}
    </div>
  );
}

function Header() {
  return (
    <div>
      <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.4em] text-[#ff4fd8]">
        <span className="h-px w-10 bg-gradient-to-r from-transparent to-[#ff4fd8]" /> 02 · Rooms & group chats
      </div>
      <h1 className="mt-2 font-display text-5xl uppercase leading-none sm:text-6xl">
        <span className="bg-gradient-to-b from-[#ffd6f6] to-[#ff4fd8] bg-clip-text text-transparent">Hangout</span>
      </h1>
    </div>
  );
}

function Rooms({ myChog }: { myChog: number }) {
  const toast = useToast();
  const qc = useQueryClient();
  const [room, setRoom] = useState("general");
  const [read, setRead] = useState(loadRead);
  const [creating, setCreating] = useState<number[] | null>(null);
  const [mobileOnline, setMobileOnline] = useState(false);

  const { data } = useQuery({ queryKey: ["hangout", room], queryFn: () => api<Feed>(`/api/hangout?room=${room}`), refetchInterval: 2500 });
  const groups = data?.groups ?? [];
  const online = data?.online ?? [];
  const messages = data?.messages ?? [];
  const lastShown = messages[messages.length - 1]?.id ?? 0;
  const myId = data?.me?.id ?? -1;

  // The open room counts as read; persisted without an extra render
  const seen = useMemo(() => (lastShown > (read[room] ?? 0) ? { ...read, [room]: lastShown } : read), [read, room, lastShown]);
  useEffect(() => {
    try {
      localStorage.setItem(READ_KEY, JSON.stringify(seen));
    } catch {}
  }, [seen]);

  const unread = (key: string, last: number) => last > (seen[key] ?? 0) && key !== room;
  const group = groups.find((x) => x.key === room);
  const pub = HANGOUT_ROOMS.find((r) => r.key === room);
  const inRoom = (key: string) => online.filter((o) => o.room === key).length;

  const open = (key: string) => {
    sfx.tick();
    setRead(seen);
    setRoom(key);
    setMobileOnline(false);
  };

  const run = async (body: object) => {
    try {
      const out = await api<{ room?: string }>("/api/hangout", body);
      await qc.invalidateQueries({ queryKey: ["hangout"] });
      return out;
    } catch (e) {
      toast({ title: "Didn't work", body: (e as Error).message, tone: "red" });
      return null;
    }
  };

  const dm = async (chogId: number) => {
    const existing = groups.find((x) => x.chogs.length === 2 && x.chogs.includes(chogId));
    if (existing) return open(existing.key);
    const out = await run({ action: "create", chogs: [chogId] });
    if (out?.room) open(out.room);
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <Header />
        <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.25em] text-paper/50">
          <span className="h-2 w-2 animate-pulse rounded-full bg-green" /> {online.length} Chog{online.length === 1 ? "" : "s"} online
        </div>
      </div>

      {/* Phone: rooms as a scroll strip */}
      <div className="thin-scroll -mx-4 mt-5 flex gap-2 overflow-x-auto px-4 pb-1 lg:hidden">
        {HANGOUT_ROOMS.map((r) => (
          <button key={r.key} type="button" onClick={() => open(r.key)} className={`relative shrink-0 rounded-full border px-4 py-2 font-display text-sm transition ${room === r.key ? "border-transparent text-[#160f2e]" : "border-white/12 text-paper/70"}`} style={room === r.key ? { background: r.color } : undefined}>
            #{r.name}
            {unread(r.key, data?.last[r.key] ?? 0) && <Dot />}
          </button>
        ))}
        {groups.map((x) => (
          <button key={x.key} type="button" onClick={() => open(x.key)} className={`relative shrink-0 rounded-full border px-4 py-2 font-display text-sm transition ${room === x.key ? "border-transparent bg-paper text-[#160f2e]" : "border-white/12 text-paper/70"}`}>
            {x.name}
            {unread(x.key, x.lastId) && <Dot />}
          </button>
        ))}
        <button type="button" onClick={() => setCreating([])} className="shrink-0 rounded-full border border-dashed border-white/25 px-4 py-2 font-display text-sm text-paper/70">
          + Group
        </button>
      </div>

      <div className="mt-4 grid gap-4 lg:mt-6 lg:h-[calc(100dvh-14rem)] lg:min-h-[560px] lg:grid-cols-[250px_1fr_250px]">
        {/* Rooms */}
        <aside className="glass hidden flex-col overflow-hidden lg:flex">
          <div className="thin-scroll flex-1 overflow-y-auto p-3">
            <Label>Public rooms</Label>
            {HANGOUT_ROOMS.map((r) => (
              <RoomButton key={r.key} active={room === r.key} onClick={() => open(r.key)} color={r.color} unread={unread(r.key, data?.last[r.key] ?? 0)} right={inRoom(r.key) ? `● ${inRoom(r.key)}` : undefined}>
                <span className="text-base">{r.emoji}</span> <span className="truncate">#{r.name}</span>
              </RoomButton>
            ))}
            <div className="mt-5 flex items-center justify-between pr-1">
              <Label>Group chats</Label>
              <button type="button" onClick={() => (sfx.pop(), setCreating([]))} aria-label="New group" className="grid h-7 w-7 place-items-center rounded-full bg-[#ff4fd8] font-display text-[#160f2e] transition hover:scale-110">
                +
              </button>
            </div>
            {!groups.length && <p className="px-2 py-2 text-[13px] text-paper/40">No groups yet. Start one with your crew or DM a Chog who&apos;s online.</p>}
            {groups.map((x) => (
              <RoomButton key={x.key} active={room === x.key} onClick={() => open(x.key)} color="#f6f1ff" unread={unread(x.key, x.lastId)}>
                <Faces ids={x.chogs.filter((c) => c !== myChog)} />
                <span className="truncate">{x.name}</span>
              </RoomButton>
            ))}
          </div>
        </aside>

        {/* Chat */}
        <Chat
          room={room}
          title={pub ? `#${pub.name}` : group?.name ?? "…"}
          desc={pub ? pub.desc : group ? `${group.chogs.length} Chogs · only members can read this` : ""}
          color={pub?.color ?? "#f6f1ff"}
          group={group}
          myId={myId}
          messages={messages}
          onSent={() => qc.invalidateQueries({ queryKey: ["hangout", room] })}
          onAdd={(chog) => run({ action: "add", room, chog })}
          onLeave={async () => {
            if ((await run({ action: "leave", room })) !== null) open("general");
          }}
          onOnline={() => setMobileOnline((v) => !v)}
          onlineCount={online.length}
        />

        {/* Online */}
        <aside className={`glass flex-col overflow-hidden ${mobileOnline ? "flex" : "hidden"} lg:flex`}>
          <div className="thin-scroll flex-1 overflow-y-auto p-3">
            <Label>Online now · {online.length}</Label>
            {online.map((o) => {
              const r = HANGOUT_ROOMS.find((x) => x.key === o.room);
              const me = o.playerId === myId;
              return (
                <div key={o.playerId} className="group flex items-center gap-2.5 rounded-2xl px-2 py-2 transition hover:bg-white/5">
                  <div className="relative">
                    <ChogAvatar id={o.chogId} size={36} />
                    <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#0e0b26] bg-green" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold">
                      {me ? "You" : `Chog #${o.chogId}`}
                      {o.kind !== "holder" && <span className="ml-1.5 font-mono text-[9px] uppercase tracking-widest text-paper/35">{o.kind}</span>}
                    </div>
                    <div className="truncate font-mono text-[10px] uppercase tracking-wider text-paper/40">{r ? `in #${r.name}` : "in a group"}</div>
                  </div>
                  {!me && o.kind !== "bot" && (
                    <button type="button" onClick={() => dm(o.chogId)} className="rounded-full border border-white/15 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-paper/70 transition hover:border-[#ff4fd8] hover:text-paper lg:opacity-0 lg:group-hover:opacity-100">
                      DM
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          <div className="border-t border-white/10 p-3">
            <button type="button" onClick={() => setCreating(online.filter((o) => o.playerId !== myId && o.kind !== "bot").slice(0, 3).map((o) => o.chogId))} className="w-full rounded-full bg-[#ff4fd8] py-2.5 font-display text-sm uppercase tracking-wider text-[#160f2e] transition hover:brightness-110">
              Start a group chat
            </button>
          </div>
        </aside>
      </div>

      <AnimatePresence>
        {creating && (
          <NewGroup
            initial={creating}
            myChog={myChog}
            online={online}
            onClose={() => setCreating(null)}
            onCreate={async (name, chogs) => {
              const out = await run({ action: "create", name, chogs });
              if (out?.room) {
                sfx.whoosh();
                setCreating(null);
                open(out.room);
              }
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function Chat(props: {
  room: string;
  title: string;
  desc: string;
  color: string;
  group?: HangoutGroup;
  myId: number;
  messages: ChatMsg[];
  onSent: () => void;
  onAdd: (chog: number) => Promise<unknown>;
  onLeave: () => void;
  onOnline: () => void;
  onlineCount: number;
}) {
  const { room, title, desc, color, group, myId, messages } = props;
  const toast = useToast();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [adding, setAdding] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const last = messages[messages.length - 1]?.id;

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [last, room]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = text.trim();
    if (!t || sending) return;
    setSending(true);
    try {
      await api("/api/hangout", { action: "send", room, text: t });
      setText("");
      sfx.pop();
      props.onSent();
    } catch (err) {
      toast({ title: "Not sent", body: (err as Error).message, tone: "red" });
    } finally {
      setSending(false);
    }
  };

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = Number(adding.replace("#", ""));
    if (!isChogId(n)) return toast({ title: "Pick a Chog", body: "Chogs are numbered 1 to 1969.", tone: "red" });
    await props.onAdd(n);
    setAdding("");
  };

  return (
    <section className="glass flex h-[70dvh] min-h-[480px] flex-col overflow-hidden lg:h-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <div className="truncate font-display text-xl sm:text-2xl" style={{ color }}>
            {title}
          </div>
          <div className="truncate text-[13px] text-paper/50">{desc}</div>
        </div>
        <div className="flex items-center gap-2">
          {group && (
            <>
              <Faces ids={group.chogs} max={5} />
              <form onSubmit={add} className="flex items-center gap-1">
                <input value={adding} onChange={(e) => setAdding(e.target.value)} placeholder="Add #" inputMode="numeric" className="h-8 w-20 rounded-full border border-white/15 bg-white/5 px-3 text-sm text-paper placeholder:text-paper/35 focus:border-[#ff4fd8] focus:outline-none" />
              </form>
              <button type="button" onClick={props.onLeave} className="rounded-full border border-white/15 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-paper/60 transition hover:border-red hover:text-red">
                Leave
              </button>
            </>
          )}
          <button type="button" onClick={props.onOnline} className="rounded-full border border-white/15 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-paper/70 lg:hidden">
            {props.onlineCount} online
          </button>
        </div>
      </div>

      <div ref={listRef} className="thin-scroll flex-1 space-y-3 overflow-y-auto px-4 py-4 sm:px-5">
        {!messages.length && <div className="grid h-full place-items-center text-center text-paper/40">Nobody&apos;s said anything yet. Say gm.</div>}
        <AnimatePresence initial={false}>
          {messages.map((m) => {
            const mine = m.playerId === myId;
            return (
              <motion.div key={m.id} layout initial={{ opacity: 0, y: 14, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: "spring", stiffness: 420, damping: 32 }} className={`flex items-end gap-2.5 ${mine ? "flex-row-reverse" : ""}`}>
                <ChogAvatar id={m.chogId} size={36} />
                <div className={`flex max-w-[78%] flex-col ${mine ? "items-end" : "items-start"}`}>
                  <div className={`mb-1 flex items-center gap-1.5 text-[11px] font-bold text-paper/50 ${mine ? "flex-row-reverse" : ""}`}>
                    <span>{mine ? "You" : `Chog #${m.chogId}`}</span>
                    {m.kind !== "holder" && <span className="font-mono text-[9px] uppercase tracking-widest text-paper/30">{m.kind}</span>}
                    <span className="font-mono text-[10px] text-paper/30">{time(m.at)}</span>
                  </div>
                  <div className={`rounded-2xl px-3.5 py-2 text-[15px] leading-snug ${mine ? "rounded-br-sm bg-gradient-to-br from-[#ffd27a] to-[#ff8fb0] font-semibold text-[#160f2e]" : "rounded-bl-sm border border-white/10 bg-white/[0.07] text-paper"}`}>{m.text}</div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <form onSubmit={send} className="flex items-center gap-2 border-t border-white/10 p-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={group ? `Message ${group.name}` : `Message #${title.replace("#", "")}`}
          maxLength={280}
          className="h-12 min-w-0 flex-1 rounded-full border border-white/12 bg-white/[0.06] px-5 text-paper placeholder:text-paper/35 focus:border-[#ff4fd8]/70 focus:outline-none"
        />
        <button type="submit" disabled={sending} aria-label="Send" className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#ffd27a] to-[#ff8fb0] text-[#160f2e] transition hover:scale-105 active:scale-95">
          <Icon name="send" className="h-5 w-5" />
        </button>
      </form>
    </section>
  );
}

function NewGroup({ initial, myChog, online, onClose, onCreate }: { initial: number[]; myChog: number; online: OnlineChog[]; onClose: () => void; onCreate: (name: string, chogs: number[]) => void }) {
  const [name, setName] = useState("");
  const [chogs, setChogs] = useState<number[]>(initial);
  const [num, setNum] = useState("");
  const suggest = online.filter((o) => o.chogId !== myChog && o.kind !== "bot" && !chogs.includes(o.chogId)).slice(0, 8);

  const add = (id: number) => {
    if (!isChogId(id) || id === myChog || chogs.includes(id) || chogs.length >= 11) return;
    sfx.tick();
    setChogs([...chogs, id]);
  };

  return (
    <motion.div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div initial={{ y: 40, scale: 0.96 }} animate={{ y: 0, scale: 1 }} exit={{ y: 40, scale: 0.96 }} onClick={(e) => e.stopPropagation()} className="glass w-full max-w-md p-6">
        <div className="font-mono text-[11px] uppercase tracking-[0.35em] text-[#ff4fd8]">New group chat</div>
        <h3 className="mt-2 font-display text-3xl uppercase">Who&apos;s in?</h3>
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={32} placeholder="Group name (optional)" className="mt-5 h-12 w-full rounded-full border border-white/12 bg-white/[0.06] px-5 text-paper placeholder:text-paper/35 focus:border-[#ff4fd8]/70 focus:outline-none" />
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            add(Number(num.replace("#", "")));
            setNum("");
          }}
        >
          <input value={num} onChange={(e) => setNum(e.target.value)} inputMode="numeric" placeholder="Add a Chog by number, e.g. 561" className="h-12 min-w-0 flex-1 rounded-full border border-white/12 bg-white/[0.06] px-5 text-paper placeholder:text-paper/35 focus:border-[#ff4fd8]/70 focus:outline-none" />
          <button type="submit" className="rounded-full border border-white/20 px-5 font-display text-sm uppercase">
            Add
          </button>
        </form>
        <div className="mt-4 flex min-h-12 flex-wrap gap-2">
          {chogs.map((id) => (
            <button key={id} type="button" onClick={() => setChogs(chogs.filter((c) => c !== id))} className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 py-1 pl-1 pr-3 text-sm" title="Remove">
              <ChogAvatar id={id} size={28} clickable={false} /> #{id} <span className="text-paper/40">×</span>
            </button>
          ))}
          {!chogs.length && <span className="py-2 text-sm text-paper/40">Add at least one Chog.</span>}
        </div>
        {!!suggest.length && (
          <div className="mt-4">
            <Label>Online now</Label>
            <div className="mt-1 flex flex-wrap gap-2">
              {suggest.map((o) => (
                <button key={o.playerId} type="button" onClick={() => add(o.chogId)} className="flex items-center gap-2 rounded-full border border-dashed border-white/20 py-1 pl-1 pr-3 text-sm text-paper/70 transition hover:border-[#ff4fd8] hover:text-paper">
                  <ChogAvatar id={o.chogId} size={26} clickable={false} /> + #{o.chogId}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-full px-5 py-2.5 font-display text-sm uppercase text-paper/60">
            Cancel
          </button>
          <button type="button" disabled={!chogs.length} onClick={() => onCreate(name, chogs)} className="rounded-full bg-[#ff4fd8] px-6 py-2.5 font-display text-sm uppercase tracking-wider text-[#160f2e] transition hover:brightness-110 disabled:opacity-40">
            Create group
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function RoomButton({ active, onClick, color, unread, right, children }: { active: boolean; onClick: () => void; color: string; unread?: boolean; right?: string; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={`relative mt-1 flex w-full items-center gap-2 rounded-2xl px-3 py-2.5 text-left text-[15px] font-semibold transition ${active ? "bg-white/10 text-paper" : "text-paper/60 hover:bg-white/5 hover:text-paper"}`}>
      {active && <span className="absolute inset-y-2 left-0 w-1 rounded-full" style={{ background: color }} />}
      {children}
      <span className="ml-auto flex items-center gap-1.5">
        {right && <span className="font-mono text-[10px] text-green/70">{right}</span>}
        {unread && <span className="h-2 w-2 rounded-full bg-[#ff4fd8] shadow-[0_0_10px_#ff4fd8]" />}
      </span>
    </button>
  );
}

function Faces({ ids, max = 3 }: { ids: number[]; max?: number }) {
  return (
    <span className="flex shrink-0">
      {ids.slice(0, max).map((id, i) => (
        <span key={id} className={i ? "-ml-2.5" : ""}>
          <ChogAvatar id={id} size={24} clickable={false} />
        </span>
      ))}
      {ids.length > max && <span className="-ml-1.5 grid h-6 w-6 place-items-center rounded-full bg-white/15 font-mono text-[9px]">+{ids.length - max}</span>}
    </span>
  );
}

const Label = ({ children }: { children: React.ReactNode }) => <div className="px-2 pt-1 font-mono text-[10px] uppercase tracking-[0.3em] text-paper/40">{children}</div>;
const Dot = () => <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-[#ff4fd8] shadow-[0_0_8px_#ff4fd8]" />;
const time = (at: number) => new Date(at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
