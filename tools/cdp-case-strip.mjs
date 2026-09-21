/* Лента кадров страницы кейса: прокручивает её внутренний скроллер по экрану и сохраняет кадры.
   node tools/cdp-case-strip.mjs --id ai-agents [--lang en] [--out shots/strip] [--w 1440] [--h 900] [--port 9341] [--max 30]
   Нужен dev-сервер на 5190. Chrome без окна. */
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { tmpdir } from "node:os";
import { launch, sleep } from "./lib/chrome.mjs";

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i < 0 ? d : process.argv[i + 1] ?? true; };
const ID = arg("id", "ai-agents"), LANG = arg("lang", "en");
const OUT = resolve(arg("out", `shots/strip/${ID}`));
const W = +arg("w", 1440), H = +arg("h", 900), PORT = +arg("port", 9341), MAX = +arg("max", 30);
const BASE = arg("base", "http://127.0.0.1:5190/");
const SEL = arg("scroller", ".cs-scroll");

const { send, close } = await launch(PORT, [
  `--remote-debugging-port=${PORT}`, `--user-data-dir=${resolve(tmpdir(), "portfolio-3d-ts2-strip")}`,
  "--headless=new", "--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist", "--remote-allow-origins=*",
  `--window-size=${W},${H}`, "--hide-scrollbars", "about:blank",
]);
const evalJs = async (expression) => (await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true })).result?.result?.value;
await send("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: 1, mobile: false });
await send("Page.enable");
await send("Page.navigate", { url: `${BASE}?lang=${LANG}&intro=0#/work/${ID}` });
await sleep(7000);
mkdirSync(OUT, { recursive: true });
const info = await evalJs(`(() => { const all = [...document.querySelectorAll("*")].filter(e => e.scrollHeight > e.clientHeight + 200 && getComputedStyle(e).overflowY !== "visible" && e.clientHeight > 300); const s = document.querySelector(${JSON.stringify(SEL)}) || all.sort((a, b) => b.scrollHeight - a.scrollHeight)[0]; window.__s = s; return s ? { cls: s.className, h: s.scrollHeight, v: s.clientHeight } : null })()`);
console.log("скроллер:", JSON.stringify(info));
if (!info) { close(); process.exit(1); }
const step = Math.round(info.v * 0.92);
let n = 0;
for (let y = 0; y < info.h && n < MAX; y += step, n++) {
  await evalJs(`(() => { window.__s.scrollTop = ${y}; })()`);
  await sleep(900);
  const shot = await send("Page.captureScreenshot", { format: "jpeg", quality: 72 });
  writeFileSync(resolve(OUT, `${String(n).padStart(2, "0")}.jpg`), Buffer.from(shot.result.data, "base64"));
}
console.log(`кадров: ${n}, высота страницы ${info.h}px → ${OUT}`);
close();
