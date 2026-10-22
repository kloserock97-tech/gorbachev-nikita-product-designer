/* v116: живой прототип «Сообщества» по кадрам «1 Stage» (Figma LdUrYy9cNus6q7005xnmXo: лента 21061:89858,
   история 21061:90076, форма 21061:91710, профиль 21061:91430). Путь читателя, который становится автором:
   лента → «Загадочная Дангауэровка» → «Рассказать историю» в шапке → форма → активность в профиле
   («Публикация истории», +5 баллов после модерации).
   Живое сверх макета — только то, что нужно пути: темы фильтруют ленту, «Прослушать» включает плеер без звука,
   «Отправить» серая, пока не заполнены заголовок и текст, тихая ссылка «Вставить пример» — чтобы не печатать в окошке.
   Фото, аватары и баннеры — участки экспортов s1-*.webp как CSS-спрайты (отдельных файлов нет).
   Тексты продукта русские в обоих языках. */
import type { LiveCtx, LiveProto } from "./types";
import "./community.css";

const W = 1280;

/* ——— спрайты: участок [x, y, w, h] целой страницы экспорта (1440 px) ——— */
type Sheet = "feed" | "art" | "prof";
const SHEET: Record<Sheet, [string, number]> = {
  feed: ["s1-feed.webp", 1440],
  art: ["s1-article.webp", 1440],
  prof: ["s1-profile.webp", 1440],
};
const SHOT = {
  banner: ["feed", 100, 158, 1240, 433],
  woman: ["feed", 100, 633, 266, 404],
  love: ["feed", 100, 1037, 612, 240],
  move: ["feed", 100, 1645, 612, 240],
  squirrel: ["feed", 100, 2061, 612, 240],
  sights: ["feed", 729, 1485, 612, 346],
  dang: ["feed", 729, 2020, 266, 404],
  fountain: ["feed", 1075, 2424, 266, 404],
  hero: ["art", 132, 342, 757, 360],
  author: ["art", 132, 749, 42, 42],
  coauthors: ["art", 366, 752, 80, 32],
  video: ["art", 132, 1432, 757, 445],
  side1: ["art", 937, 106, 403, 226],
  side2: ["art", 937, 520, 403, 226],
  side3: ["art", 937, 934, 403, 226],
  side4: ["art", 937, 1348, 403, 226],
  bannerNY: ["art", 100, 3347, 1240, 433],
  cm1: ["art", 132, 2863, 42, 42],
  cm2: ["art", 132, 3010, 42, 42],
  cm3: ["art", 156, 3113, 42, 42],
  me: ["prof", 1298, 16, 42, 42],
  me64: ["prof", 120, 126, 64, 64],
  sub: ["prof", 959, 197, 32, 32],
  promoCulture: ["prof", 937, 913, 403, 371],
  promoNY: ["prof", 937, 1284, 403, 370],
} as const satisfies Record<string, readonly [Sheet, number, number, number, number]>;
type ShotKey = keyof typeof SHOT;

/** фон-спрайт «как cover»: участок экспорта вписывается в блок w×h */
function sprite(base: string, key: ShotKey, w: number, h: number): string {
  const [sheet, x, y, rw, rh] = SHOT[key];
  const [file, IW] = SHEET[sheet];
  const s = Math.max(w / rw, h / rh);
  const px = -x * s + (w - rw * s) / 2;
  const py = -y * s + (h - rh * s) / 2;
  return `background-image:url('${base}cases/community/${file}');background-size:${(IW * s).toFixed(2)}px auto;background-position:${px.toFixed(2)}px ${py.toFixed(2)}px`;
}

