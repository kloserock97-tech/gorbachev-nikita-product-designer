/* CPU-профиль страницы в headless Chrome: какие функции съедают главный поток.
   node tools/cdp-profile.mjs [--url ...] [--from 0] [--ms 8000] [--cpu 1] [--eval "js перед профилем"] [--top 30]
   --from — через сколько мс после навигации начать запись (0 — с самой загрузки). */
import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { tmpdir } from "node:os";
import { rmSync } from "node:fs";

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i < 0 ? d : process.argv[i + 1]; };
const URL_ = arg("url", "http://127.0.0.1:5191/"), FROM = +arg("from", 0), MS = +arg("ms", 8000), CPU = +arg("cpu", 1), TOP = +arg("top", 30);
const EVAL = arg("eval", ""), PORT = +arg("port", 9460);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const dir = resolve(tmpdir(), "portfolio-profile");
try { rmSync(dir, { recursive: true, force: true }); } catch {}
const chrome = spawn(process.env.CHROME ?? "C:/Program Files/Google/Chrome/Application/chrome.exe", [`--remote-debugging-port=${PORT}`, `--user-data-dir=${dir}`, "--headless=new", "--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist", "--no-first-run", "--remote-allow-origins=*", "--window-size=1368,775", "about:blank"], { stdio: "ignore" });
let target;
for (let i = 0; i < 60 && !target; i++) { await sleep(250); try { target = (await (await fetch(`http://127.0.0.1:${PORT}/json`)).json()).find((t) => t.type === "page"); } catch {} }
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
let id = 0; const pending = new Map();
ws.addEventListener("message", (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
await send("Page.enable"); await send("Profiler.enable");
await send("Profiler.setSamplingInterval", { interval: 200 });
if (CPU > 1) await send("Emulation.setCPUThrottlingRate", { rate: CPU });
if (FROM === 0) await send("Profiler.start");
await send("Page.navigate", { url: URL_ });
if (FROM > 0) { await sleep(FROM); if (EVAL) await send("Runtime.evaluate", { expression: EVAL, awaitPromise: false }); await send("Profiler.start"); }
await sleep(MS);
const { result } = await send("Profiler.stop");
const p = result.profile;
const byId = new Map(p.nodes.map((n) => [n.id, n]));
const self = new Map();
const dt = p.timeDeltas; let total = 0;
p.samples.forEach((sid, i) => { const d = (dt[i + 1] ?? dt[i]) / 1000; total += d; self.set(sid, (self.get(sid) ?? 0) + d); });
/* self-время по функциям + суммарное (включая детей) */
const parent = new Map(); p.nodes.forEach((n) => (n.children ?? []).forEach((c) => parent.set(c, n.id)));
const agg = new Map(), incl = new Map();
const key = (n) => `${n.callFrame.functionName || "(anon)"} ${n.callFrame.url.split("/").pop()}:${n.callFrame.lineNumber + 1}:${n.callFrame.columnNumber + 1}`;
for (const [nid, t] of self) {
  const n = byId.get(nid); agg.set(key(n), (agg.get(key(n)) ?? 0) + t);
  const seen = new Set(); let cur = nid;
  while (cur !== undefined) { const k = key(byId.get(cur)); if (!seen.has(k)) { incl.set(k, (incl.get(k) ?? 0) + t); seen.add(k); } cur = parent.get(cur); }
}
const show = (m, title) => { console.log(`\n${title}`); [...m].sort((a, b) => b[1] - a[1]).slice(0, TOP).forEach(([k, v]) => console.log(`${v.toFixed(0).padStart(7)} ms  ${k}`)); };
console.log(`всего сэмплировано ${total.toFixed(0)} мс`);
show(agg, "SELF");
show(incl, "INCLUSIVE");
ws.close(); chrome.kill(); process.exit(0);
