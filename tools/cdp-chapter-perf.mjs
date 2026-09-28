/* Нагрузка по главам скролл-истории (v79): для каждой точки истории — частота кадров, время главного потока
   на кадр и работа видеокарты по каждому WebGL-холсту (вызовы отрисовки и экземпляры за кадр).
   Цель — увидеть, что продолжает работать, когда его не видно (холм под «Кейсами», сцены кейсов на холме).

   node tools/cdp-chapter-perf.mjs [--base http://127.0.0.1:5191/] [--ps 0,0.2,0.45,0.6,0.97] [--w 1440 --h 900]
   Мерить на сборке (npm run build + vite preview), не на dev-сервере. */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { launch, sleep } from "./lib/chrome.mjs";

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i < 0 ? d : process.argv[i + 1]; };
const BASE = arg("base", "http://127.0.0.1:5191/");
const PS = arg("ps", "0,0.2,0.45,0.6,0.97").split(",").map(Number);
const W = +arg("w", 1440), H = +arg("h", 900), DPR = +arg("dpr", 1), PORT = +arg("port", 9372);
const here = dirname(fileURLToPath(import.meta.url));

const { send, close } = await launch(PORT, [
  `--remote-debugging-port=${PORT}`, `--user-data-dir=${resolve(tmpdir(), "ts2-chapter-perf")}`,
  "--headless=new", "--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist",
  "--no-first-run", "--remote-allow-origins=*", "about:blank",
]);
const ev = async (expression) => (await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true })).result?.result?.value;
await send("Page.enable");
await send("Runtime.enable");
await send("Performance.enable");
await send("Page.addScriptToEvaluateOnNewDocument", { source: readFileSync(resolve(here, "pre-draw-count.js"), "utf8") });
await send("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: DPR, mobile: false });
await send("Page.navigate", { url: `${BASE}?intro=0&splash=0&governor=0&tier=${arg("tier", "3")}` });
await sleep(+arg("wait", 12000));
const metric = async () => Object.fromEntries((await send("Performance.getMetrics")).result.metrics.map((m) => [m.name, m.value]));

for (const p of PS) {
  await ev(`(() => {
    const el = document.querySelector('.story');
    const top = el.offsetTop, lead = Math.min(top, innerHeight * (innerWidth <= 900 ? 0.4 : 1));
    const start = Math.max(0, top - lead), end = top + el.offsetHeight - innerHeight;
    scrollTo({ top: ${p} <= 0 ? 0 : start + (end - start) * ${p}, behavior: 'instant' });
  })()`);
  await sleep(2500);
  await ev(`__gl.take()`);
  const m0 = await metric();
  const frames = await ev(`new Promise(r => { let n = 0; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 < 3000) requestAnimationFrame(f); else r(n); }; requestAnimationFrame(f); })`);
  const m1 = await metric();
  const gl = await ev(`__gl.take()`);
  const task = ((m1.TaskDuration - m0.TaskDuration) * 1000) / frames;
  const script = ((m1.ScriptDuration - m0.ScriptDuration) * 1000) / frames;
  console.log(`\n── p=${p}  fps ${(frames / 3).toFixed(0)}  main thread ${task.toFixed(2)} ms/frame (script ${script.toFixed(2)})  DOM nodes ${m1.Nodes}  JS heap ${(m1.JSHeapUsedSize / 1e6).toFixed(0)} MB`);
  for (const c of gl) console.log(`   ${c.lost ? "LOST " : ""}${c.shown ? "visible" : "hidden "}  ${c.name.padEnd(22)} ${c.px.padEnd(11)} draws/frame ${(c.draws / frames).toFixed(1).padStart(6)}  instances/frame ${Math.round(c.instances / frames)}`);
}
close();
process.exit(0);
