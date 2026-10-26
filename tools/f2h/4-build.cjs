// bundle.json → src/ui/live/<папка>/screens.json + картинки слоёв в public/cases/<кейс>/live2/.
// node tools/f2h/4-build.cjs <bundle.json> <кейс> <папка-модуля> '{"12:34":"home","12:56":"detail"}'
// Ключи кадров — короткие имена экранов для сценариев. Картинки (заливки IMAGE) пишутся png по хэшу,
// в классах url(IMG:<хэш>) → url(IMG:i-<8 знаков>); у текстовых классов (T;) фон убирается — у TEXT заливка = цвет букв.
const fs = require("fs");
const path = require("path");
const [, , inp, caseId, dir, keysJson] = process.argv;
const b = JSON.parse(fs.readFileSync(inp, "utf8"));
const KEY = JSON.parse(keysJson);
const root = path.resolve(__dirname, "../..");
const pub = path.join(root, "public/cases", caseId, "live2");
fs.mkdirSync(pub, { recursive: true });
const name = {};
for (const [h, uri] of Object.entries(b.imgs)) {
  const n = "i-" + h.slice(0, 8);
  name[h] = n;
  fs.writeFileSync(path.join(pub, n + ".png"), Buffer.from(uri.split(",")[1], "base64"));
}
const cls = {};
for (const [k, v0] of Object.entries(b.cls)) {
  const v = v0.startsWith("T;") ? v0.replace(/background:[^;]*;/g, "") : v0;
  cls[k] = v.replace(/url\(IMG:([0-9a-f]+)\)/g, (_, h) => `url(IMG:${name[h] ?? "missing"})`);
}
const frames = b.frames.map((f) => {
  if (!KEY[f.id]) throw new Error("нет ключа для кадра " + f.id + " " + f.name);
  return { key: KEY[f.id], id: f.id, name: f.name, w: Math.round(f.w), h: Math.round(f.h), html: f.html };
});
const outDir = path.join(root, "src/ui/live", dir);
fs.mkdirSync(outDir, { recursive: true });
const out = { frames, cls, svgs: b.svgs };
fs.writeFileSync(path.join(outDir, "screens.json"), JSON.stringify(out));
console.log("screens", frames.map((f) => f.key).join(","), "bytes", JSON.stringify(out).length, "imgs", Object.keys(name).length);
