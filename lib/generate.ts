import { Renderer, wrapText } from "./renderer.js";
import { FONT_H, FONT_W, textWidth } from "./font.js";
import { makeColorIndexMap, paletteToArray, rgbToKey, PALETTE } from "./palette.js";
import { pickRoast, sanitizeMessage } from "./roast.js";
import { DEFAULT_PAIRS } from "./defaults.js";
import { GifWriter } from "omggif";

export type GenerateOptions = {
  msg: string;
  seed?: number;
  width: number;
  height: number;
  scale: number;
  aiMsg?: string;
};

type FrameState = {
  userInput: string;
  showUserBubble: boolean;
  aiText: string;
  sendPressed: boolean;
  frameIndex: number;
};

const COLORS = {
  bg: PALETTE[0],
  panel: PALETTE[1],
  input: PALETTE[2],
  border: PALETTE[3],
  accent: PALETTE[4],
  shadow: PALETTE[5],
  text: PALETTE[6],
  textDim: PALETTE[7],
  userBubble: PALETTE[8],
  aiBubble: PALETTE[9],
  white: PALETTE[10],
  send: PALETTE[11],
};



function keyToRgb(key: number): [number, number, number] {
  return [(key >> 16) & 0xff, (key >> 8) & 0xff, key & 0xff];
}

function buildFrames(msg: string, roast: string): FrameState[] {
  const frames: FrameState[] = [];
  const intro = 6;
  const sendFrames = 3;
  const idle = 24;

  for (let i = 0; i < intro; i++) {
    frames.push({ userInput: "", showUserBubble: false, aiText: "", sendPressed: false, frameIndex: frames.length });
  }

  const userTypingMax = 40;
  const userStep = Math.max(1, Math.ceil(msg.length / userTypingMax));
  for (let i = 1; i <= msg.length; i += userStep) {
    frames.push({ userInput: msg.slice(0, i), showUserBubble: false, aiText: "", sendPressed: false, frameIndex: frames.length });
  }

  for (let i = 0; i < sendFrames; i++) {
    frames.push({ userInput: "", showUserBubble: true, aiText: "", sendPressed: i < sendFrames - 1, frameIndex: frames.length });
  }

  const aiTypingMax = 70;
  const aiStep = Math.max(1, Math.ceil(roast.length / aiTypingMax));
  for (let i = 1; i <= roast.length; i += aiStep) {
    frames.push({ userInput: "", showUserBubble: true, aiText: roast.slice(0, i), sendPressed: false, frameIndex: frames.length });
  }

  for (let i = 0; i < idle; i++) {
    frames.push({ userInput: "", showUserBubble: true, aiText: roast, sendPressed: false, frameIndex: frames.length });
  }

  return frames;
}

function measureLines(lines: string[], scale: number) {
  const lineGap = scale * 2;
  const textH = lines.length * (FONT_H * scale + lineGap) - lineGap;
  let maxTextW = 0;
  for (const line of lines) {
    maxTextW = Math.max(maxTextW, textWidth(line, scale, 1));
  }
  return { textH, maxTextW };
}

function drawBubble(
  r: Renderer,
  x: number,
  y: number,
  lines: string[],
  scale: number,
  color: [number, number, number],
  textColor: [number, number, number],
  maxWidth: number
) {
  const lineGap = scale * 2;
  const { textH, maxTextW } = measureLines(lines, scale);
  const pad = scale * 5;
  const bubbleW = Math.min(maxWidth, maxTextW + pad * 2);
  const bubbleH = textH + pad * 2;
  r.fillRoundRect(x, y, bubbleW, bubbleH, scale * 4, color);
  let ty = y + pad;
  for (const line of lines) {
    r.drawText(x + pad, ty, line, scale, textColor, 1);
    ty += FONT_H * scale + lineGap;
  }
  return { w: bubbleW, h: bubbleH };
}

