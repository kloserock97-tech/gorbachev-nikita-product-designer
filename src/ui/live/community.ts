/* v116: живой прототип «Сообщества» (stories.mos.ru) — путь читателя, который становится автором.
   Лента → «Загадочная Дангауэровка» → профиль (аватар в шапке) → форма «Расскажите свою историю» → история
   на модерации → опубликована. Состав и тексты экранов — из кадров Figma (2103:12251, 2109:18727, 2202:7956,
   2128:33091); живое сверх макета — только то, что нужно пути: темы фильтруют ленту, «Прослушать» включает плеер
   (без звука), «Прикрепить изображение» добавляет фото и ссылка «Вставить пример», чтобы не печатать в окошке.
   Фото — участки макетов proto-feed/proto-article/proto-published как CSS-спрайты, отдельных файлов нет.
   Тексты продукта русские в обоих языках. */
import type { LiveCtx, LiveProto } from "./types";
import "./community.css";

const W = 1280;

/* ——— спрайты: участок [x, y, w, h] целой страницы макета (1440 px) ——— */
type Sheet = "feed" | "art" | "pub";
const SHEET: Record<Sheet, [string, number]> = {
  feed: ["proto-feed.webp", 1440],
  art: ["proto-article.webp", 1440],
  pub: ["proto-published.webp", 1440],
};
const SHOT = {
  spring: ["feed", 100, 158, 612, 240],
  elephant: ["feed", 447, 650, 265, 403],
  love: ["feed", 100, 1054, 612, 239],
  woman: ["feed", 100, 1538, 266, 402],
  sightsVideo: ["feed", 100, 1940, 612, 345],
  dang: ["feed", 729, 962, 266, 403],
  fountain: ["feed", 1076, 1888, 265, 402],
  squirrel: ["feed", 729, 2292, 612, 240],
  cathedral: ["art", 937, 106, 403, 225],
  signs: ["art", 937, 520, 403, 225],
  dangBig: ["art", 132, 334, 757, 359],
  walk: ["art", 132, 1406, 757, 384],
  park: ["pub", 611, 661, 290, 113],
} as const satisfies Record<string, readonly [Sheet, number, number, number, number]>;
type ShotKey = keyof typeof SHOT;

/** фон-спрайт «как cover»: участок макета вписывается в блок W×H с обрезкой по центру */
function sprite(base: string, key: ShotKey, w: number, h: number): string {
  const [sheet, x0, y0, w0, h0] = SHOT[key];
  const [file, IW] = SHEET[sheet];
  const pad = 1; // край участка — мимо линий макета
  const x = x0 + pad, y = y0 + pad, rw = w0 - pad * 2, rh = h0 - pad * 2;
  const s = Math.max(w / rw, h / rh);
  const px = -x * s + (w - rw * s) / 2;
  const py = -y * s + (h - rh * s) / 2;
  return `background-image:url('${base}cases/community/${file}');background-size:${(IW * s).toFixed(1)}px auto;background-position:${px.toFixed(1)}px ${py.toFixed(1)}px`;
}

