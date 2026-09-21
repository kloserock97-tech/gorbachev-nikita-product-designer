/* CPU-профиль страницы в headless Chrome: какие функции съедают главный поток.
   node tools/cdp-profile.mjs [--url ...] [--from 0] [--ms 8000] [--cpu 1] [--eval "js перед профилем"] [--top 30]
   --from — через сколько мс после навигации начать запись (0 — с самой загрузки). */
import { resolve } from "node:path";
import { tmpdir } from "node:os";
import { rmSync } from "node:fs";
import { launch, sleep } from "./lib/chrome.mjs";

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i < 0 ? d : process.argv[i + 1]; };
const URL_ = arg("url", "http://127.0.0.1:5191/"), FROM = +arg("from", 0), MS = +arg("ms", 8000), CPU = +arg("cpu", 1), TOP = +arg("top", 30);
const EVAL = arg("eval", ""), PORT = +arg("port", 9460);
const dir = resolve(tmpdir(), "portfolio-profile");
try { rmSync(dir, { recursive: true, force: true }); } catch {}
const { chrome, ws, send } = await launch(PORT, [`--remote-debugging-port=${PORT}`, `--user-data-dir=${dir}`, "--headless=new", "--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist", "--no-first-run", "--remote-allow-origins=*", "--window-size=1368,775", "about:blank"]);
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
/* --lines имя — по каким строкам функции разложилось её собственное время (positionTicks) */
const LINES = arg("lines", "");
if (LINES) {
  const ticks = new Map();
  for (const n of p.nodes) if (n.callFrame.functionName === LINES) for (const t of n.positionTicks ?? []) ticks.set(t.line, (ticks.get(t.line) ?? 0) + t.ticks);
  console.log(`
СТРОКИ ${LINES} (тики по ${(total / p.samples.length).toFixed(2)} мс)`);
  [...ticks].sort((a, b) => b[1] - a[1]).slice(0, 14).forEach(([l, t]) => console.log(`${String(t).padStart(7)}  строка ${l}`));
}
ws.close(); chrome.kill(); process.exit(0);
