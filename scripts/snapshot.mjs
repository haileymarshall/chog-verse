// Snapshot Chog Genesis tokenURIs + metadata into data/chogs.json
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const RPC = "https://rpc.monad.xyz";
const CHOG = "0xc96d31F8626c6D03Fae5dCD3d61e3FB9F4a73763";
const SUPPLY = 1969;
const GATEWAYS = ["https://gateway.pinata.cloud/ipfs/", "https://ipfs.filebase.io/ipfs/", "https://4everland.io/ipfs/"];
const URI_CACHE = new URL("../data/uris.json", import.meta.url);

const hex = (n) => n.toString(16).padStart(64, "0");
const decodeString = (data) => {
  const b = Buffer.from(data.slice(2), "hex");
  const len = Number(b.readBigUInt64BE(56));
  return b.subarray(64, 64 + len).toString("utf8");
};

async function rpcBatch(calls) {
  const res = await fetch(RPC, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(calls),
  });
  return res.json();
}

async function tokenURIs() {
  // Public RPC allows 50 req/s: send batches of 25, retry anything rate-limited
  const out = {};
  let pending = Array.from({ length: SUPPLY }, (_, k) => k + 1);
  while (pending.length) {
    const batch = pending.slice(0, 25);
    const res = await rpcBatch(
      batch.map((id) => ({
        jsonrpc: "2.0",
        id,
        method: "eth_call",
        params: [{ to: CHOG, data: "0xc87b56dd" + hex(id) }, "latest"],
      }))
    );
    for (const r of res) {
      if (r.result) out[r.id] = decodeString(r.result);
    }
    pending = pending.filter((id) => !out[id]);
    process.stdout.write(`uris ${Object.keys(out).length}\r`);
    await new Promise((s) => setTimeout(s, 1100));
  }
  return out;
}

async function fetchJson(uri, tries = 9) {
  for (let i = 0; i < tries; i++) {
    const url = uri.replace("ipfs://", GATEWAYS[i % GATEWAYS.length]);
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(20000) });
      if (r.ok) return await r.json();
    } catch {}
    await new Promise((s) => setTimeout(s, 1000 * (i + 1)));
  }
  throw new Error("failed " + uri);
}

const uris = existsSync(URI_CACHE) ? JSON.parse(readFileSync(URI_CACHE)) : await tokenURIs();
writeFileSync(URI_CACHE, JSON.stringify(uris));
const ids = Object.keys(uris).map(Number);
const chogs = [];
let i = 0;
async function worker() {
  while (i < ids.length) {
    const id = ids[i++];
    const meta = await fetchJson(uris[id]);
    chogs.push({
      tokenId: id,
      name: meta.name,
      image: meta.image,
      traits: Object.fromEntries(meta.attributes.map((a) => [a.trait_type, a.value])),
    });
    if (chogs.length % 100 === 0) process.stdout.write(`meta ${chogs.length}\r`);
  }
}
await Promise.all(Array.from({ length: 4 }, worker));
chogs.sort((a, b) => a.tokenId - b.tokenId);
writeFileSync(new URL("../data/chogs.json", import.meta.url), JSON.stringify(chogs));
console.log(`\nsaved ${chogs.length}`);
