/* Нагрузочный прогон портфолио на профилях устройств (docs/prompts/v24.md, п. 2).

   node tools/load-test.mjs [--url http://127.0.0.1:5191/] [--only desktop-hi,phone-weak] [--out shots/v24/load]

   Каждый профиль — свежий headless Chrome (свой профиль, без кэша ступени качества) с эмуляцией
   экрана, CPU, сети, prefers-reduced-motion. Сценарий: загрузка → ждём показа UI → медленная
   прокрутка всей истории (холм → полёт → About → кейсы → футер) и обратно к холму.
   Собирается: ошибки/предупреждения консоли и исключения, упавшие запросы, вес загрузки,
   время до готового UI, интервалы кадров сцены по главам, долгие задачи, память, ступень качества.
   Итог — JSON + скриншоты в --out; сводку печатает в консоль.

   Мерить на собранной версии (npm run build && npx vite preview --port 5191) — dev-сервер отдаёт
   сотни несжатых модулей и искажает загрузку. */
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { tmpdir } from "node:os";

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i < 0 ? d : process.argv[i + 1]; };
const URL_ = arg("url", "http://127.0.0.1:5191/");
const OUT = resolve(arg("out", "shots/v24/load"));
const ONLY = arg("only", "")?.split(",").filter(Boolean) ?? [];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
mkdirSync(OUT, { recursive: true });

const NET = {
  "4g": { offline: false, latency: 60, downloadThroughput: (9 * 1024 * 1024) / 8, uploadThroughput: (3 * 1024 * 1024) / 8 },
  "3g": { offline: false, latency: 300, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 },
};
const IPHONE_UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
const ANDROID_UA = "Mozilla/5.0 (Linux; Android 13; SM-A135F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36";

const PROFILES = [
  { id: "desktop-hi", title: "Мощный ПК: DPR 2.25, 1368×775, CPU без замедления", w: 1368, h: 775, dpr: 2.25, gpu: "high" },
  { id: "laptop-mid", title: "Средний ноутбук: встроенная графика, DPR 1.25, 1440×900, CPU ×4", w: 1440, h: 900, dpr: 1.25, cpu: 4, gpu: "low" },
  { id: "weak-gpu", title: "Слабая видеокарта (программный рендер SwiftShader), 1280×720, CPU ×2", w: 1280, h: 720, dpr: 1, cpu: 2, gpu: "swiftshader", scrollMs: 9000 },
  { id: "phone-good", title: "Хороший телефон: 390×844 DPR 3, CPU ×2.5, 4G", w: 390, h: 844, dpr: 3, mobile: true, ua: IPHONE_UA, cpu: 2.5, net: "4g", gpu: "low" },
  { id: "phone-weak", title: "Бюджетный Android: 360×800 DPR 2, CPU ×6, 3G", w: 360, h: 800, dpr: 2, mobile: true, ua: ANDROID_UA, cpu: 6, net: "3g", gpu: "low", scrollMs: 9000 },
  { id: "reduced-motion", title: "Ноутбук с prefers-reduced-motion, DPR 1.5", w: 1440, h: 900, dpr: 1.5, reduced: true, gpu: "low" },
  { id: "no-webgl", title: "Браузер без WebGL", w: 1280, h: 800, dpr: 1, gpu: "none", noScroll: true },
  { id: "context-loss", title: "Потеря WebGL-контекста после загрузки (телефон выгрузил вкладку)", w: 1280, h: 800, dpr: 1, gpu: "low", loseContext: true, noScroll: true },
  { id: "rotate", title: "Телефон: поворот в альбомную и обратно", w: 390, h: 844, dpr: 3, mobile: true, ua: IPHONE_UA, cpu: 2, gpu: "low", rotate: true },
];

