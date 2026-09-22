/* Кадры скролл-истории по списку прогрессов — для разбора переходов (v65).
   node tools/cdp-story-shots.mjs --ps 0.03,0.06,0.09 --out shots/story [--w 1368 --h 775] [--extra "&walk=0"]
   Страница грузится один раз, дальше — прокрутка к нужному прогрессу. */
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { tmpdir } from "node:os";
import { launch, sleep } from "./lib/chrome.mjs";

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i < 0 ? d : process.argv[i + 1]; };
const BASE = arg("base", "http://127.0.0.1:5190/");
const PS = arg("ps", "0.05,0.1,0.15").split(",").map(Number);
const OUT = resolve(arg("out", "shots/story"));
const W = +arg("w", 1368), H = +arg("h", 775), DPR = +arg("dpr", 1);
const WAIT = +arg("wait", 12000), STEP = +arg("step", 1600), PORT = +arg("port", 9371);
const EXTRA = arg("extra", "");

const { send, close } = await launch(PORT, [
  `--remote-debugging-port=${PORT}`, `--user-data-dir=${resolve(tmpdir(), "ts2-story-shots")}`,
  "--headless=new", "--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist",
  "--no-first-run", "--remote-allow-origins=*", "about:blank",
]);
await send("Page.enable");
await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: DPR, mobile: false });
await send("Page.navigate", { url: `${BASE}?intro=0${EXTRA}` });
await sleep(WAIT);
const evaluate = async (expression) => (await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true })).result?.result?.value;
mkdirSync(OUT, { recursive: true });
for (const p of PS) {
  await evaluate(`(() => {
    const el = document.querySelector('.story');
    if (!el) return null;
    const top = el.offsetTop, lead = Math.min(top, innerHeight * (innerWidth <= 900 ? 0.4 : 1));
    const start = Math.max(0, top - lead), end = top + el.offsetHeight - innerHeight;
    const p = ${p};
    scrollTo({ top: p <= 0 ? 0 : start + (end - start) * p, behavior: 'instant' });
    return scrollY;
  })()`);
  await sleep(STEP);
  const { result } = await send("Page.captureScreenshot", { format: "png" });
  writeFileSync(resolve(OUT, `p${String(p).replace(".", "_")}.png`), Buffer.from(result.data, "base64"));
  console.log("p", p);
}
close();
process.exit(0);
