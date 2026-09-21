// Browser checks against the production preview. No dependencies; Chrome + Node 22.
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync, mkdtempSync } from "node:fs";
import { resolve, join } from "node:path";
import { tmpdir } from "node:os";
const base = process.argv[2] || "http://localhost:5218/";
const port = 9427;
const delay = ms => new Promise(r => setTimeout(r, ms));
const profile = mkdtempSync(join(tmpdir(), "portfolio-garden-audit-"));
const chrome = spawn("C:/Program Files/Google/Chrome/Application/chrome.exe", [
  "--headless=new", "--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist",
  "--no-first-run", "--remote-allow-origins=*", "--disable-background-timer-throttling",
  `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, "about:blank",
], { stdio: "ignore" });
let ws;
const errors = [], checks = [];
try {
  let target;
  for (let i = 0; i < 40 && !target; i++) {
    await delay(200);
    try { target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find(t => t.type === "page"); } catch {}
  }
  if (!target) throw new Error("Chrome did not start");
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener("open", r, { once: true }));
  let id = 0;
  const pending = new Map();
  ws.addEventListener("message", e => {
    const m = JSON.parse(e.data);
    if (m.id) { pending.get(m.id)?.(m); pending.delete(m.id); }
    if (m.method === "Runtime.exceptionThrown") errors.push(m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text);
    if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") errors.push(m.params.args.map(a => a.value ?? a.description).join(" "));
  });
  const send = (method, params = {}) => new Promise(r => { const n = ++id; pending.set(n, r); ws.send(JSON.stringify({ id: n, method, params })); });
  const evaluate = async expression => {
    const r = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.text);
    return r.result?.result?.value;
  };
  const until = async expression => {
    for (let i = 0; i < 100; i++) { if (await evaluate(expression)) return; await delay(200); }
    throw new Error("Timeout: " + expression);
  };
  const check = async (name, expression) => {
    const passed = !!await evaluate(expression); checks.push({ name, passed }); console.log(name, passed ? "PASS" : "FAIL");
  };
  const navigate = async query => { await send("Page.navigate", { url: base + query }); await delay(200); };
  const shot = async name => {
    mkdirSync("shots/garden-audit", { recursive: true });
    const r = await send("Page.captureScreenshot", { format: "png" });
    writeFileSync(resolve("shots/garden-audit", name + ".png"), Buffer.from(r.result.data, "base64"));
  };
  await send("Page.enable"); await send("Runtime.enable");
  // FullScreenQuad's drawArrays is the final pass: count actual garden frames, not rAF.
  await send("Page.addScriptToEvaluateOnNewDocument", { source: `
    window.__gardenFrameTimes=[];
    const context=HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext=function(...args){
      const gl=context.apply(this,args);
      if(args[0]==='webgl2' && this.closest('.nature-loader') && gl && !gl.__gardenAudit){
        gl.__gardenAudit=true;
        const draw=gl.drawArrays.bind(gl);
        gl.drawArrays=(...a)=>{if(a[2]===3)window.__gardenFrameTimes.push(performance.now());return draw(...a)};
      }
      return gl;
    };
  ` });
  await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  for (const [name, value] of [["bare", 0], ["growing", .45], ["blooming", .72], ["grown", 1]]) {
    await navigate(`?intro=1&garden=${value}&lite=0&lang=ru`);
    await until("!!document.querySelector('.nature-loader__stage.has-render')");
    await delay(400);
    await check(name + " growth", `Math.abs(Number(document.querySelector('.nature-loader')?.dataset.growth)-${value})<.002`);
    await shot(name);
  }
  await until("document.querySelector('.nature-loader__track')?.getAttribute('aria-valuenow') === '100'");
  await check("hill paused behind loader", "window.__hill?.paused === true && window.__hill?.renderedFrames > 0");
  await check("focus trapped in loader", "!!document.activeElement?.closest('.nature-loader')");
  await check("page inert during loader", "!!document.getElementById('stage').closest('[inert]')");
  await evaluate("window.__gardenFrameTimes=[]"); await delay(1800);
  console.log("garden frame cadence", await evaluate(`(()=>{
    const times=window.__gardenFrameTimes;
    const intervals=times.slice(1).map((t,i)=>t-times[i]).sort((a,b)=>a-b);
    return {frames:times.length,medianMs:intervals[Math.floor(intervals.length*.5)],p95Ms:intervals[Math.floor(intervals.length*.95)]};
  })()`));
  await navigate("?intro=1&lite=0&lang=ru");
  await until("!!document.querySelector('.nature-loader')");
  const start = Date.now();
  const growths = [];
  for (let i = 0; i < 70; i++) {
    const value = await evaluate("document.querySelector('.nature-loader')?.dataset.growth ?? null");
    if (value === null) break;
    growths.push(Number(value)); await delay(200);
  }
  checks.push({ name: "monotonic growth", passed: growths.every((g, i) => !i || g >= growths[i - 1]), samples: growths.length });
  await check("normal completion and cleanup", "!document.querySelector('.nature-loader') && !document.body.classList.contains('garden-loading') && !document.getElementById('stage').inert && document.body.classList.contains('is-ready') && window.__hill?.paused === false");
  console.log("normal completion ms", Date.now() - start);
  await navigate("?lite=0");
  await delay(1500); await check("repeat visit skips loader", "!document.querySelector('.nature-loader')");
  // v62: there is no skip control any more; the run must still end by itself and release the hill
  await navigate("?intro=1&lite=0");
  await until("!!document.querySelector('.nature-loader')");
  await check("no skip control", "!document.querySelector('.nature-loader__skip') && !document.querySelector('.nature-loader button:not(.nature-loader__fallback)')");
  await until("!document.querySelector('.nature-loader')");
  await check("run ends and releases the hill", "!document.body.classList.contains('garden-loading') && window.__hill?.paused === false");
  await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  await navigate("?intro=1&lite=0&lang=en");
  await until("document.body.classList.contains('is-ready') && !document.querySelector('.nature-loader')");
  await check("reduced motion completes", "!document.body.classList.contains('garden-loading')");
  await send("Emulation.setEmulatedMedia", { features: [] });
  await navigate("?intro=1&lite=0#/work/grif-ai");
  await delay(1800); await check("deep link skips loader", "!document.querySelector('.nature-loader')");
  await navigate("?lite=1&intro=1");
  await delay(900); await check("lite bypasses WebGL loader", "document.body.classList.contains('lite') && !document.querySelector('.nature-loader')");
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await navigate("?intro=1&garden=1&lite=0&lang=ru");
  await until("!!document.querySelector('.nature-loader__stage.has-render')");
  await check("mobile fits", "document.documentElement.scrollWidth <= innerWidth && document.querySelector('.nature-loader__track').getBoundingClientRect().bottom < innerHeight");
  await shot("mobile");
  await evaluate("document.querySelector('.nature-loader canvas').getContext('webgl2').getExtension('WEBGL_lose_context').loseContext()");
  await delay(500);
  await check("context loss keeps fallback usable", "!!document.querySelector('.nature-loader__fallback') && !document.querySelector('.nature-loader__stage.has-render')");
  console.log(JSON.stringify({ checks, errors }, null, 2));
  writeFileSync("shots/garden-audit/results.json", JSON.stringify({ checks, errors }, null, 2));
  if (errors.length || checks.some(c => !c.passed)) process.exitCode = 1;
} finally { ws?.close(); chrome.kill(); }
