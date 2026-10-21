/* Сквозной замер «просмотра портфолио» глазами посетителя (v103).
   Chrome с настоящей видеокартой (headless=new + d3d11), свежий профиль, без подсказок странице. --window — то же
   в окне: ближе к посетителю, но при выключенном или заблокированном экране окно не получает кадров (vsync стоит).
   Путь: загрузка → заставка готова → Enter → холм → прокрутка колесом через About, Кейсы и футер →
   стоянки по главам → каждый кейс открыть, пролистать, закрыть.
   По каждому отрезку: время, кадры (медиана, 95-й, худший, сколько дольше 50 мс), главный поток на кадр
   (скрипт / стили / раскладка), долгие кадры с виновными функциями (Long Animation Frames), вызовы отрисовки
   (в секунду: число на тик rAF зависит от частоты тиков, а у холма потолок 60 к/с) и время видеокарты по каждому
   WebGL-холсту. Плюс сеть: что и в каком отрезке скачано.

   node tools/cdp-journey.mjs [--base <url>] [--q "lang=ru"] [--w 1368 --h 775 --dpr 1.5] [--gpu] [--profile] [--window] [--out shots/journey/x.json]
   --gpu — ещё и время видеокарты (добавляет ?governor=0&jgpu=1: регулятор качества пользуется тем же таймером;
   ступень тогда берите явно, --q "tier=2"). */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { rmSync } from "node:fs";
import { launch, sleep } from "./lib/chrome.mjs";
import { createLookup } from "./lib/sourcemap.mjs";

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i < 0 ? d : process.argv[i + 1]; };
const has = (k) => process.argv.includes(`--${k}`);
/* --profile — CPU-профиль на каждый отрезок, горячие функции с привязкой к исходникам (сборка с vite build --sourcemap) */
const PROFILE = has("profile");
const BASE = arg("base", "http://127.0.0.1:5191/");
const GPU = has("gpu");
const Q = [arg("q", ""), GPU ? "governor=0&jgpu=1" : ""].filter(Boolean).join("&");
const W = +arg("w", 1368), H = +arg("h", 775), PORT = +arg("port", 9381);
const OUT = resolve(arg("out", "shots/journey/run.json"));
const CASES = arg("cases", "grif-ai,community,ai-agents,moderator-dashboard,plati-chastyami,restaurant-guru").split(",").filter(Boolean);
const here = dirname(fileURLToPath(import.meta.url));
const profile = resolve(tmpdir(), `ts2-journey-${PORT}`);
try { rmSync(profile, { recursive: true, force: true }); } catch { /* нет — и хорошо */ }

