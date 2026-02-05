import type { VercelRequest, VercelResponse } from "@vercel/node";
import { generateGif } from "../lib/generate.js";

export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
  },
};

export default function handler(req: VercelRequest, res: VercelResponse) {
  const url = new URL(req.url || "", `http://${req.headers.host || "localhost"}`);
  const msg = (url.searchParams.get("msg") || "").trim();
  if (!msg) {
    res.status(400).json({ error: "Missing msg param" });
    return;
  }

  const seed = Number(url.searchParams.get("seed") || 0) || 0;
  const width = Math.max(320, Math.min(800, Number(url.searchParams.get("w") || 480)));
  const height = Math.max(200, Math.min(600, Number(url.searchParams.get("h") || 270)));
  const scale = Math.max(1, Math.min(3, Number(url.searchParams.get("scale") || 1)));

  const gif = generateGif({ msg, seed, width, height, scale });

  res.setHeader("Content-Type", "image/gif");
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  res.status(200).send(gif);
}
