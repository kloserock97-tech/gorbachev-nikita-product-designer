/* Телефон в настоящем Chrome: эмуляция экрана и пальца, сценарий из жестов, снимки и замеры после каждого шага.
   Playwright-MCP пальцем водить не умеет, а карусели на телефоне проверяются только жестами.

   node tools/cdp-touch.mjs --script tools/touch/notes.json [--url http://127.0.0.1:5190/?intro=0&lite=0]
                            [--w 390] [--h 844] [--dpr 3] [--out shots/touch] [--wait 8000] [--port 9420]

   Сценарий — массив шагов:
     { "eval": "js" }                                  выполнить на странице
     { "swipe": [x, y, dx, dy], "speed": 1200 }         жест пальцем от точки на dx, dy (px CSS), скорость px/с
     { "tap": [x, y] }
     { "wait": 800 }
     { "shot": "имя" }                                  снимок в --out/имя.png
     { "probe": "js-выражение", "as": "метка" }          записать значение в отчёт
   Отчёт печатается в конце JSON-ом. */
import { spawn } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { tmpdir } from "node:os";

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i < 0 ? d : process.argv[i + 1]; };
const URL_ = arg("url", "http://127.0.0.1:5190/?intro=0&lite=0");
const W = +arg("w", 390), H = +arg("h", 844), DPR = +arg("dpr", 3), WAIT = +arg("wait", 8000), PORT = +arg("port", 9420);
const OUT = resolve(arg("out", "shots/touch"));
const steps = JSON.parse(readFileSync(arg("script", ""), "utf8"));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
mkdirSync(OUT, { recursive: true });

const chrome = spawn(process.env.CHROME ?? "C:/Program Files/Google/Chrome/Application/chrome.exe", [
  `--remote-debugging-port=${PORT}`, `--user-data-dir=${resolve(tmpdir(), "portfolio-3d-ts2-touch")}`,
  "--headless=new", "--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist", "--no-first-run",
  "--remote-allow-origins=*", `--window-size=${W},${H}`, "about:blank",
], { stdio: "ignore" });
let target;
for (let i = 0; i < 60 && !target; i++) { await sleep(250); try { target = (await (await fetch(`http://127.0.0.1:${PORT}/json`)).json()).find((t) => t.type === "page"); } catch {} }
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
let id = 0; const pending = new Map();
ws.addEventListener("message", (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const evaluate = async (expr) => (await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true })).result?.result?.value;

await send("Page.enable"); await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: DPR, mobile: true });
await send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
await send("Emulation.setEmitTouchEventsForMouse", { enabled: true, configuration: "mobile" });
await send("Emulation.setUserAgentOverride", { userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1" });
await send("Page.navigate", { url: URL_ });
await sleep(WAIT);

const report = [];
for (const s of steps) {
  if (s.eval) await evaluate(s.eval);
  else if (s.swipe) {
    const [x, y, dx, dy] = s.swipe;
    /* палец ведём сами, событиями касания: synthesizeScrollGesture в headless молча ничего не делает.
       dx, dy — куда идёт палец (влево = следующая карточка, вверх = страница вниз). Без паузы в конце — бросок. */
    const dist = Math.hypot(dx, dy), ms = (dist / (s.speed ?? 1200)) * 1000, n = Math.max(4, Math.round(ms / 16));
    const pt = (k) => [{ x: Math.round(x + dx * k), y: Math.round(y + dy * k), id: 1, radiusX: 8, radiusY: 8, force: 1 }];
    await send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: pt(0) });
    for (let i = 1; i <= n; i++) { await sleep(ms / n); await send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: pt(i / n) }); }
    if (s.fling === false) await sleep(250);
    await send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  } else if (s.tap) await send("Input.synthesizeTapGesture", { x: s.tap[0], y: s.tap[1], gestureSourceType: "touch" });
  else if (s.wait) await sleep(s.wait);
  else if (s.shot) {
    const r = await send("Page.captureScreenshot", { format: "png" });
    writeFileSync(resolve(OUT, `${s.shot}.png`), Buffer.from(r.result.data, "base64"));
  } else if (s.probe) report.push([s.as ?? s.probe, await evaluate(s.probe)]);
}
console.log(JSON.stringify(report, null, 1));
ws.close(); chrome.kill(); process.exit(0);
