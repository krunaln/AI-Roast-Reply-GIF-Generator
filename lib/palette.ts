export const PALETTE = [
  0x0f172a, // bg
  0x111827, // panel
  0x1f2937, // input
  0x334155, // border
  0x3b82f6, // accent
  0x0b1020, // shadow
  0xe2e8f0, // text light
  0x94a3b8, // text dim
  0x38bdf8, // user bubble
  0x1e293b, // ai bubble
  0xf8fafc, // white
  0x0f766e, // send btn
  0x22c55e, // spare
  0xf59e0b, // spare
  0xef4444, // spare
  0x64748b, // spare
];

export function makeColorIndexMap(): Map<number, number> {
  const map = new Map<number, number>();
  for (let i = 0; i < PALETTE.length; i++) {
    map.set(PALETTE[i], i);
  }
  return map;
}

export function rgbToKey(r: number, g: number, b: number): number {
  return (r << 16) | (g << 8) | b;
}

export function paletteToArray(): number[] {
  return PALETTE.slice();
}
