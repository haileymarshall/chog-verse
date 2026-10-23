import type { Role } from "@/lib/verse/types";

type IconProps = { className?: string };
const base = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.4, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

export function RoleIcon({ role, className = "h-5 w-5" }: { role: Role } & IconProps) {
  switch (role) {
    case "whale":
      return (
        <svg {...base} className={className}>
          <path d="M3 13c0 4 3.5 6 8 6 5 0 9-3 9-8 0-1.5-.4-2.6-1-3.4l2-2.1c.3-.3 0-.8-.4-.7l-2.8.7C16.6 4.6 15 4 13 4c-1.7 0-3 1-3 2.6 0 1.3 1 2.4 2.5 2.4H14" />
          <path d="M3 13c2.2 0 3.8-.6 5-2" />
          <circle cx="15.5" cy="12" r="1" fill="currentColor" />
          <path d="M8 2.5c0 1 .6 1.6 1.4 2M5.6 3.4c.4.9 1.2 1.3 2.2 1.4" />
        </svg>
      );
    case "trader":
      return (
        <svg {...base} className={className}>
          <path d="M3 20h18" />
          <path d="M4 16l5-5 3.5 3.5L19 8" />
          <path d="M14 8h5v5" />
        </svg>
      );
    case "rugger":
      return (
        <svg {...base} className={className}>
          <rect x="4" y="4" width="16" height="11" rx="1.5" />
          <path d="M7 15v3M10 15v3M14 15v3M17 15v3" />
          <path d="M8 8l3 3 2-2 3 3" />
        </svg>
      );
    case "fudder":
      return (
        <svg {...base} className={className}>
          <path d="M3 10v4h3l8 5V5L6 10H3Z" fill="currentColor" fillOpacity="0.25" />
          <path d="M17.5 9a4 4 0 0 1 0 6M20 6.5a8 8 0 0 1 0 11" />
        </svg>
      );
  }
}

export function Icon({ name, className = "h-5 w-5" }: { name: "vault" | "chat" | "board" | "hq" | "home" | "lock" | "coin" | "clock" | "close" | "check" | "send" | "spark" | "skull" | "eye" | "users" } & IconProps) {
  switch (name) {
    case "vault":
      return (
        <svg {...base} className={className}>
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <circle cx="12" cy="12" r="4.5" />
          <path d="M12 7.5v2M12 14.5v2M7.5 12h2M14.5 12h2" />
          <path d="M6 21v1.5M18 21v1.5" />
        </svg>
      );
    case "chat":
      return (
        <svg {...base} className={className}>
          <path d="M4 5h16v11H9l-5 4V5Z" />
          <path d="M8 9.5h8M8 12.5h5" />
        </svg>
      );
    case "board":
      return (
        <svg {...base} className={className}>
          <path d="M8 21V11h8v10M3 21v-6h5M16 21v-8h5v8M2 21h20" />
          <path d="m12 3 1 2.2 2.3.3-1.7 1.6.4 2.3-2-1.1-2 1.1.4-2.3-1.7-1.6 2.3-.3L12 3Z" fill="currentColor" />
        </svg>
      );
    case "hq":
      return (
        <svg {...base} className={className}>
          <path d="M3 11 12 4l9 7" />
          <path d="M5 10v10h14V10" />
          <path d="M10 20v-5h4v5" />
        </svg>
      );
    case "home":
      return (
        <svg {...base} className={className}>
          <path d="M4 20V9l8-5 8 5v11H4Z" />
        </svg>
      );
    case "lock":
      return (
        <svg {...base} className={className}>
          <rect x="5" y="10" width="14" height="10" rx="2" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3" />
          <circle cx="12" cy="15" r="1.2" fill="currentColor" />
        </svg>
      );
    case "coin":
      return (
        <svg {...base} className={className}>
          <circle cx="12" cy="12" r="9" />
          <path d="M14.8 9.3c-.5-.9-1.5-1.3-2.8-1.3-1.6 0-2.8.8-2.8 1.9s1 1.6 2.8 1.9 2.8.8 2.8 1.9-1.2 1.9-2.8 1.9c-1.3 0-2.3-.5-2.8-1.4M12 6.5V8M12 16v1.5" />
        </svg>
      );
    case "clock":
      return (
        <svg {...base} className={className}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      );
    case "close":
      return (
        <svg {...base} className={className}>
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      );
    case "check":
      return (
        <svg {...base} className={className} strokeWidth={3}>
          <path d="m5 12.5 4.5 4.5L19 7" />
        </svg>
      );
    case "send":
      return (
        <svg {...base} className={className}>
          <path d="M4 12 20 4l-6 16-3-7-7-1Z" fill="currentColor" fillOpacity="0.2" />
        </svg>
      );
    case "spark":
      return (
        <svg {...base} className={className}>
          <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" />
        </svg>
      );
    case "skull":
      return (
        <svg {...base} className={className}>
          <path d="M5 11a7 7 0 0 1 14 0v3l-2 1v3H7v-3l-2-1v-3Z" />
          <circle cx="9.5" cy="11.5" r="1.5" fill="currentColor" />
          <circle cx="14.5" cy="11.5" r="1.5" fill="currentColor" />
          <path d="M10 18v-2M14 18v-2" />
        </svg>
      );
    case "eye":
      return (
        <svg {...base} className={className}>
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
          <circle cx="12" cy="12" r="3" fill="currentColor" />
        </svg>
      );
    case "users":
      return (
        <svg {...base} className={className}>
          <circle cx="9" cy="8" r="3.5" />
          <path d="M2.5 20c.5-3.5 3.2-5.5 6.5-5.5s6 2 6.5 5.5" />
          <circle cx="17" cy="9" r="2.5" />
          <path d="M17 14.5c2.5 0 4.2 1.6 4.5 4.5" />
        </svg>
      );
  }
}

export function SoundIcon({ on, className = "h-5 w-5" }: { on: boolean } & IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M4 9v6h4l5 4V5L8 9H4Z" fill="currentColor" />
      {on ? <path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" /> : <path d="m17 9 5 6M22 9l-5 6" />}
    </svg>
  );
}
