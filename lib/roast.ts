const ROASTS = [
  "That's cute. Even my error handler has better logic than: {msg}.",
  "I've seen prettier output from a broken printer than: {msg}.",
  "You call that a message? My lint warnings are more coherent than: {msg}.",
  "Bold take. Unfortunately, {msg} reads like a TODO you never finished.",
  "If {msg} were a commit, it would be 'fix stuff' without tests.",
  "I'm not saying {msg} is bad, but it should come with a rollback plan.",
  "{msg}? That's a feature request from someone who never read the docs.",
  "I've parsed JSON with fewer errors than {msg}.",
  "{msg} looks like it was typed with a rubber duck on the keyboard.",
  "That was brave. And by brave, I mean questionable: {msg}.",
];

function xmur3(str: string) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  };
}

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickRoast(msg: string, seed: number) {
  const h = xmur3(msg + String(seed))();
  const rng = mulberry32(h);
  const idx = Math.floor(rng() * ROASTS.length) % ROASTS.length;
  const template = ROASTS[idx];
  return template.replace("{msg}", msg);
}

export function sanitizeMessage(msg: string, maxLen: number) {
  const cleaned = msg.replace(/\s+/g, " ").trim();
  if (cleaned.length <= maxLen) return cleaned;
  return cleaned.slice(0, Math.max(0, maxLen - 3)) + "...";
}
