/* Уменьшить картинку и пережать в webp. Нужен для миниатюр экранов на карточках кейсов и для широких фото
   внутри кейса: исходники приходят из Figma и с фотостоков по паре мегабайт, а на карточке экран занимает
   двести пикселей.

   Почему Chrome, а не sharp: sharp в зависимостях проекта нет и тащить его ради пяти миниатюр незачем, а
   headless Chrome тут и так стоит для всех проверок. Картинка уходит на страницу как data-адрес — тогда холст
   не «портится» чужим источником и toDataURL отдаёт результат.

   node tools/make-webp.mjs <входной файл> <выходной .webp> [--w 640] [--q 0.72] [--port 9530]
   Несколько за раз: --batch "вход>выход>ширина" через запятую. */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname, extname } from "node:path";
import { tmpdir } from "node:os";
import { launch, sleep } from "./lib/chrome.mjs";

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i < 0 ? d : process.argv[i + 1] ?? true; };
const PORT = +arg("port", 9530);
const Q = +arg("q", 0.72);
const jobs = arg("batch", null)
  ? String(arg("batch")).split(",").map((s) => { const [from, to, w] = s.split(">"); return { from, to, w: +w }; })
  : [{ from: process.argv[2], to: process.argv[3], w: +arg("w", 640) }];

const mime = (p) => ({ ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".avif": "image/avif", ".svg": "image/svg+xml" })[extname(p).toLowerCase()] ?? "image/png";

const { send, close } = await launch(PORT, [
  `--remote-debugging-port=${PORT}`, `--user-data-dir=${resolve(tmpdir(), "portfolio-3d-ts2-webp")}`,
  "--headless=new", "--no-first-run", "--remote-allow-origins=*", "--window-size=400,300", "about:blank",
]);
const ev = async (e) => (await send("Runtime.evaluate", { expression: e, awaitPromise: true, returnByValue: true })).result?.result?.value;
await send("Page.enable");
await send("Runtime.enable");

for (const { from, to, w } of jobs) {
  const src = `data:${mime(from)};base64,${readFileSync(from).toString("base64")}`;
  const out = await ev(`(async () => {
    const img = new Image();
    img.decoding = "sync";
    await new Promise((ok, no) => { img.onload = ok; img.onerror = () => no(new Error("картинка не открылась")); img.src = ${JSON.stringify(src)}; });
    const scale = Math.min(1, ${w} / img.naturalWidth);
    const c = document.createElement("canvas");
    c.width = Math.round(img.naturalWidth * scale);
    c.height = Math.round(img.naturalHeight * scale);
    const g = c.getContext("2d");
    g.imageSmoothingQuality = "high";
    g.drawImage(img, 0, 0, c.width, c.height);
    return JSON.stringify({ w: c.width, h: c.height, data: c.toDataURL("image/webp", ${Q}).split(",")[1] });
  })()`);
  if (!out) { console.error(`✗  ${from}: не удалось пережать`); process.exitCode = 1; continue; }
  const { w: ow, h: oh, data } = JSON.parse(out);
  mkdirSync(dirname(to), { recursive: true });
  const buf = Buffer.from(data, "base64");
  writeFileSync(to, buf);
  const was = readFileSync(from).length;
  console.log(`ok ${to}  ${ow}×${oh}  ${(buf.length / 1024).toFixed(0)} КБ  (было ${(was / 1024).toFixed(0)} КБ)`);
}
close();
