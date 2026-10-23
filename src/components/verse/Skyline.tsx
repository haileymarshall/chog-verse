"use client";

import { rng } from "@/lib/verse/format";
import { useSkin } from "@/lib/verse/skin";

type Building = { x: number; w: number; h: number; windows: { x: number; y: number; d: number }[] };

function city(seed: number, count: number, minH: number, maxH: number, lit: number): Building[] {
  const r = rng(seed);
  const out: Building[] = [];
  let x = -20;
  for (let i = 0; i < count && x < 1640; i++) {
    const w = 60 + Math.floor(r() * 90);
    const h = minH + Math.floor(r() * (maxH - minH));
    const windows: Building["windows"] = [];
    for (let wy = 400 - h + 18; wy < 380; wy += 22) {
      for (let wx = x + 12; wx < x + w - 14; wx += 18) {
        if (r() < lit) windows.push({ x: wx, y: wy, d: Math.round(r() * 50) / 10 });
      }
    }
    out.push({ x, w, h, windows });
    x += w + Math.floor(r() * 12);
  }
  return out;
}

const FAR = city(3, 30, 120, 260, 0);
const NEAR = city(9, 30, 70, 190, 0.18);

// Monad City at night: two building layers, lit windows, searchlights, and the Bank in the middle
const PALETTE = {
  classic: { far: "#2b1c63", near: "#160f2e", win: "#ffd23f", beam: "#ffe9a8", bankTop: "#4a3596", bankBot: "#2a1b5e", col: "#3a2880", line: "#160f2e" },
  retro: { far: "#1d2b53", near: "#000000", win: "#ffec27", beam: "#29adff", bankTop: "#7e2553", bankBot: "#3b0f2a", col: "#5f1a43", line: "#000000" },
  cine: { far: "#2a1250", near: "#0a0618", win: "#ff7ad9", beam: "#ffb3e6", bankTop: "#3a1a6e", bankBot: "#120830", col: "#2a1458", line: "#05030c" },
};

export function Skyline({ className = "", lights = true }: { className?: string; lights?: boolean }) {
  const p = PALETTE[useSkin() ?? "classic"];
  return (
    <svg viewBox="0 0 1600 400" preserveAspectRatio="xMidYMax slice" className={className} shapeRendering={p === PALETTE.retro ? "crispEdges" : undefined} aria-hidden>
      <defs>
        <linearGradient id="beam" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor={p.beam} stopOpacity="0.55" />
          <stop offset="1" stopColor={p.beam} stopOpacity="0" />
        </linearGradient>
        <linearGradient id="bank" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.bankTop} />
          <stop offset="1" stopColor={p.bankBot} />
        </linearGradient>
      </defs>

      {lights && (
        <g>
          <polygon className="searchlight" points="560,400 520,-200 600,-200" fill="url(#beam)" style={{ animationDelay: "-2s" }} />
          <polygon className="searchlight" points="1060,400 1020,-200 1100,-200" fill="url(#beam)" style={{ animationDelay: "-6s", animationDuration: "11s" }} />
        </g>
      )}

      <g fill={p.far}>
        {FAR.map((b, i) => (
          <rect key={i} x={b.x} y={400 - b.h} width={b.w} height={b.h} />
        ))}
      </g>

      {/* The Bank */}
      <g transform="translate(640 120)">
        <polygon points="0,90 160,20 320,90" fill="url(#bank)" stroke={p.line} strokeWidth="6" strokeLinejoin="round" />
        <rect x="10" y="90" width="300" height="20" fill={p.bankTop} stroke={p.line} strokeWidth="6" />
        {[30, 85, 140, 195, 250].map((x) => (
          <rect key={x} x={x} y="110" width="30" height="150" fill={p.col} stroke={p.line} strokeWidth="5" />
        ))}
        <rect x="0" y="258" width="320" height="30" fill={p.bankTop} stroke={p.line} strokeWidth="6" />
        <circle cx="160" cy="62" r="18" fill="#ffd23f" stroke={p.line} strokeWidth="5" className="neon-flicker" />
        <text x="160" y="70" textAnchor="middle" fontFamily="var(--display-face)" fontSize="22" fill="#160f2e">$</text>
        <text x="160" y="106" textAnchor="middle" fontFamily="var(--display-face)" fontSize="16" letterSpacing="5" fill="#ffd23f" className="neon-flicker">
          MONAD BANK
        </text>
      </g>

      <g fill={p.near}>
        {NEAR.map((b, i) => (
          <rect key={i} x={b.x} y={400 - b.h} width={b.w} height={b.h} />
        ))}
      </g>
      <g fill={p.win}>
        {NEAR.flatMap((b, i) =>
          b.windows.map((w, k) => <rect key={`${i}-${k}`} x={w.x} y={w.y} width="8" height="10" rx="1.5" className="window-glow" style={{ animationDelay: `-${w.d}s` }} />),
        )}
      </g>
      <rect x="0" y="392" width="1600" height="8" fill={p.line} />
    </svg>
  );
}
