/* Резкий взмах колесом и пальцем: где остановится страница. Проверка остановки на About (storyScroll.ts, v74.3).

   node tools/fling-test.mjs [--url http://127.0.0.1:5200/?intro=0&lite=0] [--mode wheel|touch]

   Колесо — серия событий mouseWheel за ~0,3 с, как у быстрого взмаха на мыши с разгоном; палец — быстрый свайп
   снизу вверх с отпусканием на скорости (инерция). Печатает прогресс истории после остановки и долю главы About */
import { resolve } from "node:path";
import { tmpdir } from "node:os";
import { launch, sleep } from "./lib/chrome.mjs";

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i < 0 ? d : process.argv[i + 1]; };
const URL_ = arg("url", "http://127.0.0.1:5200/?intro=0&lite=0&tier=6&governor=0");
const MODE = arg("mode", "wheel");
const touch = MODE === "touch";
const W = touch ? 390 : 1440, H = touch ? 844 : 900;
const PORT = +arg("port", 9431);
const FROM = arg("from", ""); // доля главы About, откуда начать жест

const { send, close } = await launch(PORT, [
  `--remote-debugging-port=${PORT}`, `--user-data-dir=${resolve(tmpdir(), "portfolio-fling")}`,
  "--headless=new", "--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist", "--no-first-run",
  "--remote-allow-origins=*", `--window-size=${W},${H}`, "about:blank",
]);
const evaluate = async (expression) => (await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true })).result?.result?.value;
await send("Page.enable"); await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: 1, mobile: touch });
if (touch) await send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
await send("Page.navigate", { url: URL_ });
await sleep(9000);

const state = () => evaluate(`(() => { const el = document.querySelector('.story'); const top = el.offsetTop, lead = Math.min(top, innerHeight * (innerWidth <= 900 ? 0.4 : 1)); const start = Math.max(0, top - lead), end = top + el.offsetHeight - innerHeight; const p = (scrollY - start) / (end - start); const [a] = window.__story.chapter(); return JSON.stringify({ p: +p.toFixed(4), about: +(p / a).toFixed(3), y: Math.round(scrollY) }); })()`);

if (touch) {
  /* дойти до начала истории (низ первого экрана), дальше — резкий свайп */
  await evaluate(FROM ? `(() => { const el = document.querySelector('.story'); const top = el.offsetTop, lead = Math.min(top, innerHeight * 0.4); const start = Math.max(0, top - lead), end = top + el.offsetHeight - innerHeight; scrollTo({ top: start + (end - start) * window.__story.chapter()[0] * ${FROM || 0}, behavior: 'instant' }); })()` : `scrollTo({ top: document.querySelector('.story').offsetTop - innerHeight * 0.4, behavior: 'instant' })`);
  await sleep(800);
  const x = 200, y0 = 720, y1 = 120, steps = 6;
  await send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y: y0 }] });
  for (let i = 1; i <= steps; i++) {
    await send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y: y0 + ((y1 - y0) * i) / steps }] });
    await sleep(12);
  }
  await send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
} else {
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: W / 2, y: H / 2 });
  for (let i = 0; i < 28; i++) {
    await send("Input.dispatchMouseEvent", { type: "mouseWheel", x: W / 2, y: H / 2, deltaX: 0, deltaY: 240 });
    await sleep(12);
  }
}
await sleep(2500);
console.log(MODE, await state());
close();
process.exit(0);