/* скрипт до загрузки страницы: долгие задачи, ошибки ресурсов, CLS */
const PRELUDE = `(() => {
  const t = window.__lt = { long: [], shift: 0, shifts: [], lcp: 0, resErr: [] };
  try { new PerformanceObserver((l) => l.getEntries().forEach((e) => t.long.push([Math.round(e.startTime), Math.round(e.duration)]))).observe({ type: "longtask", buffered: true }); } catch {}
  try { new PerformanceObserver((l) => l.getEntries().forEach((e) => { if (!e.hadRecentInput) { t.shift += e.value; if (e.value > 0.005) t.shifts.push([Math.round(e.startTime), +e.value.toFixed(3), (e.sources || []).map((s) => s.node ? (s.node.className || s.node.nodeName).toString().slice(0, 40) : "?").join("|")]); } })).observe({ type: "layout-shift", buffered: true }); } catch {}
  try { new PerformanceObserver((l) => l.getEntries().forEach((e) => (t.lcp = Math.round(e.startTime)))).observe({ type: "largest-contentful-paint", buffered: true }); } catch {}
  addEventListener("error", (e) => { const s = e.target && (e.target.src || e.target.href); if (s) t.resErr.push(s); }, true);
})();`;

/* в странице: обернуть fx.render и записывать интервалы с прогрессом истории */
const HOOK = `(() => {
  const h = window.__hill; if (!h || !h.fx || h.__hooked) return !!(h && h.__hooked);
  h.__hooked = true; const t = window.__lt; t.frames = []; let last = 0;
  const orig = h.fx.render.bind(h.fx);
  h.fx.render = (...a) => { const now = performance.now(); if (last) t.frames.push([+(h.storyProgress || 0).toFixed(4), +(now - last).toFixed(1)]); last = now; return orig(...a); };
  return true;
})()`;

/* плавная прокрутка всей истории вниз и обратно; шаг — rAF, как колесо/палец */
const SCROLL = (ms) => `new Promise((done) => {
  const story = document.querySelector(".story");
  const top = story.offsetTop, start = Math.max(0, top - innerHeight), end = top + story.offsetHeight - innerHeight;
  const legs = [[0, 1, ${ms}], [1, 0.43, ${Math.round(ms * 0.35)}], [0.43, 0, ${Math.round(ms * 0.3)}]];
  let leg = 0, t0 = performance.now();
  const step = (now) => {
    const [a, b, d] = legs[leg]; const k = Math.min(1, (now - t0) / d);
    const e = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
    scrollTo(0, start + (end - start) * (a + (b - a) * e));
    if (k >= 1) { leg++; t0 = now; if (leg >= legs.length) return setTimeout(done, 400); }
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
})`;

const CHAPTERS = [
  ["hill", 0, 0.02], ["flight", 0.02, 0.3], ["about", 0.3, 0.43], ["cases-in", 0.43, 0.56], ["cases", 0.56, 0.797], ["footer-in", 0.797, 0.9], ["footer", 0.9, 1.01],
];

function stats(xs) {
  if (!xs.length) return null;
  const s = xs.slice().sort((a, b) => a - b);
  const q = (p) => s[Math.min(s.length - 1, Math.floor(p * s.length))];
  return { n: s.length, fps: +(1000 / q(0.5)).toFixed(1), p50: q(0.5), p95: q(0.95), max: s[s.length - 1], over50: s.filter((x) => x > 50).length, over100: s.filter((x) => x > 100).length };
}

