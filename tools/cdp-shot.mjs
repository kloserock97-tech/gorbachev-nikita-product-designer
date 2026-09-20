/* Скриншот + FPS сцены в настоящем Chrome через CDP (без зависимостей, Node 22+).

   node tools/cdp-shot.mjs [--url http://localhost:5190/] [--out shots/hill.png]
                           [--w 1600] [--h 900] [--wait 4000] [--drag] [--port 9340]

   --drag  перед вторым скриншотом проводит курсор дугой по склону — видно,
           как трава раздвигается и остаётся след.
   Chrome запускается сам с отдельным профилем; окно не должно быть перекрыто
   (иначе Windows глушит rAF — см. флаги ниже). */
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { tmpdir } from "node:os";

const arg = (k, d) => {
  const i = process.argv.indexOf(`--${k}`);
  return i < 0 ? d : process.argv[i + 1] ?? true;
};
const URL_ = arg("url", "http://localhost:5190/");
const OUT = resolve(arg("out", "shots/hill.png"));
const W = +arg("w", 1600), H = +arg("h", 900);
const WAIT = +arg("wait", 4000);
const SCROLL = arg("scroll", "");
const PORT = +arg("port", 9340);
const DRAG = process.argv.includes("--drag");
const CHROME = process.env.CHROME ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const chrome = spawn(CHROME, [
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${resolve(tmpdir(), "portfolio-3d-ts2-cdp")}`,
  `--window-size=${W},${H + 90}`,
  "--no-first-run", "--no-default-browser-check",
  "--disable-features=CalculateNativeWinOcclusion",
  "--disable-backgrounding-occluded-windows", "--disable-renderer-backgrounding",
  "--disable-background-timer-throttling", "--remote-allow-origins=*", ...(process.argv.includes("--headless") ? ["--headless=new", "--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist"] /* HEADLESS: окно не нужно, rAF не глушится */ : []),
  "about:blank",
], { stdio: "ignore" });

let target;
for (let i = 0; i < 50 && !target; i++) {
  await sleep(200);
  try {
    const list = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json();
    target = list.find((t) => t.type === "page");
  } catch {}
}
if (!target) { console.error("Chrome не поднялся"); chrome.kill(); process.exit(1); }

const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
let id = 0;
const pending = new Map();
ws.addEventListener("message", (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  if (m.method === "Runtime.consoleAPICalled") console.log("[console]", m.params.args.map((a) => a.value ?? a.description).join(" "));
  if (m.method === "Runtime.exceptionThrown") console.log("[exception]", m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text);
});
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const evaluate = async (expr) => (await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true })).result?.result?.value;

await send("Runtime.enable");
await send("Page.enable");
await send("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: +arg("dpr", 1), mobile: false });
await send("Page.navigate", { url: URL_ });
await sleep(WAIT);
if (SCROLL) {
  await evaluate(`(() => { const el = document.querySelector(${JSON.stringify(SCROLL)}); if (!el) return false; el.scrollIntoView({ block: "center" }); return true; })()`);
  await sleep(+arg("scroll-wait", 1800));
}

/* если окно перекрыто, rAF стоит — не ждём вечно, отдаём null */
const fps = await evaluate(`new Promise(r => { let n = 0; const t0 = performance.now();
  setTimeout(() => r(null), 5000);
  const f = () => { n++; if (performance.now() - t0 < 2000) requestAnimationFrame(f); else r(Math.round(n * 1000 / (performance.now() - t0))); };
  requestAnimationFrame(f); })`);
console.log("fps", fps, "renderer", await evaluate(`(() => { const c = document.createElement('canvas').getContext('webgl2'); const e = c && c.getExtension('WEBGL_debug_renderer_info'); return e ? c.getParameter(e.UNMASKED_RENDERER_WEBGL) : '?'; })()`));

const shot = async (file) => {
  const r = await send("Page.captureScreenshot", { format: "png" });
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, Buffer.from(r.result.data, "base64"));
  console.log("saved", file);
};
await shot(OUT);
if (process.argv.includes('--audit-demo')) {
  console.log('demo-manual', await evaluate(`(() => {
    const root = document.querySelector('.sm');
    const buttons = root?.querySelectorAll('[data-shot]');
    return [...(buttons ?? [])].map(button => {
      button.click();
      return {focus: root.dataset.focus, pressed: button.getAttribute('aria-pressed'), imagesLoaded: [...root.querySelectorAll('img')].every(img => img.complete && img.naturalWidth > 0)};
    });
  })()`));
  await evaluate(`document.querySelector('.dm-replay')?.click()`);
  await sleep(150);
  console.log('demo-replay', await evaluate(`document.querySelector('.sm')?.dataset.focus`));
  await send('Emulation.setEmulatedMedia', { features: [{name:'prefers-reduced-motion',value:'reduce'}] });
  await sleep(200);
  console.log('demo-reduced-motion', await evaluate(`(() => {const root=document.querySelector('.sm');return {focus:root?.dataset.focus,running:root?.getAnimations({subtree:true}).filter(a=>a.playState==='running').length};})()`));
}
if (process.argv.includes('--audit-hero')) {
  console.log('hero-audit', await evaluate(`(() => {
    const hero = document.querySelector('.mh');
    const scroller = document.querySelector('.cv-scroll');
    const button = hero?.querySelector('button');
    button?.click();
    return { found: !!hero, paused: hero?.classList.contains('mh-paused'), pressed: button?.getAttribute('aria-pressed'), overflow: scroller ? scroller.scrollWidth > scroller.clientWidth : null, wide: [...(scroller?.querySelectorAll('*') ?? [])].filter(e => e.getBoundingClientRect().right > window.innerWidth + 2).slice(0,8).map(e=>e.className) };
  })()`));
  await send('Emulation.setEmulatedMedia', { features: [{name:'prefers-reduced-motion',value:'reduce'}] });
  await sleep(100);
  console.log('reduced-motion', await evaluate(`(() => {const el=document.querySelector('.mh'); return {still:el?.classList.contains('mh-still'), running:el?.getAnimations({subtree:true}).filter(a=>a.playState==='running').length};})()`));
}

if (DRAG) {
  /* дуга по переднему склону справа налево, затем курсор остаётся в траве */
  const steps = 60;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = W * (0.78 - 0.5 * t);
    const y = H * (0.8 - 0.12 * Math.sin(t * Math.PI));
    await send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y });
    await sleep(22);
  }
  await sleep(250);
  await shot(OUT.replace(/\.png$/, "-drag.png"));
}

ws.close();
chrome.kill();
process.exit(0);
