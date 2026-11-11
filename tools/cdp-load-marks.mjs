/* Загрузка первого экрана по вехам: когда заставка на экране, когда сцена готова, когда холм начал проявляться и
   когда появилась кнопка Enter (v140).

   node tools/cdp-load-marks.mjs [--url http://127.0.0.1:5191/] [--compare http://127.0.0.1:5192/] [--n 5]
                                 [--mobile] [--cpu 4] [--cold] [--port 9468]

   --compare — вторая сборка (например, исходник из `vite build --outDir dist-base` на другом порту): прогоны
   чередуются, А-Б-А-Б. Сравнивать только так: машина между сериями бывает занята другим, и абсолютные цифры плывут
   вдвое, а в чередовании обе сборки попадают в одни условия.
   --cold — без прогрева. По умолчанию браузер перед навигацией прогревается: только что запущенный Chrome первые
   полсекунды поднимает процесс видеокарты, и первое обращение страницы к WebGL его ждёт. У посетителя браузер уже
   открыт; без прогрева в виновники попадает тот, кто первым тронул видеокарту (так «дорогим» выглядел glassLens).

   Вехи: loaderPaint — первый кадр после того, как заставка появилась в DOM; sceneReady — body.scene-ready;
   reveal — вуаль начала таять; loaderReady — кнопка Enter; block — сумма блокировок долгими кадрами;
   revealWorst — худший кадр между reveal и loaderReady (рывок в проявлении холма). */
import { resolve } from "node:path";
import { tmpdir } from "node:os";
import { rmSync } from "node:fs";
import { launch, sleep } from "./lib/chrome.mjs";

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i < 0 ? d : process.argv[i + 1]; };
const has = (k) => process.argv.includes(`--${k}`);
const URL_ = arg("url", "http://127.0.0.1:5191/"), OTHER = arg("compare", ""), N = +arg("n", 5), CPU = +arg("cpu", 1), PORT = +arg("port", 9468);
const mobile = has("mobile");
const W = +arg("w", mobile ? 390 : 1368), H = +arg("h", mobile ? 844 : 775), DPR = +arg("dpr", mobile ? 2 : 1.5);
const KEYS = ["loaderPaint", "sceneReady", "reveal", "loaderReady", "block", "revealWorst", "kb"];

const PRE = `
  window.__lp = { loaf: [], marks: {}, frames: [] };
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) __lp.loaf.push({ start: e.startTime, block: e.blockingDuration }); }).observe({ type: "long-animation-frame", buffered: true }); } catch {}
  (function tick(t) { __lp.frames.push(t); requestAnimationFrame(tick); })(0);
  new MutationObserver(() => {
    const m = __lp.marks, now = Math.round(performance.now());
    if (!m.loader && document.querySelector(".focus-loader")) m.loader = now;
    if (!m.sceneReady && document.body?.classList.contains("scene-ready")) m.sceneReady = now;
    if (!m.reveal && document.querySelector(".focus-loader.is-revealing")) m.reveal = now;
    if (!m.loaderReady && document.querySelector(".focus-loader.is-ready")) m.loaderReady = now;
  }).observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ["class"] });`;
const READ = `(() => { const m = __lp.marks;
  const fr = __lp.frames.filter((t) => m.reveal && t >= m.reveal && t <= m.loaderReady); let worst = 0; for (let i = 1; i < fr.length; i++) worst = Math.max(worst, fr[i] - fr[i - 1]);
  return { ...m, loaderPaint: Math.round(__lp.frames.find((t) => t >= m.loader) ?? 0), block: Math.round(__lp.loaf.reduce((a, e) => a + e.block, 0)), revealWorst: Math.round(worst),
    kb: Math.round(performance.getEntriesByType("resource").reduce((a, r) => a + r.transferSize, 0) / 1024) }; })()`;

async function run(url) {
  const dir = resolve(tmpdir(), `ts2-load-marks-${PORT}`);
  try { rmSync(dir, { recursive: true, force: true }); } catch { /* нет — и хорошо */ }
  const { send, close } = await launch(PORT, [`--remote-debugging-port=${PORT}`, `--user-data-dir=${dir}`, "--headless=new", "--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist", "--no-first-run", "--remote-allow-origins=*", `--window-size=${W},${H}`, "about:blank"]);
  const ev = async (expression) => (await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true })).result?.result?.value;
  await send("Page.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: DPR, mobile });
  if (mobile) {
    await send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
    await send("Emulation.setUserAgentOverride", { userAgent: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36" });
  }
  if (CPU > 1) await send("Emulation.setCPUThrottlingRate", { rate: CPU });
  await send("Page.addScriptToEvaluateOnNewDocument", { source: PRE });
  if (!has("cold")) {
    await ev("(() => { const g = document.createElement('canvas').getContext('webgl2'); g && g.getParameter(g.VERSION); const d = document.createElement('canvas').getContext('2d'); d.fillRect(0, 0, 1, 1); d.canvas.toDataURL(); })()");
    await sleep(2500);
  }
  await send("Page.navigate", { url });
  const t0 = Date.now();
  while (Date.now() - t0 < 90000) { await sleep(250); if (await ev("!!(window.__lp && __lp.marks.loaderReady)").catch(() => false)) break; }
  await sleep(600);
  const row = await ev(READ);
  close();
  await sleep(400);
  return row;
}

const rows = { a: [], b: [] };
for (let i = 0; i < N; i++) {
  if (OTHER) { const r = await run(OTHER); rows.b.push(r); console.log(`  Б #${i + 1} ${JSON.stringify(r)}`); }
  const r = await run(URL_); rows.a.push(r); console.log(`  А #${i + 1} ${JSON.stringify(r)}`);
}
const median = (list, k) => { const v = list.map((r) => r?.[k]).filter((x) => x != null).sort((x, y) => x - y); return v.length ? v[Math.floor((v.length - 1) / 2)] : "—"; };
const line = (name, list) => `${name}  n=${list.length}  ${KEYS.map((k) => `${k} ${median(list, k)}`).join(" | ")}`;
if (OTHER) console.log(line(`Б ${OTHER}`, rows.b));
console.log(line(`А ${URL_}`, rows.a));
process.exit(0);
