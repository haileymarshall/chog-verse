import { rng } from "./format";
import type { Token } from "./types";

// Demo daily list. The live version pulls ~20 Monad tokens by volume from DexScreener.
const LIST: [string, string, string, number][] = [
  ["CHOG", "Chog", "#836ef9", 0.00162],
  ["MON", "Monad", "#6e54ff", 0.0243],
  ["PURP", "Purple Rain", "#b05cff", 0.0031],
  ["NADZ", "Nadz", "#ff7eb6", 0.00081],
  ["BLOB", "Blobby", "#3ddc84", 0.0127],
  ["SNEK", "Snek", "#9be15d", 0.00044],
  ["GIGA", "Gigachog", "#ff9f1c", 0.0412],
  ["TOAD", "Toad Inc", "#2ec4b6", 0.0067],
  ["ZAP", "Zap", "#ffd23f", 0.0019],
  ["MOCHI", "Mochi", "#ffb3c7", 0.00093],
  ["FROTH", "Froth", "#8fd3ff", 0.00212],
  ["BONKR", "Bonkr", "#ff6b35", 0.00057],
  ["WAGMI", "Wagmi", "#4cc9f0", 0.0158],
  ["HONK", "Honk", "#f15bb5", 0.00031],
  ["YOLO", "Yolo", "#fee440", 0.0088],
  ["GRAPE", "Grape", "#7b2cbf", 0.0049],
  ["RUGZ", "Rugz", "#ff4d5e", 0.00022],
  ["DUCKO", "Ducko", "#ffc300", 0.0036],
  ["LAMBO", "Lambo", "#00bbf9", 0.0271],
  ["COPE", "Cope", "#a3a3c2", 0.00011],
];

export const TOKENS: Token[] = LIST.map(([symbol, name, color, base], i) => {
  const r = rng(1000 + i);
  const drift = (r() - 0.45) * 0.06;
  const vol = 0.01 + r() * 0.05;
  const spark: number[] = [];
  let p = base;
  for (let h = 0; h < 24; h++) {
    p *= 1 + drift / 4 + (r() - 0.5) * vol;
    spark.push(p);
  }
  return {
    symbol,
    name,
    color,
    price: p,
    change24h: ((p - spark[0]) / spark[0]) * 100,
    spark,
    fresh: i >= 15,
  };
});

export const tokenBy = (symbol: string | null | undefined) => TOKENS.find((t) => t.symbol === symbol) ?? null;

/** A demo "live" move since today's lock, wobbling smoothly over time */
export function liveMove(symbol: string, now: number) {
  const i = Math.max(0, TOKENS.findIndex((t) => t.symbol === symbol));
  const r = rng(77 + i);
  const bias = (r() - 0.5) * 30;
  const t = now / 60_000;
  const wobble = Math.sin(t / (3 + r() * 4) + i) * 6 + Math.sin(t / 1.3 + i * 2) * 1.5;
  return Math.max(-100, Math.min(100, bias + wobble));
}
