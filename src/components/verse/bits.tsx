"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { TIER_COLOR, chogImage, chogInfo } from "@/lib/verse/chogs";
import { ROLE_INFO } from "@/lib/verse/roles";
import { useSkin } from "@/lib/verse/skin";
import type { Role } from "@/lib/verse/types";
import { RoleIcon } from "./icons";
import { useDossier } from "./providers";

type AvatarProps = {
  id: number;
  size?: number;
  role?: Role;
  ring?: string;
  bob?: boolean;
  clickable?: boolean;
  className?: string;
};

// A Chog as a die-cut sticker: ink ring, white border, tier ring, optional role badge
export function ChogAvatar({ id, size = 56, role, ring, bob, clickable = true, className = "" }: AvatarProps) {
  const open = useDossier();
  const skin = useSkin();
  const tier = chogInfo(id).tier;
  const ringColor = ring ?? TIER_COLOR[tier] ?? "#fff";
  const delay = (id % 10) * -0.31;
  const Tag = clickable ? motion.button : motion.div;

  return (
    <Tag
      type={clickable ? "button" : undefined}
      onClick={clickable ? () => open(id) : undefined}
      aria-label={clickable ? `Open Chog #${id} dossier` : undefined}
      className={`relative shrink-0 ${clickable ? "cursor-pointer" : ""} ${className}`}
      style={{ width: size, height: size }}
      animate={bob ? { y: [0, -4, 0] } : undefined}
      transition={bob ? { duration: 2.4, repeat: Infinity, ease: "easeInOut", delay } : undefined}
      whileHover={clickable ? { scale: 1.06, rotate: -3 } : undefined}
      whileTap={clickable ? { scale: 0.95 } : undefined}
    >
      <div
        className="relative h-full w-full overflow-hidden rounded-full bg-white"
        style={{ boxShadow: avatarRing(skin, size, ringColor) }}
      >
        {/* The arcade skin asks for a tiny image so the browser upscales it into real pixels */}
        <Image src={chogImage(id)} alt={`Chog #${id}`} fill sizes={skin === "retro" ? "32px" : `${Math.ceil(size * 2)}px`} className="object-cover" draggable={false} />
      </div>
      {role && (
        <span
          className="absolute -bottom-1 -right-1 grid place-items-center rounded-full border-[2.5px] border-ink text-ink"
          style={{ background: ROLE_INFO[role].color, width: Math.max(20, size * 0.4), height: Math.max(20, size * 0.4) }}
        >
          <RoleIcon role={role} className="h-[62%] w-[62%]" />
        </span>
      )}
    </Tag>
  );
}

function avatarRing(skin: ReturnType<typeof useSkin>, size: number, ring: string) {
  if (skin === "retro") return `0 0 0 ${Math.max(2, size / 22)}px ${ring}, 0 0 0 ${Math.max(4, size / 11)}px #000, ${Math.max(3, size / 14)}px ${Math.max(3, size / 14)}px 0 ${Math.max(4, size / 11)}px #000`;
  if (skin === "cine") return `0 0 0 1.5px ${ring}, 0 0 ${size / 4}px ${ring}66, 0 ${size / 10}px ${size / 4}px rgba(0,0,0,0.55)`;
  return `0 0 0 ${Math.max(2, size / 22)}px ${ring}, 0 0 0 ${Math.max(4, size / 12)}px var(--ink), ${size / 18}px ${size / 14}px 0 ${Math.max(4, size / 12)}px rgba(0,0,0,0.35)`;
}

export function RoleChip({ role, className = "" }: { role: Role; className?: string }) {
  return (
    <span className={`chip ${className}`} style={{ background: ROLE_INFO[role].color }}>
      <RoleIcon role={role} className="h-3.5 w-3.5" />
      {ROLE_INFO[role].name}
    </span>
  );
}

const TOKEN_HUES = ["#836ef9", "#ff4fd8", "#3fd9ff", "#2ff5a8", "#ffc85a", "#ff8a3d", "#ff3b6b", "#9be15d"];
const hueOf = (symbol: string) => TOKEN_HUES[[...symbol].reduce((a, c) => a + c.charCodeAt(0), 0) % TOKEN_HUES.length];

// Token logo from nad.fun, or a coloured coin with its first letter
export function TokenIcon({ token, size = 36 }: { token: { symbol: string; image?: string | null; color?: string }; size?: number }) {
  if (token.image) {
    return (
      <span className="relative shrink-0 overflow-hidden rounded-full border border-white/20 bg-night-3" style={{ width: size, height: size }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- remote nad.fun logos, many hosts */}
        <img src={token.image} alt="" width={size} height={size} loading="lazy" className="h-full w-full object-cover" />
      </span>
    );
  }
  return (
    <span
      className="relative grid shrink-0 place-items-center rounded-full border-[2.5px] border-ink font-display text-white"
      style={{ width: size, height: size, background: `radial-gradient(circle at 35% 30%, #ffffff66, transparent 45%), ${token.color ?? hueOf(token.symbol)}`, fontSize: size * 0.42 }}
    >
      <span className="text-outline-sm" style={{ WebkitTextStrokeWidth: Math.max(2, size / 12) }}>
        {token.symbol[0]}
      </span>
    </span>
  );
}

export function Sparkline({ data, width = 96, height = 32, color, fill = true }: { data: number[]; width?: number; height?: number; color?: string; fill?: boolean }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => [(i / (data.length - 1)) * width, height - 3 - ((v - min) / span) * (height - 6)]);
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const up = data[data.length - 1] >= data[0];
  const c = color ?? (up ? "var(--green)" : "var(--red)");
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible" aria-hidden>
      {fill && <path d={`${d} L${width},${height} L0,${height} Z`} fill={c} opacity={0.18} />}
      <path d={d} fill="none" stroke={c} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r={3} fill={c} stroke="var(--ink)" strokeWidth={1.5} />
    </svg>
  );
}

export function Delta({ value, className = "" }: { value: number; className?: string }) {
  const up = value >= 0;
  return (
    <span className={`font-mono font-bold ${up ? "text-green" : "text-red"} ${className}`}>
      {up ? "▲" : "▼"} {Math.abs(value).toFixed(1)}%
    </span>
  );
}
