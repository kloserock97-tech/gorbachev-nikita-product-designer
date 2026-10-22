/* v115: живой прототип «Сообщества» (stories.mos.ru) — путь читателя, который становится автором.
   Лента → «Загадочная Дангауэровка» → профиль (аватар в шапке) → форма «Расскажите свою историю» → история
   на модерации → опубликована. Темы над лентой фильтруют карточки, «Прослушать» включает плеер (без звука),
   форма есть и в ленте, и в профиле (решение кейса «главное — написать и обсудить»).
   Фото — участки макетов proto-feed/proto-article/proto-published как CSS-спрайты, отдельных файлов нет.
   Тексты продукта русские в обоих языках; по-английски только служебные всплывашки. */
import type { LiveCtx, LiveProto } from "./types";
import "./community.css";

/* ——— спрайты: участок [x, y, w, h] целой страницы макета (1440 px) ——— */
type Sheet = "feed" | "art" | "pub";
const SHEET: Record<Sheet, [string, number, number]> = {
  feed: ["proto-feed.webp", 1440, 2942],
  art: ["proto-article.webp", 1440, 3723],
  pub: ["proto-published.webp", 1440, 1574],
};
const SHOT = {
  spring: ["feed", 100, 158, 612, 240],
  elephant: ["feed", 447, 650, 265, 403],
  love: ["feed", 100, 1054, 612, 239],
  woman: ["feed", 100, 1538, 266, 400],
  dang: ["feed", 729, 962, 266, 403],
  fountain: ["feed", 1076, 1888, 265, 402],
  squirrel: ["feed", 729, 2292, 612, 240],
  cathedral: ["art", 937, 106, 403, 225],
  signs: ["art", 937, 520, 403, 225],
  dangBig: ["art", 132, 334, 757, 359],
  walk: ["art", 132, 1406, 757, 380],
  park: ["pub", 611, 661, 290, 113],
} as const satisfies Record<string, readonly [Sheet, number, number, number, number]>;
type ShotKey = keyof typeof SHOT;

/** фон-спрайт «как cover»: участок макета вписывается в блок W×H с обрезкой по центру */
function sprite(base: string, key: ShotKey, W: number, H: number): string {
  const [sheet, x0, y0, w0, h0] = SHOT[key];
  const [file, IW] = SHEET[sheet];
  const pad = 2; // край участка — мимо линий и скруглений макета
  const x = x0 + pad, y = y0 + pad, w = w0 - pad * 2, h = h0 - pad * 2;
  const s = Math.max(W / w, H / h);
  const px = -x * s + (W - w * s) / 2;
  const py = -y * s + (H - h * s) / 2;
  return `background-image:url('${base}cases/community/${file}');background-size:${(IW * s).toFixed(1)}px auto;background-position:${px.toFixed(1)}px ${py.toFixed(1)}px`;
}

/* ——— иконки (свои) ——— */
const ic = (d: string, vb = 20) => `<svg viewBox="0 0 ${vb} ${vb}" aria-hidden="true">${d}</svg>`;
const I = {
  comment: ic('<path d="M3.5 4.5h13v9h-7l-3.5 3v-3h-2.5z"/>'),
  share: ic('<circle cx="5.5" cy="10" r="1.8"/><circle cx="14.5" cy="5" r="1.8"/><circle cx="14.5" cy="15" r="1.8"/><path d="M7.1 9.1l5.8-3.2M7.1 10.9l5.8 3.2"/>'),
  play: ic('<path class="is-play" d="M5 3.2l11 6.8-11 6.8z"/><path class="is-pause" d="M5 3.5h3.4v13H5zM11.6 3.5H15v13h-3.4z"/>'),
  arrow: ic('<path d="M4 10h12M11 5l5 5-5 5"/>'),
  mark: ic('<path d="M5.5 3.5h9v13l-4.5-3-4.5 3z"/>'),
  down: ic('<path d="M5 8l5 5 5-5"/>'),
  clip: ic('<path d="M14 7l-5.6 5.6a2 2 0 0 1-2.8-2.8l6.1-6.1a3.2 3.2 0 0 1 4.5 4.5l-6.3 6.3a4.4 4.4 0 0 1-6.2-6.2L9.3 2.7"/>'),
  x: ic('<path d="M5 5l10 10M15 5L5 15"/>'),
  spark: ic('<path d="M10 2.5c.6 3.8 3.2 6.4 7 7-3.8.6-6.4 3.2-7 7-.6-3.8-3.2-6.4-7-7 3.8-.6 6.4-3.2 7-7z"/>'),
  like: ic('<path d="M6.5 9v7.5H3.5V9zM6.5 9l3-5.5c1.2 0 1.9.9 1.6 2.1L10.5 8h4.8a1.4 1.4 0 0 1 1.4 1.6l-1 5.6a1.6 1.6 0 0 1-1.6 1.3H6.5"/>'),
  dislike: ic('<path d="M6.5 11V3.5H3.5V11zM6.5 11l3 5.5c1.2 0 1.9-.9 1.6-2.1L10.5 12h4.8a1.4 1.4 0 0 0 1.4-1.6l-1-5.6a1.6 1.6 0 0 0-1.6-1.3H6.5"/>'),
  vplay: ic('<path d="M6 3.5l10 6.5-10 6.5z"/>'),
};