const net = new Map();
let navT0 = 0, phase = "load";
const { send, close } = await launch(PORT, [
  `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, `--window-size=${W},${H + 87}`, "--window-position=0,0",
  "--no-first-run", "--no-default-browser-check", "--remote-allow-origins=*", "--autoplay-policy=no-user-gesture-required",
  "--disable-features=CalculateNativeWinOcclusion", "--disable-backgrounding-occluded-windows", "--disable-renderer-backgrounding",
  "--disable-background-timer-throttling",
  ...(has("window") ? [] : ["--headless=new", "--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist"]), "about:blank",
], {
  onEvent(m) {
    const p = m.params;
    if (m.method === "Network.requestWillBeSent") net.set(p.requestId, { url: p.request.url, t: p.timestamp, phase, type: p.type });
    else if (m.method === "Network.responseReceived") { const r = net.get(p.requestId); if (r) { r.status = p.response.status; r.mime = p.response.mimeType; r.cached = p.response.fromDiskCache; } }
    else if (m.method === "Network.loadingFinished") { const r = net.get(p.requestId); if (r) { r.bytes = p.encodedDataLength; r.end = p.timestamp; } }
  },
});
const ev = async (expression) => {
  const r = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (r.result?.exceptionDetails) throw new Error(`${expression.slice(0, 80)}: ${r.result.exceptionDetails.exception?.description ?? r.result.exceptionDetails.text}`);
  return r.result?.result?.value;
};
const waitFor = async (expr, ms = 60000) => { const t = Date.now(); while (Date.now() - t < ms) { if (await ev(expr).catch(() => false)) return Date.now() - t; await sleep(100); } return null; };
const metric = async () => Object.fromEntries((await send("Performance.getMetrics")).result.metrics.map((m) => [m.name, m.value]));

await send("Page.enable"); await send("Runtime.enable");
if (PROFILE) { await send("Profiler.enable"); await send("Profiler.setSamplingInterval", { interval: 500 }); } await send("Network.enable"); await send("Performance.enable");
await send("Page.bringToFront");
if (!has("window")) await send("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: +arg("dpr", 1.5), mobile: false });
await send("Page.addScriptToEvaluateOnNewDocument", { source: readFileSync(resolve(here, "pre-journey.js"), "utf8") });

/* отрезок: всё, что случилось между begin() и end() */
const segs = [];
let cur = null;
/* self-время по функциям исходников: позиция функции в собранном файле → source map */
const maps = new Map();
const lookupFor = async (url) => {
  if (!maps.has(url)) maps.set(url, fetch(`${url}.map`).then((r) => (r.ok ? r.json() : null)).then((m) => (m ? createLookup(m) : null)).catch(() => null));
  return maps.get(url);
};
const hotFunctions = async (profile) => {
  const self = new Map();
  const byId = new Map(profile.nodes.map((n) => [n.id, n]));
  profile.samples.forEach((id, i) => { const dt = (profile.timeDeltas[i + 1] ?? 0) / 1000; self.set(id, (self.get(id) ?? 0) + dt); });
  const agg = new Map();
  for (const [id, ms] of self) {
    const cf = byId.get(id).callFrame;
    let key = cf.functionName || cf.url ? `${cf.functionName || "(anon)"} ${cf.url.replace(/^.*\//, "")}:${cf.lineNumber}:${cf.columnNumber}` : "(program)";
    if (/^\((program|idle|garbage collector)\)/.test(cf.functionName)) key = cf.functionName;
    else if (cf.url.startsWith("http")) {
      const look = await lookupFor(cf.url);
      const at = look?.(cf.lineNumber, cf.columnNumber);
      if (at) key = `${at.source}:${at.line} ${at.name ?? cf.functionName ?? ""}`;
    }
    agg.set(key, (agg.get(key) ?? 0) + ms);
  }
  return [...agg].filter(([k]) => k !== "(idle)").sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => `${Math.round(v)} ms ${k}`);
};

const begin = async (name) => {
  phase = name;
  if (PROFILE) await send("Profiler.start");
  const now = await ev("performance.now()");
  await ev("__j.gl.take()").catch(() => null);
  cur = { name, t0: now, m0: await metric(), wall0: Date.now() };
};
const end = async (extra = {}) => {
  const t1 = await ev("performance.now()"), m1 = await metric();
  const s = cur;
  const raw = await ev(`(() => { const f = __j.frames, o = []; for (let i = 0; i < f.length; i += 2) if (f[i] >= ${s.t0} && f[i] <= ${t1}) o.push(f[i]); return o; })()`);
  const dts = raw.slice(1).map((t, i) => t - raw[i]).sort((a, b) => a - b);
  const q = (x) => (dts.length ? dts[Math.min(dts.length - 1, Math.floor(dts.length * x))] : null);
  const loaf = await ev(`__j.loaf.filter(e => e.start >= ${s.t0} && e.start <= ${t1})`);
  const fn = new Map();
  for (const e of loaf) for (const sc of e.scripts) { const k = `${sc.fn || "(anon)"} @${sc.url}:${sc.at} [${sc.inv}]`; fn.set(k, (fn.get(k) ?? 0) + sc.dur); }
  const gl = await ev("__j.gl.take()").catch(() => []);
  const hot = PROFILE ? await hotFunctions((await send("Profiler.stop")).result.profile) : [];
  const n = Math.max(1, dts.length), secs = (t1 - s.t0) / 1000;
  const d = (k) => ((m1[k] - s.m0[k]) * 1000) / n;
  const out = {
    name: s.name, ms: Math.round(t1 - s.t0), frames: dts.length, fps: +(dts.length / secs).toFixed(1),
    dt: { p50: +q(0.5)?.toFixed(1), p95: +q(0.95)?.toFixed(1), max: +(dts.at(-1) ?? 0).toFixed(0), over50: dts.filter((x) => x > 50).length },
    main: { task: +d("TaskDuration").toFixed(2), script: +d("ScriptDuration").toFixed(2), style: +d("RecalcStyleDuration").toFixed(2), layout: +d("LayoutDuration").toFixed(2) },
    heapMB: Math.round(m1.JSHeapUsedSize / 1e6), nodes: m1.Nodes,
    loaf: { n: loaf.length, blockMs: Math.round(loaf.reduce((a, e) => a + e.block, 0)), worst: Math.round(Math.max(0, ...loaf.map((e) => e.dur))) },
    hot,
    culprits: [...fn].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, v]) => `${Math.round(v)} ms ${k}`),
    gl: gl.map((c) => ({ name: c.name, px: c.px, shown: c.shown, lost: c.lost, drawsPerSec: Math.round(c.draws / secs), drawsPerTick: +(c.draws / n).toFixed(1), instPerTick: Math.round(c.instances / n), gpuMs: c.gpu == null ? null : +c.gpu.toFixed(2) })),
    state: await ev("({ y: Math.round(scrollY), cls: document.body.className })").catch(() => null),
    ...extra,
  };
  segs.push(out);
  cur = null;
  const glTxt = out.gl.filter((c) => c.drawsPerSec > 0).map((c) => `${c.name}${c.shown ? "" : "(скрыт)"} ${c.drawsPerSec} вызовов/с${c.gpuMs != null ? ` ${c.gpuMs}мс` : ""}`).join(", ");
  console.log(`${out.name.padEnd(22)} ${String(out.ms).padStart(6)} мс  ${String(out.fps).padStart(5)} fps  кадр p50 ${out.dt.p50} p95 ${out.dt.p95} max ${out.dt.max} (>50: ${out.dt.over50})  поток ${out.main.task}/кадр (js ${out.main.script}, стили ${out.main.style})  LoAF ${out.loaf.n}/${out.loaf.blockMs}мс  GL: ${glTxt}`);
  for (const c of out.culprits.slice(0, 3)) console.log(`      ${c}`);
  for (const c of out.hot.slice(0, 5)) console.log(`      cpu ${c}`);
  return out;
};

