# AI Roast Reply GIF Generator

![AI Roaster Demo](https://ai-roaster-pi.vercel.app/api/gif)

Make a deterministic, README‑embeddable GIF that looks like a chat app roasting your message. No APIs, no LLMs, no external services. Just pure server‑generated pixels.

If you want to add this to your README, drop in this Markdown:
```md
![AI Roaster](https://ai-roaster-pi.vercel.app/api/gif)
```

## What It Does
- Renders a chat UI
- Types your message, clicks Send
- Types a roast response
- Loops forever

## Quick Start (Local)
```bash
npm install
npx vercel dev
```

Open:
```
http://localhost:3000/api/gif?msg=hello%20world&seed=1&w=480&h=270&scale=1
```

## Deploy (Vercel)
```bash
npx vercel
# then
npx vercel --prod
```

## API
`GET /api/gif`

Query params:
- `msg` (optional): text to roast (if omitted, a precomputed default pair is used)
- `ai_msg` (optional): custom AI reply (requires `msg`, skips classifier)
- `seed` (optional, number): deterministic variation (also selects a deterministic default pair)
- `w` (optional, number): width, default 480 (min 320, max 800)
- `h` (optional, number): height, default 270 (min 200, max 600)
- `scale` (optional, 1..3): pixel scale

Default behavior:
- If `msg` is omitted, the API serves a **precomputed** default GIF from `/public/defaults/`.
- If `seed` is omitted, that default is **random** and **not cached**.
- If `seed` is provided, the default is deterministic and **cached**.

Example:
```
/api/gif?msg=ship%20it&seed=42&w=360&h=220&scale=1
```

## Precompute Default GIFs
```bash
npm run generate:defaults
```
This writes files to `public/defaults/` that are served via Vercel’s CDN.

## Performance Tips
This is pure JS pixel rendering, so runtime is roughly proportional to:
```
frames × width × height
```
Faster options:
- Lower `w`/`h`
- Keep `scale=1`
- Shorter `msg`

## Determinism
Same input yields the same GIF:
- Roast selection is seeded
- Typing timing is deterministic
- Fixed palette for encoding

## Project Layout
- `api/gif.ts` Vercel Serverless Function
- `lib/generate.ts` frame builder + encoder
- `lib/renderer.ts` tiny pixel renderer
- `lib/font.ts` 5x7 bitmap font

## Roast Disclaimer
The roast is a joke. If your message feels personally attacked, blame the deterministic seed.

## License
MIT