/* ——— темы ——— */
type Tag = "travel" | "zhkh" | "ill" | "detail" | "food" | "sport" | "night" | "party" | "fauna" | "tragedy" | "transport" | "adv";
const TAG: Record<Tag, [string, string, string]> = {
  travel: ["Путешествие", "#e5f4fb", '<rect x="4.5" y="5" width="7" height="8.5" rx="1"/><path d="M6.5 5V3h3v2M8 8v3"/>'],
  zhkh: ["ЖКХ", "#fbe9eb", '<rect x="3" y="4" width="10" height="9" rx="1"/><path d="M5.5 4v9M8 4v9M10.5 4v9"/>'],
  ill: ["Болезнь", "#fdf0e4", '<path d="M6 2.5h4V6h3.5v4H10v3.5H6V10H2.5V6H6z"/>'],
  detail: ["Деталь", "#f2ece2", '<path d="M2.5 4h11M3.5 4v2h9V4M5 6v7M8 6v7M11 6v7M3 13h10"/>'],
  food: ["Еда", "#fbf6d9", '<path d="M4 13.5V2.5l8 3.5-8 3.5"/>'],
  sport: ["Спорт", "#e7f5eb", '<circle cx="8" cy="8" r="5.5"/><path d="M2.5 8h11M8 2.5c-2 2-2 9 0 11M8 2.5c2 2 2 9 0 11"/>'],
  night: ["Ночь", "#eef0fb", '<path d="M8 2.5c.5 3 2.5 5 5.5 5.5-3 .5-5 2.5-5.5 5.5-.5-3-2.5-5-5.5-5.5 3-.5 5-2.5 5.5-5.5z"/>'],
  party: ["Кутёж", "#fdedf7", '<path d="M3 13l3.2-8.3 5.1 5.1z"/><path d="M9 4.5l1-2M11.5 7l2-1M10.5 3.5L12 5"/>'],
  fauna: ["Фауна", "#eef5df", '<circle cx="5" cy="6" r="1.2"/><circle cx="8" cy="4.3" r="1.2"/><circle cx="11" cy="6" r="1.2"/><path d="M5 11.5C5 9.5 6.5 8 8 8s3 1.5 3 3.5c0 1.3-1.3 1.6-3 1.6s-3-.3-3-1.6z"/>'],
  tragedy: ["Трагедия", "#f1f1f1", '<path d="M8 2.5c2.5 3.2 4 5.3 4 7.2a4 4 0 0 1-8 0c0-1.9 1.5-4 4-7.2z"/>'],
  transport: ["Транспорт", "#efeffa", '<rect x="3.5" y="2.5" width="9" height="9.5" rx="1.5"/><path d="M3.5 8h9M5.5 12v1.5M10.5 12v1.5"/>'],
  adv: ["Приключение", "#e6f8dc", '<circle cx="4.5" cy="10.5" r="2.5"/><circle cx="11.5" cy="10.5" r="2.5"/><path d="M4.5 10.5L7 6h4l.5 4.5M6.5 4.5h2"/>'],
};
const ROW: Tag[] = ["travel", "zhkh", "ill", "detail", "food", "sport", "night", "party", "fauna", "tragedy", "transport"];
const chip = (t: Tag, attr = "") => `<span class="lv-c-chip" style="--t:${TAG[t][1]}"${attr}>${ic(TAG[t][2], 16)}${TAG[t][0]}</span>`;
const tags = (ts: readonly Tag[]) => `<div class="lv-c-tags">${ts.map((t) => chip(t)).join("")}</div>`;