/* ——— иконки (свои, по виду макета: контур 16/20/24) ——— */
const ic = (d: string, vb = 20) => `<svg viewBox="0 0 ${vb} ${vb}" aria-hidden="true">${d}</svg>`;
const I = {
  like: ic('<path d="M5 7.5v7H2.5v-7zM5 7.5l3-5c1.1 0 1.8.9 1.5 2L9 6.5h4.4a1.4 1.4 0 0 1 1.4 1.6l-.9 5a1.6 1.6 0 0 1-1.6 1.4H5"/>', 16),
  dislike: ic('<path d="M5 8.5v-7H2.5v7zM5 8.5l3 5c1.1 0 1.8-.9 1.5-2L9 9.5h4.4a1.4 1.4 0 0 0 1.4-1.6l-.9-5A1.6 1.6 0 0 0 12.3 1.5H5"/>', 16),
  bubble: ic('<path d="M2.5 3.5h11v8H7.5L4.5 14v-2.5h-2z"/>', 16),
  share: ic('<circle cx="4.5" cy="8" r="1.6"/><circle cx="11.5" cy="4" r="1.6"/><circle cx="11.5" cy="12" r="1.6"/><path d="M5.9 7.2l4.2-2.4M5.9 8.8l4.2 2.4"/>', 16),
  eye: ic('<path d="M2 10s3-5.5 8-5.5S18 10 18 10s-3 5.5-8 5.5S2 10 2 10z"/><circle cx="10" cy="10" r="2.3"/>'),
  play: ic('<path class="is-play" d="M11 9.2v13.6L22.5 16z"/><path class="is-pause" d="M10.5 9h3.6v14h-3.6zM17.9 9h3.6v14h-3.6z"/>', 32),
  arrow: ic('<path d="M4 12h16M14 6l6 6-6 6"/>', 24),
  down: ic('<path d="M5 7.5l5 5 5-5"/>'),
  left: ic('<path d="M12.5 5l-5 5 5 5"/>'),
  right: ic('<path d="M7.5 5l5 5-5 5"/>'),
  search: ic('<circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5 5"/>', 24),
  burger: ic('<path d="M4 6.5h16M4 12h16M4 17.5h16"/>', 24),
  shield: ic('<path d="M6 4.5h12v10.2c0 2.6-2.7 4.4-6 5.3-3.3-.9-6-2.7-6-5.3z"/>', 24),
  bell: ic('<path d="M6.5 16.5V11a5.5 5.5 0 0 1 11 0v5.5l1.5 1.5H5z"/><path d="M10 20.5a2.2 2.2 0 0 0 4 0"/>', 24),
  clip: ic('<path d="M14.5 7.5l-5.8 5.8a2 2 0 0 1-2.8-2.8l6.2-6.2a3.2 3.2 0 0 1 4.5 4.5l-6.4 6.4a4.4 4.4 0 0 1-6.2-6.2L9.6 3.4"/>'),
  image: ic('<rect x="3.5" y="5" width="17" height="14" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="M4 17l5-4.5 3.5 3 3-2.5 4.5 4"/>', 24),
  dots: ic('<circle cx="4.5" cy="10" r="1.5"/><circle cx="10" cy="10" r="1.5"/><circle cx="15.5" cy="10" r="1.5"/>'),
  gear: ic('<circle cx="12" cy="12" r="3"/><path d="M12 3.5l1.6 2.3 2.7-.6.6 2.7 2.3 1.6-1.4 2.5 1.4 2.5-2.3 1.6-.6 2.7-2.7-.6L12 20.5l-1.6-2.3-2.7.6-.6-2.7-2.3-1.6L6.2 12 4.8 9.5l2.3-1.6.6-2.7 2.7.6z"/>', 24),
  persons: ic('<circle cx="6" cy="5.5" r="2.2"/><path d="M2 13c0-2.3 1.8-4 4-4s4 1.7 4 4"/><circle cx="11.3" cy="5" r="1.8"/><path d="M11 9c1.8 0 3.3 1.5 3.3 3.5"/>', 16),
  dice: ic('<rect x="3.5" y="3.5" width="13" height="13" rx="3" transform="rotate(12 10 10)"/><circle cx="7.5" cy="8" r=".9"/><circle cx="12.5" cy="12" r=".9"/><circle cx="10" cy="10" r=".9"/>'),
  /* «лучик» — значок рейтинга сообщества, круг с закрашенной половиной */
  ray: '<svg viewBox="0 0 32 32" aria-hidden="true" class="lv-c-ray"><circle cx="16" cy="16" r="10.5"/><path d="M16 5.5a10.5 10.5 0 0 0 0 21z" class="is-fill"/><path d="M16 11.5l3.5 4.5-3.5 4.5"/></svg>',
  story: ic('<path d="M8 5.5h12.5v21H8z"/><path d="M11.5 10.5h5.5M11.5 14h5.5M11.5 17.5h3.5"/><path d="M20.5 9.5l3-1.5v17l-3 1.5"/>', 32),
  mask: '<svg viewBox="0 0 20 20" aria-hidden="true" class="lv-c-nick"><path d="M3 5c2.5 1 4.5 1 7 0 2.5 1 4.5 1 7 0v5.5c0 3.5-3.2 6-7 6.5-3.8-.5-7-3-7-6.5z"/><path d="M6 9.5c.8-.6 1.7-.6 2.5 0M11.5 9.5c.8-.6 1.7-.6 2.5 0M7.5 13c1.6 1 3.4 1 5 0" class="is-line"/></svg>',
  qOpen: '<svg viewBox="0 0 24 17" aria-hidden="true"><path d="M0 17V10.6C0 4.9 2.6 1.4 7.8 0l1 2.4C6.1 3.5 4.9 5.4 4.8 8.2H9.8V17zm13.6 0V10.6c0-5.7 2.6-9.2 7.8-10.6l1 2.4c-2.7 1.1-3.9 3-4 5.8h5V17z"/></svg>',
  qClose: '<svg viewBox="0 0 24 17" aria-hidden="true"><path d="M24 0v6.4c0 5.7-2.6 9.2-7.8 10.6l-1-2.4c2.7-1.1 3.9-3 4-5.8h-5V0zM10.4 0v6.4c0 5.7-2.6 9.2-7.8 10.6l-1-2.4c2.7-1.1 3.9-3 4-5.8H.6V0z"/></svg>',
};

/* ——— темы (цвета — токены Tag/* из макета) ——— */
type Tag = "travel" | "zhkh" | "ill" | "detail" | "food" | "sport" | "night" | "party" | "fauna" | "tragedy" | "transport" | "adv";
const TAG: Record<Tag, [string, string, string]> = {
  travel: ["Путешествие", "#e2f8ff", '<rect x="4.5" y="5" width="7" height="8.5" rx="1"/><path d="M6.5 5V3h3v2M8 7.5v3.5"/>'],
  zhkh: ["ЖКХ", "#f5e8e8", '<rect x="3" y="4" width="10" height="9" rx="1"/><path d="M5.5 4v9M8 4v9M10.5 4v9"/>'],
  ill: ["Болезнь", "#fff1e4", '<path d="M6 2.5h4V6h3.5v4H10v3.5H6V10H2.5V6H6z"/>'],
  detail: ["Деталь", "#f2ecdf", '<path d="M2.5 4h11M3.5 4v2h9V4M5 6v7M8 6v7M11 6v7M3 13h10"/>'],
  food: ["Еда", "#fffedf", '<path d="M3 4c3.4-1.4 6.6-1.4 10 0L8 14z"/><circle cx="7" cy="6.5" r=".8"/><circle cx="9.3" cy="8.8" r=".8"/>'],
  sport: ["Спорт", "#e7fdf2", '<circle cx="8" cy="8" r="5.5"/><path d="M2.5 8h11M8 2.5c-2 2-2 9 0 11M8 2.5c2 2 2 9 0 11"/>'],
  night: ["Ночь", "#f2f5ff", '<path d="M8 2.5c.5 3 2.5 5 5.5 5.5-3 .5-5 2.5-5.5 5.5-.5-3-2.5-5-5.5-5.5 3-.5 5-2.5 5.5-5.5z"/>'],
  party: ["Кутёж", "#fff2fb", '<path d="M3 13l3.2-8.3 5.1 5.1z"/><path d="M9 4.5l1-2M11.5 7l2-1M10.5 3.5L12 5"/>'],
  fauna: ["Фауна", "#f4fbe4", '<circle cx="5" cy="6" r="1.2"/><circle cx="8" cy="4.3" r="1.2"/><circle cx="11" cy="6" r="1.2"/><path d="M5 11.5C5 9.5 6.5 8 8 8s3 1.5 3 3.5c0 1.3-1.3 1.6-3 1.6s-3-.3-3-1.6z"/>'],
  tragedy: ["Трагедия", "#f2f2f2", '<path d="M8 2.5c2.5 3.2 4 5.3 4 7.2a4 4 0 0 1-8 0c0-1.9 1.5-4 4-7.2z"/>'],
  transport: ["Транспорт", "#f1edff", '<path d="M3 10.5l1.3-4a1.5 1.5 0 0 1 1.4-1h4.6a1.5 1.5 0 0 1 1.4 1l1.3 4v2.5H3z"/><circle cx="5.5" cy="10.8" r=".6"/><circle cx="10.5" cy="10.8" r=".6"/>'],
  adv: ["Приключение", "#e4ffdb", '<circle cx="4.5" cy="10.5" r="2.5"/><circle cx="11.5" cy="10.5" r="2.5"/><path d="M4.5 10.5L7 6h4l.5 4.5M6.5 4.5h2"/>'],
};
const ROW: Tag[] = ["travel", "zhkh", "ill", "detail", "food", "sport", "night", "party", "fauna", "tragedy", "transport"];
const chip = (t: Tag, attr = "", tagName = "span") => `<${tagName} class="lv-c-chip" style="--t:${TAG[t][1]}"${attr}>${ic(TAG[t][2], 16)}${TAG[t][0]}</${tagName}>`;
const tags = (ts: readonly Tag[]) => `<div class="lv-c-tags">${ts.map((t) => chip(t)).join("")}</div>`;

