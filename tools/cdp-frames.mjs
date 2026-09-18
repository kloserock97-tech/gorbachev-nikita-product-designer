/* Покадровая запись сцены для поиска мерцания (headless Chrome, реальная GPU).

   node tools/cdp-frames.mjs --url "http://127.0.0.1:5190/?ui=0" --out shots/frames/base
                             [--n 24] [--w 1368] [--h 775] [--dpr 2.25] [--wait 9000]
                             [--clip x,y,w,h]   (в CSS-пикселях)
                             [--eval "js" --after 2500]  (выполнить JS перед съёмкой и подождать)

   Сохраняет PNG подряд и печатает для каждой пары соседних кадров среднюю
   разницу яркости по клипу. Трава от ветра меняется всегда, поэтому клип
   лучше ставить на небо или на гребень — там разница должна быть почти нулём. */
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { tmpdir } from "node:os";

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i < 0 ? d : process.argv[i + 1]; };
const URL_ = arg("url", "http://127.0.0.1:5190/?ui=0");
const OUT = resolve(arg("out", "shots/frames/base"));
const N = +arg("n", 24), W = +arg("w", 1368), H = +arg("h", 775), DPR = +arg("dpr", 2.25);
const WAIT = +arg("wait", 9000), PORT = +arg("port", 9360);
const clipArg = arg("clip", null)?.split(",").map(Number);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const chrome = spawn(process.env.CHROME ?? "C:/Program Files/Google/Chrome/Application/chrome.exe", [
  `--remote-debugging-port=${PORT}`, `--user-data-dir=${resolve(tmpdir(), "portfolio-3d-ts2-frames")}`,
  "--headless=new", "--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist", ...(process.argv.includes("--lowpower") ? ["--force_low_power_gpu"] : process.argv.includes("--highpower") ? ["--force_high_performance_gpu"] : []),
  "--no-first-run", "--remote-allow-origins=*", "about:blank",
], { stdio: "ignore" });

let target;
for (let i = 0; i < 50 && !target; i++) {
  await sleep(200);
  try { target = (await (await fetch(`http://127.0.0.1:${PORT}/json`)).json()).find((t) => t.type === "page"); } catch {}
}
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
let id = 0; const pending = new Map();
ws.addEventListener("message", (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });

await send("Page.enable");
await send("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: DPR, mobile: false });
await send("Page.navigate", { url: URL_ });
await sleep(WAIT);
if (arg("eval", null)) {
  const r = await send("Runtime.evaluate", { expression: arg("eval"), awaitPromise: true, returnByValue: true });
  console.log("eval:", JSON.stringify(r.result?.result?.value ?? r.result?.exceptionDetails?.text ?? null));
  await sleep(+arg("after", 2500));
}

mkdirSync(OUT, { recursive: true });
const clip = clipArg ? { x: clipArg[0], y: clipArg[1], width: clipArg[2], height: clipArg[3], scale: 1 } : undefined;
for (let i = 0; i < N; i++) {
  const r = await send("Page.captureScreenshot", { format: "png", ...(clip ? { clip } : {}) });
  writeFileSync(resolve(OUT, `f${String(i).padStart(3, "0")}.png`), Buffer.from(r.result.data, "base64"));
}
console.log("saved", N, "frames to", OUT);
ws.close(); chrome.kill(); process.exit(0);