/* ——— истории ленты (тексты — из макетов кейса) ——— */
type Card = { id: string; title: string; n: number; tags: Tag[]; shot?: ShotKey; kind: "big" | "right" | "left"; dur?: number; video?: string };
const LEFT: Card[] = [
  { id: "spring", title: "Весна! Московские улицы — на смену гимнастическому залу", n: 28, tags: ["sport", "travel"], shot: "spring", kind: "big", dur: 185 },
  { id: "elephant", title: "Москва — родина слонов", n: 144, tags: ["travel", "fauna"], shot: "elephant", kind: "right", dur: 140 },
  { id: "love", title: "«И здесь действительно важно доверие». История любви пожарного и журналисточки", n: 109, tags: ["party", "night"], shot: "love", kind: "big" },
  { id: "date", title: "Куда пригласить на свидание в Москве незнакомку", n: 201, tags: ["party", "food"], shot: "woman", kind: "left", dur: 210 },
  { id: "sights", title: "Что посмотреть в Москве за один день", n: 188, tags: ["travel", "adv"], shot: "cathedral", kind: "big", video: "1:28" },
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

const SAMPLE = {
  title: "Фотоотчет: тренировки в парках Москвы — доступно и полезно",
  text: "Каждое утро бегаю в парке у дома. Летом там обновили площадку: поставили турники и разметили дорожки. Теперь по выходным тренируемся целой компанией соседей — приходите!",
};

const MSG = {
  ru: { only: "В прототипе открывается история «Загадочная Дангауэровка»", off: "Этот раздел не входит в прототип", link: "Ссылка на историю скопирована", sent: "История отправлена на модерацию", ok: "История прошла модерацию и опубликована", max: "Можно прикрепить до 10 изображений — для примера хватит одного" },
  en: { only: "In this prototype only «Загадочная Дангауэровка» opens", off: "This section isn't part of the prototype", link: "Link to the story copied", sent: "Story sent for moderation", ok: "The story passed moderation and is published", max: "Up to 10 images are allowed — one is enough for the demo" },
};

const fmtT = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const stamp = (d: Date) => `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}, ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

const logo = '<span class="lv-c-logo" aria-label="сообщество">с<i class="lv-c-oo" aria-hidden="true"><b></b><b></b></i>бщество</span>';
const meta = (n: number) => `<div class="lv-c-meta"><span>${I.comment}${n}</span><button type="button" data-share aria-label="Поделиться">${I.share}</button></div>`;
const listen = (id: string) => `<button type="button" class="lv-c-listen" data-listen="${id}"><i class="lv-c-pp">${I.play}</i><span class="lv-c-lt">Прослушать</span><span class="lv-c-bar"><b></b></span></button>`;
const navs = (cls = "") => `<nav class="lv-c-nav${cls}"><button type="button" data-nav="feed">Лента</button><button type="button" data-nav="off">О проекте</button><button type="button" data-nav="off">Обратная связь</button></nav>`;

function form(where: string): string {
  return `<section class="lv-c-form" data-form="${where}">
    <div class="lv-c-form-h"><h3>Расскажите свою историю</h3><button type="button" class="lv-c-sample" data-sample>${I.spark}Вставить пример</button></div>
    <p>Самые интересные истории мы опубликуем</p>
    <input class="lv-c-field" data-f="title" type="text" placeholder="Заголовок" maxlength="120" autocomplete="off">
    <textarea class="lv-c-field" data-f="text" placeholder="Ваш текст"></textarea>
    <div class="lv-c-attach"><span class="lv-c-file" data-file hidden><i></i>площадка.jpg · 1,2 Мб<button type="button" data-unattach aria-label="Убрать изображение">${I.x}</button></span>
      <button type="button" class="lv-c-clip" data-attach>${I.clip}Прикрепить изображение</button></div>
    <p class="lv-c-note">Вы можете загрузить до 10 изображений, размер файла не может превышать 5 Мб, а общий максимальный размер вложений — 10 Мб, допустимые форматы .jpeg, .jpg, .png</p>
    <button type="button" class="lv-c-btn lv-c-send" data-send disabled>Отправить</button>
    <p class="lv-c-terms">Нажимая «Отправить», вы принимаете <u>условия соглашения</u> и <u>политику конфиденциальности</u></p>
  </section>`;
}

const proto: LiveProto = {
  design: { w: 1100 },
  mount(root, ctx: LiveCtx) {
    const B = ctx.base;
    const T = MSG[ctx.lang];
    const ph = (key: ShotKey, W: number, H: number) => sprite(B, key, W, H);

    function card(c: Card, where: "feed" | "side" = "feed"): string {
      const W = where === "side" ? 386 : c.kind === "big" ? 504 : 216;
      const H = where === "side" ? 200 : c.kind === "big" ? 198 : 300;
      const photo = c.shot
        ? `<div class="lv-c-photo" style="${ph(c.shot, W, H)}">${c.video ? `<span class="lv-c-play">${I.vplay}</span><span class="lv-c-dur">${c.video}</span>` : ""}</div>`
        : "";
      const body = `<div class="lv-c-body">${meta(c.n)}${c.dur && where === "feed" ? listen(c.id) : ""}<h3 class="lv-c-title">${c.title}</h3>
        <div class="lv-c-foot">${tags(c.tags)}<span class="lv-c-go">${I.arrow}</span></div></div>`;
      const cls = c.kind === "big" || where === "side" ? "lv-c-big" : `lv-c-split${c.kind === "left" ? " is-left" : ""}`;
      return `<article class="lv-c-card ${cls}" data-open="${c.id}" data-tags="${c.tags.join(" ")}">${photo}${body}</article>`;
    }
    const item = (c: Card) => `<article class="lv-c-item" data-open="${c.id}" data-tags="${c.tags.join(" ")}">${meta(c.n)}${c.dur ? listen(c.id) : ""}<h3 class="lv-c-title">${c.title}</h3><div class="lv-c-foot">${tags(c.tags)}<span class="lv-c-go">${I.arrow}</span></div></article>`;

    const footer = `<footer class="lv-c-footer"><div class="lv-c-wrap">${logo}${navs()}<span></span>
      <small>Соглашение о пользовании информационными системами и ресурсами города Москвы.<br>Политика в отношении обработки персональных данных.</small><small>© Проект Сообщество, 2023</small></div></footer>`;

    const cm = (who: string, time: string, text: string, likes: number, reply = false) => `<div class="lv-c-cm${reply ? " is-reply" : ""}">
      <div class="lv-c-cm-h"><span class="lv-c-ava">Ю</span>${who}<time>${time}</time></div><p>${text}</p>
      <div class="lv-c-cm-a"><span>Ответить</span><button type="button" data-like="${likes}">${I.like}<span>${likes || ""}</span></button><button type="button" data-like-no>${I.dislike}</button></div></div>`;

    root.innerHTML = `<div class="lv-community${ctx.calm ? " is-calm" : ""}">
      <header class="lv-c-head">${logo}${navs()}<div class="lv-c-tools"><button type="button" class="lv-c-mark" data-nav="off" aria-label="Закладки">${I.mark}</button><i></i><button type="button" class="lv-c-ava" data-avatar aria-label="Профиль">Ю</button></div></header>
      <div class="lv-c-scroll" data-scroll>
        <div class="lv-c-page" data-page="feed"><div class="lv-c-wrap">
          <div class="lv-c-chips"><button type="button" class="lv-c-chip is-on" data-chip="all">Все</button>${ROW.map((t) => chip(t, ` data-chip="${t}" role="button" tabindex="0"`)).join("")}</div>
          <div class="lv-c-feed">
            <div class="lv-c-col" data-col="left"><div data-mine-feed hidden></div>${LEFT.map((c) => card(c)).join("")}<div class="lv-c-empty" data-empty hidden><b>По этой теме историй пока нет</b>Расскажите свою — форма справа</div></div>
            <div class="lv-c-col">
              <section class="lv-c-news"><div class="lv-c-news-h"><h2>Новости</h2><button type="button" data-nav="off">Все${I.down}</button></div>
                ${NEWS.map(item).join("")}
                <div class="lv-c-pager"><button type="button" class="lv-c-btn is-ghost" disabled>Назад</button><button type="button" class="lv-c-btn" data-nav="off">Показать ещё</button></div></section>
              ${card(DANG)}${form("feed")}${RIGHT_AFTER.map((c) => card(c)).join("")}
            </div>
          </div></div>${footer}</div>

        <div class="lv-c-page" data-page="story" hidden><div class="lv-c-wrap lv-c-art">
          <article class="lv-c-story">
            <div class="lv-c-story-top">${tags(DANG.tags)}<span class="lv-c-date">17.04.2024</span></div>
            ${listen("dang")}
            <h1>Загадочная Дангауэровка</h1>${meta(5)}
            <div class="lv-c-photo lv-c-hero" style="${ph("dangBig", 558, 270)}"></div>
            <p class="lv-c-cap">Фото: Соня Лесная</p>
            <div class="lv-c-by"><span class="lv-c-org"><i class="lv-c-oo"><b></b><b></b></i></span>Екатерина Иосифова<span class="lv-c-co"><i>А</i><i>Л</i><i>К</i></span><span>и еще 3 автора</span></div>
            <div class="lv-c-text">
              <p class="is-lead">По центру Москвы ходит автобус М6 с конечной остановкой «Дангауэровка». Надежда Владимировна Фролова родилась в этом квартале и всю жизнь проработала в местной школе. Там же, в Дангауэровке, она встретила своего мужа. Мы поговорили с Надеждой о ее детстве и юности, а историк архитектуры Николай Васильев рассказал, какие интересные дома есть в этом районе.</p>
              <p>Николая я замечаю издалека: он идет быстрым широким шагом, из-под фетровой шляпы развеваются длинные седые волосы. Мы встречаемся у кинотеатра «Факел» на Авиамоторной. Николай громко здоровается — он часто водит экскурсии, и голос у него поставлен. Дождавшись фотографа Соню, мы отправляемся в Дангауэровку, о которой я часто слышала, но в которой никогда не была.</p>
              <p>По пути Николай рассказывает об истории места.</p>
              <div class="lv-c-q">“</div>
              <p>Сейчас Дангауэровкой называется конечная остановка автобуса М6, а до революции здесь был механический завод немецких коммерсантов А. К. Дангауэра и В. В. Кайзера. Район Лефортово находился тогда за границей Москвы: земля за железной дорогой, в «Ржавом поясе», стоила дешево, поэтому выбрали именно это место.</p>
              <p>В годы Первой мировой войны завод Дангауэра и Кайзера был национализирован и переименован сперва в «Котлоаппарат», а затем в «Компрессор», но в народном сознании район остался Дангауэровкой. Слово сложное, поэтому у москвичей получалось что-то вроде «Дангаровка».</p>
              <div class="lv-c-q">”</div>
              <div class="lv-c-photo lv-c-video" style="${ph("walk", 558, 300)}"><span class="lv-c-play">${I.vplay}</span><div class="lv-c-vbar">${I.vplay}<span>0:05 / 1:28</span><i></i></div></div>
              <h3>Свой маленький мир</h3>
              <p>Первые дома конструктивистского квартала находятся у шестого выхода станции «Авиамоторная». Здания стоят друг за другом «строчно» с севера на юг, перпендикулярно шоссе Энтузиастов. Изначально их было шесть, но на месте одного из них сейчас спортивная площадка. Фотограф Соня просит Николая остановиться, чтобы сделать портрет на фоне первого дома. Николай встает на указанное место, но рассказ не прерывает.</p>
              <div class="lv-c-q">“</div>
              <p>Первые дома — это практическая архитектура, чистая прагматика. Здесь вы не увидите любимых конструктивистами ленточных окон и балконов: железобетон был в дефиците, делали деревянные перекрытия. Три из шести корпусов сперва даже не оштукатурили — денег на это не хватило. Зато планировку секций сразу продумали хорошо.</p>
            </div>
            <section class="lv-c-comments">
              <h2>Комментарии <span data-cn>5</span></h2>
              <textarea class="lv-c-field" data-ctext placeholder="Ваш комментарий"></textarea>
              <button type="button" class="lv-c-btn lv-c-send" data-csend disabled>Отправить</button>
              <div data-clist>
                ${cm("Имя Фамилия", "19.04, 18:41", "Было очень интересно почитать статью! Не знала, что в Москве у нас есть такая необычная архитектура.", 12)}
                ${cm("Имя Фамилия", "19.04, 11:20", "Классная тема про окошко в ванной. Всегда интересовало, откуда это пошло.", 0)}
                ${cm("Имя Фамилия", "19.04, 13:45", "Михаил, я думала, это в хрущевках появилось изначально", 12, true)}
              </div>
              <button type="button" class="lv-c-more" data-nav="off">Ещё 2 мнения</button>
            </section>
          </article>
          <aside class="lv-c-side">${SIDE.map((c) => card(c, "side")).join("")}</aside>
        </div>${footer}</div>

        <div class="lv-c-page" data-page="profile" hidden><div class="lv-c-wrap"><div class="lv-c-prof">
          <section class="lv-c-me">
            <div class="lv-c-me-top"><span class="lv-c-ava">Ю</span><h2>Юлия Некрасова</h2><button type="button" class="lv-c-btn is-light" data-nav="off">${I.mark}Редактировать</button></div>
            <p class="lv-c-since">на проекте с 5 мая 2024 года</p><p class="lv-c-mail">nekraSova@gmail.com</p>
            <div class="lv-c-tabs"><button type="button" class="is-on" data-tab="posts"><b data-posts-n hidden></b>Статьи</button><button type="button" data-tab="cms"><b data-cms-n>3</b>Комментарии</button></div>
          </section>
          <div data-mine></div>
          ${form("profile")}
          <section class="lv-c-mycm" data-mycm hidden>
            <div data-mycm-new></div>
            <p class="lv-c-to">К истории «Загадочная Дангауэровка»</p>
            ${cm("Юлия Некрасова", "19.04, 18:41", "Было очень интересно почитать статью! Не знала, что в Москве у нас есть такая необычная архитектура.", 12)}
            <p class="lv-c-to">К истории «Москва — родина слонов»</p>
            ${cm("Юлия Некрасова", "02.04, 09:12", "Классная тема! Всегда интересовало, откуда это пошло.", 3)}
            <p class="lv-c-to">К истории «Укротители воды. Кто управляет фонтанами»</p>
            ${cm("Юлия Некрасова", "28.03, 20:05", "Не знала, что фонтаны на зиму так тщательно готовят.", 0)}
          </section>
        </div></div>${footer}</div>
      </div>
      <div class="lv-c-toast" role="status" data-toast></div>
    </div>`;

    const $ = <E extends Element = HTMLElement>(s: string, r: ParentNode = root) => r.querySelector<E>(s as string) as E;
    const $$ = <E extends Element = HTMLElement>(s: string, r: ParentNode = root) => [...r.querySelectorAll<E>(s)];
    const app = $(".lv-community");
    const scroller = $("[data-scroll]");
    const pages = { feed: $("[data-page=feed]"), story: $("[data-page=story]"), profile: $("[data-page=profile]") };
    type Page = keyof typeof pages;
    const avatar = $("[data-avatar]");
    const dangCard = $(`[data-page=feed] [data-open=dang]`);
    const allChip = $("[data-chip=all]");
    const toastEl = $("[data-toast]");
    const forms = $$("[data-form]");
    const profForm = $("[data-form=profile]");

    /* ——— состояние ——— */
    let step = 0;
    let page: Page = "feed";
    let filter: Tag | "all" = "all";
    let mine: { title: string; text: string; photo: boolean; at: Date; ok: boolean } | null = null;
    let myComments = 0;
    const audio = new Map<string, { t: number; on: boolean }>();
    const timers = new Set<number>();
    let tick = 0;
    let toastT = 0;
    let sending = false;

    const later = (fn: () => void, ms: number) => {
      const id = window.setTimeout(() => { timers.delete(id); fn(); }, ms);
      timers.add(id);
      return id;
    };
    const clearTimers = () => { timers.forEach((id) => clearTimeout(id)); timers.clear(); };

    function toast(text: string) {
      toastEl.textContent = text;
      toastEl.classList.add("is-on");
      clearTimeout(toastT);
      toastT = window.setTimeout(() => toastEl.classList.remove("is-on"), 2200);
    }

    function advance(k: number) {
      if (k <= step) return;
      step = k;
      ctx.go(k);
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

    /* на телефоне движок не ужимает окно мельче 0,5 и даёт листать его вбок (.pt-screen.is-pan) — доводим до подсказки */
    function panTo(el: HTMLElement, smooth: boolean) {
      const scr = root.parentElement;
      if (!scr || !scr.classList.contains("is-pan")) return;
      const a = el.getBoundingClientRect();
      const b = scr.getBoundingClientRect();
      if (a.left >= b.left + 6 && a.right <= b.right - 6) return;
      scr.scrollTo({ left: scr.scrollLeft + (a.left + a.right) / 2 - (b.left + b.right) / 2, behavior: smooth && !ctx.calm ? "smooth" : "auto" });
    }

    /* ——— куда нажать ——— */
    let lastHint: HTMLElement | null = null;
    /** подсказка переехала на новый элемент внутри прокрутки — экран сам доезжает до него */
    function hint(scroll = true) {
      $$(".pt-hint").forEach((el) => el.classList.remove("pt-hint"));
      let el: HTMLElement | null = null;
      if (step === 0) el = page === "feed" ? (dangCard.hidden ? allChip : dangCard) : $("[data-nav=feed]");
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
      $$("[data-nav=feed]").forEach((b) => b.classList.toggle("is-on", p === "feed"));
    }

    /* ——— фильтр по темам ——— */
    function setFilter(f: Tag | "all") {
      filter = f;
      $$("[data-chip]").forEach((c) => c.classList.toggle("is-on", c.dataset.chip === f));
      let leftShown = 0;
      $$<HTMLElement>("[data-page=feed] [data-tags]").forEach((el) => {
        const show = f === "all" || el.dataset.tags!.split(" ").includes(f);
        const was = !el.hidden;
        el.hidden = !show;
        if (show && !was && !ctx.calm) { el.classList.remove("is-in"); void el.offsetWidth; el.classList.add("is-in"); }
        if (show && el.closest("[data-col=left]")) leftShown++;
      });
      const news = $(".lv-c-news");
      news.hidden = !news.querySelector(".lv-c-item:not([hidden])");
      const mf = $("[data-mine-feed]");
      mf.hidden = !(mine?.ok && f === "all");
      if (!mf.hidden) leftShown++;
      $("[data-empty]").hidden = leftShown > 0;
    }

    /* ——— плеер «Прослушать» (без звука: время и полоска) ——— */
    function paintListen(id: string) {
      const a = audio.get(id);
      $$(`[data-listen="${id}"]`).forEach((b) => {
        b.classList.toggle("is-on", !!a?.on);
        b.classList.toggle("is-live", !!a && (a.on || a.t > 0));
        b.querySelector(".lv-c-lt")!.textContent = a && (a.on || a.t > 0) ? `${fmtT(a.t)} / ${fmtT(DUR[id])}` : "Прослушать";
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
      if (on) (x.file.querySelector("i") as HTMLElement).setAttribute("style", ph("park", 64, 40));
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
        if (el instanceof HTMLTextAreaElement) el.scrollTop = el.scrollHeight;
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
        typeInto(x.text, SAMPLE.text, 800, f, () => { attach(f, true); hint(); });
      });
    }

    function mineHTML(): string {
      if (!mine) return "";
      const status = mine.ok ? '<span class="lv-c-status is-ok">Опубликована</span>' : '<span class="lv-c-status is-wait">На модерации</span>';
      return `<article class="lv-c-mine${mine.photo ? "" : " is-text"}${ctx.calm ? "" : " is-in"}"><div>
        <div class="lv-c-mine-top"><span>Автор истории</span><span>${stamp(mine.at)}</span>${status}</div>
        ${meta(0)}<h3 class="lv-c-title">${esc(mine.title)}</h3><p>${esc(mine.text)}</p></div>
        ${mine.photo ? `<div class="lv-c-photo" style="${ph("park", 236, 92)}"></div>` : ""}</article>`;
    }
    function paintMine(fresh = true) {
      const box = $("[data-mine]");
      box.innerHTML = mineHTML();
      if (!fresh) box.querySelector(".lv-c-mine")?.classList.remove("is-in");
      const n = $("[data-posts-n]");
      n.hidden = !mine;
      n.textContent = mine ? "1" : "";
      const mf = $("[data-mine-feed]");
      mf.innerHTML = mine?.ok
        ? `<article class="lv-c-card lv-c-big" data-open="mine">${mine.photo ? `<div class="lv-c-photo" style="${ph("park", 504, 198)}"></div>` : ""}<div class="lv-c-body">${meta(0)}<h3 class="lv-c-title">${esc(mine.title)}</h3><div class="lv-c-foot"><div class="lv-c-tags"><span class="lv-c-chip lv-c-new">Новое · Юлия Некрасова</span></div><span class="lv-c-go">${I.arrow}</span></div></div></article>`
        : "";
      setFilter(filter);
    }
    function publish() {
      if (!mine) return;
      mine.ok = true;
      const st = $(".lv-c-status");
      if (st) { st.className = "lv-c-status is-ok"; st.textContent = "Опубликована"; }
      paintMine(false);
      sending = false;
      forms.forEach(syncForm);
      if (page === "profile") toast(T.ok);
      advance(3);
      hint();
    }
    function submit(f: HTMLElement) {
      const x = fields(f);
      if (!x.title.value.trim() || !x.text.value.trim() || sending) return;
      mine = { title: x.title.value.trim(), text: x.text.value.trim(), photo: !x.file.hidden, at: new Date(), ok: false };
      sending = true;
      forms.forEach(resetForm);
      setTab("posts");
      go("profile", f !== profForm);
      paintMine();
      toast(T.sent);
      hint();
      if (ctx.calm) publish();
      else later(publish, 1500);
    }

    function setTab(t: "posts" | "cms") {
      $$("[data-tab]").forEach((b) => b.classList.toggle("is-on", b.dataset.tab === t));
      $("[data-mine]").hidden = t !== "posts";
      profForm.hidden = t !== "posts";
      $("[data-mycm]").hidden = t !== "cms";
    }

    /* ——— комментарий под историей ——— */
    function postComment() {
      const ta = $<HTMLTextAreaElement>("[data-ctext]");
      const v = ta.value.trim();
      if (!v) return;
      const html = cm("Юлия Некрасова", "только что", esc(v), 0);
      $("[data-clist]").insertAdjacentHTML("afterbegin", html);
      const fresh = $("[data-clist]").firstElementChild as HTMLElement;
      if (!ctx.calm) fresh.classList.add("is-in");
      reveal(fresh, true);
      $("[data-mycm-new]").insertAdjacentHTML("afterbegin", `<p class="lv-c-to">К истории «Загадочная Дангауэровка»</p>${html}`);
      myComments++;
      $("[data-cn]").textContent = String(5 + myComments);
      $("[data-cms-n]").textContent = String(3 + myComments);
      ta.value = "";
      $<HTMLButtonElement>("[data-csend]").disabled = true;
    }
    function resetComments() {
      $$("[data-clist] .lv-c-cm").slice(0, myComments).forEach((n) => n.remove());
      $("[data-mycm-new]").innerHTML = "";
      myComments = 0;
      $("[data-cn]").textContent = "5";
      $("[data-cms-n]").textContent = "3";
      $<HTMLTextAreaElement>("[data-ctext]").value = "";
      $<HTMLButtonElement>("[data-csend]").disabled = true;
    }

    /* ——— открыть историю / профиль ——— */
    function openStory(id: string) {
      if (id === "mine") { openProfile(); return; }
      if (id !== "dang") { toast(T.only); return; }
      go("story");
      advance(1);
      hint();
    }
    function openProfile() {
      setTab("posts");
      go("profile");
      advance(2);
      hint();
    }

    /* ——— события ——— */
    const onClick = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      const hit = <E extends HTMLElement = HTMLElement>(s: string) => el.closest<E>(s);
      let b: HTMLElement | null;
      if ((b = hit("[data-listen]"))) return toggleListen(b.dataset.listen!);
      if (hit("[data-share]")) return toast(T.link);
      if ((b = hit("[data-like]"))) {
        const on = b.classList.toggle("is-on");
        const n = Number(b.dataset.like) + (on ? 1 : 0);
        b.querySelector("span")!.textContent = n ? String(n) : "";
        return;
      }
      if (hit("[data-like-no]")) return;
      if ((b = hit("[data-chip]"))) { setFilter(b.dataset.chip as Tag | "all"); hint(); return; }
      if (hit("[data-sample]")) return sample(hit("[data-form]")!);
      if (hit("[data-unattach]")) return attach(hit("[data-form]")!, false);
      if (hit("[data-attach]")) {
        const f = hit("[data-form]")!;
        if (!fields(f).file.hidden) return toast(T.max);
        return attach(f, true);
      }
      if ((b = hit("[data-send]"))) return submit(hit("[data-form]")!);
      if (hit("[data-csend]")) return postComment();
      if ((b = hit("[data-tab]"))) return setTab(b.dataset.tab as "posts" | "cms");
      if (hit("[data-avatar]")) return openProfile();
      if ((b = hit("[data-nav]"))) {
        if (b.dataset.nav === "feed") { go("feed"); hint(); return; }
        return toast(T.off);
      }
      if ((b = hit("[data-open]"))) return openStory(b.dataset.open!);
    };
    const onInput = (e: Event) => {
      const el = e.target as HTMLElement;
      const f = el.closest<HTMLElement>("[data-form]");
      if (f) { syncForm(f); if (f === profForm) hint(); return; }
      if (el.matches("[data-ctext]")) $<HTMLButtonElement>("[data-csend]").disabled = !(el as HTMLTextAreaElement).value.trim();
    };
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if ((e.key === "Enter" || e.key === " ") && el.matches("[data-chip]") && el.tagName !== "BUTTON") { e.preventDefault(); el.click(); }
    };
    app.addEventListener("click", onClick);
    app.addEventListener("input", onInput);
    app.addEventListener("keydown", onKey);

    /* ——— состояние в начале шага k ——— */
    function show(k: number, smooth = true) {
      clearTimers();
      stopAudio();
      sending = false;
      step = k;
      mine = k >= 3 ? { title: SAMPLE.title, text: SAMPLE.text, photo: true, at: new Date(), ok: true } : null;
      forms.forEach(resetForm);
      resetComments();
      setTab("posts");
      paintMine(false);
      setFilter("all");
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
        clearTimeout(toastT);
        app.removeEventListener("click", onClick);
        app.removeEventListener("input", onInput);
        app.removeEventListener("keydown", onKey);
        root.innerHTML = "";
      },
    };
  },
};
export default proto;
