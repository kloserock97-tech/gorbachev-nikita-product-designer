/* Заметки на первом экране (v28): одна карточка, три страницы. Первая — как вырос холм, дальше —
   три своих графических проекта Никиты, у каждого живая демонстрация с панелью настроек и код.
   Тексты — в словарях (i18n/en.ts, ru.ts) под ключами notes.<id>.*; здесь только то, что от языка
   не зависит. Все проекты опубликованы: код на github.com/kloserock97-tech, демо на GitHub Pages. */
export type NoteLinks = { demo: string; repo: string };
/** зацикленное превью: webm для Chrome и Firefox, mp4 для Safari; постер — первый кадр ролика */
export type NoteVideo = { webm: string; mp4: string };
/** meta — стек и год строкой под заголовком описания (от языка не зависит);
    glyph — свой штриховой значок проекта: содержимое svg с viewBox 0 0 64 64 (v58) */
export type Note = { id: "hill" | "drift" | "sail" | "meadow"; image: string; points: number; meta: string; glyph: string; links?: NoteLinks; video?: NoteVideo };

const notes: Note[] = [
  {
    id: "hill",
    meta: "three.js · GLSL · 2026",
    /* три травинки над линией земли */
    glyph: '<path d="M10 52h44"/><path d="M22 52c1-14 5-24 13-34"/><path d="M32 52c0-12 4-21 12-28"/><path d="M42 52c-1-10-5-18-13-24"/>',
    image: "ui/card-windcrest.webp",
    video: { webm: "ui/card-windcrest.webm", mp4: "ui/card-windcrest.mp4" },
    points: 3,
    /* v54: на карточке трава в пресете gale (v55; в v54 был moonlit), и демо по ссылке открывается в нём же (настройки Windcrest живут в hash) */
    links: { demo: "https://kloserock97-tech.github.io/windcrest/#l=1.15&wi=2.4&wa=60&gs=1.5&fl=1.6&s=1.5&se=14&sc=e8e2d6&sp=1.5&sk=93a0ad&am=1.1&bl=0.35&fg=b9c0c4&ze=6d7a86&hz=1.35", repo: "https://github.com/kloserock97-tech/windcrest" },
  },
  {
    id: "drift",
    meta: "three.js · GLSL · 2026",
    /* линии тока, закрученные вихрем */
    glyph: '<path d="M10 40c8-20 28-24 36-12 6 9-4 18-12 12-6-5-1-13 5-10"/><path d="M12 50c14 4 32 2 42-10"/><path d="M8 28c4-8 10-13 18-15"/>',
    image: "ui/card-driftfield.webp",
    video: { webm: "ui/card-driftfield.webm", mp4: "ui/card-driftfield.mp4" },
    points: 3,
    links: { demo: "https://kloserock97-tech.github.io/driftfield/", repo: "https://github.com/kloserock97-tech/driftfield" },
  },
  {
    id: "sail",
    meta: "three.js · WebGPU · TSL · 2026",
    /* столб света, голова и две волны */
    glyph: '<path d="M32 8v10"/><circle cx="32" cy="29" r="10"/><path d="M8 44q6-6 12 0t12 0 12 0 12 0"/><path d="M8 53q6-6 12 0t12 0 12 0 12 0"/>',
    image: "ui/card-nightsail.webp",
    video: { webm: "ui/card-nightsail.webm", mp4: "ui/card-nightsail.mp4" },
    points: 3,
    links: { demo: "https://kloserock97-tech.github.io/nightsail/", repo: "https://github.com/kloserock97-tech/nightsail" },
  },
  {
    id: "meadow",
    meta: "React Three Fiber · GLSL · 2026",
    /* два холма и низкое солнце */
    glyph: '<path d="M6 50c8-16 16-18 24-6 7-18 18-20 28-2"/><path d="M6 50h52"/><circle cx="46" cy="18" r="5"/>',
    image: "ui/card-meadow.webp",
    video: { webm: "ui/card-meadow.webm", mp4: "ui/card-meadow.mp4" },
    points: 3,
    links: { demo: "https://kloserock97-tech.github.io/meadow-walk/", repo: "https://github.com/kloserock97-tech/meadow-walk" },
  },
];

export default notes;