const story = `(() => { const el = document.querySelector('.story'); if (!el) return null; const top = el.offsetTop, lead = Math.min(top, innerHeight * (innerWidth <= 900 ? 0.4 : 1));
  const start = Math.max(0, top - lead), end = top + el.offsetHeight - innerHeight; return { start, end }; })()`;
/* к доле истории — шагами по 150 px: прыжок через главы оставлял историю в чужом состоянии (удержание у About
   утягивало прокрутку назад, глава не успевала смениться) */
const scrollToP = async (p) => {
  const target = await ev(`(() => { const s = ${story}; return Math.round(${p} <= 0 ? 0 : s.start + (s.end - s.start) * ${p}); })()`);
  let y = await ev("scrollY");
  const step = target > y ? 150 : -150;
  while (Math.abs(target - y) > 150) { y += step; await ev(`scrollTo(0, ${y})`); await sleep(40); }
  await ev(`scrollTo(0, ${target})`);
};
const wheel = (dy) => send("Input.dispatchMouseEvent", { type: "mouseWheel", x: W / 2, y: H / 2, deltaX: 0, deltaY: dy });

/* ── 1. загрузка ── */
const url = `${BASE}${Q ? `?${Q}` : ""}`;
console.log(`→ ${url}`);
await begin("load: до заставки");
navT0 = (await send("Runtime.evaluate", { expression: "Date.now()", returnByValue: true })).result.result.value;
await send("Page.navigate", { url });
const loaderMs = await waitFor("!!document.querySelector('.focus-loader.is-ready') || (!document.querySelector('.focus-loader') && document.body.classList.contains('is-ready'))", 90000);
const nav = await ev(`(() => { const n = performance.getEntriesByType('navigation')[0], p = Object.fromEntries(performance.getEntriesByType('paint').map(e => [e.name, Math.round(e.startTime)]));
  const l = performance.getEntriesByType('largest-contentful-paint').at(-1);
  return { ttfb: Math.round(n.responseStart), dcl: Math.round(n.domContentLoadedEventEnd), load: Math.round(n.loadEventEnd), fcp: p['first-contentful-paint'], lite: document.body.classList.contains('lite') || !!document.querySelector('.lite') }; })()`);
const loadSeg = await end({ readyMs: loaderMs, nav });
cur = null;

/* человек читает заголовок заставки и жмёт Enter */
await begin("заставка: ждём Enter");
await sleep(2000);
await end();
await begin("Enter → холм");
await ev("document.querySelector('.focus-loader__enter')?.click()");
const enterMs = await waitFor("!document.querySelector('.focus-loader')", 20000);
await sleep(500);
await end({ enterMs });

await begin("холм: смотрим");
await sleep(6000);
const tier = await ev("(() => { const s = window.__hill; return s ? { tier: s.qualityTier, dpr: +s.pixelRatio?.toFixed?.(2), blades: s.blades } : null; })()").catch(() => null);
await end({ tier });