async function runProfile(P, port) {
  const dir = resolve(tmpdir(), `portfolio-load-${P.id}`);
  try { rmSync(dir, { recursive: true, force: true }); } catch {}
  const gpuFlags = P.gpu === "swiftshader" ? ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"]
    : P.gpu === "none" ? ["--disable-webgl", "--disable-3d-apis"]
    : ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist", P.gpu === "low" ? "--force_low_power_gpu" : "--force_high_performance_gpu"];
  const chrome = spawn(process.env.CHROME ?? "C:/Program Files/Google/Chrome/Application/chrome.exe", [
    `--remote-debugging-port=${port}`, `--user-data-dir=${dir}`, "--headless=new", "--no-first-run", "--no-default-browser-check",
    "--disable-background-timer-throttling", "--disable-renderer-backgrounding", "--remote-allow-origins=*", "--autoplay-policy=no-user-gesture-required",
    `--window-size=${P.w},${P.h}`, ...gpuFlags, "about:blank",
  ], { stdio: "ignore" });

  let target;
  for (let i = 0; i < 60 && !target; i++) {
    await sleep(250);
    try { target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === "page"); } catch {}
  }
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener("open", r, { once: true }));
  let id = 0; const pending = new Map();
  const R = { id: P.id, title: P.title, console: [], exceptions: [], failed: [], bytes: 0, requests: 0, byType: {} };
  const reqType = new Map();
  ws.addEventListener("message", (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); return; }
    const p = m.params;
    if (m.method === "Runtime.consoleAPICalled" && ["error", "warning", "warn", "assert"].includes(p.type))
      R.console.push(`${p.type}: ${p.args.map((a) => a.value ?? a.description ?? "").join(" ").slice(0, 300)}`);
    if (m.method === "Runtime.exceptionThrown") R.exceptions.push((p.exceptionDetails.exception?.description ?? p.exceptionDetails.text).slice(0, 400));
    if (m.method === "Log.entryAdded" && ["error", "warning"].includes(p.entry.level)) R.console.push(`log-${p.entry.level}: ${p.entry.text.slice(0, 300)} ${p.entry.url ?? ""}`);
    if (m.method === "Network.responseReceived") reqType.set(p.requestId, p.type);
    if (m.method === "Network.loadingFinished") { R.bytes += p.encodedDataLength; R.requests++; const t = reqType.get(p.requestId) ?? "Other"; R.byType[t] = (R.byType[t] ?? 0) + p.encodedDataLength; }
    if (m.method === "Network.loadingFailed" && !/net::ERR_ABORTED/.test(p.errorText)) R.failed.push(`${p.errorText} ${p.requestId}`);
  });
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const evalJs = async (expression, timeout = 60000) => {
    const r = await Promise.race([send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true }), sleep(timeout).then(() => ({ timeout: true }))]);
    if (r.timeout) return { __timeout: true };
    return r.result?.result?.value ?? r.result?.exceptionDetails?.exception?.description ?? null;
  };

  for (const d of ["Page", "Runtime", "Log", "Network", "Performance"]) await send(`${d}.enable`);
  await send("Network.setCacheDisabled", { cacheDisabled: true });
  await send("Page.addScriptToEvaluateOnNewDocument", { source: PRELUDE });
  const metrics = (w, h, mobile) => send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: P.dpr, mobile: !!mobile, screenWidth: w, screenHeight: h,
    screenOrientation: mobile ? { type: w > h ? "landscapePrimary" : "portraitPrimary", angle: w > h ? 90 : 0 } : undefined });
  await metrics(P.w, P.h, P.mobile);
  if (P.mobile) { await send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 }); await send("Emulation.setUserAgentOverride", { userAgent: P.ua, platform: /iPhone/.test(P.ua) ? "iPhone" : "Linux armv8l" }); }
  if (P.cpu) await send("Emulation.setCPUThrottlingRate", { rate: P.cpu });
  if (P.net) await send("Network.emulateNetworkConditions", NET[P.net]);
  if (P.reduced) await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });

  const t0 = Date.now();
  await send("Page.navigate", { url: URL_ });
  /* до показа UI (или 60 с) */
  let readyAt = null, sceneAt = null;
  for (let i = 0; i < 240; i++) {
    await sleep(250);
    const st = await evalJs(`({ scene: document.body.classList.contains("scene-ready"), ui: !!document.querySelector(".ui-in, body.ui-ready, .is-ready"), load: document.readyState })`, 5000);
    if (st?.scene && !sceneAt) sceneAt = Date.now() - t0;
    if (st?.scene && Date.now() - t0 - sceneAt > 1500) { readyAt = Date.now() - t0; break; }
    if (P.gpu === "none" && st?.load === "complete" && Date.now() - t0 > 6000) break;
  }
  R.sceneReadyMs = sceneAt; R.settledMs = readyAt;
  await sleep(1500);
  R.lt0 = await evalJs(`({ lcp: __lt.lcp, cls: +__lt.shift.toFixed(3), long: __lt.long.length, longMax: Math.max(0, ...__lt.long.map((l) => l[1])), longTotal: __lt.long.reduce((s, l) => s + l[1], 0) })`);
  R.quality = await evalJs(`(() => { const h = window.__hill; if (!h) return null; const gl = h.renderer?.getContext?.(); const ext = gl && gl.getExtension("WEBGL_debug_renderer_info");
    return { tier: h.qualityTier, dpr: +h.pixelRatio?.toFixed(2), blades: h.blades, tierLog: h.tierLog, calib: h.calibrationLog, gpu: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : null,
      programs: h.renderer?.info?.programs?.length, tex: h.renderer?.info?.memory?.textures, geo: h.renderer?.info?.memory?.geometries }; })()`);
  await send("Page.captureScreenshot", { format: "jpeg", quality: 70 }).then((r) => r.result && writeFileSync(resolve(OUT, `${P.id}-hero.jpg`), Buffer.from(r.result.data, "base64")));

  R.lite = await evalJs(`document.documentElement.dataset.lite || null`);
  if (P.gpu === "none") {
    R.noWebgl = await evalJs(`({ bodyClass: document.body.className, canvasVisible: getComputedStyle(document.getElementById("scene")).display, text: document.body.innerText.slice(0, 400), hasFallback: !!document.querySelector(".no-webgl, .fallback") })`);
  }

  if (P.loseContext) {
    R.contextLoss = await evalJs(`(async () => { const gl = __hill.renderer.getContext(); const ext = gl.getExtension("WEBGL_lose_context"); const url = location.href; sessionStorage.setItem("__lt_before", String(performance.timeOrigin)); ext.loseContext(); await new Promise((r) => setTimeout(r, 1500)); return { lost: gl.isContextLost() }; })()`, 10000);
    await sleep(6000);
    R.contextLossAfter = await evalJs(`({ lite: document.documentElement.dataset.lite || null, reloaded: sessionStorage.getItem("__lt_before") !== String(performance.timeOrigin), sceneReady: document.body.classList.contains("scene-ready"), lost: window.__hill?.renderer?.getContext()?.isContextLost?.() })`);
  }

  if (!P.noScroll && !R.lite) {
    await evalJs(HOOK);
    const heap0 = await send("Performance.getMetrics");
    const scrollRes = await evalJs(SCROLL(P.scrollMs ?? 14000), 180000);
    if (scrollRes?.__timeout) R.exceptions.push("прокрутка не завершилась за 180 с (страница зависла?)");
    const frames = (await evalJs(`__lt.frames`)) ?? [];
    R.chapters = Object.fromEntries(CHAPTERS.map(([k, a, b]) => [k, stats(frames.filter(([p]) => p >= a && p < b).map((f) => f[1]))]));
    R.worst = frames.slice().sort((a, b) => b[1] - a[1]).slice(0, 6);
    R.lt1 = await evalJs(`({ cls: +__lt.shift.toFixed(3), long: __lt.long.length, longMax: Math.max(0, ...__lt.long.map((l) => l[1])), longTotal: __lt.long.reduce((s, l) => s + l[1], 0), resErr: __lt.resErr, shifts: __lt.shifts })`);
    const m = Object.fromEntries((await send("Performance.getMetrics")).result.metrics.map((x) => [x.name, x.value]));
    R.heapMB = +(m.JSHeapUsedSize / 1048576).toFixed(1);
    R.heapTotalMB = +(m.JSHeapTotalSize / 1048576).toFixed(1);
    R.quality2 = await evalJs(`({ tier: __hill.qualityTier, dpr: +__hill.pixelRatio.toFixed(2), tierLog: __hill.tierLog, programs: __hill.renderer.info.programs.length, tex: __hill.renderer.info.memory.textures })`);
    /* скриншоты ключевых мест: About и футер */
    for (const [tag, p] of [["about", 0.43], ["cases", 0.62], ["footer", 1]]) {
      await evalJs(`(() => { const s = document.querySelector(".story"); const top = s.offsetTop, st = Math.max(0, top - innerHeight), en = top + s.offsetHeight - innerHeight; scrollTo(0, st + (en - st) * ${p}); })()`);
      await sleep(P.cpu >= 4 ? 3500 : 2200);
      const shot = await send("Page.captureScreenshot", { format: "jpeg", quality: 70 });
      if (shot.result) writeFileSync(resolve(OUT, `${P.id}-${tag}.jpg`), Buffer.from(shot.result.data, "base64"));
    }
    /* вёрстка: горизонтальный скролл, вылезающие за экран элементы в футере */
    R.layout = await evalJs(`(() => { const out = []; const W = document.documentElement.clientWidth;
      document.querySelectorAll(".site-footer *, .story-hero *, .hero *, .dock *").forEach((el) => { const r = el.getBoundingClientRect(); if (r.width && getComputedStyle(el).visibility !== "hidden" && (r.right > W + 1 || r.left < -1)) out.push((el.className || el.tagName).toString().slice(0, 40) + " " + Math.round(r.left) + ".." + Math.round(r.right)); });
      return { docW: document.documentElement.scrollWidth, vw: W, overflow: out.slice(0, 12) }; })()`);
    await evalJs(`scrollTo(0, 0)`);
    await sleep(1500);
  }

  if (P.rotate) {
    await metrics(P.h, P.w, true);
    await sleep(3000);
    const s1 = await send("Page.captureScreenshot", { format: "jpeg", quality: 70 });
    if (s1.result) writeFileSync(resolve(OUT, `${P.id}-landscape.jpg`), Buffer.from(s1.result.data, "base64"));
    R.landscape = await evalJs(`({ dpr: __hill.pixelRatio, canvas: [__hill.renderer.domElement.width, __hill.renderer.domElement.height], vw: innerWidth, vh: innerHeight, docW: document.documentElement.scrollWidth })`);
    await metrics(P.w, P.h, true);
    await sleep(3000);
    const s2 = await send("Page.captureScreenshot", { format: "jpeg", quality: 70 });
    if (s2.result) writeFileSync(resolve(OUT, `${P.id}-portrait-back.jpg`), Buffer.from(s2.result.data, "base64"));
    R.portraitBack = await evalJs(`({ canvas: [__hill.renderer.domElement.width, __hill.renderer.domElement.height], vw: innerWidth, vh: innerHeight })`);
  }

  R.totalMB = +(R.bytes / 1048576).toFixed(2);
  R.byTypeKB = Object.fromEntries(Object.entries(R.byType).map(([k, v]) => [k, Math.round(v / 1024)]));
  delete R.byType;
  ws.close();
  chrome.kill();
  await sleep(1500);
  return R;
}

const results = [];
let port = 9420;
for (const P of PROFILES) {
  if (ONLY.length && !ONLY.includes(P.id)) continue;
  process.stdout.write(`▶ ${P.id} … `);
  const t = Date.now();
  try {
    const r = await runProfile(P, port++);
    results.push(r);
    const ch = r.chapters ? Object.entries(r.chapters).map(([k, v]) => `${k} ${v ? v.fps : "-"}`).join(" · ") : "";
    console.log(`${((Date.now() - t) / 1000).toFixed(0)} с | UI ${r.sceneReadyMs ?? "—"} мс | ${r.totalMB} МБ/${r.requests} | tier ${r.quality?.tier ?? "—"} dpr ${r.quality?.dpr ?? "—"} | ${ch} | ошибок ${r.exceptions.length + r.console.length}${r.lite ? " | LITE: " + r.lite : ""}`);
  } catch (e) {
    console.log("сбой:", e.message);
    results.push({ id: P.id, crash: String(e) });
  }
  writeFileSync(resolve(OUT, "report.json"), JSON.stringify(results, null, 1));
}
console.log("→", resolve(OUT, "report.json"));
process.exit(0);
