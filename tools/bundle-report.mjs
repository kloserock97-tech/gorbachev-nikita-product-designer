/* Из чего состоит собранный скрипт: байты минифицированного кода по исходным файлам, через карту кода.
   node tools/bundle-report.mjs [--top 30]
   Сам собирает проект с картами во временную папку (dist не трогает) и печатает таблицу по каждому .js-чанку.
   Нужен, чтобы оптимизация сборки опиралась на числа: что лежит в основном чанке и сколько это весит. */
import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

const top = Number(process.argv[process.argv.indexOf("--top") + 1]) || 30;
const out = mkdtempSync(join(tmpdir(), "bundle-report-"));
execFileSync(process.execPath, ["node_modules/vite/bin/vite.js", "build", "--sourcemap", "--outDir", out, "--emptyOutDir", "--logLevel", "error"], { stdio: "inherit" });

const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
/** сколько символов каждой строки сгенерированного кода принадлежит какому исходнику */
function attribute(code, map) {
  const lines = code.split("\n"), sizes = new Array(map.sources.length).fill(0);
  let source = 0, unmapped = 0;
  map.mappings.split(";").forEach((line, row) => {
    const length = lines[row]?.length ?? 0;
    let column = 0, previous = null;
    for (const segment of line.split(",")) {
      if (!segment) continue;
      const fields = []; let value = 0, shift = 0;
      for (const ch of segment) {
        const digit = B64.indexOf(ch); value += (digit & 31) << shift;
        if (digit & 32) shift += 5; else { fields.push(value & 1 ? -(value >> 1) : value >> 1); value = shift = 0; }
      }
      column += fields[0];
      if (previous) (previous.source === null ? (unmapped += column - previous.column) : (sizes[previous.source] += column - previous.column));
      if (fields.length > 1) source += fields[1];
      previous = { column, source: fields.length > 1 ? source : null };
    }
    if (previous) (previous.source === null ? (unmapped += length - previous.column) : (sizes[previous.source] += length - previous.column));
    else unmapped += length;
  });
  return { sizes, unmapped };
}

const label = (path) => {
  const p = path.replaceAll("\\", "/");
  const nm = p.lastIndexOf("node_modules/");
  if (nm >= 0) { const rest = p.slice(nm + 13).split("/"); return rest[0] === "three" ? (rest[1] === "examples" ? "three/examples" : "three (ядро)") : rest[0]; }
  return p.replace(/^(\.\.\/)+/, "").replace(/^.*?(src\/|index\.html)/, "$1");
};

for (const file of readdirSync(join(out, "assets")).filter((f) => f.endsWith(".js")).sort()) {
  const code = readFileSync(join(out, "assets", file), "utf8");
  let map; try { map = JSON.parse(readFileSync(join(out, "assets", file + ".map"), "utf8")); } catch { continue; }
  const { sizes, unmapped } = attribute(code, map), groups = new Map();
  map.sources.forEach((s, i) => groups.set(label(s), (groups.get(label(s)) ?? 0) + sizes[i]));
  const rows = [...groups].sort((a, b) => b[1] - a[1]);
  console.log(`\n${file}: ${(code.length / 1024).toFixed(0)} КБ, в сжатии ${(gzipSync(code).length / 1024).toFixed(0)} КБ, исходников ${rows.length}`);
  rows.slice(0, top).forEach(([name, size]) => console.log(`${(size / 1024).toFixed(1).padStart(8)} КБ  ${name}`));
  if (unmapped > 2048) console.log(`${(unmapped / 1024).toFixed(1).padStart(8)} КБ  (без привязки)`);
}
rmSync(out, { recursive: true, force: true });
