/* Хватает ли макетам точек. Для каждой картинки на странице кейса сравнивает, сколько точек у выбранного
   браузером файла и сколько нужно под место, которое кадру досталось: в тексте и в окне просмотра.

   Почему не naturalWidth: у картинки с srcset он пересчитан по плотности выбранного файла, а не равен
   числу точек в файле. Поэтому имя файла берём из currentSrc, а ширину читаем у файла на диске.

   node tools/shot-audit.mjs [--w 1440] [--h 900] [--dpr 2] [--port 10360] */
import { resolve } from "node:path"; import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { launch, sleep } from "./lib/chrome.mjs";

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i < 0 ? d : +process.argv[i + 1]; };
const PORT = arg("port", 10360), W = arg("w", 1440), H = arg("h", 900), DPR = arg("dpr", 2);
const CASES = ["ai-agents", "community", "grif-ai", "moderator-dashboard", "plati-chastyami", "restaurant-guru", "stop-spam"];

const { send, close } = await launch(PORT, [
  `--remote-debugging-port=${PORT}`, `--user-data-dir=${resolve(tmpdir(), "p3d-audit-" + PORT)}`,
  `--window-size=${W},${H + 90}`, "--no-first-run", "--no-default-browser-check", "--remote-allow-origins=*",
  "--hide-scrollbars", "--headless=new", "--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist", "about:blank"]);
const ev = async (e) => (await send("Runtime.evaluate", { expression: e, awaitPromise: true, returnByValue: true })).result?.result?.value;
await send("Page.enable"); await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: DPR, mobile: false });

const fileW = (p) => { try { return +execFileSync("ffprobe", ["-v", "error", "-select_streams", "v", "-show_entries", "stream=width", "-of", "csv=p=0", p]).toString().trim(); } catch { return 0; } };
const best = new Map();
for (const c of CASES) {
  await send("Page.navigate", { url: `http://127.0.0.1:5200/?intro=0&lite=0&lang=ru#/work/${c}` });
  await sleep(7000);
  await ev(`(async()=>{const sc=document.querySelector(".case-scroll")||document.scrollingElement;
    for(let y=0;y<sc.scrollHeight;y+=600){sc.scrollTop=y;await new Promise(r=>setTimeout(r,40));}
    const im=[...document.querySelectorAll("img")];im.forEach(i=>i.loading="eager");
    await Promise.all(im.map(i=>i.complete?null:new Promise(r=>{i.addEventListener("load",r,{once:true});i.addEventListener("error",r,{once:true})})));return im.length})()`);
  await sleep(1000);
  /* окно просмотра растягивает кадр на весь экран — это и есть самое требовательное место */
  const rows = JSON.parse(await ev(`(()=>{const pad=Math.min(40,Math.max(12,innerWidth*0.024));
    const fw=innerWidth-pad*2, fh=innerHeight-pad*2-48;
    return JSON.stringify([...document.querySelectorAll("img")].filter(i=>i.currentSrc&&i.naturalWidth).map(i=>{
      const r=i.getBoundingClientRect(), u=new URL(i.currentSrc).pathname;
      const k=Math.min(fw/i.naturalWidth, fh/i.naturalHeight);
      return {u, disp:Math.round(r.width*devicePixelRatio), lb:Math.round(i.naturalWidth*k*devicePixelRatio),
        zoom:!!i.closest("[data-zoom]")||!!(i.closest(".cs-stage")||{}).querySelector?.("[data-zoom]")};
    }))})()`) || "[]");
  for (const r of rows) {
    const need = Math.max(r.disp, r.zoom ? r.lb : 0);
    const cur = best.get(r.u);
    if (!cur || need > cur.need) best.set(r.u, { need, u: r.u });
  }
}
const out = [];
for (const { u, need } of best.values()) {
  const name = u.replace(/^.*\/cases\//, "");
  const path = "public/cases/" + name;
  if (!existsSync(path) || need < 120) continue;
  const have = fileW(path);
  out.push({ name, have, need, pct: Math.round((have / need) * 100) });
}
out.sort((a, b) => a.pct - b.pct);
console.log(`экран ${W}×${H}, плотность ${DPR}\n`);
console.log("файл".padEnd(46) + "в файле".padEnd(10) + "нужно".padEnd(9) + "хватает");
for (const r of out) console.log(r.name.padEnd(46) + String(r.have).padEnd(10) + String(r.need).padEnd(9) + (r.pct >= 100 ? "да" : r.pct + "%"));
const bad = out.filter((r) => r.pct < 100).length;
console.log(`\nне хватает разрешения: ${bad} из ${out.length}`);
close(); process.exit(0);
