/* Заметки на первом экране (v28): одна карточка, три страницы. Первая — как вырос холм, дальше —
   три своих графических проекта Никиты, у каждого живая демонстрация с панелью настроек и код.
   Тексты — в словарях (i18n/en.ts, ru.ts) под ключами notes.<id>.*; здесь только то, что от языка
   не зависит. Все проекты опубликованы: код на github.com/kloserock97-tech, демо на GitHub Pages. */
export type NoteLinks = { demo: string; repo: string };
/** зацикленное превью: webm для Chrome и Firefox, mp4 для Safari; постер — первый кадр ролика */
export type NoteVideo = { webm: string; mp4: string };
export type Note = { id: "hill" | "drift" | "sail" | "meadow"; image: string; points: number; links?: NoteLinks; video?: NoteVideo };

const notes: Note[] = [
  { id: "hill", image: "ui/card-grass.webp", points: 5 },
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
