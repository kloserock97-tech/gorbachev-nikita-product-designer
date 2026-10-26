// Дописать кадры в уже собранный screens.json (новые экраны для демо или сценария), не ломая прежние ключи.
// node tools/f2h/4c-merge.cjs <bundle.json> <кейс> <папка-модуля> '{"24:515":"loading"}'
// Стили и SVG без повторов: совпавший стиль берётся из набора, новый получает свободное имя (префиксы выгрузки
// у разных прогонов одинаковые — oc/ov, — поэтому переименовываем). Кадры с теми же ключами заменяются.
// Картинки и шрифты — как в 4-build (картинки слоёв печатаются списком для выгрузки, README шаг 4б).
const fs = require("fs");
const path = require("path");
const [, , inp, caseId, dir, keysJson] = process.argv;
const root = path.resolve(__dirname, "../..");
const screensPath = path.join(root, "src/ui/live", dir, "screens.json");
const out = JSON.parse(fs.readFileSync(screensPath, "utf8"));
const b = JSON.parse(fs.readFileSync(inp, "utf8"));
const KEY = JSON.parse(keysJson);
const free = (taken, pre) => { let n = 0; while (taken[pre + n.toString(36)]) n++; return pre + n.toString(36); };
const name = {}, need = [];
for (const [h, v] of Object.entries(b.imgs)) {
  const n = "i-" + h.slice(0, 8);
  name[h] = n;
  if (typeof v === "string" && v.startsWith("data:")) fs.writeFileSync(path.join(root, "public/cases", caseId, "live2", n + ".png"), Buffer.from(v.split(",")[1], "base64"));
  else if (!fs.existsSync(path.join(root, "public/cases", caseId, "live2", n + ".webp"))) need.push(`${n}.webp ← узел ${v}`);
}
const fallback = (fam) => (/^SF Pro/i.test(fam) ? `'${fam}',-apple-system,BlinkMacSystemFont,Inter,sans-serif` : `'${fam}',Inter,sans-serif`);
const fonts = (s) => s.replace(/font-family:'([^']+)'(?![,'])/g, (_, fam) => `font-family:${fallback(fam)}`);
const byStyle = new Map(Object.entries(out.cls).map(([k, v]) => [v, k]));
const bySvg = new Map(Object.entries(out.svgs).map(([k, v]) => [v, k]));
const clsMap = {}, svgMap = {};
for (const [k, v0] of Object.entries(b.cls)) {
  let v = v0.startsWith("T;") ? "T;" + v0.slice(2).replace(/background:[^;]*;/g, "") : v0;
  v = fonts(v).replace(/url\(IMG:([0-9a-f]+)\)/g, (_, h) => `url(IMG:${name[h] ?? "missing"})`);
  if (!byStyle.has(v)) { const nk = free(out.cls, "m"); out.cls[nk] = v; byStyle.set(v, nk); }
  clsMap[k] = byStyle.get(v);
}
for (const [k, v] of Object.entries(b.svgs)) {
  if (!bySvg.has(v)) { const nk = free(out.svgs, "w"); out.svgs[nk] = v; bySvg.set(v, nk); }
  svgMap[k] = bySvg.get(v);
}
const keys = new Set(Object.values(KEY));
out.frames = out.frames.filter((f) => !keys.has(f.key));
for (const f of b.frames) {
  if (!KEY[f.id]) throw new Error("нет ключа для кадра " + f.id + " " + f.name);
  const html = fonts(f.html)
    .replace(/ c="([0-9a-z]+)"/g, (_, k) => ` c="${clsMap[k] ?? k}"`)
    .replace(/ s="([a-z][0-9a-z]*)"/g, (_, k) => ` s="${svgMap[k] ?? k}"`)
    .replace(/ p="([-\d.]+),([-\d.]+),([\d.]+),0"/g, ' p="$1,$2,$3,1"');
  out.frames.push({ key: KEY[f.id], id: f.id, name: f.name, w: Math.round(f.w), h: Math.round(f.h), html });
}
fs.writeFileSync(screensPath, JSON.stringify(out));
console.log("frames", out.frames.length, out.frames.map((f) => f.key).join(","), "cls", Object.keys(out.cls).length, "svgs", Object.keys(out.svgs).length);
if (need.length) console.log("выгрузить картинки слоёв (README, шаг 4б):\n  " + need.join("\n  "));
