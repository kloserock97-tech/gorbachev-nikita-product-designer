/* Переход от карточки к карточке на телефоне: глава «Кейсы» (колесо) и заметки «по вечерам».

   Проверяет две вещи, на которых это ломалось (v68):
   1) Адресная строка. Браузер на телефоне прячет и показывает её на ходу, innerHeight меняется на 50–90 px,
      а страница не сдвигается. Если прогресс истории считать от innerHeight, глава уезжает сама по себе —
      экран моргает, карточка перескакивает, а шаг назад не слушается (прокрутка вверх как раз и вытаскивает
      адресную строку). Здесь innerHeight подменяется так же, как это делает браузер, и положение колеса
      должно остаться прежним.
   2) Вариативность. Кроме прокрутки и свайпа должны работать кнопки шага и стрелки на клавиатуре — в обе
      стороны, в обеих главах.

   node tools/cdp-cards.mjs [--base http://127.0.0.1:5190/] [--port 9481]
   Нужен dev-сервер (или preview — тогда --base). Chrome без окна. Выход 1, если что-то не прошло. */
import { resolve } from "node:path";
import { tmpdir } from "node:os";
import { launch, sleep } from "./lib/chrome.mjs";

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i < 0 ? d : process.argv[i + 1] ?? true; };
const BASE = arg("base", "http://127.0.0.1:5190/"), PORT = +arg("port", 9481);
const W = 390, H = 844, BAR = 64; // насколько окно ниже, когда адресная строка видна

const { send, close } = await launch(PORT, [
  `--remote-debugging-port=${PORT}`, `--user-data-dir=${resolve(tmpdir(), "portfolio-3d-ts2-cards")}`,
  "--headless=new", "--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist", "--no-first-run",
  "--remote-allow-origins=*", "--hide-scrollbars", `--window-size=${W},${H}`, "about:blank",
]);
const ev = async (e) => (await send("Runtime.evaluate", { expression: e, awaitPromise: true, returnByValue: true })).result?.result?.value;
await send("Page.enable");
await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: 2, mobile: true });
await send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
await send("Page.navigate", { url: `${BASE}?intro=0&lite=0` });
await sleep(9500);

let bad = 0;
const ok = (good, text) => { console.log(`${good ? "ok " : "✗  "}${text}`); if (!good) bad++; };

/* свой пробник vh: им же меряет сайт, и он не зависит от адресной строки */
await ev(`(()=>{const i=document.createElement("i");i.id="vhp";i.style.cssText="position:fixed;top:0;left:0;width:0;height:100vh;visibility:hidden";document.body.appendChild(i);return 1})()`);
const goto = async (p) => {
  await ev(`(()=>{const st=document.querySelector(".story");const vh=document.getElementById("vhp").offsetHeight;
    const lead=Math.min(st.offsetTop, vh*.4); const start=Math.max(0,st.offsetTop-lead), end=st.offsetTop+st.offsetHeight-vh;
    scrollTo({top:start+(end-start)*${p}, behavior:"instant"}); return 1})()`);
  await sleep(2600);
};
const tap = async (sel) => {
  const raw = await ev(`(()=>{const e=document.querySelector("${sel}");if(!e)return null;const r=e.getBoundingClientRect();
    return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)})})()`);
  if (!raw) return false;
  const { x, y } = JSON.parse(raw);
  const tp = [{ x, y, id: 1, radiusX: 8, radiusY: 8, force: 1 }];
  await send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: tp });
  await sleep(70);
  await send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await sleep(2400);
  return true;
};
const key = async (name, vk) => {
  for (const type of ["keyDown", "keyUp"]) await send("Input.dispatchKeyEvent", { type, key: name, code: name, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk });
  await sleep(2400);
};
/** свайп вбок по середине блока: dx < 0 — следующая карточка */
const swipe = async (sel, dx, speed = 900) => {
  const raw = await ev(`(()=>{const e=document.querySelector("${sel}");if(!e)return null;const r=e.getBoundingClientRect();
    return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)})})()`);
  if (!raw) return false;
  const { x, y } = JSON.parse(raw);
  const ms = (Math.abs(dx) / speed) * 1000, n = Math.max(6, Math.round(ms / 16));
  const pt = (k) => [{ x: Math.round(x + dx * k), y, id: 1, radiusX: 8, radiusY: 8, force: 1 }];
  await send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: pt(0) });
  for (let i = 1; i <= n; i++) { await sleep(ms / n); await send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: pt(i / n) }); }
  await send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await sleep(2400);
  return true;
};
/* кнопка видна целиком и её ничем не накрыло: под её серединой лежит она сама */
const reachable = async (sel) => ev(`(()=>{const e=document.querySelector("${sel}");if(!e)return false;const r=e.getBoundingClientRect();
  if (r.width<20||r.height<20||r.top<0||r.bottom>innerHeight) return false;
  const hit=document.elementFromPoint(Math.round(r.x+r.width/2), Math.round(r.y+r.height/2));
  return !!hit && (hit===e || e.contains(hit))})()`);

