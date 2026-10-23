import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import sharp from "sharp";
import { TIER_COLOR } from "@/lib/verse/chogs";
import { usd } from "@/lib/verse/format";
import { ROLE_INFO } from "@/lib/verse/roles";
import { chogCard } from "@/server/chogid";

const fonts = Promise.all([
  readFile(join(process.cwd(), "src/assets/fonts/ArchivoBlack.ttf")),
  readFile(join(process.cwd(), "src/assets/fonts/JetBrainsMono-Bold.ttf")),
]);

const pctOf = (n: number) => `${((n / 1969) * 100).toFixed(n < 20 ? 2 : 1)}%`;

// The Chog ID card as a 1200x630 PNG: the download, and the preview image when a card link is shared on X
export async function GET(req: Request, ctx: RouteContext<"/api/card/[id]">) {
  const id = Number((await ctx.params).id);
  const card = await chogCard(id);
  if (!card) return Response.json({ error: "No such Chog" }, { status: 404 });

  const url = new URL(req.url);
  const img = await fetch(new URL(`/chogs/${id}.webp`, url.origin));
  const png = await sharp(Buffer.from(await img.arrayBuffer())).resize(440, 440).png().toBuffer();
  const [archivo, mono] = await fonts;
  const tier = TIER_COLOR[card.tier] ?? "#e9dfcc";
  const role = card.crew ? ROLE_INFO[card.crew.role] : null;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#07061a", color: "#f6f1ff", fontFamily: "Mono", position: "relative" }}>
        <div style={{ position: "absolute", left: -160, top: -120, width: 820, height: 820, borderRadius: 820, background: `radial-gradient(circle, ${tier}55 0%, transparent 62%)`, display: "flex" }} />
        <div style={{ position: "absolute", right: -200, bottom: -260, width: 760, height: 760, borderRadius: 760, background: "radial-gradient(circle, rgba(124,92,255,0.35) 0%, transparent 65%)", display: "flex" }} />
        <div style={{ position: "absolute", inset: 18, borderRadius: 36, border: `2px solid ${tier}66`, display: "flex" }} />

        <div style={{ width: 540, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ display: "flex", borderRadius: 440, border: `12px solid ${tier}`, boxShadow: `0 0 80px ${tier}99` }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`data:image/png;base64,${png.toString("base64")}`} width={420} height={420} style={{ borderRadius: 420 }} alt="" />
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", paddingRight: 70 }}>
          <div style={{ fontSize: 20, letterSpacing: 6, color: "#ffc85a" }}>CHOG VERSE · CHOG ID</div>
          <div style={{ fontFamily: "Archivo", fontSize: 80, lineHeight: 1, marginTop: 16, whiteSpace: "nowrap" }}>{`CHOG #${id}`}</div>
          <div style={{ display: "flex", alignItems: "center", marginTop: 22 }}>
            <div style={{ background: tier, color: "#160f2e", fontSize: 22, padding: "8px 20px", borderRadius: 40, letterSpacing: 3 }}>{card.tier.toUpperCase()}</div>
            <div style={{ marginLeft: 18, fontSize: 22, color: "#cfc6f5" }}>{`RARITY #${card.rank} / 1,969`}</div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", marginTop: 30 }}>
            {card.traits.slice(0, 4).map((t) => (
              <div key={t.type} style={{ display: "flex", alignItems: "center", fontSize: 21, marginTop: 9 }}>
                <div style={{ width: 150, color: "#8f88bd", letterSpacing: 2 }}>{t.type.toUpperCase()}</div>
                <div style={{ flex: 1, color: "#f6f1ff" }}>{t.value}</div>
                <div style={{ color: t.count <= 20 ? "#ffc85a" : "#8f88bd" }}>{pctOf(t.count)}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", marginTop: 30, paddingTop: 22, borderTop: "2px solid rgba(255,255,255,0.12)", fontSize: 21 }}>
            {card.crew && role ? (
              <div style={{ display: "flex", alignItems: "center" }}>
                <div style={{ background: role.color, color: "#160f2e", padding: "6px 16px", borderRadius: 30, letterSpacing: 2 }}>{role.name.toUpperCase()}</div>
                <div style={{ marginLeft: 14 }}>{card.crew.name}</div>
                <div style={{ marginLeft: 14, color: card.crew.profit >= 0 ? "#2ff5a8" : "#ff3b6b" }}>{usd(card.crew.profit, true)}</div>
              </div>
            ) : (
              <div style={{ color: "#8f88bd" }}>NO CREW YET · FREE AGENT</div>
            )}
          </div>
          <div style={{ marginTop: 20, fontSize: 17, color: "#6f6a99", letterSpacing: 2 }}>{`${url.host}/id/${id}`}</div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: "Archivo", data: archivo, weight: 900, style: "normal" },
        { name: "Mono", data: mono, weight: 700, style: "normal" },
      ],
      headers: { "cache-control": "public, max-age=300" },
    },
  );
}
