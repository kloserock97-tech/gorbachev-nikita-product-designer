/* Выполнить JS на странице в настоящем Chrome и напечатать результат.
   node tools/cdp-eval.mjs "<выражение>" [--url ...] [--wait 8000] [--port 9341] */
import { resolve } from "node:path";
import { tmpdir } from "node:os";
import { launch, sleep } from "./lib/chrome.mjs";

const expr = process.argv[2];
const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i < 0 ? d : process.argv[i + 1]; };
const URL_ = arg("url", "http://127.0.0.1:5190/");
const WAIT = +arg("wait", 8000), PORT = +arg("port", 9341);

const { chrome, ws, send } = await launch(PORT, [
  `--remote-debugging-port=${PORT}`, `--user-data-dir=${resolve(tmpdir(), "portfolio-3d-ts2-eval")}`,
  ...(process.argv.includes("--fresh") ? ["--disable-gpu-shader-disk-cache", "--disable-gpu-program-cache"] /* как у нового посетителя: шейдеры собираются с нуля */ : []), "--window-size=1600,990", "--no-first-run", "--no-default-browser-check",
  "--disable-features=CalculateNativeWinOcclusion", "--disable-backgrounding-occluded-windows",
  "--disable-renderer-backgrounding", "--disable-background-timer-throttling", "--remote-allow-origins=*", ...(process.argv.includes("--headless") ? ["--headless=new", "--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist", ...(process.argv.includes("--lowpower") ? ["--force_low_power_gpu"] : process.argv.includes("--highpower") ? ["--force_high_performance_gpu"] : [])] /* HEADLESS: окно не нужно, rAF не глушится */ : []), "about:blank",
]);
await send("Page.enable");
/* --dpr 2.25 --w 1368 --h 775 — эмуляция экрана Никиты (3072×1920 при масштабе 225%) */
if (process.argv.includes("--dpr")) await send("Emulation.setDeviceMetricsOverride", { width: +arg("w", 1368), height: +arg("h", 775), deviceScaleFactor: +arg("dpr", 2.25), mobile: false });
/* --pre файл.js — выполнить скрипт до загрузки страницы (перехват WebGL, счётчики) */
if (arg("pre", "")) await send("Page.addScriptToEvaluateOnNewDocument", { source: (await import("node:fs")).readFileSync(arg("pre", ""), "utf8") });
if (arg("cpu", "")) await send("Emulation.setCPUThrottlingRate", { rate: +arg("cpu", 1) });
await send("Page.navigate", { url: URL_ });
await sleep(WAIT);
const r = await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true });
console.log(JSON.stringify(r.result?.result?.value ?? r.result, null, 1));
ws.close(); chrome.kill(); process.exit(0);
