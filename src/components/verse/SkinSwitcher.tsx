"use client";

import { motion } from "motion/react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { sfx } from "@/lib/sound";
import { SKINS, setSkin, useSkin } from "@/lib/verse/skin";

// Floating style picker so the three designs can be compared on any screen
export function SkinSwitcher() {
  const skin = useSkin();
  const home = usePathname() === "/";
  const [open, setOpen] = useState(false);
  if (!skin) return null;

  return (
    <div className={`skin-switcher fixed z-[80] flex flex-col lg:bottom-4 lg:left-auto lg:right-3 lg:items-end ${home ? "bottom-3 left-3 items-start" : "bottom-24 right-3 items-end"}`}>
      {open && (
        <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="skin-menu mb-2 flex w-56 flex-col gap-1 p-1.5">
          {SKINS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                sfx.pop();
                setSkin(s.id);
              }}
              className={`skin-opt flex items-center justify-between px-3 py-2 text-left ${skin === s.id ? "is-on" : ""}`}
            >
              <span>
                <span className="skin-opt-name block">{s.name}</span>
                <span className="skin-opt-blurb block">{s.blurb}</span>
              </span>
              {skin === s.id && <span aria-hidden>●</span>}
            </button>
          ))}
        </motion.div>
      )}
      <button
        type="button"
        onClick={() => {
          sfx.tick();
          setOpen((o) => !o);
        }}
        className="skin-toggle flex items-center gap-2 px-3.5 py-2"
        aria-expanded={open}
      >
        <span className="skin-dots flex gap-1" aria-hidden>
          <i />
          <i />
          <i />
        </span>
        <span className="max-sm:hidden">Style:</span> {SKINS.find((s) => s.id === skin)?.name}
      </button>
    </div>
  );
}
