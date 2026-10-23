"use client";

import { useEffect, useRef } from "react";
import { chogImage } from "@/lib/verse/chogs";
import { rng } from "@/lib/verse/format";

// Monad City as a 180px-tall pixel scene, upscaled with hard edges.
// Stars twinkle, windows flick on and off, the Bank's $ blinks, and four Chogs walk the street.

const H = 180;
const PAL = { sky0: "#0b0f2a", sky1: "#1d2b53", sky2: "#7e2553", far: "#26336b", near: "#000000", win: "#ffec27", win2: "#29adff", pink: "#ff77a8", red: "#ff004d", gold: "#ffec27", white: "#fff1e8" };

export function PixelCity({ className = "", walkers = [561, 70, 196, 61] }: { className?: string; walkers?: number[] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const key = walkers.join(",");

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const g = canvas.getContext("2d")!;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ids = key.split(",").map(Number);
    const sprites = ids.map((id) => {
      const img = new Image();
      img.src = chogImage(id);
      return img;
    });

    let W = 320;
    let stars: { x: number; y: number; p: number }[] = [];
    let far: { x: number; w: number; h: number }[] = [];
    let near: { x: number; w: number; h: number; wins: { x: number; y: number; p: number; c: number }[] }[] = [];

    const build = () => {
      const r = rng(11);
      W = Math.max(200, Math.ceil((H * canvas.clientWidth) / Math.max(1, canvas.clientHeight)));
      canvas.width = W;
      canvas.height = H;
      stars = Array.from({ length: Math.floor(W / 3) }, () => ({ x: Math.floor(r() * W), y: Math.floor(r() * 90), p: r() * 10 }));
      far = [];
      for (let x = -4; x < W; ) {
        const w = 10 + Math.floor(r() * 18);
        far.push({ x, w, h: 40 + Math.floor(r() * 50) });
        x += w + 1;
      }
      near = [];
      const bankX = Math.floor(W / 2) - 24;
      for (let x = -4; x < W; ) {
        const w = 14 + Math.floor(r() * 20);
        if (x + w > bankX - 4 && x < bankX + 52) {
          x = bankX + 54;
          continue;
        }
        const h = 22 + Math.floor(r() * 46);
        const wins = [];
        for (let wy = H - 14 - h + 4; wy < H - 18; wy += 5) for (let wx = x + 3; wx < x + w - 3; wx += 4) if (r() < 0.45) wins.push({ x: wx, y: wy, p: r() * 20, c: r() });
        near.push({ x, w, h, wins });
        x += w + 2;
      }
    };
    build();
    const ro = new ResizeObserver(build);
    ro.observe(canvas);

    let raf = 0;
    let t0 = performance.now();
    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      const t = reduced ? 0 : (now - t0) / 1000;
      const ground = H - 14;

      // Banded sky, dithered at each edge
      const bands = [PAL.sky0, PAL.sky1, PAL.sky2];
      const bh = [0, 70, 120];
      g.fillStyle = PAL.sky0;
      g.fillRect(0, 0, W, H);
      for (let i = 1; i < 3; i++) {
        g.fillStyle = bands[i];
        g.fillRect(0, bh[i], W, H - bh[i]);
        g.fillStyle = bands[i];
        for (let x = 0; x < W; x += 2) for (let y = 0; y < 6; y += 2) g.fillRect(x + ((y / 2) % 2), bh[i] - 6 + y, 1, 1);
      }

      for (const s of stars) {
        if (Math.sin(t * 2 + s.p) > -0.2) {
          g.fillStyle = s.p > 8 ? PAL.pink : PAL.white;
          g.fillRect(s.x, s.y, 1, 1);
        }
      }

      // Moon
      const mx = W - 60;
      g.fillStyle = PAL.white;
      for (let y = -12; y <= 12; y++) {
        const half = Math.floor(Math.sqrt(144 - y * y));
        g.fillRect(mx - half, 28 + y, half * 2, 1);
      }
      g.fillStyle = "#c2c3c7";
      g.fillRect(mx - 4, 22, 3, 3);
      g.fillRect(mx + 3, 30, 4, 3);

      // Searchlights
      g.fillStyle = "rgba(41,173,255,0.12)";
      for (const [ox, ph] of [
        [W / 2 - 14, 0],
        [W / 2 + 14, 2],
      ]) {
        const a = Math.sin(t * 0.6 + ph) * 0.5;
        for (let y = 0; y < ground - 60; y += 2) {
          const k = (ground - 60 - y) / (ground - 60);
          const cx = ox + Math.sin(a) * (ground - 60 - y);
          const w = 2 + k * 30;
          g.fillRect(Math.round(cx - w / 2), y, Math.round(w), 1);
        }
      }

      g.fillStyle = PAL.far;
      for (const b of far) g.fillRect(b.x, ground - b.h, b.w, b.h);

      // The Bank
      const bx = Math.floor(W / 2) - 24;
      g.fillStyle = "#5f1a43";
      g.fillRect(bx, ground - 46, 48, 46);
      g.fillStyle = PAL.near;
      for (let i = 0; i < 12; i++) g.fillRect(bx - 2 + i * 2, ground - 50 - i, 52 - i * 4, 1);
      g.fillRect(bx - 2, ground - 50, 52, 4);
      g.fillStyle = "#7e2553";
      for (let i = 0; i < 5; i++) g.fillRect(bx + 4 + i * 9, ground - 40, 4, 36);
      g.fillStyle = PAL.near;
      g.fillRect(bx - 3, ground - 4, 54, 4);
      const on = Math.floor(t * 2) % 2 === 0;
      g.fillStyle = on ? PAL.gold : "#ab5236";
      g.fillRect(bx + 21, ground - 60, 6, 6);
      g.fillStyle = PAL.near;
      g.fillRect(bx + 23, ground - 59, 2, 4);
      g.fillStyle = on ? PAL.gold : "#ab5236";
      g.font = "5px monospace";

      for (const b of near) {
        g.fillStyle = PAL.near;
        g.fillRect(b.x, ground - b.h, b.w, b.h);
        for (const w of b.wins) {
          const lit = Math.sin(t * 0.4 + w.p) > -0.6;
          if (!lit) continue;
          g.fillStyle = w.c > 0.85 ? PAL.win2 : w.c > 0.75 ? PAL.pink : PAL.win;
          g.fillRect(w.x, w.y, 2, 2);
        }
      }

      // Street
      g.fillStyle = "#1d2b53";
      g.fillRect(0, ground, W, H - ground);
      g.fillStyle = "#5f574f";
      for (let x = Math.floor(-(t * 20) % 12); x < W; x += 12) g.fillRect(x, ground + 7, 6, 1);
      g.fillStyle = PAL.near;
      g.fillRect(0, ground, W, 1);

      // Chogs walking home with the loot
      sprites.forEach((img, i) => {
        if (!img.complete || !img.naturalWidth) return;
        const span = W + 40;
        const x = Math.floor(((t * 14 + i * 26) % span) - 24);
        const bob = Math.floor(t * 6 + i) % 2;
        g.imageSmoothingEnabled = true;
        g.drawImage(img, x, ground - 18 - bob, 16, 16);
        g.fillStyle = PAL.near;
        g.fillRect(x + 3, ground - 2, 3, 2 - bob);
        g.fillRect(x + 10, ground - 2, 3, 1 + bob);
      });
      g.imageSmoothingEnabled = false;
      if (reduced) cancelAnimationFrame(raf);
    };
    t0 = performance.now();
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [key]);

  return <canvas ref={ref} className={className} style={{ imageRendering: "pixelated" }} aria-hidden />;
}