/* ── 2. прокрутка колесом через всю историю ── */
const ext = await ev(story);
console.log(`история: ${Math.round((ext.end - ext.start) / H)} экранов (${Math.round(ext.end)} px)`);
const chapters = await ev("window.__story ? __story.chapter() : [0.32, 0.85]");
const pOf = (y) => (y - ext.start) / (ext.end - ext.start);
const label = (p) => (p < 0.005 ? "hero" : p < chapters[0] ? "about" : p < chapters[1] ? "cases" : "footer");
let lastLabel = null, y = 0, still = 0;
const scrollT0 = Date.now();
for (let i = 0; i < 4000; i++) {
  const nowY = await ev("scrollY");
  const lb = label(pOf(nowY));
  if (lb !== lastLabel) { if (cur) await end(); await begin(`прокрутка: ${lb}`); lastLabel = lb; }
  if (Math.abs(nowY - y) < 1) { if (++still > 25) break; } else still = 0;
  y = nowY;
  await wheel(100);
  await sleep(80);
}
await end();
const scrollMs = Date.now() - scrollT0;

/* ── 3. стоянки: что страница делает, когда посетитель просто смотрит главу ── */
for (const [name, p] of [["стоянка: холм", 0], ["стоянка: about", chapters[0] * 0.6], ["стоянка: кейсы", (chapters[0] + chapters[1]) / 2], ["стоянка: футер", 0.995]]) {
  await scrollToP(p);
  await sleep(2500);
  await begin(name);
  await sleep(4000);
  await end({ p: +p.toFixed(3) });
}

/* ── 4. кейсы: открыть, пролистать, закрыть ── */
await scrollToP((chapters[0] + chapters[1]) / 2);
await sleep(2000);
for (const id of CASES) {
  await begin(`кейс ${id}: открытие`);
  await ev(`(() => { const a = document.createElement('a'); a.href = '#/work/${id}'; document.body.appendChild(a); a.click(); a.remove(); })()`);
  const openMs = await waitFor("document.body.classList.contains('case-open') && !!document.querySelector('.case-view.is-on #cv-title')", 15000);
  await sleep(1200);
  await end({ openMs });
  await begin(`кейс ${id}: чтение`);
  for (let i = 0; i < 40; i++) { await wheel(120); await sleep(90); }
  await sleep(1000);
  await end();
  await begin(`кейс ${id}: закрытие`);
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
  const closeMs = await waitFor("!document.body.classList.contains('case-open')", 5000);
  await sleep(1500);
  await end({ closeMs });
}

/* ── сеть ── */
const t0 = Math.min(...[...net.values()].map((r) => r.t));
const reqs = [...net.values()].filter((r) => r.bytes != null).map((r) => ({ url: r.url.replace(BASE, "").replace(/\?.*$/, ""), kb: +(r.bytes / 1024).toFixed(1), at: Math.round((r.t - t0) * 1000), took: Math.round(((r.end ?? r.t) - r.t) * 1000), phase: r.phase, mime: r.mime }));
const byPhase = {};
for (const r of reqs) { const k = r.phase.replace(/:.*$/, ""); byPhase[k] = byPhase[k] ?? { n: 0, kb: 0 }; byPhase[k].n++; byPhase[k].kb += r.kb; }
console.log("\nсеть по отрезкам:", Object.entries(byPhase).map(([k, v]) => `${k} ${v.n} шт / ${Math.round(v.kb)} КБ`).join("; "));
console.log("до Enter, крупнее 25 КБ:");
for (const r of reqs.filter((r) => /load|заставка/.test(r.phase) && r.kb > 25).sort((a, b) => b.kb - a.kb)) console.log(`   ${String(Math.round(r.kb)).padStart(5)} КБ  @${r.at} мс  ${r.url}`);

const total = segs.reduce((a, s) => a + s.ms, 0);
console.log(`\nготовность заставки ${loaderMs} мс (FCP ${nav.fcp}, DCL ${nav.dcl}, load ${nav.load}); Enter → холм ${enterMs} мс; прокрутка всей истории ${scrollMs} мс; весь путь ${Math.round(total / 1000)} с; ступень ${JSON.stringify(tier)}`);
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify({ url, w: W, h: H, loaderMs, enterMs, scrollMs, nav, tier, story: ext, segs, reqs }, null, 1));
console.log(`→ ${OUT}`);
close();
process.exit(0);
