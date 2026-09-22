/* Перебор поз камеры первого экрана: по кадру на каждую (?cam=px,py,pz,tx,ty,tz).
   node tools/cdp-cams.mjs --cams "0.6,1.58,14.2,0.2,3.57,0;3.2,1.6,14,-1.6,3.5,0" --out shots/cams
   Каждая поза — своя навигация: трава сажается под камеру при загрузке. */
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { tmpdir } from "node:os";
import { launch, sleep } from "./lib/chrome.mjs";

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i < 0 ? d : process.argv[i + 1]; };
const BASE = arg("base", "http://127.0.0.1:5190/");
const CAMS = arg("cams", "").split(";").filter(Boolean);
const OUT = resolve(arg("out", "shots/cams"));
const W = +arg("w", 1368), H = +arg("h", 775), DPR = +arg("dpr", 1.5);
const WAIT = +arg("wait", 13000), PORT = +arg("port", 9372);
const EXTRA = arg("extra", "");

const { send, close } = await launch(PORT, [
  `--remote-debugging-port=${PORT}`, `--user-data-dir=${resolve(tmpdir(), "ts2-cams")}`,
  "--headless=new", "--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist",
  "--no-first-run", "--remote-allow-origins=*", "about:blank",
]);
await send("Page.enable");
await send("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: DPR, mobile: false });
mkdirSync(OUT, { recursive: true });
for (const [i, cam] of CAMS.entries()) {
  await send("Page.navigate", { url: `${BASE}?intro=0&lite=0&cam=${cam}${EXTRA}` });
  await sleep(WAIT);
  const { result } = await send("Page.captureScreenshot", { format: "png" });
  const name = `cam${String(i + 1).padStart(2, "0")}.png`;
  writeFileSync(resolve(OUT, name), Buffer.from(result.data, "base64"));
  console.log(name, cam);
}
close();
process.exit(0);
