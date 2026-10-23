"use client";

import { useSyncExternalStore } from "react";

// Three visual styles for the same game. The choice lives on <html data-skin> so CSS can restyle every screen.
export type Skin = "classic" | "retro" | "cine";

export const SKINS: { id: Skin; name: string; blurb: string }[] = [
  { id: "classic", name: "Classic", blurb: "Sticker cartoon" },
  { id: "retro", name: "Arcade", blurb: "8-bit CRT" },
  { id: "cine", name: "Cinematic", blurb: "Neon city 3D" },
];

const KEY = "verse:skin";
const listeners = new Set<() => void>();

function read(): Skin {
  if (typeof document === "undefined") return "classic";
  const v = document.documentElement.dataset.skin;
  return v === "retro" || v === "classic" ? v : "cine";
}

export function setSkin(skin: Skin) {
  document.documentElement.dataset.skin = skin;
  try {
    localStorage.setItem(KEY, skin);
  } catch {}
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

/** null during server render and hydration, so callers can avoid a wrong-skin flash */
export function useSkin(): Skin | null {
  return useSyncExternalStore(subscribe, read, () => null);
}

/** Runs before first paint. Cinematic is the chosen look; ?skin=classic|retro opens the old designs for reference */
export const SKIN_BOOT = `(function(){var d=document.documentElement;d.dataset.skin='cine';try{var q=new URLSearchParams(location.search).get('skin');if(q==='retro'||q==='classic')d.dataset.skin=q}catch(e){}})();`;
