/* Разбор чужой страницы «на насмотренность» (v64): снимки по шагам прокрутки и выписка того, из чего она сделана.
   Снимки отвечают на вопрос «как это выглядит», выписка — «какими числами»: шкала шрифтов, трекинг, интерлиньяж,
   скругления и фоны крупных плиток, ширина контента. Чужой код и картинки не сохраняются — только числа и кадры
   для себя (shots/ вне git).

   node tools/site-study.mjs --url https://www.apple.com/iphone/ [--out shots/v64/research/apple/iphone]
                             [--w 1440] [--h 900] [--dpr 1] [--steps 8] [--step 0.9] [--wait 3500] [--settle 1100]
                             [--mobile] [--port 9460] [--from 0]
   --steps   сколько экранов снять сверху вниз; --step — доля высоты окна на шаг; --from — с какого экрана начать.
   В конце печатает JSON: высота страницы, шкала шрифтов (чем чаще встречается, тем выше), плитки, кнопки. */
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { tmpdir } from "node:os";
import { launch, sleep } from "./lib/chrome.mjs";

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i < 0 ? d : process.argv[i + 1]; };
const URL_ = arg("url", "https://www.apple.com/");
const OUT = resolve(arg("out", "shots/v64/research/site"));
const W = +arg("w", 1440), H = +arg("h", 900), DPR = +arg("dpr", 1);
const STEPS = +arg("steps", 8), STEP = +arg("step", 0.9), FROM = +arg("from", 0);
const WAIT = +arg("wait", 3500), SETTLE = +arg("settle", 1100), PORT = +arg("port", 9460);
const MOBILE = process.argv.includes("--mobile");
mkdirSync(OUT, { recursive: true });

const { send, close } = await launch(PORT, [
  `--remote-debugging-port=${PORT}`, `--user-data-dir=${resolve(tmpdir(), `portfolio-3d-ts2-study-${PORT}`)}`,
  "--headless=new", "--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist", "--no-first-run",
  "--remote-allow-origins=*", "--autoplay-policy=no-user-gesture-required", `--window-size=${W},${H}`, "about:blank",
]);
const evaluate = async (expr) => (await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true })).result?.result?.value;

await send("Page.enable"); await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: DPR, mobile: MOBILE });
await send("Emulation.setUserAgentOverride", {
  userAgent: MOBILE
    ? "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1"
    : "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
});
if (MOBILE) await send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
await send("Page.navigate", { url: URL_ });
await sleep(WAIT);

const shot = async (name) => {
  const r = await send("Page.captureScreenshot", { format: "jpeg", quality: 72 });
  if (r.result?.data) writeFileSync(resolve(OUT, `${name}.jpg`), Buffer.from(r.result.data, "base64"));
};

/* прокрутка колесом, а не scrollTo: страницы со сценами на прокрутке слушают именно его */
const total = await evaluate("Math.max(document.documentElement.scrollHeight, document.body.scrollHeight)");
for (let i = FROM; i < FROM + STEPS; i++) {
  const y = Math.round(i * H * STEP);
  if (y > total) break;
  await evaluate(`window.scrollTo({ top: ${y}, behavior: "instant" })`);
  await sleep(SETTLE);
  await shot(String(i).padStart(2, "0"));
}

const PROBE = `(() => {
  const vis = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  const fonts = new Map();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let n;
  while ((n = walker.nextNode())) {
    const text = n.nodeValue.trim();
    if (text.length < 2) continue;
    const el = n.parentElement;
    if (!el || !vis(el)) continue;
    const s = getComputedStyle(el);
    const size = parseFloat(s.fontSize);
    const track = s.letterSpacing === "normal" ? 0 : parseFloat(s.letterSpacing) / size;
    const lh = s.lineHeight === "normal" ? "normal" : (parseFloat(s.lineHeight) / size).toFixed(3);
    const key = [size, s.fontWeight, track.toFixed(3), lh, s.fontFamily.split(",")[0].trim()].join(" | ");
    const e = fonts.get(key) ?? { count: 0, chars: 0, sample: text.slice(0, 60), color: s.color, tag: el.tagName.toLowerCase(), transform: s.textTransform };
    e.count++; e.chars += text.length;
    fonts.set(key, e);
  }
  const scale = [...fonts].map(([k, v]) => ({ font: k, ...v })).sort((a, b) => parseFloat(b.font) - parseFloat(a.font)).slice(0, 40);
  const tiles = [];
  for (const el of document.querySelectorAll("section, div, li, a, article, figure")) {
    const r = el.getBoundingClientRect();
    if (r.width < 260 || r.height < 180 || r.width > innerWidth * 0.98) continue;
    const s = getComputedStyle(el);
    const radius = parseFloat(s.borderTopLeftRadius);
    if (!(radius >= 12)) continue;
    tiles.push({ w: Math.round(r.width), h: Math.round(r.height), radius: s.borderTopLeftRadius, bg: s.backgroundColor, pad: s.padding, shadow: s.boxShadow === "none" ? "" : s.boxShadow.slice(0, 80), cls: (el.className?.toString() ?? "").slice(0, 60) });
  }
  const uniqTiles = [...new Map(tiles.map((t) => [t.w + "x" + t.h + t.radius + t.bg, t])).values()].slice(0, 30);
  const buttons = [...document.querySelectorAll("a, button")].filter(vis).map((el) => {
    const s = getComputedStyle(el), r = el.getBoundingClientRect();
    return { text: (el.textContent ?? "").trim().slice(0, 28), w: Math.round(r.width), h: Math.round(r.height), radius: s.borderTopLeftRadius, bg: s.backgroundColor, color: s.color, size: s.fontSize, weight: s.fontWeight, pad: s.padding };
  }).filter((b) => parseFloat(b.radius) >= 8 && b.bg !== "rgba(0, 0, 0, 0)" && b.text);
  const uniqButtons = [...new Map(buttons.map((b) => [b.h + b.radius + b.bg + b.size, b])).values()].slice(0, 16);
  const widths = {};
  for (const el of document.querySelectorAll("main section > div, main > div > div, [class*=content], [class*=container], [class*=wrapper]")) {
    const w = Math.round(el.getBoundingClientRect().width);
    if (w > 500 && w < innerWidth) widths[w] = (widths[w] ?? 0) + 1;
  }
  const commonWidths = Object.entries(widths).sort((a, b) => b[1] - a[1]).slice(0, 8);
  return JSON.stringify({ title: document.title, height: document.documentElement.scrollHeight, bodyBg: getComputedStyle(document.body).backgroundColor, scale, tiles: uniqTiles, buttons: uniqButtons, commonWidths });
})()`;
const data = await evaluate(PROBE);
writeFileSync(resolve(OUT, "study.json"), data ?? "{}");
console.log(data);
close();
process.exit(0);
