/* Страховка при переписывании текстов: сравнивает файл с его версией в git HEAD и показывает, что поменялось
   кроме слов — числа, пути к картинкам, идентификаторы, координаты точек, число строковых полей.
   Тексты можно упрощать как угодно, а факты и структура должны остаться теми же.

   node tools/text-guard.mjs src/data/stories/community.ts [ещё файлы] */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const count = (list) => { const m = new Map(); for (const x of list) m.set(x, (m.get(x) ?? 0) + 1); return m; };
const diff = (a, b) => {
  const out = [];
  for (const [k, v] of a) if ((b.get(k) ?? 0) !== v) out.push(`${k}: было ${v}, стало ${b.get(k) ?? 0}`);
  for (const [k, v] of b) if (!a.has(k)) out.push(`${k}: было 0, стало ${v}`);
  return out;
};
/* числа внутри текста: 169,4 · 26.25% · 3:20 · 250+ · 24–35; слова-числительные не ловим — их смотрим глазами */
const numbers = (s) => (s.match(/\d+(?:[.,:]\d+)*\s?%?\+?/g) ?? []).map((x) => x.replace(/\s/g, "").replace(",", "."));
const paths = (s) => s.match(/["'`](?:cases|ui|figma)\/[^"'`]+["'`]|C \+ "[^"]+"/g) ?? [];
const ids = (s) => s.match(/\b(?:id|decision|deepDive|kind|outcome|status): "[^"]+"/g) ?? [];
const keys = (s) => s.match(/^\s*"?[A-Za-z][\w.]*"?:/gm)?.map((k) => k.trim()) ?? [];

let bad = 0;
for (const file of process.argv.slice(2)) {
  const now = readFileSync(file, "utf8");
  const was = execFileSync("git", ["show", `HEAD:${file.replace(/\\/g, "/")}`], { encoding: "utf8", maxBuffer: 1 << 26 });
  const report = [
    ["числа", diff(count(numbers(was)), count(numbers(now)))],
    ["пути", diff(count(paths(was)), count(paths(now)))],
    ["идентификаторы", diff(count(ids(was)), count(ids(now)))],
    ["поля", diff(count(keys(was)), count(keys(now)))],
  ].filter(([, d]) => d.length);
  const dashes = (now.match(/[—–]/g) ?? []).length, dashesWas = (was.match(/[—–]/g) ?? []).length;
  console.log(`\n${file}: ${was.length} → ${now.length} знаков, тире ${dashesWas} → ${dashes}`);
  for (const [name, d] of report) { bad += d.length; console.log(`  ${name}:\n    ${d.slice(0, 40).join("\n    ")}`); }
  if (!report.length) console.log("  факты и структура на месте");
}
process.exit(bad ? 1 : 0);
