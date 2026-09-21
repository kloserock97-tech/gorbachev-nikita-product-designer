/* Десятисекундный тест: через сколько секунд гость видит имя, роль, призыв к действию и работы.
   На той стороне у человека 30 секунд на решение, и экран загрузки съедает их первыми.

   node tools/cdp-first-read.mjs [--base http://127.0.0.1:5190/] [--lang en] [--net 4g|none] [--port 9343]
   Нужен dev-сервер (или preview). Chrome без окна. */
import { resolve } from "node:path";
import { tmpdir } from "node:os";
import { launch, sleep } from "./lib/chrome.mjs";

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i < 0 ? d : process.argv[i + 1] ?? true; };
const BASE = arg("base", "http://127.0.0.1:5190/"), LANG = arg("lang", "en"), PORT = +arg("port", 9343), NET = arg("net", "none");

const { send, close } = await launch(PORT, [
  `--remote-debugging-port=${PORT}`, `--user-data-dir=${resolve(tmpdir(), "portfolio-3d-ts2-first")}`,
  "--headless=new", "--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist", "--remote-allow-origins=*", "--hide-scrollbars",
  "--window-size=1440,900", "about:blank",
]);
const evalJs = async (expression) => (await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true })).result?.result?.value;
await send("Page.enable");
await send("Network.enable");
if (NET !== "none") {
  /* «быстрый 4G» из панели разработчика: рекрутёр смотрит не всегда с офисного интернета */
  await send("Network.emulateNetworkConditions", { offline: false, latency: 70, downloadThroughput: 9 * 1024 * 1024 / 8, uploadThroughput: 3 * 1024 * 1024 / 8 });
}

/* видимость по существу: элемент есть, не прозрачен, не за экраном и с непустым текстом */
const seen = `(() => {
  const vis = (sel) => { const e = document.querySelector(sel); if (!e) return false; const r = e.getBoundingClientRect();
    if (r.width < 4 || r.height < 4 || r.top > innerHeight || r.bottom < 0) return false;
    for (let p = e; p; p = p.parentElement) { const s = getComputedStyle(p); if (s.display === "none" || s.visibility === "hidden" || +s.opacity < 0.05) return false; }
    return (e.textContent || "").trim().length > 1; };
  return { name: vis("[data-i18n='hero.name']"), role: vis("[data-i18n='hero.role']"), lede: vis("[data-i18n='hero.lede'], [data-i18n='hero.lede.lite']"),
           cta: vis("[data-i18n='hero.explore']"), work: vis(".dock a[href='#work'], .dock [data-i18n='nav.work']"),
           loader: !!document.querySelector(".garden, .intro, [class*='loader']") };
})()`;

const t0 = Date.now();
await send("Page.navigate", { url: `${BASE}?lang=${LANG}` });
const marks = {};
for (let i = 0; i < 120; i++) {
  const s = await evalJs(seen);
  if (s) for (const k of ["name", "role", "lede", "cta", "work"]) if (s[k] && !marks[k]) marks[k] = Date.now() - t0;
  if (["name", "role", "lede", "cta"].every((k) => marks[k])) break;
  await sleep(250);
}
const weight = await evalJs(`(() => { const r = performance.getEntriesByType("resource"); const sum = (f) => Math.round(r.filter(f).reduce((n, x) => n + (x.encodedBodySize || 0), 0) / 1024);
  return { total: sum(() => true), img: sum((x) => x.initiatorType === "img" || /\\.(avif|webp|png|jpe?g)/.test(x.name)), js: sum((x) => /\\.js/.test(x.name)), n: r.length } })()`);

console.log(`сеть: ${NET}, язык: ${LANG}`);
for (const [k, label] of [["name", "имя"], ["role", "роль"], ["lede", "о чём я"], ["cta", "кнопка «смотреть кейсы»"], ["work", "пункт Work в доке"]])
  console.log(`  ${label.padEnd(24)} ${marks[k] ? (marks[k] / 1000).toFixed(1) + " с" : "не появилось за 30 с"}`);
console.log(`  вес загруженного          ${weight.total} КБ (картинки ${weight.img}, скрипты ${weight.js}, запросов ${weight.n})`);
close();
