// Downloads Chog images from IPFS and saves 384px webp copies to public/chogs/<tokenId>.webp
// Usage: node scripts/mirror-images.mjs 561 70 61   (no args = all 1969)
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import sharp from "sharp";

const GATEWAY = "https://ipfs.filebase.io/ipfs/";
const out = new URL("../public/chogs/", import.meta.url);
mkdirSync(out, { recursive: true });

const chogs = JSON.parse(readFileSync(new URL("../data/chogs.json", import.meta.url), "utf8"));
const ids = process.argv.slice(2).map(Number);
const todo = chogs.filter((c) => !ids.length || ids.includes(c.tokenId));

let i = 0;
async function worker() {
  while (i < todo.length) {
    const c = todo[i++];
    const file = new URL(`${c.tokenId}.webp`, out);
    if (existsSync(file)) continue;
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        const res = await fetch(c.image.replace("ipfs://", GATEWAY), { signal: AbortSignal.timeout(30000) });
        if (!res.ok) throw new Error(String(res.status));
        await sharp(Buffer.from(await res.arrayBuffer())).resize(384, 384).webp({ quality: 82 }).toFile(file.pathname);
        break;
      } catch {
        await new Promise((s) => setTimeout(s, 1500 * (attempt + 1)));
      }
    }
  }
}
await Promise.all(Array.from({ length: 4 }, worker));
console.log("done", todo.length);
