export function usd(n: number, signed = false) {
  const s = Math.abs(Math.round(n)).toLocaleString("en-US");
  if (!signed) return `${n < 0 ? "-" : ""}$${s}`;
  return `${n >= 0 ? "+" : "-"}$${s}`;
}

export function pct(n: number, digits = 1) {
  return `${n >= 0 ? "+" : ""}${n.toFixed(digits)}%`;
}

export function num(n: number) {
  return Math.round(n).toLocaleString("en-US");
}

export function price(p: number) {
  if (p >= 1) return `$${p.toFixed(2)}`;
  if (p >= 0.01) return `$${p.toFixed(4)}`;
  return `$${p.toPrecision(3)}`;
}

export function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function countdown(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return { d, h, m, s: sec, text: `${d > 0 ? `${d}d ` : ""}${pad(h)}:${pad(m)}:${pad(sec)}` };
}

/** Deterministic PRNG so demo data matches on server and client */
export function rng(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
