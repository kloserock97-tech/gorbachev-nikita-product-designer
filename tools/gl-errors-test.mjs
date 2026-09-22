/* Проверка: за загрузку сцены WebGL не должен вернуть ни одной ошибки (v69).

   Ошибка драйвера не ломает картинку, поэтому её легко не заметить — она видна только тому, кто откроет
   консоль. Но вызов отрисовки, который драйвер отклонил, всё равно оплачен проверкой, а консоль с ошибками
   у смотрящего портфолио выглядит ровно так, как выглядит.

   node tools/gl-errors-test.mjs [--url http://127.0.0.1:5191/] [--cpu 4] [--wait 18000] [--port 9361]

   Замедление процессора обязательно: на быстрой машине окно, в котором ошибка успевает случиться,
   укладывается в один кадр, и проверка её не поймает. */
import { resolve } from "node:path";
import { tmpdir } from "node:os";
import { readFileSync } from "node:fs";
import { launch, sleep } from "./lib/chrome.mjs";

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i < 0 ? d : process.argv[i + 1]; };
const URL_ = arg("url", "http://127.0.0.1:5191/");
const CPU = +arg("cpu", 4);
/* На CPU x4 сцена стартует дольше пятнадцати секунд (см. регресс в docs/load-test-report.md),
   поэтому ждём с запасом: иначе проверка постоянно отвечает «прогон не состоялся». */
const WAIT = +arg("wait", 35000);
const PORT = +arg("port", 9361);

const { ws, send, close } = await launch(PORT, [
  `--remote-debugging-port=${PORT}`, `--user-data-dir=${resolve(tmpdir(), "portfolio-3d-ts2-gl-errors")}`,
  "--headless=new", "--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist",
  "--no-first-run", "--no-default-browser-check", "--remote-allow-origins=*",
  "--disable-features=CalculateNativeWinOcclusion", "--disable-backgrounding-occluded-windows",
  "--disable-renderer-backgrounding", "--disable-background-timer-throttling",
  "about:blank",
]);

await send("Page.enable");
await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1.25, mobile: false });
if (CPU > 1) await send("Emulation.setCPUThrottlingRate", { rate: CPU });
await send("Page.addScriptToEvaluateOnNewDocument", { source: readFileSync(new URL("./pre-gl-errors.js", import.meta.url), "utf8") });
await send("Page.navigate", { url: `${URL_}?intro=0` });
await sleep(WAIT);

const r = await send("Runtime.evaluate", {
  expression: "JSON.stringify({ gl: window.__glerr || {}, rendered: window.__hill ? window.__hill.renderedFrames : 0, lite: document.body.classList.contains('lite') })",
  returnByValue: true,
});
const { gl, rendered, lite } = JSON.parse(r.result?.result?.value ?? "{}");
ws.close(); close();

const errors = gl?.errors ?? [];
console.log(`кадров ${gl?.frames ?? "—"}, вызовов отрисовки ${gl?.draws ?? "—"} (проверено ${gl?.watched ?? "—"}), сцена нарисовала ${rendered ?? "—"}, ошибок WebGL ${errors.length}`);
for (const e of errors.slice(0, 3)) console.log(`  ${e.code} на кадре ${e.frame}: ${e.samplers.join(" ")}`);
if (errors.length) console.log("  Материал с receiveShadow рисуется раньше, чем впервые отрисована карта теней?");

/* «Ошибок нет» ничего не значит, если сцена не рисовалась: на занятой машине прогон однажды
   успел только 5 кадров и зазеленел впустую. Считаем такой прогон несостоявшимся, а не удачным. */
const enough = !lite && (gl?.draws ?? 0) >= 300 && (rendered ?? 0) >= 20;
if (!enough) {
  console.log(lite ? "  Открылась лёгкая версия — 3D не проверено." : "  Сцена почти не рисовалась: прогон не состоялся, повторить на свободной машине.");
  process.exit(2);
}
process.exit(errors.length ? 1 : 0);