/* ——— карточки ленты (тексты и счётчики — из кадра 21061:89858) ——— */
const DESC = "Текст-описание в три строки, далее многоточие. Текст-описание в три строки, далее многоточие. Текст-описание в три строки, далее многоточие. Текст-описание в три строки, далее многоточие. Текст-описание в три строки, далее многоточие. Текст-описание в три строки, далее многоточие.";
type Card = { id: string; title: string; likes: number; cms?: number; tags: Tag[]; shot?: ShotKey; kind: "big" | "right" | "left"; dur?: number; desc?: boolean; tall?: boolean };
const LEFT: Card[] = [
  { id: "date", title: "Куда пригласить на свидание в Москве незнакомку", likes: 12, cms: 201, tags: ["party", "food"], shot: "woman", kind: "left", dur: 210 },
  { id: "love", title: "«И здесь действительно важно доверие». История любви пожарного и журналисточки", likes: 12, cms: 28, tags: ["party", "night"], shot: "love", kind: "big", dur: 240, desc: true },
];
const LEFT_AFTER: Card[] = [
  { id: "squirrel", title: "Московский белкопад", likes: 12, cms: 32, tags: ["fauna", "tragedy"], shot: "squirrel", kind: "big", desc: true },
];
const NEWS: Card[] = [
  { id: "penguin", title: "Маленький пингвиненок не захотел вставать на весы и уморил сеть", likes: 12, tags: ["fauna", "adv", "travel"], kind: "big", dur: 75 },
  { id: "heat", title: "Может ли жаркая погода вызывать агрессию", likes: 12, cms: 62, tags: ["ill", "tragedy"], kind: "big" },
  { id: "theatre", title: "Как в столице прошла акция «Ночь театров»", likes: 12, cms: 12, tags: ["travel", "party"], kind: "big", dur: 160 },
];
const RIGHT: Card[] = [
  { id: "sights", title: "Что посмотреть в Москве за один день", likes: 12, cms: 188, tags: ["travel", "adv"], shot: "sights", kind: "big", tall: true },
  { id: "dang", title: "Загадочная Дангауэровка", likes: 12, cms: 5, tags: ["detail", "travel", "adv"], shot: "dang", kind: "left", dur: 252 },
  { id: "fountain", title: "Укротители воды. Кто управляет фонтанами", likes: 12, cms: 32, tags: ["zhkh"], shot: "fountain", kind: "right" },
];
const SIDE: [ShotKey, string, number, number, Tag[]][] = [
  ["side1", "Что посмотреть в Москве за один день", 12, 12, ["travel", "adv"]],
  ["side2", "«Я совершенно влюбился в эти вывески»", 12, 12, ["detail", "travel"]],
  ["side3", "Весна! Московские улицы — на смену гимнастическому залу", 12, 12, ["sport", "travel"]],
  ["side4", "Москва — родина слонов", 12, 0, ["travel", "fauna"]],
];
const DUR: Record<string, number> = {};
[...LEFT, ...NEWS, ...RIGHT].forEach((c) => { if (c.dur) DUR[c.id] = c.dur; });

/* пример истории для ссылки «Вставить пример» — заголовок взят из макетов профиля */
const SAMPLE = {
  title: "Фотоотчет: тренировки в парках Москвы — доступно и полезно",
  text: "Каждое утро бегаю в парке у дома. Летом там обновили площадку: поставили турники и разметили дорожки. Теперь по выходным тренируемся целой компанией соседей.",
};

