/* Что в проекте лежит без дела: ключи словаря, классы CSS и файлы public/, на которые нет ссылок.
   node tools/unused.mjs [--json]
   Неиспользуемые файлы и экспорт ищет `npx knip`; здесь то, чего он не видит.
   Поиск идёт по подстроке, поэтому ложных «не используется» почти нет, а вот динамику надо проверять глазами:
   ключи и классы, собранные шаблоном (`notes.${id}.p1`, `case-brand--${id}`), попадают в отдельный список «по шаблону». */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, extname, basename } from "node:path";

const root = process.cwd();
const walk = (dir, out = []) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name), s = statSync(p);
    if (s.isDirectory()) walk(p, out); else out.push(p);
  }
  return out;
};
const rel = (p) => relative(root, p).replaceAll("\\", "/");
const read = (p) => readFileSync(p, "utf8");

const srcFiles = walk(join(root, "src"));
const code = srcFiles.filter((f) => [".ts", ".tsx", ".js"].includes(extname(f)));
const css = srcFiles.filter((f) => extname(f) === ".css");
const html = read(join(root, "index.html"));
const dictFiles = code.filter((f) => rel(f).startsWith("src/i18n/") && !rel(f).endsWith("index.ts"));
const codeText = code.filter((f) => !dictFiles.includes(f)).map(read).join("\n");
const cssText = css.map(read).join("\n");
const everything = codeText + "\n" + html + "\n" + cssText;

/* ── ключи словаря ── */
const keysOf = (file) => [...read(file).matchAll(/^\s*"([a-zA-Z0-9_.-]+)":/gm)].map((m) => m[1]);
const en = new Set(keysOf(join(root, "src/i18n/en.ts"))), ru = new Set(keysOf(join(root, "src/i18n/ru.ts")));
/* шаблонные обращения: t(`weather.${k}`), key(id, "p1") → `notes.${id}.${part}` */
const templates = [...codeText.matchAll(/`([a-zA-Z0-9_.-]*)\$\{[^}]+\}([a-zA-Z0-9_.${}-]*)`/g)].map((m) => m[1]).filter((p) => p.length > 1);
const i18n = { unused: [], byTemplate: [], onlyEn: [...en].filter((k) => !ru.has(k)), onlyRu: [...ru].filter((k) => !en.has(k)) };
for (const key of en) {
  if (everything.includes(`"${key}"`) || everything.includes(`'${key}'`)) continue;
  const prefix = templates.find((p) => key.startsWith(p));
  (prefix ? i18n.byTemplate : i18n.unused).push(prefix ? `${key}  ← \`${prefix}\${…}\`` : key);
}

/* ── классы CSS ── */
const classes = new Set([...cssText.matchAll(/\.(-?[a-zA-Z_][\w-]*)/g)].map((m) => m[1]).filter((c) => !/^\d/.test(c)));
const markup = codeText + "\n" + html;
const classTemplates = [...markup.matchAll(/([a-zA-Z][\w-]*--?)\$\{/g)].map((m) => m[1]);
const cssReport = { unused: [], byTemplate: [] };
for (const name of [...classes].sort()) {
  const re = new RegExp(`(^|[^\\w-])${name.replace(/[-]/g, "\\-")}($|[^\\w-])`);
  if (re.test(markup)) continue;
  const prefix = classTemplates.find((p) => name.startsWith(p));
  (prefix ? cssReport.byTemplate : cssReport.unused).push(prefix ? `${name}  ← ${prefix}\${…}` : name);
}

/* ── файлы public/ ── */
const pub = walk(join(root, "public"));
const assets = { unused: [], byTemplate: [], bytes: 0 };
const dirTemplates = [...everything.matchAll(/([\w/-]+\/)\$\{/g)].map((m) => m[1]);
for (const file of pub) {
  const path = rel(file).replace(/^public\//, ""), name = basename(file), stem = name.replace(/\.[^.]+$/, "");
  if (everything.includes(path) || everything.includes(name)) continue;
  /* имя без расширения: `${clip}.webm`, `${id}.webp` */
  const dir = dirTemplates.find((d) => path.startsWith(d) || path.includes("/" + d));
  if (dir || everything.includes(stem + ".") || everything.includes(`"${stem}"`)) { assets.byTemplate.push(`${path}  ← ${dir ?? stem}`); continue; }
  assets.unused.push(`${path}  (${Math.round(statSync(file).size / 1024)} КБ)`); assets.bytes += statSync(file).size;
}

const report = { i18n, css: cssReport, assets };
if (process.argv.includes("--json")) console.log(JSON.stringify(report, null, 1));
else {
  const show = (title, list) => { console.log(`\n${title}: ${list.length}`); list.forEach((x) => console.log("  " + x)); };
  show("Ключи словаря без обращений", i18n.unused);
  show("Ключи только в en", i18n.onlyEn); show("Ключи только в ru", i18n.onlyRu);
  console.log(`\nКлючей, к которым обращаются по шаблону (проверить глазами): ${i18n.byTemplate.length}`);
  show("Классы CSS без упоминаний в разметке и коде", cssReport.unused);
  show("Классы CSS, собираемые шаблоном", cssReport.byTemplate);
  show(`Файлы public/ без ссылок (${Math.round(assets.bytes / 1024)} КБ)`, assets.unused);
  console.log(`\nФайлов public/, на которые ссылаются по шаблону: ${assets.byTemplate.length}`);
}
