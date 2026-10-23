"use client";

import dynamic from "next/dynamic";
import { useSkin } from "@/lib/verse/skin";
import { Landing } from "./Landing";

const RetroLanding = dynamic(() => import("./retro/RetroLanding").then((m) => m.RetroLanding));
const CineLanding = dynamic(() => import("./cine/CineLanding").then((m) => m.CineLanding));

// Each style gets its own title screen; the game screens share one layout restyled by CSS
export function SkinLanding() {
  const skin = useSkin();
  if (skin === "retro") return <RetroLanding />;
  if (skin === "cine") return <CineLanding />;
  if (skin === "classic") return <Landing />;
  return <div className="min-h-dvh" />;
}
