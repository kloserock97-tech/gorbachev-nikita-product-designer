// bundle.json → src/ui/live/<папка>/screens.json + картинки слоёв в public/cases/<кейс>/live2/.
// node tools/f2h/4-build.cjs <bundle.json> <кейс> <папка-модуля> '{"12:34":"home","12:56":"detail"}'
// Ключи кадров — короткие имена экранов для сценариев.
// Картинки (заливки IMAGE): конвертер кладёт в imgs хэш → id узла (data URI не влезал в лимиты). В классах
// url(IMG:<хэш>) → url(IMG:i-<8 знаков>), а сами файлы i-<8 знаков>.webp выгружаются отдельно (README, шаг 4б) —
// скрипт печатает, какие нужны и с каких узлов. Если в imgs data URI (старый конвертер) — пишет png сам.
// У текстовых классов (T;) фон убирается — у TEXT заливка = цвет букв. Шрифтам дописывается запасной ряд
// (SF Pro в вебе не раздаётся → системный шрифт Apple, дальше Inter).
const fs = require("fs");
const path = require("path");
const [, , inp, caseId, dir, keysJson] = process.argv;
const b = JSON.parse(fs.readFileSync(inp, "utf8"));
const KEY = JSON.parse(keysJson);
const root = path.resolve(__dirname, "../..");
const pub = path.join(root, "public/cases", caseId, "live2");
fs.mkdirSync(pub, { recursive: true });
const name = {}, need = [];
for (const [h, v] of Object.entries(b.imgs)) {
  const n = "i-" + h.slice(0, 8);
  name[h] = n;
  if (typeof v === "string" && v.startsWith("data:")) fs.writeFileSync(path.join(pub, n + ".png"), Buffer.from(v.split(",")[1], "base64"));
  else need.push(`${n}.webp ← узел ${v}`);
}
const fallback = (fam) => (/^SF Pro/i.test(fam) ? `'${fam}',-apple-system,BlinkMacSystemFont,Inter,sans-serif` : `'${fam}',Inter,sans-serif`);
const fonts = (s) => s.replace(/font-family:'([^']+)'(?![,'])/g, (_, fam) => `font-family:${fallback(fam)}`);
const cls = {};
for (const [k, v0] of Object.entries(b.cls)) {
  const v = v0.startsWith("T;") ? "T;" + v0.slice(2).replace(/background:[^;]*;/g, "") : v0;
  cls[k] = fonts(v).replace(/url\(IMG:([0-9a-f]+)\)/g, (_, h) => `url(IMG:${name[h] ?? "missing"})`);
}
const frames = b.frames.map((f) => {
  if (!KEY[f.id]) throw new Error("нет ключа для кадра " + f.id + " " + f.name);
  /* линии нулевой высоты (пунктир, разделители) в браузере пропадают — высота не меньше 1 px */
  const html = fonts(f.html).replace(/ p="([-\d.]+),([-\d.]+),([\d.]+),0"/g, ' p="$1,$2,$3,1"');
  return { key: KEY[f.id], id: f.id, name: f.name, w: Math.round(f.w), h: Math.round(f.h), html };
});
const outDir = path.join(root, "src/ui/live", dir);
fs.mkdirSync(outDir, { recursive: true });
const out = { frames, cls, svgs: b.svgs };
fs.writeFileSync(path.join(outDir, "screens.json"), JSON.stringify(out));
console.log("screens", frames.map((f) => f.key).join(","), "bytes", JSON.stringify(out).length);
if (need.length) console.log("выгрузить картинки слоёв (README, шаг 4б):\n  " + need.join("\n  "));
