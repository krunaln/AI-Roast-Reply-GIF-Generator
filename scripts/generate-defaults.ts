import { writeFile, mkdir } from "fs/promises";
import { resolve } from "path";
import { DEFAULT_PAIRS } from "../lib/defaults.js";
import { generateGif } from "../lib/generate.js";

async function main() {
  const outDir = resolve("public/defaults");
  await mkdir(outDir, { recursive: true });

  const width = 480;
  const height = 270;
  const scale = 1;

  for (let i = 0; i < DEFAULT_PAIRS.length; i++) {
    const pair = DEFAULT_PAIRS[i];
    const gif = generateGif({
      msg: pair.user,
      aiMsg: pair.ai.replace("{msg}", pair.user),
      seed: i,
      width,
      height,
      scale,
    });
    const outPath = resolve(outDir, `${i}.gif`);
    await writeFile(outPath, gif);
  }

  // eslint-disable-next-line no-console
  console.log(`Generated ${DEFAULT_PAIRS.length} default GIFs in ${outDir}`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