/** одна глава: жест, кнопки и клавиши — в обе стороны */
async function chapter(title, at, counter, prevSel, nextSel, swipeSel, swipeDx) {
  console.log(`\n── ${title} ──`);
  await goto(at);
  const now = () => ev(`document.querySelector("${counter}")?.textContent`);
  ok(await reachable(prevSel), "кнопка «назад» на экране и ничем не накрыта");
  ok(await reachable(nextSel), "кнопка «вперёд» на экране и ничем не накрыта");
  /* переключатель звука первые секунды раскрыт подписью и занимает правую половину нижней строки —
     кнопки шага не должны прятаться под ним ни в свёрнутом, ни в раскрытом виде */
  await ev(`document.querySelector(".sound-fab")?.classList.add("is-tell")`);
  await sleep(700);
  ok(await reachable(prevSel), "«назад» не уходит под раскрытый переключатель звука");
  ok(await reachable(nextSel), "«вперёд» не уходит под раскрытый переключатель звука");
  await ev(`document.querySelector(".sound-fab")?.classList.remove("is-tell")`);
  await sleep(700);
  const a = await now();
  await tap(nextSel); const b = await now();
  ok(+b === +a + 1, `кнопкой вперёд: ${a} → ${b}`);
  await tap(prevSel); const c = await now();
  ok(+c === +b - 1, `кнопкой назад: ${b} → ${c}`);
  await key("ArrowRight", 39); const d = await now();
  ok(+d === +c + 1, `клавишей →: ${c} → ${d}`);
  await key("ArrowLeft", 37); const e = await now();
  ok(+e === +d - 1, `клавишей ←: ${d} → ${e}`);

  /* Сам жест, с которого всё началось. Встаём на первую карточку кнопкой, иначе шаги вперёд упрутся в конец
     списка, и проверка соврёт. Дальше два раза вперёд и два раза назад: путь должен читаться как 1-2-3-2-1. */
  for (let i = 0; i < 8 && +(await now()) > 1; i++) await tap(prevSel);
  const path = [await now()];
  for (let i = 0; i < 2; i++) { await swipe(swipeSel, -swipeDx); path.push(await now()); }
  for (let i = 0; i < 2; i++) { await swipe(swipeSel, swipeDx); path.push(await now()); }
  const n = path.map(Number);
  console.log(`   пальцем: ${path.join(" → ")}`);
  ok(n[1] === n[0] + 1 && n[2] === n[1] + 1, "свайп вперёд — по одной карточке, без пропусков");
  ok(n[3] === n[2] - 1 && n[4] === n[3] - 1, "свайп назад — ровно обратно, по одной");
  ok(n[4] === n[0], `вернулись на ту же карточку: ${path[0]} → ${path[4]}`);
}

await chapter("глава «Кейсы»", 0.55, ".cases-now", ".cw-step[data-d='-1']", ".cw-step--next", ".cw-wheel", 150);
await chapter("заметки «по вечерам»", 0.80, ".shelf-now", ".shelf-step[data-d='-1']", ".shelf-step--next", ".shelf-stage", 220);

console.log("\n── адресная строка телефона ──");
/* непрерывный показатель: полоска прогресса главы хранит дробное положение колеса */
const wheelAt = async () => {
  const t = await ev(`(()=>{const b=document.querySelector(".cases-bar i");return b?b.style.transform:""})()`);
  const i = (t || "").indexOf("("), j = (t || "").indexOf(")");
  return i < 0 ? null : Number(t.slice(i + 1, j));
};
const setBar = (px) => ev(`(()=>{Object.defineProperty(window,"innerHeight",{configurable:true,value:${px}});dispatchEvent(new Event("resize"));return innerHeight})()`);
/* лёгкий толчок: история пересчитывается на прокрутке, а не сама по себе */
const nudge = async () => { await ev("scrollBy(0,2)"); await sleep(350); await ev("scrollBy(0,-2)"); await sleep(1300); };
await goto(0.55); await nudge();
const before = await wheelAt();
await setBar(H - BAR); await nudge();
const during = await wheelAt();
await setBar(H); await nudge();
const after = await wheelAt();
const cards = Math.max(1, (await ev(`document.querySelectorAll(".cw-item").length`)) - 1);
const shift = Math.abs(during - before) * cards;
ok(shift < 0.01, `строка появилась — глава не сдвинулась (сдвиг ${(shift * 100).toFixed(0)}% карточки)`);
ok(Math.abs(after - before) * cards < 0.01, "строка ушла — глава на прежнем месте");

console.log(bad ? `\n${bad} проверок не прошло` : "\nвсе проверки прошли");
close();
process.exit(bad ? 1 : 0);
