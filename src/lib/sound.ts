// Tiny synthesized sound effects, so the game needs no audio files
let ctx: AudioContext | null = null;
let muted = false;

try {
  muted = localStorage.getItem("verse:muted") === "1";
} catch {}

export function isMuted() {
  return muted;
}

const muteListeners = new Set<() => void>();

export function setMuted(value: boolean) {
  muted = value;
  muteListeners.forEach((l) => l());
  try {
    localStorage.setItem("verse:muted", value ? "1" : "0");
  } catch {}
}

function audio() {
  if (muted || typeof window === "undefined") return null;
  ctx ??= new AudioContext();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(freq: number, endFreq: number, duration: number, type: OscillatorType = "sine", volume = 0.18, delay = 0) {
  const a = audio();
  if (!a) return;
  const t = a.currentTime + delay;
  const osc = a.createOscillator();
  const gain = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  osc.frequency.exponentialRampToValueAtTime(endFreq, t + duration);
  gain.gain.setValueAtTime(volume, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
  osc.connect(gain).connect(a.destination);
  osc.start(t);
  osc.stop(t + duration);
}

export const sfx = {
  pop: () => tone(520, 900, 0.09, "triangle"),
  plop: () => tone(700, 220, 0.14, "sine", 0.22),
  chime: () => {
    tone(660, 660, 0.18, "triangle", 0.12);
    tone(990, 990, 0.25, "triangle", 0.1, 0.08);
  },
  tick: () => tone(1200, 1000, 0.03, "square", 0.04),
  coin: () => {
    tone(988, 988, 0.08, "square", 0.06);
    tone(1319, 1319, 0.3, "square", 0.06, 0.07);
  },
  stamp: () => {
    tone(160, 60, 0.18, "sine", 0.4);
    tone(90, 40, 0.12, "triangle", 0.2, 0.02);
  },
  lock: () => {
    tone(300, 120, 0.08, "square", 0.08);
    tone(500, 500, 0.06, "square", 0.05, 0.1);
    tone(800, 800, 0.12, "triangle", 0.08, 0.18);
  },
  whoosh: () => tone(200, 1400, 0.25, "sawtooth", 0.03),
  fail: () => {
    tone(400, 300, 0.15, "triangle", 0.1);
    tone(300, 160, 0.3, "triangle", 0.1, 0.14);
  },
  thunder: () => {
    const a = audio();
    if (!a) return;
    const len = a.sampleRate * 1.4;
    const buf = a.createBuffer(1, len, a.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
    const src = a.createBufferSource();
    const filter = a.createBiquadFilter();
    const gain = a.createGain();
    filter.type = "lowpass";
    filter.frequency.value = 260;
    gain.gain.value = 0.5;
    src.buffer = buf;
    src.connect(filter).connect(gain).connect(a.destination);
    src.start();
  },
};

export function subscribeMuted(l: () => void) {
  muteListeners.add(l);
  return () => {
    muteListeners.delete(l);
  };
}