const fmtT = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const hhmm = (d: Date) => `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;

const logo = '<span class="lv-c-logo" role="img" aria-label="сообщество"><span aria-hidden="true">с</span><i class="lv-c-oo" aria-hidden="true"><b></b><b></b></i><span aria-hidden="true">бщесmво</span></span>';
const meta = (likes: number, cms?: number, views = true) => `<div class="lv-c-meta"><div><span>${I.like}${likes || ""}</span><span>${I.bubble}${cms ?? ""}</span><span>${I.share}</span></div>${views ? `<span class="lv-c-views">${I.eye}123</span>` : ""}</div>`;
const listen = (id: string) => `<button type="button" class="lv-c-listen" data-listen="${id}"><i class="lv-c-pp">${I.play}</i><span class="lv-c-lt">Прослушать</span><span class="lv-c-bar"><b></b></span></button>`;

function form(): string {
  return `<section class="lv-c-form" data-form>
    <div class="lv-c-form-h"><h1>Рассказать историю</h1><p>Напишите текст на любую интересную вам тему. После модерации история появится в Сообществе и в вашем личном профиле. Пожалуйста, ознакомьтесь с <b>правилами публикации</b>.</p></div>
    <div class="lv-c-inputs">
      <label class="lv-c-label"><span>Заголовок</span><input class="lv-c-field" data-f="title" type="text" maxlength="120" autocomplete="off"></label>
      <label class="lv-c-label"><span>Ваш текст</span><textarea class="lv-c-field" data-f="text" placeholder="О чем вы хотите рассказать"></textarea></label>
      <div class="lv-c-attach"><button type="button" class="lv-c-link lv-c-sample" data-sample>Вставить пример</button><span class="lv-c-link">${I.clip}Прикрепить изображение</span></div>
    </div>
    <label class="lv-c-label"><span>Ваша электронная почта</span><input class="lv-c-field" type="email" value="nekraSova@gmail.com" autocomplete="off"></label>
    <div class="lv-c-send-row"><button type="button" class="lv-c-btn lv-c-send" data-send disabled>Отправить</button>
    <p class="lv-c-terms">Нажимая «Отправить», вы принимаете <u>условия соглашения</u> и <u>политику конфиденциальности</u></p></div>
  </section>`;
}

const proto: LiveProto = {
  design: { w: W },
  mount(root, ctx: LiveCtx) {
    const B = ctx.base;
    const ph = (key: ShotKey, w: number, h: number) => sprite(B, key, w, h);
    const ava = (key: ShotKey, size: number, cls = "lv-c-ava") => `<span class="${cls}" style="width:${size}px;height:${size}px;${ph(key, size, size)}"></span>`;

    function card(c: Card): string {
      const big = c.kind === "big";
      const pw = big ? 612 : 266;
      const phH = c.tall ? 346 : big ? 240 : 404;
      const photo = c.shot ? `<div class="lv-c-photo" style="height:${phH}px;${ph(c.shot, pw, phH)}"></div>` : "";
      const open = c.id === "dang";
      const body = `<div class="lv-c-body"><div class="lv-c-b1"><div class="lv-c-row1">${meta(c.likes, c.cms)}${c.dur ? listen(c.id) : ""}</div>
        <div class="lv-c-ht"><h3 class="lv-c-title">${c.title}</h3>${c.desc ? `<p class="lv-c-desc">${DESC}</p>` : ""}</div></div>
        <div class="lv-c-b2">${tags(c.tags)}<span class="lv-c-go">${I.arrow}</span></div></div>`;
      const cls = big ? "lv-c-big" : `lv-c-split${c.kind === "left" ? " is-left" : ""}`;
      return `<article class="lv-c-card ${cls}"${open ? ` data-open="${c.id}"` : ""} data-tags="${c.tags.join(" ")}">${photo}${body}</article>`;
    }
    const item = (c: Card) => `<article class="lv-c-item" data-tags="${c.tags.join(" ")}"><div class="lv-c-b1"><div class="lv-c-row1">${meta(c.likes, c.cms)}${c.dur ? listen(c.id) : ""}</div><h3 class="lv-c-title">${c.title}</h3></div><div class="lv-c-b2">${tags(c.tags)}<span class="lv-c-go">${I.arrow}</span></div></article>`;
    const cross = ([shot, title, likes, cms, ts]: (typeof SIDE)[number]) => `<article class="lv-c-cross"><div class="lv-c-photo" style="height:226px;${ph(shot, 403, 226)}"></div><div class="lv-c-body"><div class="lv-c-b1">${meta(likes, cms || undefined, cms > 0)}<h3 class="lv-c-title">${title}</h3></div>${tags(ts)}</div></article>`;

    /* шапка: «полная» (лента, история, профиль) и короткая (страница формы), как в кадрах */
    const pill = '<button type="button" class="lv-c-pill" data-write>Рассказать историю</button>';
    const tools = (full: boolean) => `<div class="lv-c-tools">${full ? `<span class="lv-c-ico lv-c-opt">${I.search}</span><span class="lv-c-ico lv-c-opt">${I.burger}</span>` : ""}
      <span class="lv-c-promo lv-c-opt">${I.shield}<i></i></span><span class="lv-c-ico lv-c-opt">${I.bell}</span>${pill}
      <button type="button" class="lv-c-me" data-avatar aria-label="Профиль" style="${ph("me", 42, 42)}"></button></div>`;
    const headFull = (active: boolean) => `<header class="lv-c-head"><div class="lv-c-left">${logo}<nav class="lv-c-nav">
      <button type="button" data-nav="feed"${active ? ' class="is-on"' : ""}>Лента${I.down}</button><span class="lv-c-opt2">Группы и события${I.down}</span></nav></div>${tools(true)}</header>`;
    const headForm = `<header class="lv-c-head"><div class="lv-c-left">${logo}<nav class="lv-c-nav">
      <button type="button" data-nav="feed">Лента${I.down}</button><span class="lv-c-opt2">О проекте</span><span class="lv-c-opt2">Обратная связь</span></nav></div>${tools(false)}</header>`;

    const footer = `<footer class="lv-c-footer"><div>${logo}<nav class="lv-c-fnav"><button type="button" data-nav="feed">Лента</button><span>О проекте</span><span>Группы и события</span><span>Обратная связь</span></nav></div>
      <div><small><span>Соглашение о пользовании информационными системами и ресурсами города Москвы.</span><span>Политика в отношении обработки персональных данных.</span></small><small>©&nbsp; Проект Сообщество, 2023</small></div></footer>`;

    const cm = (shot: ShotKey, who: string, badges: string, time: string, text: string, likes: number, reply = false) => `<div class="lv-c-cm${reply ? " is-reply" : ""}">
      <div class="lv-c-cm-h"><div><span class="lv-c-user">${ava(shot, 42)}<span class="lv-c-cm-n"><b>${who}</b>${badges}</span></span><time>${time}</time></div><span class="lv-c-dots">${I.dots}</span></div>
      <p class="lv-c-cm-t">${text}</p>
      <div class="lv-c-cm-a"><span>Ответить</span><span><span>${I.like}${likes || ""}</span><span>${I.dislike}</span></span></div></div>`;
    const karma = (n: string, neg = false) => `<span class="lv-c-karma${neg ? " is-neg" : ""}">${n}</span>`;
    const award = (t: string) => `<span class="lv-c-award">${t}</span>`;
    const qm = (svg: string) => `<div class="lv-c-qm">${svg}</div>`;

    const act = (chipHtml: string, title: string, time: string, icon = I.ray, extra = "") => `<div class="lv-c-act${extra}"><span class="lv-c-act-i">${icon}</span><div>${chipHtml}<p class="lv-c-act-t">${title}</p><time>${time}</time></div></div>`;
    const rays = (t: string) => `<span class="lv-c-ach">${t}</span>`;
    const subItem = `<div class="lv-c-sub"><div><span class="lv-c-mark">Пометка</span><span class="lv-c-sub-u">${ava("sub", 32)}Имя Фамилия</span></div><span class="lv-c-dots">${I.dots}</span></div>`;
    const recent = (kind: string, t: string) => `<div class="lv-c-recent"><span class="lv-c-mark">${kind}</span><p>${t}</p></div>`;

    root.innerHTML = `<div class="lv-community${ctx.calm ? " is-calm" : ""}">
      <div class="lv-c-heads" data-head>
        <div data-head-for="feed">${headFull(true)}</div>
        <div data-head-for="story" hidden>${headFull(false)}</div>
        <div data-head-for="form" hidden>${headForm}</div>
        <div data-head-for="profile" hidden>${headFull(false)}</div>
      </div>
      <div class="lv-c-scroll" data-scroll>

        <div class="lv-c-page" data-page="feed"><div class="lv-c-wrap">
          <div class="lv-c-slider"><div class="lv-c-chips"><button type="button" class="lv-c-chip is-on" data-chip="all">Все</button>${ROW.map((t) => chip(t, ` data-chip="${t}"`, "button")).join("")}</div><span class="lv-c-round">${I.down}</span></div>
          <div class="lv-c-banner"><div class="lv-c-photo" role="img" aria-label="Где купить подарки на Новый год. Подборка новогодних ярмарок" style="height:433px;${ph("banner", 1240, 433)}"></div>
            <span class="lv-c-arr is-l">${I.left}</span><span class="lv-c-arr is-r">${I.right}</span></div>
          <div class="lv-c-pag"><i class="is-on"></i><i></i><i></i><i></i><i></i></div>
          <div class="lv-c-feed">
            <div class="lv-c-col">${LEFT.map(card).join("")}
              <article class="lv-c-card lv-c-big lv-c-q"><div class="lv-c-photo" style="height:240px;${ph("move", 612, 240)}"></div><div class="lv-c-body"><h3 class="lv-c-title">Недавно перебрались в Москву? Расскажите, как проходил переезд</h3><button type="button" class="lv-c-btn" data-write>Рассказать историю</button></div></article>
              ${LEFT_AFTER.map(card).join("")}</div>
            <div class="lv-c-col">
              <section class="lv-c-news"><div class="lv-c-news-h"><h2>Новости</h2><span>Все${I.down}</span></div>
                ${NEWS.map(item).join("")}
                <div class="lv-c-pager"><span class="lv-c-btn is-off">Назад</span><span class="lv-c-btn">Показать ещё</span></div></section>
              ${RIGHT.map(card).join("")}
            </div>
          </div></div>${footer}</div>

        <div class="lv-c-page" data-page="story" hidden><div class="lv-c-wrap">
          <div class="lv-c-art">
            <article class="lv-c-story">
              <div class="lv-c-story-top">${tags(["detail", "travel", "adv"])}<span class="lv-c-date">17.04.2024</span></div>
              <div class="lv-c-block">
                <div class="lv-c-head2">${listen("dang")}<h1>Загадочная Дангауэровка</h1></div>
                ${meta(12, 5)}
                <div class="lv-c-fig"><div class="lv-c-photo" style="height:360px;${ph("hero", 757, 360)}"></div><p class="lv-c-cap">Фото: Соня Лесная</p></div>
                <div class="lv-c-by"><span class="lv-c-user">${ava("author", 42)}<span class="lv-c-byn"><b>Екатерина Иосифова</b><span>редактор</span></span></span>
                  <span class="lv-c-co"><span class="lv-c-photo" style="width:80px;height:32px;${ph("coauthors", 80, 32)}"></span><b>и еще 3 автора</b></span></div>
                <p class="lv-c-lead">По центру Москвы ходит автобус М6 с конечной остановкой «Дангауэровка». Надежда Владимировна Фролова родилась в этом квартале и всю жизнь проработала в местной школе. Там же, в Дангауэровке, она встретила своего мужа. Мы поговорили с Надеждой о ее детстве и юности, а историк архитектуры Николай Васильев рассказал, какие интересные дома есть в этом районе.</p>
                <div class="lv-c-paras"><p>Николая я замечаю издалека: он идет быстрым широким шагом, из-под фетровой шляпы развеваются длинные седые волосы. Мы встречаемся у кинотеатра «Факел» на Авиамоторной. Николай громко здоровается — он часто водит экскурсии, и голос у него поставлен. Дождавшись фотографа Соню, мы отправляемся в Дангауэровку, о которой я часто слышала, но в которой никогда не была.</p><p>По пути Николай рассказывает об истории места.</p></div>
              </div>
              <div class="lv-c-quote">${qm(I.qOpen)}<p>Сейчас Дангауэровкой называется конечная автобуса М6, а до революции здесь был механический завод немецких коммерсантов А. К. Дангауэра и В. В. Кайзера. Район Лефортово находился тогда за границей Москвы: земля за железной дорогой, в «Ржавом поясе», стоила дешево, поэтому выбрали именно это место.<br><br>В годы Первой мировой войны завод Дангауэра и Кайзера был национализирован и переименован сперва в «Котлоаппарат», а затем в «Компрессор», но в народном сознании район остался Дангауэровкой. Слово сложное, поэтому у москвичей получалось что-то вроде «Дангаровка».</p>${qm(I.qClose)}</div>
              <div class="lv-c-photo" role="img" aria-label="Видео" style="height:445px;${ph("video", 757, 445)}"></div>
              <div class="lv-c-paras"><p class="lv-c-subt">Свой маленький мир</p><p>Первые дома конструктивистского квартала находятся у шестого выхода станции «Авиамоторная». Здания стоят друг за другом «строчно» с севера на юг, перпендикулярно шоссе Энтузиастов. Изначально их было шесть, но на месте одного из них сейчас спортивная площадка. Фотограф Соня просит Николая остановиться, чтобы сделать портрет на фоне первого дома. Николай встает на указанное место, но рассказ не прерывает.</p></div>
              <div class="lv-c-quote">${qm(I.qOpen)}<p>Первые дома — это практическая архитектура, чистая прагматика. Здесь вы не увидите любимых конструктивистами ленточных окон и балконов: железобетон был в дефиците, делали деревянные перекрытия. Три из шести корпусов сперва даже не оштукатурили — денег на это не хватило. Зато планировку секций сразу продумали хорошо. Квартиры все двусторонние: окна кухонь выходят на восток, а комнат — на запад, чтобы по утрам солнце освещало кухню, а вечером — жилую зону. Тогда же в стене между кухней и ванной впервые появилось окошко. В стране развернулась масштабная борьба с туберкулезом, а поскольку туберкулезная палочка размножается в темной влажной среде, для профилактики заболевания придумали такую систему вентиляции. Потом она появится во всех хрущевках.</p>${qm(I.qClose)}</div>
              <div class="lv-c-stat"><p>Как прошла тренировка:</p><div><span>Время</span><span>Пульс</span><span>Потрачено</span></div><div><span>60 минут</span><span>129 ударов в минуту</span><span>463 ккал</span></div></div>
              <h2 class="lv-c-cmh">Комментарии 5</h2>
              <div class="lv-c-my"><div class="lv-c-my-in"><p>Ваш комментарий</p><span>${I.image}</span></div><span class="lv-c-btn is-dis">Отправить</span></div>
              <div class="lv-c-cms">
                <div class="lv-c-cmlist">
                  ${cm("cm1", "Венди Дарлинг", I.mask + karma("141") + award("Экстраверт"), "19.04, 18:41", "Было очень интересно почитать статью! Не знала, что в Москве у нас есть такая необычная архитектура.", 4)}
                  <div class="lv-c-cmlist is-thread">
                    ${cm("cm2", "Михаил Трофимов", karma("86") + award("Мастер пера"), "19.04, 11:20", "Классная тема про окошко в ванной. Всегда интересовало, откуда это пошло.", 0)}
                    ${cm("cm3", "Ирина Чехова", karma("-9", true), "19.04, 13:45", '<b class="lv-c-mention">Михаил,</b> я думала, это в хрущевках появилось изначально', 5, true)}
                    <span class="lv-c-more">Еще 3 ответа</span>
                  </div>
                </div>
                <span class="lv-c-opinions">Еще 2 мнения</span>
              </div>
            </article>
            <aside class="lv-c-side">${SIDE.map(cross).join("")}</aside>
          </div>
          <div class="lv-c-photo lv-c-wide" role="img" aria-label="Новый год с Миллионом призов" style="height:433px;${ph("bannerNY", 1240, 433)}"></div>
        </div>${footer}</div>

        <div class="lv-c-page" data-page="form" hidden><div class="lv-c-wrap lv-c-formwrap">${form()}</div>${footer}</div>

        <div class="lv-c-page" data-page="profile" hidden><div class="lv-c-wrap"><div class="lv-c-prof">
          <div class="lv-c-pcol">
            <section class="lv-c-me-card">
              <div class="lv-c-me-top"><div>
                <div class="lv-c-me-name">${ava("me64", 64)}<h2>Юлия Некрасова</h2>${award("Душа компании")}</div>
                <div class="lv-c-info"><p class="lv-c-role">Разработчик из Москвы</p>
                  <div class="lv-c-stats"><span class="lv-c-karma lv-c-karma-l"><span>Карма</span> 816</span><span class="lv-c-rating">${I.ray}Рейтинг 1782</span><span class="lv-c-subs">${I.persons}132 подписчика</span></div>
                  <p class="lv-c-mail">nekraSova@gmail.com</p></div></div>
                <span class="lv-c-gear">${I.gear}</span></div>
              <div class="lv-c-tabs"><div class="lv-c-tab is-on"><span>Активность</span><i></i></div><div class="lv-c-tab"><span><b data-stories-n>4</b>Истории</span><i></i></div><div class="lv-c-tab"><span><b>12</b>Комментарии</span><i></i></div><div class="lv-c-tab"><span>Награды</span><i></i></div><div class="lv-c-tab"><span>Группы и события</span><i></i></div></div>
            </section>
            <div class="lv-c-acts">
              <section class="lv-c-day"><p>Сегодня</p><div class="lv-c-day-l" data-today>
                ${act(rays("+2 лучика"), "Ответ на комментарий", "14:29")}${act(rays("+5 лучиков"), "Запуск подкаста", "11:15")}</div></section>
              <section class="lv-c-day"><p>24 июня</p><div class="lv-c-day-l">
                ${act('<span class="lv-c-ach is-pts">+5 баллов</span>', "Публикация истории", "8:54", I.story)}${act(rays("+3 лучика"), "Запуск видео", "8:52")}${act(rays("+3 лучика"), "Комментарий", "8:34")}</div></section>
              <section class="lv-c-day"><p>21 июня</p><div class="lv-c-day-l">
                ${act(rays("+1 лучик"), "Лайк", "21:15")}${act(rays("+5 лучиков"), "Открытие статьи на сайте", "21:10")}</div></section>
            </div>
          </div>
          <aside class="lv-c-pside">
            <section class="lv-c-box"><h3>Подписки</h3><div class="lv-c-subs-l">${subItem.repeat(4)}</div><span class="lv-c-btn is-light">Смотреть все</span></section>
            <section class="lv-c-box"><h3>Недавние</h3><div class="lv-c-recent-l">${recent("История", "Куда пригласить на свидание в Москве незнакомку")}${recent("Подкаст", "Не могу понять")}${recent("История", "Что посмотреть в Москве за один день")}<i></i></div><span class="lv-c-btn is-light">${I.dice}Случайная история</span></section>
            <div class="lv-c-photo" role="img" aria-label="Главные культурные события Москвы" style="height:371px;${ph("promoCulture", 403, 371)}"></div>
            <div class="lv-c-photo" role="img" aria-label="Новый год с Миллионом призов" style="height:370px;${ph("promoNY", 403, 370)}"></div>
          </aside>
        </div></div>${footer}</div>
      </div>
    </div>`;

    const $ = <E extends Element = HTMLElement>(s: string, r: ParentNode = root) => r.querySelector<E>(s) as E;
    const $$ = <E extends Element = HTMLElement>(s: string, r: ParentNode = root) => [...r.querySelectorAll<E>(s)];
    const app = $(".lv-community");
    const head = $("[data-head]");
    const scroller = $("[data-scroll]");
    const pages = { feed: $("[data-page=feed]"), story: $("[data-page=story]"), form: $("[data-page=form]"), profile: $("[data-page=profile]") };
    type Page = keyof typeof pages;
    const dangCard = $(`[data-page=feed] [data-open=dang]`);
    const allChip = $("[data-chip=all]");
    const theForm = $("[data-form]");
    const titleF = $<HTMLInputElement>("[data-f=title]", theForm);
    const textF = $<HTMLTextAreaElement>("[data-f=text]", theForm);
    const sendB = $<HTMLButtonElement>("[data-send]", theForm);
    const today = $("[data-today]");
    const storiesN = $("[data-stories-n]");

    /* ——— состояние ——— */
    let step = 0;
    let page: Page = "feed";
    let sending = false;
    const audio = new Map<string, { t: number; on: boolean }>();
    const timers = new Set<number>();
    let tick = 0;

    const later = (fn: () => void, ms: number) => {
      const id = window.setTimeout(() => { timers.delete(id); fn(); }, ms);
      timers.add(id);
    };
    const clearTimers = () => { timers.forEach((id) => clearTimeout(id)); timers.clear(); };
    function advance(k: number) { if (k > step) { step = k; ctx.go(k); } }
    const curHead = () => $(`[data-head-for="${page}"]`);

    /* ——— телефон: окно движка листается вбок (.pt-screen.is-pan) — шапка стоит на месте, статья, форма и профиль
       сужаются до видимой ширины ——— */
    const scr = root.parentElement;
    function syncPan() {
      const pan = !!scr && scr.classList.contains("is-pan");
      const z = parseFloat(root.style.zoom) || 1;
      const vis = pan && scr ? Math.min(W, scr.clientWidth / z) : W;
      app.classList.toggle("is-pan", pan);
      app.classList.toggle("is-tight", pan && vis < 700);
      if (!pan || !scr) { head.style.width = ""; head.style.transform = ""; app.style.removeProperty("--visw"); return; }
      app.style.setProperty("--visw", `${vis}px`);
      head.style.width = `${vis}px`;
      head.style.transform = `translateX(${scr.scrollLeft / z}px)`;
    }
    const panRO = scr ? new ResizeObserver(syncPan) : null;
    if (scr) { scr.addEventListener("scroll", syncPan, { passive: true }); panRO!.observe(scr); }
    function panTo(el: HTMLElement | null, smooth: boolean) {
      if (!scr || !scr.classList.contains("is-pan")) return;
      if (!el || head.contains(el)) { scr.scrollTo({ left: 0, behavior: "auto" }); return; }
      const a = el.getBoundingClientRect();
      const b = scr.getBoundingClientRect();
      if (a.left >= b.left + 6 && a.right <= b.right - 6) return;
      const left = a.width > b.width ? scr.scrollLeft + a.left - b.left - 8 : scr.scrollLeft + (a.left + a.right) / 2 - (b.left + b.right) / 2;
      scr.scrollTo({ left, behavior: smooth && !ctx.calm ? "smooth" : "auto" });
    }

    function topIn(el: HTMLElement) {
      let y = 0;
      let n: HTMLElement | null = el;
      while (n && n !== scroller) { y += n.offsetTop; n = n.offsetParent as HTMLElement | null; }
      return y;
    }
    function reveal(el: HTMLElement, smooth: boolean) {
      const top = topIn(el);
      const bottom = top + el.offsetHeight;
      const vh = scroller.clientHeight;
      const st = scroller.scrollTop;
      if (top >= st + 8 && bottom <= st + vh - 8) return;
      const to = el.offsetHeight > vh - 40 || top < st ? top - 24 : bottom - vh + 28;
      scroller.scrollTo({ top: Math.max(0, to), behavior: smooth && !ctx.calm ? "smooth" : "auto" });
    }

    /* ——— куда нажать ——— */
    let lastHint: HTMLElement | null = null;
    function hint(scroll = true) {
      $$(".pt-hint").forEach((el) => el.classList.remove("pt-hint"));
      let el: HTMLElement | null = null;
      if (step === 0) el = page === "feed" ? (dangCard.hidden ? allChip : dangCard) : $("[data-nav=feed]", curHead());
      else if (step === 1) el = $("[data-write]", curHead());
      else if (step === 2 && !sending) {
        if (page !== "form") el = $("[data-write]", curHead());
        else el = !titleF.value.trim() ? titleF : !textF.value.trim() ? textF : sendB;
      }
      const moved = el !== lastHint;
      lastHint = el;
      if (!el) return;
      el.classList.add("pt-hint");
      if (scroll && moved && scroller.contains(el)) reveal(el, true);
      if (moved || !scroll) panTo(el, scroll);
    }

    /* ——— страницы ——— */
    function go(p: Page, anim = true) {
      if (p !== page) {
        pages[page].hidden = true;
        pages[p].hidden = false;
        $$("[data-head-for]").forEach((h) => { h.hidden = h.dataset.headFor !== p; });
        if (anim && !ctx.calm) {
          pages[p].classList.remove("is-in");
          void pages[p].offsetWidth;
          pages[p].classList.add("is-in");
        }
        page = p;
      }
      scroller.scrollTop = 0;
      if (scr?.classList.contains("is-pan")) scr.scrollTo({ left: 0, behavior: "auto" });
    }

    /* ——— фильтр по темам ——— */
    function setFilter(f: Tag | "all") {
      $$("[data-chip]").forEach((c) => c.classList.toggle("is-on", c.dataset.chip === f));
      $$<HTMLElement>("[data-page=feed] [data-tags]").forEach((el) => {
        const show = f === "all" || el.dataset.tags!.split(" ").includes(f);
        const was = !el.hidden;
        el.hidden = !show;
        if (show && !was && !ctx.calm) { el.classList.remove("is-in"); void el.offsetWidth; el.classList.add("is-in"); }
      });
      $(".lv-c-q").hidden = f !== "all";
      const news = $(".lv-c-news");
      news.hidden = !news.querySelector(".lv-c-item:not([hidden])");
    }

    /* ——— плеер «Прослушать» (без звука: время и полоска) ——— */
    function paintListen(id: string) {
      const a = audio.get(id);
      $$(`[data-listen="${id}"]`).forEach((b) => {
        const live = !!a && (a.on || a.t > 0);
        b.classList.toggle("is-on", !!a?.on);
        b.classList.toggle("is-live", live);
        b.querySelector(".lv-c-lt")!.textContent = live ? `${fmtT(a!.t)} / ${fmtT(DUR[id])}` : "Прослушать";
        (b.querySelector(".lv-c-bar b") as HTMLElement).style.width = a ? `${(a.t / DUR[id]) * 100}%` : "0";
      });
    }
    function toggleListen(id: string) {
      const a = audio.get(id) ?? { t: 0, on: false };
      audio.forEach((v, k) => { if (k !== id && v.on) { v.on = false; paintListen(k); } });
      a.on = !a.on;
      audio.set(id, a);
      paintListen(id);
      if (a.on && !tick) {
        tick = window.setInterval(() => {
          let any = false;
          audio.forEach((v, k) => {
            if (!v.on) return;
            any = true;
            v.t += 0.25;
            if (v.t >= DUR[k]) { v.t = 0; v.on = false; }
            paintListen(k);
          });
          if (!any) { clearInterval(tick); tick = 0; }
        }, 250);
      }
    }
    function stopAudio() {
      clearInterval(tick); tick = 0;
      const ids = [...audio.keys()];
      audio.clear();
      ids.forEach(paintListen);
    }

    /* ——— форма ——— */
    const syncForm = () => { sendB.disabled = sending || !titleF.value.trim() || !textF.value.trim(); };
    function resetForm() { titleF.value = ""; textF.value = ""; syncForm(); }
    function typeInto(el: HTMLInputElement | HTMLTextAreaElement, str: string, ms: number, done: () => void) {
      if (ctx.calm) { el.value = str; syncForm(); done(); return; }
      const t0 = performance.now();
      const run = () => {
        const k = Math.min(1, (performance.now() - t0) / ms);
        el.value = str.slice(0, Math.ceil(str.length * k));
        syncForm();
        if (k < 1) later(run, 16); else done();
      };
      run();
    }
    function sample() {
      titleF.value = ""; textF.value = "";
      typeInto(titleF, SAMPLE.title, 450, () => { hint(); typeInto(textF, SAMPLE.text, 750, () => hint()); });
    }

    /* новая строка активности: сначала «На модерации», после проверки — «+5 баллов», как у «Публикации истории» в кадре */
    function addActivity(ok: boolean, fresh: boolean) {
      today.querySelector("[data-mine]")?.remove();
      const chipHtml = ok ? '<span class="lv-c-ach is-pts">+5 баллов</span>' : '<span class="lv-c-ach is-wait">На модерации</span>';
      today.insertAdjacentHTML("afterbegin", act(chipHtml, "Публикация истории", hhmm(new Date()), I.story, fresh && !ctx.calm ? " is-in" : ""));
      (today.firstElementChild as HTMLElement).dataset.mine = "";
      storiesN.textContent = ok ? "5" : "4";
    }
    function publish() {
      const chipEl = today.querySelector("[data-mine] .lv-c-ach");
      if (chipEl) { chipEl.className = "lv-c-ach is-pts"; chipEl.textContent = "+5 баллов"; }
      storiesN.textContent = "5";
      sending = false;
      syncForm();
      advance(3);
      hint();
    }
    function submit() {
      if (!titleF.value.trim() || !textF.value.trim() || sending) return;
      sending = true;
      resetForm();
      go("profile");
      addActivity(false, true);
      hint();
      if (ctx.calm) publish();
      else later(publish, 1500);
    }

    function openStory() { go("story"); advance(1); hint(); }
    function openForm() { go("form"); advance(2); hint(); }

    /* ——— события ——— */
    const onClick = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      const hit = (s: string) => el.closest<HTMLElement>(s);
      let b: HTMLElement | null;
      if ((b = hit("[data-listen]"))) return toggleListen(b.dataset.listen!);
      if ((b = hit("[data-chip]"))) { setFilter(b.dataset.chip as Tag | "all"); hint(); return; }
      if (hit("[data-sample]")) return sample();
      if (hit("[data-send]")) return submit();
      if (hit("[data-write]")) return openForm();
      if (hit("[data-avatar]")) { go("profile"); hint(); return; }
      if (hit("[data-nav=feed]")) { go("feed"); hint(); return; }
      if (hit("[data-open]")) return openStory();
    };
    const onInput = (e: Event) => { if ((e.target as HTMLElement).closest("[data-form]")) { syncForm(); hint(); } };
    app.addEventListener("click", onClick);
    app.addEventListener("input", onInput);

    /* ——— состояние в начале шага k ——— */
    function show(k: number, smooth = true) {
      clearTimers();
      stopAudio();
      sending = false;
      step = k;
      resetForm();
      today.querySelector("[data-mine]")?.remove();
      storiesN.textContent = "4";
      if (k >= 3) addActivity(true, false);
      setFilter("all");
      syncPan();
      go(k === 0 ? "feed" : k === 1 ? "story" : k === 2 ? "form" : "profile", smooth);
      lastHint = null;
      hint(false);
      if (k === 0) reveal(dangCard, smooth);
    }
    show(0, false);

    return {
      show: (k) => show(k),
      destroy() {
        clearTimers();
        clearInterval(tick);
        app.removeEventListener("click", onClick);
        app.removeEventListener("input", onInput);
        scr?.removeEventListener("scroll", syncPan);
        panRO?.disconnect();
        root.innerHTML = "";
      },
    };
  },
};
export default proto;
