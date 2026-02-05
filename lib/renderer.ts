import { FONT_H, FONT_W, getGlyph } from "./font.js";

export type Color = [number, number, number];

export class Renderer {
  width: number;
  height: number;
  data: Uint8ClampedArray;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.data = new Uint8ClampedArray(width * height * 4);
  }

  clear(color: Color) {
    const [r, g, b] = color;
    for (let i = 0; i < this.data.length; i += 4) {
      this.data[i] = r;
      this.data[i + 1] = g;
      this.data[i + 2] = b;
      this.data[i + 3] = 255;
    }
  }

  setPixel(x: number, y: number, color: Color) {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return;
    const i = (y * this.width + x) * 4;
    this.data[i] = color[0];
    this.data[i + 1] = color[1];
    this.data[i + 2] = color[2];
    this.data[i + 3] = 255;
  }

  fillRect(x: number, y: number, w: number, h: number, color: Color) {
    const x0 = Math.max(0, x);
    const y0 = Math.max(0, y);
    const x1 = Math.min(this.width, x + w);
    const y1 = Math.min(this.height, y + h);
    for (let yy = y0; yy < y1; yy++) {
      let row = (yy * this.width + x0) * 4;
      for (let xx = x0; xx < x1; xx++) {
        this.data[row] = color[0];
        this.data[row + 1] = color[1];
        this.data[row + 2] = color[2];
        this.data[row + 3] = 255;
        row += 4;
      }
    }
  }

  fillRoundRect(x: number, y: number, w: number, h: number, r: number, color: Color) {
    const r2 = r * r;
    for (let yy = y; yy < y + h; yy++) {
      for (let xx = x; xx < x + w; xx++) {
        const dx = xx < x + r ? x + r - xx : xx >= x + w - r ? xx - (x + w - r - 1) : 0;
        const dy = yy < y + r ? y + r - yy : yy >= y + h - r ? yy - (y + h - r - 1) : 0;
        if (dx * dx + dy * dy <= r2) {
          this.setPixel(xx, yy, color);
        }
      }
    }
  }

  drawText(x: number, y: number, text: string, scale: number, color: Color, spacing = 1) {
    let cursorX = x;
    const step = (FONT_W + spacing) * scale;
    for (const ch of text) {
      const glyph = getGlyph(ch);
      for (let gy = 0; gy < FONT_H; gy++) {
        for (let gx = 0; gx < FONT_W; gx++) {
          if (glyph[gy][gx] === "1") {
            for (let sy = 0; sy < scale; sy++) {
              for (let sx = 0; sx < scale; sx++) {
                this.setPixel(cursorX + gx * scale + sx, y + gy * scale + sy, color);
              }
            }
          }
        }
      }
      cursorX += step;
    }
  }
}

export function wrapText(text: string, maxWidthPx: number, scale: number, spacing = 1): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  const wordWidth = (word: string) => (FONT_W + spacing) * scale * word.length - spacing * scale;
  for (const word of words) {
    if (!current) {
      current = word;
      continue;
    }
    const candidate = current + " " + word;
    if (wordWidth(candidate) <= maxWidthPx) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}