/* ——— иконки (свои, по виду макета: контур, 16/20/24) ——— */
const ic = (d: string, vb = 20) => `<svg viewBox="0 0 ${vb} ${vb}" aria-hidden="true">${d}</svg>`;
const I = {
  bubble: ic('<path d="M3 4.5h14v9.5H9.5L6 17v-3H3z"/>'),
  share: ic('<circle cx="5.5" cy="10" r="2"/><circle cx="14.5" cy="5" r="2"/><circle cx="14.5" cy="15" r="2"/><path d="M7.3 9l5.4-3M7.3 11l5.4 3"/>'),
  play: ic('<path class="is-play" d="M11 9.2v13.6L22.5 16z"/><path class="is-pause" d="M10.5 9h3.6v14h-3.6zM17.9 9h3.6v14h-3.6z"/>', 32),
  arrow: ic('<path d="M4 12h16M14 6l6 6-6 6"/>', 24),
  promo: ic('<path d="M6 4.5h12v10.2c0 2.6-2.7 4.4-6 5.3-3.3-.9-6-2.7-6-5.3z"/>', 24),
  down: ic('<path d="M5 7.5l5 5 5-5"/>'),
  clip: ic('<path d="M14.5 7.5l-5.8 5.8a2 2 0 0 1-2.8-2.8l6.2-6.2a3.2 3.2 0 0 1 4.5 4.5l-6.4 6.4a4.4 4.4 0 0 1-6.2-6.2L9.6 3.4"/>'),
  x: ic('<path d="M5 5l10 10M15 5L5 15"/>'),
  edit: ic('<path d="M5.5 3.5h9v13l-4.5-3-4.5 3z"/>'),
  up: ic('<path d="M5 8.5v6.5H3V8.5zM5 8.5l3-5.2c1.1 0 1.8.9 1.5 2L9 7.5h4.6a1.4 1.4 0 0 1 1.4 1.6l-.9 5a1.6 1.6 0 0 1-1.6 1.3H5"/>', 16),
  dn: ic('<path d="M5 7.5V1H3v6.5zM5 7.5l3 5.2c1.1 0 1.8-.9 1.5-2L9 8.5h4.6A1.4 1.4 0 0 0 15 6.9l-.9-5A1.6 1.6 0 0 0 12.5.6H5"/>', 16),
  dots: ic('<circle cx="4.5" cy="10" r="1.5"/><circle cx="10" cy="10" r="1.5"/><circle cx="15.5" cy="10" r="1.5"/>'),
  qOpen: '<svg viewBox="0 0 24 17" aria-hidden="true"><path d="M0 17V10.6C0 4.9 2.6 1.4 7.8 0l1 2.4C6.1 3.5 4.9 5.4 4.8 8.2H9.8V17zm13.6 0V10.6c0-5.7 2.6-9.2 7.8-10.6l1 2.4c-2.7 1.1-3.9 3-4 5.8h5V17z"/></svg>',
  qClose: '<svg viewBox="0 0 24 17" aria-hidden="true"><path d="M24 0v6.4c0 5.7-2.6 9.2-7.8 10.6l-1-2.4c2.7-1.1 3.9-3 4-5.8h-5V0zM10.4 0v6.4c0 5.7-2.6 9.2-7.8 10.6l-1-2.4c2.7-1.1 3.9-3 4-5.8H.6V0z"/></svg>',
  vplay: ic('<path class="is-fill" d="M11 9v14l11.5-7z"/>', 32),
  mute: ic('<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4zM16 9.5l5 5M21 9.5l-5 5"/>', 24),
  gear: ic('<circle cx="12" cy="12" r="3"/><path d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6 6l1.6 1.6M16.4 16.4L18 18M6 18l1.6-1.6M16.4 7.6L18 6"/>', 24),
  full: ic('<path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"/>', 24),
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

/* ——— карточки ленты (тексты — из макета) ——— */
type Card = { id: string; title: string; n: number; tags: Tag[]; shot?: ShotKey; kind: "big" | "right" | "left" | "video"; dur?: number };
const LEFT: Card[] = [
  { id: "spring", title: "Весна! Московские улицы — на смену гимнастическому залу", n: 28, tags: ["sport", "travel"], shot: "spring", kind: "big", dur: 185 },
  { id: "elephant", title: "Москва — родина слонов", n: 144, tags: ["travel", "fauna"], shot: "elephant", kind: "right", dur: 140 },
  { id: "love", title: "«И здесь действительно важно доверие». История любви пожарного и журналисточки", n: 109, tags: ["party", "night"], shot: "love", kind: "big" },
  { id: "date", title: "Куда пригласить на свидание в Москве незнакомку", n: 201, tags: ["party", "food"], shot: "woman", kind: "left", dur: 210 },
  { id: "sights", title: "Что посмотреть в Москве за один день", n: 188, tags: ["travel", "adv"], shot: "sightsVideo", kind: "video" },
];
const NEWS: Card[] = [
  { id: "penguin", title: "Маленький пингвиненок не захотел вставать на весы и уморил сеть", n: 12, tags: ["fauna", "adv", "travel"], kind: "big", dur: 75 },
  { id: "heat", title: "Может ли жаркая погода вызывать агрессию", n: 62, tags: ["ill", "tragedy"], kind: "big" },
  { id: "theatre", title: "Как в столице прошла акция «Ночь театров»", n: 12, tags: ["night", "party"], kind: "big", dur: 160 },
];
const DANG: Card = { id: "dang", title: "Загадочная Дангауэровка", n: 5, tags: ["detail", "travel", "adv"], shot: "dang", kind: "left", dur: 252 };
const RIGHT_AFTER: Card[] = [
  { id: "fountain", title: "Укротители воды. Кто управляет фонтанами", n: 16, tags: ["zhkh"], shot: "fountain", kind: "right", dur: 230 },
  { id: "squirrel", title: "Московский белкопад", n: 32, tags: ["fauna", "tragedy"], shot: "squirrel", kind: "big" },
];
const SIDE: Card[] = [
  { id: "sights", title: "Что посмотреть в Москве за один день", n: 12, tags: ["travel", "adv"], shot: "cathedral", kind: "big" },
  { id: "signs", title: "«Я совершенно влюбился в эти вывески»", n: 12, tags: ["detail", "travel"], shot: "signs", kind: "big" },
  { id: "spring", title: "Весна! Московские улицы — на смену гимнастическому залу", n: 12, tags: ["sport", "travel"], shot: "spring", kind: "big" },
  { id: "elephant", title: "Москва — родина слонов", n: 12, tags: ["travel", "fauna"], shot: "elephant", kind: "big" },
];
const DUR: Record<string, number> = {};
[...LEFT, ...NEWS, DANG, ...RIGHT_AFTER].forEach((c) => { if (c.dur) DUR[c.id] = c.dur; });

/* пример истории — та, что в макете профиля (2128:33091), с её фото */
const SAMPLE = {
  title: "Фотоотчет: тренировки в парках Москвы — доступно и полезно",
  text: "Каждое утро бегаю в парке у дома. Летом там обновили площадку: поставили турники и разметили дорожки. Теперь по выходным тренируемся целой компанией соседей.",
};

const fmtT = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const stamp = (d: Date) => `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}, ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

/* знак «сообщество» текстом: «оо» — два круга, «т» — как «m», как в логотипе макета */
const logo = '<span class="lv-c-logo" role="img" aria-label="сообщество"><span aria-hidden="true">с</span><i class="lv-c-oo" aria-hidden="true"><b></b><b></b></i><span aria-hidden="true">бщесmво</span></span>';
const meta = (n: number) => `<div class="lv-c-meta"><span>${I.bubble}${n}</span><span>${I.share}</span></div>`;
const listen = (id: string) => `<button type="button" class="lv-c-listen" data-listen="${id}"><i class="lv-c-pp">${I.play}</i><span class="lv-c-lt">Прослушать</span><span class="lv-c-bar"><b></b></span></button>`;
const nav = (active: boolean) => `<nav class="lv-c-nav"><button type="button" data-nav="feed"${active ? ' class="is-on"' : ""}>Лента</button><button type="button">О проекте</button><button type="button">Обратная связь</button></nav>`;

function form(where: string): string {
  return `<section class="lv-c-form" data-form="${where}">
    <div class="lv-c-form-h"><h3>Расскажите свою историю</h3><p>Самые интересные истории мы опубликуем</p></div>
    <div><div class="lv-c-fields">
      <input class="lv-c-field" data-f="title" type="text" placeholder="Заголовок" maxlength="120" autocomplete="off">
      <textarea class="lv-c-field" data-f="text" placeholder="Ваш текст"></textarea>
    </div>
    <div class="lv-c-attach">
      <div class="lv-c-attach-row">
        <button type="button" class="lv-c-link lv-c-sample" data-sample>Вставить пример</button>
        <span class="lv-c-file" data-file hidden><i></i>площадка.jpg<button type="button" data-unattach aria-label="Убрать изображение">${I.x}</button></span>
        <button type="button" class="lv-c-link" data-attach>${I.clip}Прикрепить изображение</button>
      </div>
      <p class="lv-c-note">Вы можете загрузить до 10 изображений, размер файла не может превышать 5 Мб, а общий максимальный размер вложений - 10 Мб, допустимые форматы .jpeg, .jpg, .png</p>
    </div></div>
    <div class="lv-c-send-row"><button type="button" class="lv-c-btn lv-c-send" data-send disabled>Отправить</button>
    <p class="lv-c-terms">Нажимая «Отправить», вы принимаете <u>условия соглашения</u> и <u>политику конфиденциальности</u></p></div>
  </section>`;
}

const proto: LiveProto = {
  design: { w: W },
  mount(root, ctx: LiveCtx) {
    const B = ctx.base;
    const ph = (key: ShotKey, w: number, h: number) => sprite(B, key, w, h);

    function card(c: Card): string {
      const big = c.kind === "big" || c.kind === "video";
      const pw = big ? 612 : 266;
      const phH = c.kind === "video" ? 345 : big ? 240 : 404;
      const photo = c.shot ? `<div class="lv-c-photo" style="${ph(c.shot, pw, phH)}"></div>` : "";
      const open = c.id === "dang";
      const body = `<div class="lv-c-body"><div class="lv-c-b1"><div class="lv-c-row1">${meta(c.n)}${c.dur ? listen(c.id) : ""}</div>
        <h3 class="lv-c-title">${c.title}</h3></div>
        <div class="lv-c-b2">${tags(c.tags)}<span class="lv-c-go">${I.arrow}</span></div></div>`;
      const cls = big ? `lv-c-big${c.kind === "video" ? " is-video" : ""}` : `lv-c-split${c.kind === "left" ? " is-left" : ""}`;
      return `<article class="lv-c-card ${cls}"${open ? ` data-open="${c.id}"` : ""} data-tags="${c.tags.join(" ")}">${photo}${body}</article>`;
    }
    const item = (c: Card) => `<article class="lv-c-item" data-tags="${c.tags.join(" ")}"><div class="lv-c-b1"><div class="lv-c-row1">${meta(c.n)}${c.dur ? listen(c.id) : ""}</div><h3 class="lv-c-title">${c.title}</h3></div><div class="lv-c-b2">${tags(c.tags)}<span class="lv-c-go">${I.arrow}</span></div></article>`;
    const cross = (c: Card) => `<article class="lv-c-cross"><div class="lv-c-photo" style="${ph(c.shot!, 403, 226)}"></div><div class="lv-c-body"><div class="lv-c-b1">${meta(c.n)}<h3 class="lv-c-title">${c.title}</h3></div>${tags(c.tags)}</div></article>`;

    const footer = `<footer class="lv-c-footer"><div>${logo}${nav(false)}</div>
      <div><small><span>Соглашение о пользовании информационными системами и ресурсами города Москвы.</span><span>Политика в отношении обработки персональных данных.</span></small><small>© Проект Сообщество, 2023</small></div></footer>`;

    const cm = (who: string, time: string, text: string, likes: number, reply = false) => `<div class="lv-c-cm${reply ? " is-reply" : ""}">
      <div class="lv-c-cm-h"><span><span class="lv-c-user"><span class="lv-c-ava">Ю</span>${who}</span><time>${time}</time></span><span class="lv-c-dots">${I.dots}</span></div>
      <p class="lv-c-cm-t">${text}</p>
      <div class="lv-c-cm-a"><span>Ответить</span><span><span>${I.up}${likes || ""}</span><span>${I.dn}</span></span></div></div>`;
    const qm = (svg: string) => `<div class="lv-c-qm">${svg}</div>`;

    root.innerHTML = `<div class="lv-community${ctx.calm ? " is-calm" : ""}">
      <header class="lv-c-head" data-head><div class="lv-c-left">${logo}${nav(true)}</div>
        <div class="lv-c-tools"><span><span class="lv-c-promo">${I.promo}</span><i></i></span><button type="button" class="lv-c-ava" data-avatar aria-label="Профиль">Ю</button></div></header>
      <div class="lv-c-scroll" data-scroll>
        <div class="lv-c-page" data-page="feed"><div class="lv-c-wrap">
          <div class="lv-c-slider"><div class="lv-c-chips"><button type="button" class="lv-c-chip is-on" data-chip="all">Все</button>${ROW.map((t) => chip(t, ` data-chip="${t}"`, "button")).join("")}</div><span class="lv-c-more-tags">${I.down}</span></div>
          <div class="lv-c-feed">
            <div class="lv-c-col">${LEFT.map(card).join("")}</div>
            <div class="lv-c-col">
              <section class="lv-c-news"><div class="lv-c-news-h"><h2>Новости</h2><span>Все${I.down}</span></div>
                ${NEWS.map(item).join("")}
                <div class="lv-c-pager"><span class="lv-c-btn is-off">Назад</span><span class="lv-c-btn">Показать ещё</span></div></section>
              ${card(DANG)}${form("feed")}${RIGHT_AFTER.map(card).join("")}
            </div>
          </div></div>${footer}</div>

        <div class="lv-c-page" data-page="story" hidden><div class="lv-c-wrap lv-c-art">
          <article class="lv-c-story">
            <div class="lv-c-story-top">${tags(DANG.tags)}<span class="lv-c-date">17.04.2024</span></div>
            ${listen("dang")}
            <h1>Загадочная Дангауэровка</h1>${meta(5)}
            <div class="lv-c-fig"><div class="lv-c-photo lv-c-hero" style="${ph("dangBig", 757, 360)}"></div><p class="lv-c-cap">Фото: Соня Лесная</p></div>
            <div class="lv-c-by"><span class="lv-c-user"><span class="lv-c-org"><i class="lv-c-oo"><b></b><b></b></i></span>Екатерина Иосифова</span><span class="lv-c-co"><span><i>А</i><i>Л</i><i>К</i></span><b>и еще 3 автора</b></span></div>
            <p class="lv-c-lead">По центру Москвы ходит автобус М6 с конечной остановкой «Дангауэровка». Надежда Владимировна Фролова родилась в этом квартале и всю жизнь проработала в местной школе. Там же, в Дангауэровке, она встретила своего мужа. Мы поговорили с Надеждой о ее детстве и юности, а историк архитектуры Николай Васильев рассказал, какие интересные дома есть в этом районе.</p>
            <div class="lv-c-paras">
              <p>Николая я замечаю издалека: он идет быстрым широким шагом, из-под фетровой шляпы развеваются длинные седые волосы. Мы встречаемся у кинотеатра «Факел» на Авиамоторной. Николай громко здоровается — он часто водит экскурсии, и голос у него поставлен. Дождавшись фотографа Соню, мы отправляемся в Дангауэровку, о которой я часто слышала, но в которой никогда не была.</p>
              <p>По пути Николай рассказывает об истории места.</p>
            </div>
            <div class="lv-c-quote">${qm(I.qOpen)}
              <p>Сейчас Дангауэровкой называется конечная автобуса М6, а до революции здесь был механический завод немецких коммерсантов А. К. Дангауэра и В. В. Кайзера. Район Лефортово находился тогда за границей Москвы: земля за железной дорогой, в «Ржавом поясе», стоила дешево, поэтому выбрали именно это место.<br><br>В годы Первой мировой войны завод Дангауэра и Кайзера был национализирован и переименован сперва в «Котлоаппарат», а затем в «Компрессор», но в народном сознании район остался Дангауэровкой. Слово сложное, поэтому у москвичей получалось что-то вроде «Дангаровка».</p>
              ${qm(I.qClose)}</div>
            <div class="lv-c-photo lv-c-video" style="${ph("walk", 757, 445)}"><div class="lv-c-vp"><div class="lv-c-track"><b></b><b></b><b></b><b></b></div>
              <div class="lv-c-vbtns"><span>${I.vplay}0:05 / 1:28</span><span>${I.mute}${I.gear}${I.full}</span></div></div></div>
            <div class="lv-c-paras"><p class="lv-c-sub">Свой маленький мир</p>
              <p>Первые дома конструктивистского квартала находятся у шестого выхода станции «Авиамоторная». Здания стоят друг за другом «строчно» с севера на юг, перпендикулярно шоссе Энтузиастов. Изначально их было шесть, но на месте одного из них сейчас спортивная площадка. Фотограф Соня просит Николая остановиться, чтобы сделать портрет на фоне первого дома. Николай встает на указанное место, но рассказ не прерывает.</p>
              <p>Николая я замечаю издалека: он идет быстрым широким шагом, из-под фетровой шляпы развеваются длинные седые волосы. Мы встречаемся у кинотеатра «Факел» на Авиамоторной. Николай громко здоровается — он часто водит экскурсии, и голос у него поставлен. Дождавшись фотографа Соню, мы отправляемся в Дангауэровку, о которой я часто слышала, но в которой никогда не была.</p></div>
            <div class="lv-c-quote">${qm(I.qOpen)}
              <p>Первые дома — это практическая архитектура, чистая прагматика. Здесь вы не увидите любимых конструктивистами ленточных окон и балконов: железобетон был в дефиците, делали деревянные перекрытия. Три из шести корпусов сперва даже не оштукатурили — денег на это не хватило. Зато планировку секций сразу продумали хорошо. Квартиры все двусторонние: окна кухонь выходят на восток, а комнат — на запад, чтобы по утрам солнце освещало кухню, а вечером — жилую зону. Тогда же в стене между кухней и ванной впервые появилось окошко. В стране развернулась масштабная борьба с туберкулезом, а поскольку туберкулезная палочка размножается в темной влажной среде, для профилактики заболевания придумали такую систему вентиляции. Потом она появится во всех хрущевках.</p>
              ${qm(I.qClose)}</div>
            <section class="lv-c-comments">
              <h2>Комментарии 5</h2>
              <div class="lv-c-my"><textarea class="lv-c-field" placeholder="Ваш комментарий" readonly tabindex="-1"></textarea><span class="lv-c-btn" style="background:var(--c-mute);color:var(--c-sec)">Отправить</span></div>
              <div class="lv-c-cms">
                ${cm("Имя Фамилия", "19.04, 18:41", "Было очень интересно почитать статью! Не знала, что в Москве у нас есть такая необычная архитектура.", 12)}
                <div class="lv-c-cms" style="gap:8px">
                  ${cm("Имя Фамилия", "19.04, 11:20", "Классная тема про окошко в ванной. Всегда интересовало, откуда это пошло.", 0)}
                  ${cm("Имя Фамилия", "19.04, 13:45", "<b style=\"font-weight:500\">Михаил,</b> я думала, это в хрущевках появилось изначально", 12, true)}
                  <span class="lv-c-cm-more">Еще 3 ответа</span>
                </div>
                <div class="lv-c-cm">
                  <div class="lv-c-cm-h"><span><span class="lv-c-user"><span class="lv-c-guest">${I.x}</span>Пользователь сообщества</span><time>18.04, 12:02</time></span><span class="lv-c-dots">${I.dots}</span></div>
                  <p class="lv-c-cm-t is-clip">Распакуйте свечу, уберите упаковку и украшения в виде сухих цветов и лент. Установите ее на подсвечник из металла. Стеклянный или керамический может из-за перегрева треснуть, а пластиковый — расплавиться и потерять устойчивость.<br><br>В качестве подсвечника для фигурной свечи или свечи большого диаметра можно использовать металлический поднос, но тогда ее нужно закрепить на нем расплавленным воском или парафином. Небольшие плоские или шарообразные свечи положите в стеклянный стакан с водой — это безопасно и уютно.</p>
                  <span class="lv-c-readmore">Читать еще${I.down}</span>
                  <div class="lv-c-cm-a"><span>Ответить</span><span><span>${I.up}</span><span>${I.dn}</span></span></div>
                </div>
              </div>
              <span class="lv-c-opinions">Ещё 2 мнения</span>
            </section>
          </article>
          <aside class="lv-c-side">${SIDE.map(cross).join("")}</aside>
        </div>${footer}</div>

        <div class="lv-c-page" data-page="profile" hidden><div class="lv-c-wrap"><div class="lv-c-prof">
          <section class="lv-c-me">
            <div class="lv-c-me-top"><div><div class="lv-c-me-name"><span class="lv-c-ava">Ю</span><h2>Юлия Некрасова</h2></div>
              <div class="lv-c-info"><p class="lv-c-since">на проекте с 5 мая 2024 года</p><p class="lv-c-mail">nekraSova@gmail.com</p></div></div>
              <span class="lv-c-btn is-light">${I.edit}Редактировать</span></div>
            <div class="lv-c-tabs"><div class="lv-c-tab is-on"><span><b data-posts-n hidden></b>Статьи</span><i></i></div><div class="lv-c-tab"><span><b>6</b>Комментарии</span><i></i></div></div>
          </section>
          <div class="lv-c-list"><div data-mine hidden></div>${form("profile")}</div>
        </div></div>${footer}</div>
      </div>
    </div>`;

    const $ = <E extends Element = HTMLElement>(s: string, r: ParentNode = root) => r.querySelector<E>(s) as E;
    const $$ = <E extends Element = HTMLElement>(s: string, r: ParentNode = root) => [...r.querySelectorAll<E>(s)];
    const app = $(".lv-community");
    const head = $("[data-head]");
    const scroller = $("[data-scroll]");
    const pages = { feed: $("[data-page=feed]"), story: $("[data-page=story]"), profile: $("[data-page=profile]") };
    type Page = keyof typeof pages;
    const avatar = $("[data-avatar]");
    const dangCard = $(`[data-page=feed] [data-open=dang]`);
    const allChip = $("[data-chip=all]");
    const forms = $$("[data-form]");
    const profForm = $("[data-form=profile]");
    const mineBox = $("[data-mine]");

    /* ——— состояние ——— */
    let step = 0;
    let page: Page = "feed";
    let mine: { title: string; text: string; photo: boolean; at: Date; ok: boolean } | null = null;
    const audio = new Map<string, { t: number; on: boolean }>();
    const timers = new Set<number>();
    let tick = 0;
    let sending = false;

    const later = (fn: () => void, ms: number) => {
      const id = window.setTimeout(() => { timers.delete(id); fn(); }, ms);
      timers.add(id);
    };
    const clearTimers = () => { timers.forEach((id) => clearTimeout(id)); timers.clear(); };

    function advance(k: number) {
      if (k <= step) return;
      step = k;
      ctx.go(k);
    }

    /* ——— телефон: окно движка листается вбок (.pt-screen.is-pan) — шапка стоит на месте, статья и профиль
       сужаются до видимой ширины, чтобы ничего важного не уезжало за край ——— */
    const scr = root.parentElement;
    function syncPan() {
      const pan = !!scr && scr.classList.contains("is-pan");
      app.classList.toggle("is-pan", pan);
      app.classList.toggle("is-tight", pan && !!scr && scr.clientWidth / (parseFloat(root.style.zoom) || 1) < 700);
      if (!pan || !scr) { head.style.width = ""; head.style.transform = ""; app.style.removeProperty("--visw"); return; }
      const z = parseFloat(root.style.zoom) || 1;
      const vis = Math.min(W, scr.clientWidth / z);
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

    /* координата элемента внутри прокрутки (offsetTop в собственных px — zoom не мешает) */
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
      if (step === 0) el = page === "feed" ? (dangCard.hidden ? allChip : dangCard) : $("[data-head] [data-nav=feed]");
      else if (step === 1) el = avatar;
      else if (step === 2 && !sending) {
        if (page !== "profile") el = avatar;
        else {
          const tt = $<HTMLInputElement>("[data-f=title]", profForm);
          const tx = $<HTMLTextAreaElement>("[data-f=text]", profForm);
          el = !tt.value.trim() ? tt : !tx.value.trim() ? tx : $("[data-send]", profForm);
        }
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
        if (anim && !ctx.calm) {
          pages[p].classList.remove("is-in");
          void pages[p].offsetWidth;
          pages[p].classList.add("is-in");
        }
        page = p;
      }
      scroller.scrollTop = 0;
      if (scr?.classList.contains("is-pan")) scr.scrollTo({ left: 0, behavior: "auto" });
      $$("[data-head] [data-nav=feed]").forEach((b) => b.classList.toggle("is-on", p === "feed"));
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

    /* ——— форма истории ——— */
    const fields = (f: HTMLElement) => ({
      title: $<HTMLInputElement>("[data-f=title]", f),
      text: $<HTMLTextAreaElement>("[data-f=text]", f),
      send: $<HTMLButtonElement>("[data-send]", f),
      file: $("[data-file]", f),
    });
    function syncForm(f: HTMLElement) {
      const x = fields(f);
      x.send.disabled = sending || !x.title.value.trim() || !x.text.value.trim();
    }
    function attach(f: HTMLElement, on: boolean) {
      const x = fields(f);
      x.file.hidden = !on;
      if (on) (x.file.querySelector("i") as HTMLElement).setAttribute("style", ph("park", 48, 32));
    }
    function resetForm(f: HTMLElement) {
      const x = fields(f);
      x.title.value = ""; x.text.value = "";
      attach(f, false);
      syncForm(f);
    }
    function typeInto(el: HTMLInputElement | HTMLTextAreaElement, str: string, ms: number, f: HTMLElement, done: () => void) {
      if (ctx.calm) { el.value = str; syncForm(f); done(); return; }
      const t0 = performance.now();
      const run = () => {
        const k = Math.min(1, (performance.now() - t0) / ms);
        el.value = str.slice(0, Math.ceil(str.length * k));
        syncForm(f);
        if (k < 1) later(run, 16); else done();
      };
      run();
    }
    function sample(f: HTMLElement) {
      const x = fields(f);
      x.title.value = ""; x.text.value = "";
      typeInto(x.title, SAMPLE.title, 450, f, () => {
        hint();
        typeInto(x.text, SAMPLE.text, 750, f, () => { attach(f, true); hint(); });
      });
    }

    function paintMine(fresh: boolean) {
      mineBox.hidden = !mine;
      const n = $("[data-posts-n]");
      n.hidden = !mine;
      n.textContent = mine ? "1" : "";
      if (!mine) { mineBox.innerHTML = ""; return; }
      const status = mine.ok ? '<span class="lv-c-status is-ok">Опубликована</span>' : '<span class="lv-c-status is-wait">На модерации</span>';
      mineBox.innerHTML = `<article class="lv-c-mine${fresh && !ctx.calm ? " is-in" : ""}"><div>
        <div class="lv-c-mine-top"><span><span>Автор истории</span><span>${stamp(mine.at)}</span></span>${status}</div>
        ${meta(0)}<h3 class="lv-c-title">${esc(mine.title)}</h3></div>
        ${mine.photo ? `<div class="lv-c-photo" style="${ph("park", 290, 114)}"></div>` : ""}</article>`;
    }
    function publish() {
      if (!mine) return;
      mine.ok = true;
      const st = mineBox.querySelector(".lv-c-status");
      if (st) { st.className = "lv-c-status is-ok"; st.textContent = "Опубликована"; }
      sending = false;
      forms.forEach(syncForm);
      advance(3);
      hint();
    }
    function submit(f: HTMLElement) {
      const x = fields(f);
      if (!x.title.value.trim() || !x.text.value.trim() || sending) return;
      mine = { title: x.title.value.trim(), text: x.text.value.trim(), photo: !x.file.hidden, at: new Date(), ok: false };
      sending = true;
      forms.forEach(resetForm);
      go("profile", f !== profForm);
      paintMine(true);
      hint();
      if (ctx.calm) publish();
      else later(publish, 1500);
    }

    /* ——— открыть историю / профиль ——— */
    function openStory() {
      go("story");
      advance(1);
      hint();
    }
    function openProfile() {
      go("profile");
      advance(2);
      hint();
    }

    /* ——— события ——— */
    const onClick = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      const hit = (s: string) => el.closest<HTMLElement>(s);
      let b: HTMLElement | null;
      if ((b = hit("[data-listen]"))) return toggleListen(b.dataset.listen!);
      if ((b = hit("[data-chip]"))) { setFilter(b.dataset.chip as Tag | "all"); hint(); return; }
      if (hit("[data-sample]")) return sample(hit("[data-form]")!);
      if (hit("[data-unattach]")) return attach(hit("[data-form]")!, false);
      if (hit("[data-attach]")) return attach(hit("[data-form]")!, true);
      if (hit("[data-send]")) return submit(hit("[data-form]")!);
      if (hit("[data-avatar]")) return openProfile();
      if (hit("[data-nav=feed]")) { go("feed"); hint(); return; }
      if (hit("[data-open]")) return openStory();
    };
    const onInput = (e: Event) => {
      const f = (e.target as HTMLElement).closest<HTMLElement>("[data-form]");
      if (f) { syncForm(f); if (f === profForm) hint(); }
    };
    app.addEventListener("click", onClick);
    app.addEventListener("input", onInput);

    /* ——— состояние в начале шага k ——— */
    function show(k: number, smooth = true) {
      clearTimers();
      stopAudio();
      sending = false;
      step = k;
      mine = k >= 3 ? { title: SAMPLE.title, text: SAMPLE.text, photo: true, at: new Date(), ok: true } : null;
      forms.forEach(resetForm);
      paintMine(false);
      setFilter("all");
      syncPan();
      go(k === 0 ? "feed" : k === 1 ? "story" : "profile", smooth);
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
        head.style.transform = "";
        root.innerHTML = "";
      },
    };
  },
};
export default proto;
