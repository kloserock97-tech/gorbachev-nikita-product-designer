/* Обложки кейсов для лёгкой версии: снимает tools/case-cards.html (настоящий экран продукта на цветах кейса) в
   public/lite/cards/<id>.webp, 960×600 с двойной плотностью и уменьшением — чёткие и лёгкие.
   node tools/render-case-cards.mjs [--base http://127.0.0.1:5247/]  (нужен запущенный vite dev) */
import { mkdirSync, writeFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import { launch, sleep } from "./lib/chrome.mjs";

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i < 0 ? d : process.argv[i + 1]; };
const BASE = arg("base", "http://127.0.0.1:5247/");
const IDS = ["grif-ai", "community", "ai-agents", "moderator-dashboard", "plati-chastyami", "restaurant-guru"];
const OUT = resolve("public/lite/cards");
const PORT = 9402;
mkdirSync(OUT, { recursive: true });

const { send, close } = await launch(PORT, [`--remote-debugging-port=${PORT}`, `--user-data-dir=${resolve(tmpdir(), "case-cards")}`,
  "--headless=new", "--no-first-run", "--remote-allow-origins=*", "about:blank"]);
await send("Page.enable");
await send("Emulation.setDeviceMetricsOverride", { width: 960, height: 600, deviceScaleFactor: 2, mobile: false });
const tmp = resolve(tmpdir(), "case-card.png");
for (const id of IDS) {
  await send("Page.navigate", { url: `${BASE}tools/case-cards.html?id=${id}` });
  for (let i = 0; i < 40; i++) {
    await sleep(150);
    const r = await send("Runtime.evaluate", { expression: "window.cardReady === true", returnByValue: true });
    if (r.result?.result?.value) break;
  }
  await sleep(200);
  const { result } = await send("Page.captureScreenshot", { format: "png" });
  writeFileSync(tmp, Buffer.from(result.data, "base64"));
  const out = resolve(OUT, `${id}.webp`);
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", tmp, "-vf", "scale=960:-2:flags=lanczos", "-c:v", "libwebp_anim", "-quality", "82", "-frames:v", "1", out]);
  console.log(`${id}: ${(statSync(out).size / 1e3).toFixed(0)} KB`);
}
close();
process.exit(0);
