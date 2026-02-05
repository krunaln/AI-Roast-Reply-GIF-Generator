import type { VercelRequest, VercelResponse } from "@vercel/node";
import { generateGif } from "../lib/generate.js";
import { DEFAULT_PAIRS } from "../lib/defaults.js";
import { readFile } from "fs/promises";
import { resolve } from "path";

export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const url = new URL(req.url || "", `http://${req.headers.host || "localhost"}`);
  const msg = (url.searchParams.get("msg") || "").trim();
  const aiMsg = (url.searchParams.get("ai_msg") || "").trim();
  if (aiMsg && !msg) {
    res.status(400).json({ error: "msg is required when ai_msg is provided" });
    return;
  }

  const hasSeed = url.searchParams.has("seed");
  const seedRaw = url.searchParams.get("seed");
  const seed = hasSeed ? Number(seedRaw || 0) || 0 : undefined;
  const width = Math.max(320, Math.min(800, Number(url.searchParams.get("w") || 480)));
  const height = Math.max(200, Math.min(600, Number(url.searchParams.get("h") || 270)));
  const scale = Math.max(1, Math.min(3, Number(url.searchParams.get("scale") || 1)));

  if (!msg && !aiMsg) {
    const idx = seed === undefined ? Math.floor(Math.random() * DEFAULT_PAIRS.length) : Math.abs(seed) % DEFAULT_PAIRS.length;
    const filePath = resolve(process.cwd(), "public", "defaults", `${idx}.gif`);
    const file = await readFile(filePath);
    res.setHeader("Content-Type", "image/gif");
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.status(200).send(file);
    return;
  }

  const gif = generateGif({ msg, seed, width, height, scale, aiMsg });

  res.setHeader("Content-Type", "image/gif");
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  res.status(200).send(gif);
}
