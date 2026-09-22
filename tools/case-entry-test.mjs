/* Проверка входа по прямой ссылке на кейс (v69).

   Самый частый маршрут к сайту — не главная, а ссылка на конкретный кейс в отклике: её открывает
   нанимающий лид, у которого на всё портфолио полторы минуты. Страница кейса — обычный HTML с картинками,
   поэтому время до её текста не должно зависеть от того, сколько поднимается сцена холма.

   Инструмент открывает `<адрес>#/work/<кейс>` в настоящем Chrome с холодным профилем (шейдеры и кэш
   собираются с нуля, как у нового посетителя) и меряет, когда на экране появился заголовок кейса и его
   первая картинка. Выходит с ненулевым кодом, если не уложились в бюджет.

   node tools/case-entry-test.mjs [--url http://127.0.0.1:5191/] [--case grif-ai] [--budget 3000]
                                  [--profile laptop-mid|desktop-hi|all] [--wait 20000] [--port 9354] [--head]

   Мерять по сборке: npm run build && npm run preview (dev-сервер везёт десятки отдельных модулей и врёт на загрузке). */
import { resolve } from "node:path";
import { tmpdir } from "node:os";
import { rmSync } from "node:fs";
import { launch, sleep } from "./lib/chrome.mjs";

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i < 0 ? d : process.argv[i + 1]; };
const URL_ = arg("url", "http://127.0.0.1:5191/");
const CASE = arg("case", "grif-ai");
const BUDGET = +arg("budget", 3000);
const WAIT = +arg("wait", 20000);
const PORT = +arg("port", 9354);
const HEAD = process.argv.includes("--head");

/* Профили совпадают с нагрузочным прогоном (tools/load-test.mjs), чтобы цифры можно было сравнивать. */
const PROFILES = [
  { id: "laptop-mid", title: "Средний ноутбук: DPR 1.25, 1440×900, CPU ×4", w: 1440, h: 900, dpr: 1.25, cpu: 4, budget: BUDGET },
  { id: "desktop-hi", title: "Мощный ПК: DPR 2.25, 1368×775, без замедления", w: 1368, h: 775, dpr: 2.25, cpu: 1, budget: Math.round(BUDGET / 2) },
];
const only = arg("profile", "laptop-mid");
const run = only === "all" ? PROFILES : PROFILES.filter((p) => p.id === only);
if (!run.length) { console.error(`Нет профиля «${only}». Есть: ${PROFILES.map((p) => p.id).join(", ")}, all`); process.exit(2); }

/* Скрипт до загрузки страницы: отмечает по кадрам, когда на экране появились интерфейс, заголовок кейса
   и его первая картинка. Именно это видит человек, поэтому меряем видимость, а не события загрузки. */
const MARKS = `(() => {
  const m = window.__entry = { uiFirst: 0, caseText: 0, caseImg: 0 };
  const now = () => Math.round(performance.now());
  const shown = (el) => { if (!el) return false; const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  const tick = () => {
    if (!m.uiFirst && shown(document.querySelector(".hero, .case-view, .lite"))) m.uiFirst = now();
    if (!m.caseText) { const h = document.querySelector(".case-view #cv-title"); if (shown(h) && h.textContent.trim()) m.caseText = now(); }
    if (!m.caseImg) { const i = [...document.querySelectorAll(".case-view img")].find((x) => x.complete && x.naturalWidth > 0 && x.getBoundingClientRect().width > 100); if (i) m.caseImg = now(); }
    if (m.uiFirst && m.caseText && m.caseImg) return;
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
})();`;

const ms = (v) => (v ? `${(v / 1000).toFixed(1)} с` : "—");
let failed = false;

for (const p of run) {
  const dir = resolve(tmpdir(), `portfolio-3d-ts2-case-entry-${p.id}`);
  /* холодный профиль: кэш шейдеров и файлов не переезжает из прошлого прогона */
  try { rmSync(dir, { recursive: true, force: true }); } catch { /* первого прогона ещё не было */ }

  const { ws, send, close } = await launch(PORT, [
    `--remote-debugging-port=${PORT}`, `--user-data-dir=${dir}`,
    "--disable-gpu-shader-disk-cache", "--disable-gpu-program-cache",
    "--no-first-run", "--no-default-browser-check", "--remote-allow-origins=*",
    "--disable-features=CalculateNativeWinOcclusion", "--disable-backgrounding-occluded-windows",
    "--disable-renderer-backgrounding", "--disable-background-timer-throttling",
    ...(HEAD ? [`--window-size=${p.w},${p.h}`] : ["--headless=new", "--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist"]),
    "about:blank",
  ]);

  await send("Page.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: p.w, height: p.h, deviceScaleFactor: p.dpr, mobile: false });
  if (p.cpu > 1) await send("Emulation.setCPUThrottlingRate", { rate: p.cpu });
  await send("Page.addScriptToEvaluateOnNewDocument", { source: MARKS });
  await send("Page.navigate", { url: `${URL_}#/work/${CASE}` });

  /* ждём, пока отметятся все три вехи, но не дольше --wait */
  const till = Date.now() + WAIT;
  let marks = {};
  while (Date.now() < till) {
    await sleep(250);
    const r = await send("Runtime.evaluate", { expression: "JSON.stringify(window.__entry || {})", returnByValue: true });
    marks = JSON.parse(r.result?.result?.value ?? "{}");
    if (marks.caseText && marks.caseImg) break;
  }
  ws.close(); close();

  const ok = marks.caseText && marks.caseText <= p.budget;
  if (!ok) failed = true;
  console.log(`${ok ? "OK  " : "ПЛОХО"} ${p.id.padEnd(11)} ${p.title}`);
  console.log(`      интерфейс ${ms(marks.uiFirst)} · заголовок кейса ${ms(marks.caseText)} · первая картинка ${ms(marks.caseImg)} · бюджет ${ms(p.budget)}`);
  if (!ok) console.log(`      Ссылка на кейс — самый частый вход. Страница кейса не должна ждать сцену холма.`);
}

process.exit(failed ? 1 : 0);
