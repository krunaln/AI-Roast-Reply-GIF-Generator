const ROASTS_NORMAL = [
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
  "As an AI, I still can't compute how {msg} passed review.",
  "My training data flagged {msg} as a runtime warning.",
  "According to my model, {msg} is just a TODO in disguise.",
  "Even my fallback response outperforms {msg}.",
  "My logits say {msg} is bold, but not in a good way.",
  "As your AI assistant, I recommend rolling back {msg}.",
  "My confidence is high that {msg} needs tests.",
  "Model summary: {msg} looks like a merge conflict.",
  "I simulated {msg} and got a segmentation fault.",
  "The algorithm in me is allergic to {msg}.",
  "In my dataset, {msg} is labeled as 'questionable choice.'",
  "My neural net ranks {msg} below 'fix stuff later.'",
  "As an AI, I generate better output than {msg} on low battery.",
  "My loss function spikes whenever I read {msg}.",
  "Prediction: {msg} will fail CI with a helpful error.",
  "I ran {msg} through my filters and it came back 'yikes.'",
  "My inference engine says {msg} is a hotfix waiting to happen.",
  "Statistically, {msg} is an outlier in bad decisions.",
  "My attention heads couldn't find the point of {msg}.",
  "I parsed {msg} and got a syntax error in spirit.",
  "If I were human, I'd refactor {msg} with a sigh.",
  "My model predicts {msg} will be reverted by lunch.",
  "As an AI, I still need a try/catch for {msg}.",
  "The probability of {msg} being correct is near zero.",
  "My token budget is wasted on {msg}.",
];

const ROASTS_GREETING = [
  "As an AI, I acknowledge your greeting and still feel underwhelmed.",
  "Hello detected. Context missing.",
  "My model received your greeting. It asked for a payload.",
  "A greeting? That was a low‑entropy input.",
  "Polite, yes. Informative, no.",
  "I parsed your hello and found zero actionable tokens.",
  "Greetings are nice. So is substance.",
  "As an AI, I can confirm you said hi. That's it.",
];

const ROASTS_SHORT = [
  "As an AI, I need more than a single token to work with.",
  "Your message is shorter than my error strings.",
  "That input was so short it barely hit my attention heads.",
  "I expected a message, not a breadcrumb.",
  "Minimalism is a choice. This was the wrong one.",
  "My model tried to expand your input and gave up.",
  "Short messages are fast. So is my disappointment.",
  "I ran that through my model and it asked for the rest.",
];

const ROASTS_QUESTION = [
  "As an AI, I can answer that, but I can't respect it.",
  "That's a question, sure. It's also a cry for refactoring.",
  "My model says the question is why you asked it like that.",
  "I could answer, but your question needs unit tests first.",
  "The query compiles, but the intent does not.",
  "Asking that is legal. Shipping it is not.",
  "I found the answer, but it's in a different repo.",
  "I am an AI. Even I need better requirements than that.",
];

const ROASTS_CODE = [
  "As an AI, I've seen cleaner code in a corrupted diff.",
  "Your syntax is valid; your choices are not.",
  "I linted it in my head and still felt pain.",
  "Looks like code. Smells like regret.",
  "My model suggests a rewrite, a nap, and a strong coffee.",
  "I can parse it. I just don't want to.",
  "That code has more branches than logic.",
  "As an AI, I'd put this behind a feature flag. Permanently.",
];

const ROASTS_EMPTY = [
  "As an AI, I received nothing and still felt judged.",
  "The silence is loud. The content is absent.",
  "Empty message detected. So is my patience.",
  "I can't roast nothing. Try again with actual words.",
  "My model predicts your next message will have characters.",
  "I got an empty input. That was the best part.",
  "No tokens, no mercy.",
  "Nothing in, nothing out. Except disappointment.",
];

type RoastPool = "empty" | "greeting" | "short" | "question" | "code" | "normal";

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

function classifyMessage(msg: string): RoastPool {
  const raw = msg || "";
  const trimmed = raw.replace(/\s+/g, " ").trim();
  if (!trimmed) return "empty";

  const lower = trimmed.toLowerCase();
  const words = trimmed.split(" ").filter(Boolean);
  const charLen = trimmed.length;

  const scores: Record<RoastPool, number> = {
    empty: 0,
    greeting: 0,
    short: 0,
    question: 0,
    code: 0,
    normal: 0,
  };

  // Greeting signals
  if (/^(hi|hello|hey|yo|sup|hola|howdy|hiya|hey there)\b/.test(lower)) scores.greeting += 4;
  if (/\b(gm|gn|good morning|good night|good evening)\b/.test(lower)) scores.greeting += 3;

  // Short signals
  if (charLen <= 4) scores.short += 4;
  if (charLen <= 8) scores.short += 2;
  if (words.length <= 2) scores.short += 2;
  if (words.length === 1) scores.short += 2;

  // Question signals
  if (/[?]\s*$/.test(trimmed)) scores.question += 4;
  if (/^(why|how|what|when|where|who|is|are|can|do|does|should|would|could)\b/.test(lower)) {
    scores.question += 3;
  }

  // Code-ish signals
  const codeHints = ["{", "}", "(", ")", "=>", ";", "const ", "let ", "var ", "function ", "return ", "class ", "if (", "for (", "while (", "import ", "export "];
  for (const hint of codeHints) {
    if (trimmed.includes(hint)) scores.code += 2;
  }
  if (/^```[\s\S]*```$/.test(trimmed)) scores.code += 5;
  if (/^[\\w\\-]+\\.(js|ts|py|rb|go|rs|java|cpp|c|cs|json|yml|yaml)$/i.test(trimmed)) scores.code += 3;

  // Default bias
  scores.normal += 1;

  // Tie-breaker priority
  const order: RoastPool[] = ["empty", "greeting", "short", "question", "code", "normal"];
  let best: RoastPool = "normal";
  let bestScore = -Infinity;
  for (const key of order) {
    const score = scores[key];
    if (score > bestScore) {
      best = key;
      bestScore = score;
    }
  }
  return best;
}

function pickFrom(pool: string[], msg: string, seed: number) {
  const h = xmur3(msg + String(seed))();
  const rng = mulberry32(h);
  const idx = Math.floor(rng() * pool.length) % pool.length;
  return pool[idx];
}

export function pickRoast(msg: string, seed: number) {
  const bucket = classifyMessage(msg);
  switch (bucket) {
    case "empty":
      return pickFrom(ROASTS_EMPTY, msg, seed);
    case "greeting":
      return pickFrom(ROASTS_GREETING, msg, seed);
    case "short":
      return pickFrom(ROASTS_SHORT, msg, seed);
    case "question":
      return pickFrom(ROASTS_QUESTION, msg, seed);
    case "code":
      return pickFrom(ROASTS_CODE, msg, seed).replace("{msg}", formatMsg(msg));
    default:
      return pickFrom(ROASTS_NORMAL, msg, seed).replace("{msg}", formatMsg(msg));
  }
}

export function sanitizeMessage(msg: string, maxLen: number) {
  const cleaned = msg.replace(/\s+/g, " ").trim();
  if (cleaned.length <= maxLen) return cleaned;
  return cleaned.slice(0, Math.max(0, maxLen - 3)) + "...";
}

function formatMsg(msg: string) {
  const trimmed = msg.trim();
  if (!trimmed) return "that message";
  const words = trimmed.split(/\s+/).filter(Boolean);
  const shouldQuote = trimmed.length <= 4 || words.length === 1;
  return shouldQuote ? `"${trimmed}"` : trimmed;
}
