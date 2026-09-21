/* Что на страницах кейсов вылезает за правый край экрана: телефон, маленький ноутбук, обычный монитор.
   Экран у рекрутёра может быть любым, а текст, обрезанный краем, читается как неряшливость.

   node tools/cdp-overflow.mjs [--base http://127.0.0.1:5190/] [--lang en] [--port 9342]
   Нужен dev-сервер на 5190 (или preview — тогда --base). Chrome без окна. Выход 1, если что-то найдено. */
import { resolve } from "node:path";
import { tmpdir } from "node:os";
import { launch, sleep } from "./lib/chrome.mjs";

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i < 0 ? d : process.argv[i + 1] ?? true; };
const BASE = arg("base", "http://127.0.0.1:5190/"), LANGS = String(arg("lang", "en,ru")).split(","), PORT = +arg("port", 9342);
const IDS = String(arg("ids", "grif-ai,ai-agents,community,moderator-dashboard,stop-spam,electronic-house")).split(",");
const SIZES = [[390, 844], [1280, 720], [1440, 900]];

const { send, close } = await launch(PORT, [
  `--remote-debugging-port=${PORT}`, `--user-data-dir=${resolve(tmpdir(), "portfolio-3d-ts2-overflow")}`,
  "--headless=new", "--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist", "--remote-allow-origins=*", "--hide-scrollbars", "about:blank",
]);
const evalJs = async (expression) => (await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true })).result?.result?.value;
await send("Page.enable");

/* Сцены с экранами и ленты намеренно шире экрана и обрезаются своим контейнером — их не считаем:
   смотрим только на текст и плитки, у которых нет обрезающего предка внутри страницы кейса. */
const probe = `(() => {
  const root = document.querySelector(".cs"); if (!root) return null;
  const W = document.documentElement.clientWidth, out = [];
  const clipped = (el) => { for (let p = el.parentElement; p && p !== root; p = p.parentElement) { const o = getComputedStyle(p); if (/(hidden|clip|auto|scroll)/.test(o.overflowX)) return true; } return false; };
  for (const el of root.querySelectorAll("p, li, h1, h2, h3, h4, b, dd, dt, td, th, figcaption, a, span")) {
    if (!el.textContent.trim() || el.children.length > 3) continue;
    const r = el.getBoundingClientRect(); if (r.width < 2 || r.height < 2) continue;
    if (r.right > W + 1 && !clipped(el)) out.push({ tag: el.tagName.toLowerCase() + (el.className ? "." + String(el.className).split(" ")[0] : ""), over: Math.round(r.right - W), text: el.textContent.trim().slice(0, 50) });
  }
  const seen = new Set(); return out.filter((x) => { const k = x.tag + x.text; if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, 8);
})()`;

let bad = 0;
for (const [w, h] of SIZES) {
  await send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 1, mobile: w < 600 });
  for (const lang of LANGS) for (const id of IDS) {
    await send("Page.navigate", { url: `${BASE}?lang=${lang}&intro=0&lite=${w < 600 ? 1 : 0}#/work/${id}` });
    await sleep(w < 600 ? 3500 : 6000);
    /* раскрыть всё, что появляется по прокрутке, иначе скрытые блоки имеют нулевой размер */
    await evalJs(`document.querySelectorAll("[data-reveal]").forEach((e) => e.classList.add("is-in"))`);
    const found = await evalJs(probe);
    if (found === null) { console.log(`?  ${w}px ${lang} ${id}: страница кейса не открылась`); bad++; continue; }
    if (found.length) { bad += found.length; console.log(`✗  ${w}px ${lang} ${id}`); for (const f of found) console.log(`     +${f.over}px  ${f.tag}  «${f.text}»`); }
    else console.log(`ok ${w}px ${lang} ${id}`);
  }
}
close();
process.exit(bad ? 1 : 0);
