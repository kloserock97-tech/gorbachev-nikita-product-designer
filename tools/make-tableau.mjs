/* Логотип плитки для Табло Яндекс Браузера: docs/media/tableau-logo.svg → public/tableau.png.

   Табло берёт картинку сайта у сервиса иконок Яндекса, а тот ищет её по домену — в корне
   kloserock97-tech.github.io, где нашего сайта нет (он в подпапке репозитория). Сервис отдавал пустую картинку
   1×1, и Табло рисовало вместо сайта букву. Свой логотип сайт отдаёт через виджет: index.html →
   <link rel="yandex-tableau-widget" href="tableau.json">, в манифесте — адрес PNG и цвет плитки.
   Требования Табло: PNG 300×100, прозрачный фон.

   Почему Chrome, а не Python с resvg, как в Logo/tools: headless Chrome уже стоит для всех проверок сайта.

   node tools/make-tableau.mjs [--port 9531] */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { tmpdir } from "node:os";
import { launch, sleep } from "./lib/chrome.mjs";

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i < 0 ? d : process.argv[i + 1]; };
const SRC = resolve("docs/media/tableau-logo.svg"), OUT = resolve("public/tableau.png");
const W = 300, H = 100, PORT = +arg("port", 9531);

const svg = readFileSync(SRC, "utf8");
const { send, close } = await launch(PORT, [
  `--remote-debugging-port=${PORT}`, `--user-data-dir=${resolve(tmpdir(), "ts2-make-tableau")}`,
  "--headless=new", "--no-first-run", "--remote-allow-origins=*", "about:blank",
]);
try {
  await send("Page.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: 1, mobile: false });
  /* без этого у снимка белый фон вместо прозрачного */
  await send("Emulation.setDefaultBackgroundColorOverride", { color: { r: 0, g: 0, b: 0, a: 0 } });
  const { result } = await send("Page.getFrameTree");
  await send("Page.setDocumentContent", {
    frameId: result.frameTree.frame.id,
    html: `<!doctype html><style>html,body{margin:0;background:transparent}svg{display:block}</style>${svg}`,
  });
  await sleep(300);
  const shot = await send("Page.captureScreenshot", { format: "png", clip: { x: 0, y: 0, width: W, height: H, scale: 1 } });
  writeFileSync(OUT, Buffer.from(shot.result.data, "base64"));
  console.log(`saved ${OUT}`);
} finally {
  close();
}
