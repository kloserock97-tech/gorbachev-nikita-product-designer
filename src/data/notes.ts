/* Заметки на первом экране (v28): одна карточка, три страницы. Первая — как вырос холм, дальше —
   три своих графических проекта Никиты, у каждого живая демонстрация с панелью настроек и код.
   Тексты — в словарях (i18n/en.ts, ru.ts) под ключами notes.<id>.*; здесь только то, что от языка
   не зависит. Все проекты опубликованы: код на github.com/kloserock97-tech, демо на GitHub Pages. */
export type NoteLinks = { demo: string; repo: string };
/** зацикленное превью: webm для Chrome и Firefox, mp4 для Safari; постер — первый кадр ролика */
export type NoteVideo = { webm: string; mp4: string };
export type Note = { id: "hill" | "drift" | "sail" | "meadow"; image: string; points: number; links?: NoteLinks; video?: NoteVideo };

const notes: Note[] = [
  {
    id: "hill",
    image: "ui/card-windcrest.webp",
    video: { webm: "ui/card-windcrest.webm", mp4: "ui/card-windcrest.mp4" },
    points: 3,
    /* v54: на карточке трава в пресете gale (v55; в v54 был moonlit), и демо по ссылке открывается в нём же (настройки Windcrest живут в hash) */
    links: { demo: "https://kloserock97-tech.github.io/windcrest/#l=1.15&wi=2.4&wa=60&gs=1.5&fl=1.6&s=1.5&se=14&sc=e8e2d6&sp=1.5&sk=93a0ad&am=1.1&bl=0.35&fg=b9c0c4&ze=6d7a86&hz=1.35", repo: "https://github.com/kloserock97-tech/windcrest" },
  },
  {
    id: "drift",
    image: "ui/card-driftfield.webp",
    video: { webm: "ui/card-driftfield.webm", mp4: "ui/card-driftfield.mp4" },
    points: 3,
    links: { demo: "https://kloserock97-tech.github.io/driftfield/", repo: "https://github.com/kloserock97-tech/driftfield" },
  },
  {
    id: "sail",
    image: "ui/card-nightsail.webp",
    video: { webm: "ui/card-nightsail.webm", mp4: "ui/card-nightsail.mp4" },
    points: 3,
    links: { demo: "https://kloserock97-tech.github.io/nightsail/", repo: "https://github.com/kloserock97-tech/nightsail" },
  },
  {
    id: "meadow",
    image: "ui/card-meadow.webp",
    video: { webm: "ui/card-meadow.webm", mp4: "ui/card-meadow.mp4" },
    points: 3,
    links: { demo: "https://kloserock97-tech.github.io/meadow-walk/", repo: "https://github.com/kloserock97-tech/meadow-walk" },
  },
];

export default notes;
