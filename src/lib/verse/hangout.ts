export type HangoutRoom = { key: string; name: string; emoji: string; desc: string; color: string };

export const HANGOUT_ROOMS: HangoutRoom[] = [
  { key: "general", name: "general", emoji: "💬", desc: "Say gm. Meet the other Chogs in the city.", color: "#ffc85a" },
  { key: "alpha", name: "alpha", emoji: "📈", desc: "Calls, charts, and what's moving on nad.fun.", color: "#2ff5a8" },
  { key: "memes", name: "memes", emoji: "🤡", desc: "Chog brainrot only.", color: "#ff4fd8" },
  { key: "crews", name: "find-a-crew", emoji: "🛡️", desc: "Need a crew for the Chog Verse game? Post your role here.", color: "#3fd9ff" },
];

export type HangoutGroup = { key: string; name: string; chogs: number[]; lastId: number; createdAt: number };
export type OnlineChog = { playerId: number; chogId: number; kind: "holder" | "guest" | "bot"; room: string };