function renderFrame(
  r: Renderer,
  state: FrameState,
  opts: GenerateOptions,
  msgDisplay: string,
  roastDisplay: string,
  wrapCache: Map<string, string[]>
) {
  const { width, height, scale } = opts;
  const S = (n: number) => n * scale;

  const c = (key: number) => keyToRgb(key);
  r.clear(c(COLORS.bg));

  const margin = S(12);
  const inputH = S(42);
  const bubbleMaxW = width - margin * 2;

  // Chat panel background
  r.fillRoundRect(margin, margin, width - margin * 2, height - margin * 2, S(10), c(COLORS.panel));

  const chatTop = margin + S(22);
  let yCursor = chatTop;
  let aiBubbleTop = yCursor;
  let aiBubbleH = 0;

  if (state.showUserBubble) {
    const userKey = `u:${msgDisplay}`;
    let userLines = wrapCache.get(userKey);
    if (!userLines) {
      userLines = wrapText(msgDisplay, bubbleMaxW - S(30), scale, 1);
      wrapCache.set(userKey, userLines);
    }
    const { textH, maxTextW } = measureLines(userLines, scale);
    const pad = scale * 5;
    const bubbleW = Math.min(bubbleMaxW, maxTextW + pad * 2);
    const bubbleH = textH + pad * 2;
    // Right align
    const bubbleX = width - margin - S(10) - bubbleW;
    const label = "USER";
    const labelW = textWidth(label, scale, 1);
    r.drawText(bubbleX + bubbleW - labelW, yCursor - S(10) - FONT_H * scale, label, scale, c(COLORS.textDim), 1);
    drawBubble(r, bubbleX, yCursor, userLines, scale, c(COLORS.userBubble), c(COLORS.white), bubbleMaxW);
    yCursor += bubbleH + S(8);
  }

  if (state.aiText) {
    const aiKey = `a:${state.aiText}`;
    let aiLines = wrapCache.get(aiKey);
    if (!aiLines) {
      aiLines = wrapText(state.aiText, bubbleMaxW - S(30), scale, 1);
      wrapCache.set(aiKey, aiLines);
    }
    aiBubbleTop = yCursor;
    r.drawText(margin + S(10), yCursor - S(10) - FONT_H * scale, "ASSISTANT", scale, c(COLORS.textDim), 1);
    const aiSize = drawBubble(r, margin + S(10), yCursor, aiLines, scale, c(COLORS.aiBubble), c(COLORS.text), bubbleMaxW);
    aiBubbleH = aiSize.h;
    yCursor += aiSize.h + S(8);
  }

  // Input bar
  const inputY = height - margin - inputH;
  r.fillRoundRect(margin + S(8), inputY, width - margin * 2 - S(16), inputH, S(8), c(COLORS.input));

  const btnW = S(56);
  const btnH = S(26);
  const btnX = width - margin - S(8) - btnW;
  const btnY = inputY + (inputH - btnH) / 2;
  const btnColor = state.sendPressed ? COLORS.accent : COLORS.send;
  r.fillRoundRect(btnX, btnY, btnW, btnH, S(6), c(btnColor));
  r.drawText(btnX + S(8), btnY + S(7), "SEND", scale, c(COLORS.white), 1);

  const inputText = state.userInput;
  if (inputText) {
    r.drawText(margin + S(16), inputY + S(12), inputText, scale, c(COLORS.text), 1);
  }

  const blinkOn = state.frameIndex % 10 < 5;
  if (blinkOn && !state.showUserBubble) {
    const caretX = margin + S(16) + textWidth(inputText, scale, 1) + S(2);
    const caretY = inputY + S(12);
    r.fillRect(caretX, caretY, S(2), FONT_H * scale, c(COLORS.text));
  }

  if (blinkOn && state.showUserBubble && state.aiText && state.aiText !== roastDisplay) {
    const aiKey = `a:${state.aiText}`;
    const aiLines = wrapCache.get(aiKey) || wrapText(state.aiText, bubbleMaxW - S(30), scale, 1);
    const lastLine = aiLines[aiLines.length - 1] || "";
    const caretX = margin + S(10) + S(5) + textWidth(lastLine, scale, 1) + S(2);
    const caretY = aiBubbleTop + aiBubbleH - (FONT_H * scale + S(5));
    r.fillRect(caretX, caretY, S(2), FONT_H * scale, c(COLORS.textDim));
  }
}

function rgbaToIndexed(r: Renderer): Uint8Array {
  const map = makeColorIndexMap();
  const out = new Uint8Array(r.width * r.height);
  for (let i = 0; i < out.length; i++) {
    const ri = i * 4;
    const key = rgbToKey(r.data[ri], r.data[ri + 1], r.data[ri + 2]);
    const idx = map.get(key);
    out[i] = idx === undefined ? 0 : idx;
  }
  return out;
}

export function generateGif(opts: GenerateOptions): Buffer {
  const scale = Math.max(1, Math.min(4, Math.floor(opts.scale || 1)));
  const width = opts.width * scale;
  const height = opts.height * scale;

  let userMsg = opts.msg || "";
  let aiMsg = opts.aiMsg || "";
  if (!userMsg) {
    const idx = opts.seed === undefined ? Math.floor(Math.random() * DEFAULT_PAIRS.length) : Math.abs(opts.seed) % DEFAULT_PAIRS.length;
    const pair = DEFAULT_PAIRS[idx];
    userMsg = pair.user;
    aiMsg = pair.ai.replace("{msg}", pair.user);
  }

  const msgDisplay = sanitizeMessage(userMsg, 80);
  const msgTyping = sanitizeMessage(userMsg, 40);
  const roastBase = aiMsg ? aiMsg : pickRoast(msgDisplay, opts.seed || 0);
  const roastDisplay = sanitizeMessage(roastBase.replace("{msg}", msgDisplay), 140);

  const frames = buildFrames(msgTyping, roastDisplay);
  const maxFrames = 120;
  const limitedFrames = frames.slice(0, maxFrames);

  const approxSize = width * height * limitedFrames.length + width * height + 1024 * 64;
  const buffer = Buffer.alloc(Math.max(approxSize, 1024 * 1024));

  const gif = new GifWriter(buffer, width, height, {
    loop: 0,
    palette: paletteToArray(),
  });

  const r = new Renderer(width, height);
  const wrapCache = new Map<string, string[]>();
  for (const frame of limitedFrames) {
    renderFrame(r, frame, { ...opts, width, height, scale }, msgDisplay, roastDisplay, wrapCache);
    const indexed = rgbaToIndexed(r);
    gif.addFrame(0, 0, width, height, Array.from(indexed), { delay: 8, palette: paletteToArray() });
  }

  const gifBytes = gif.end();
  return buffer.subarray(0, gifBytes);
}
