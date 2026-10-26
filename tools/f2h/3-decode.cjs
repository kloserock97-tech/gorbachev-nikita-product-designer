// Ответ get_metadata по фрейму-держателю (сохранён в файл) → bundle.json.
// node tools/f2h/3-decode.cjs <metadata-файл> <bundle.json>
const fs = require("fs");
const [, , inp, out] = process.argv;
const txt = fs.readFileSync(inp, "utf8");
const parts = [...txt.matchAll(/name="D(\d{3}):([A-Za-z0-9+/=]+)"/g)].sort((a, b) => +a[1] - +b[1]);
if (!parts.length) throw new Error("в файле нет фреймов D000:…");
const b64 = parts.map((m) => m[2]).join("");
const json = Buffer.from(b64, "base64").toString("utf8");
const b = JSON.parse(json);
fs.writeFileSync(out, JSON.stringify(b));
console.log("frames", b.frames.length, b.frames.map((f) => `${f.id} ${f.name} ${Math.round(f.w)}×${Math.round(f.h)}`).join(" | "), "cls", Object.keys(b.cls).length, "svgs", Object.keys(b.svgs).length, "imgs", Object.keys(b.imgs).length);
