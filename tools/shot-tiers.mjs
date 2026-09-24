/* Разложить выгрузку экрана из Figma на два размера для srcset и собрать манифест.

   Зачем. Макеты в кейсах лежали в одном размере — и в том, в каком их когда-то отдали: 1440 точек на фрейм
   шириной 1440, то есть 1×. На нынешних экранах точек вдвое больше, а окно просмотра растягивает кадр на
   весь экран, и браузеру приходится додумывать пиксели. Отсюда «мыло».

   Что делает. Из выгрузки в 2× кладёт рядом два файла: обычный (<имя>.webp) и двойной (<имя>@2x.webp).
   Браузер по srcset берёт нужный сам, поэтому на простом экране вес не растёт.

   Почему webp, а не png: на снимках интерфейса при качестве 82 он весит вдвое меньше и на глаз не отличается
   (сверено по PSNR с исходником). Двойной webp выходит легче, чем лежавший раньше одинарный png.

   node tools/shot-tiers.mjs <вход 2x.png> <выход без расширения> [--base 1440] [--q 82]
   Пачкой:   node tools/shot-tiers.mjs --batch "вход>выход>базовая ширина,..."
   Манифест: node tools/shot-tiers.mjs --manifest   (пересобирает src/data/shots2x.ts) */
import { execFileSync } from "node:child_process";
import { mkdirSync, statSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i < 0 ? d : process.argv[i + 1] ?? true; };
const has = (k) => process.argv.includes(`--${k}`);

/* Манифест: разметка в браузере не видит папку, поэтому список файлов с парой @2x собирается здесь. */
if (has("manifest")) {
  const found = [];
  const walk = (dir) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith("@2x.webp")) found.push(relative("public", p).split("\\").join("/").replace("@2x.webp", ".webp"));
    }
  };
  walk("public/cases");
  found.sort();
  writeFileSync("src/data/shots2x.ts",
    "/* Собирается tools/shot-tiers.mjs --manifest. Руками не править.\n" +
    "   Здесь перечислены экраны, у которых рядом лежит файл @2x: по нему строится srcset. */\n" +
    "export const shots2x = new Set<string>([\n" + found.map((f) => `  "${f}",`).join("\n") + "\n]);\n");
  console.log(`в манифесте ${found.length} экранов`);
  process.exit(0);
}

const Q = +arg("q", 82);
const jobs = arg("batch", null)
  ? String(arg("batch")).split(",").map((s) => { const [from, to, base] = s.split(">"); return { from, to, base: +base }; })
  : [{ from: process.argv[2], to: process.argv[3], base: +arg("base", 1440) }];

const ff = (args) => execFileSync("ffmpeg", ["-v", "error", "-y", ...args], { stdio: ["ignore", "pipe", "pipe"] });
const kb = (p) => Math.round(statSync(p).size / 1024);
/* нечётную сторону libwebp не берёт, поэтому после масштабирования подрезаем до чётной */
const even = "scale=trunc(iw/2)*2:trunc(ih/2)*2";
const webp = (from, to, w) => ff(["-i", from, "-vf", `scale=${w}:-1:flags=lanczos,${even}`, "-c:v", "libwebp", "-quality", String(Q), "-preset", "picture", "-compression_level", "6", to]);

for (const { from, to, base } of jobs) {
  mkdirSync(dirname(to), { recursive: true });
  webp(from, `${to}@2x.webp`, base * 2);
  webp(from, `${to}.webp`, base);
  console.log(`${to}.webp ${kb(`${to}.webp`)}kb · @2x ${kb(`${to}@2x.webp`)}kb`);
}
