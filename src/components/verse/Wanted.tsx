import Image from "next/image";
import { chogImage } from "@/lib/verse/chogs";

// Wanted poster with a Chog silhouette: The Rugger is one of us
export function WantedPoster({ className = "", silhouetteId = 61 }: { className?: string; silhouetteId?: number }) {
  return (
    <div className={`relative w-48 rounded-md border-[3px] border-ink bg-[#f3e3c0] p-3 text-ink shadow-sticker-lg ${className}`} style={{ backgroundImage: "radial-gradient(circle at 20% 20%, #fff4d9, transparent 60%), radial-gradient(circle at 80% 90%, #e2c994, transparent 55%)" }}>
      <span className="absolute -top-3 left-1/2 h-5 w-5 -translate-x-1/2 rounded-full border-[3px] border-ink bg-red shadow-sticker-sm" />
      <div className="text-center font-display text-4xl leading-none tracking-wider">WANTED</div>
      <div className="mt-0.5 text-center font-mono text-[10px] font-bold tracking-[0.3em]">DEAD OR RUGGED</div>
      <div className="relative mx-auto mt-2 aspect-square w-full overflow-hidden rounded border-[3px] border-ink bg-[#c8b6e8]">
        <Image src={chogImage(silhouetteId)} alt="" fill sizes="200px" className="object-cover" style={{ filter: "grayscale(1) blur(5px) brightness(0.55) contrast(1.2)" }} />
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden>
          <path d="M18 100 C18 70 26 58 50 58 C74 58 82 70 82 100 Z" fill="#160f2e" />
          <path d="M26 52 C22 24 36 10 50 10 C64 10 78 24 74 52 C70 64 30 64 26 52 Z" fill="#160f2e" />
          <path d="M30 22 L24 6 L40 16 M70 22 L76 6 L60 16" fill="#160f2e" stroke="#160f2e" strokeWidth="4" strokeLinejoin="round" />
          <circle cx="40" cy="40" r="4" fill="#ff4d5e" />
          <circle cx="60" cy="40" r="4" fill="#ff4d5e" />
        </svg>
        <span className="text-outline-sm absolute inset-0 grid place-items-center font-display text-7xl text-gold">?</span>
      </div>
      <div className="mt-2 text-center font-display text-2xl leading-none">THE RUGGER</div>
      <div className="mt-1 border-t-2 border-dashed border-ink/40 pt-1 text-center font-mono text-[11px] font-bold">REWARD: THE WHOLE VAULT</div>
    </div>
  );
}
