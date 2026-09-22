/* v32 (docs/prompts/v32.md): глава «Кейсы» над лугом Meadow Walk.
   1) Заставка — «Хватит травы. Вот работы.»: слова проявляются из размытия по скроллу, потом уходят вверх.
   2) После ленты кейсов — заметки (data/notes.ts) колодой: карточки раздаются веером, рядом панель текущей заметки.
      На телефоне колода не помещается — лента крупных карточек (strip).
   v32.1 сравнивали вживую четыре формата (колода, раскрытие, лента, лента с размытым фоном) — Никита выбрал колоду (v33).
   Всё ведёт прогресс главы (как лента кейсов в cases.ts): DOM-трансформы без собственных таймеров. */
import notes, { type Note } from "../data/notes";
import { pad2 as pad } from "../lib/format";
import { cue } from "../audio/bus";
import { onLang, t, type Key } from "../i18n";
import { CASES, CHAPTER, CHAPTER2, FOOTER, chapters, dwell, ramp, stickyIndex } from "../scene/story";
import { onViewport, topFor } from "./storyScroll";
import { swipeStrip, type SwipeStrip } from "./swipeStrip";

type StoryScene = { onStory?: (p: number) => void };
export type ShelfFormat = "stack" | "strip";

const BASE = import.meta.env.BASE_URL;
const key = (id: string, part: string) => `notes.${id}.${part}` as Key;
const ease = (x: number) => x * x * (3 - 2 * x);
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const calm = reduced || !!(navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
const narrow = () => matchMedia("(max-width: 900px)").matches;

/** колода; на телефоне — лента */
function shelfFormat(): ShelfFormat {
  return narrow() ? "strip" : "stack";
}

function body(note: Note) {
  const points = Array.from({ length: note.points }, (_, i) => `<li>${t(key(note.id, `p${i + 1}`))}</li>`).join("");
  const links = note.links
    ? `<p class="shelf-links">
        <a href="${note.links.demo}" target="_blank" rel="noopener">${t("notes.demo")}</a>
        <a href="${note.links.repo}" target="_blank" rel="noopener">${t("notes.repo")}</a>
      </p>`
    : "";
  return `<p class="shelf-label">${t(key(note.id, "label"))}</p>
    <h3 class="shelf-name">${t(key(note.id, "title"))}</h3>
    <ul class="shelf-points">${points}</ul>${links}`;
}

function media(note: Note) {
  const poster = `${BASE}${note.image}`;
  const video = note.video && !calm
    ? `<video muted loop playsinline preload="none" poster="${poster}" aria-hidden="true" tabindex="-1">
        <source src="${BASE}${note.video.webm}" type="video/webm"><source src="${BASE}${note.video.mp4}" type="video/mp4"></video>`
    : "";
  return `<span class="shelf-media"><img src="${poster}" alt="${t(key(note.id, "alt"))}" loading="lazy" decoding="async">${video}</span>`;
}

export function renderShelf() {
  const root = document.querySelector<HTMLElement>(".shelf");
  const stage = root?.querySelector<HTMLElement>(".shelf-stage");
  if (!root || !stage) return;
  const format = shelfFormat();
  if (document.body.classList.contains("lite")) root.removeAttribute("data-format");
  else root.dataset.format = format;
  stage.innerHTML = notes
    .map((n, i) => `<article class="shelf-card" role="listitem" data-i="${i}">${media(n)}<div class="shelf-body">${body(n)}</div></article>`)
    .join("") + (format === "stack" ? `<aside class="shelf-info" aria-live="polite"></aside>` : "");
  const of = root.querySelector<HTMLElement>(".shelf-of");
  if (of) of.textContent = `/ ${pad(notes.length)}`;

}

function splitTitle(el: HTMLElement) {
  const words = (el.textContent ?? "").trim().split(/\s+/);
  el.setAttribute("aria-label", words.join(" "));
  el.innerHTML = words.map((w) => `<span class="walk-word" aria-hidden="true">${w}</span> `).join("");
  return [...el.querySelectorAll<HTMLElement>(".walk-word")];
}

export function initWalkChapter(scene: StoryScene) {
  const intro = document.querySelector<HTMLElement>(".walk-intro");
  const title = intro?.querySelector<HTMLElement>("[data-walk-title]");
  const kicker = intro?.querySelector<HTMLElement>(".walk-kicker");
  const sub = intro?.querySelector<HTMLElement>(".walk-sub");
  const shelf = document.querySelector<HTMLElement>(".shelf");
  if (!intro || !title || !shelf) return;

  let introOn = false;
  let shelfOn = false;
  let current = -1;
  let lastP = 0;
  const last: string[] = [];
  let words = splitTitle(title);
  let cards: HTMLElement[] = [];
  let info: HTMLElement | null = null;
  const now = shelf.querySelector<HTMLElement>(".shelf-now");

  /* v43: на телефоне заметки листаются пальцем, как лента кейсов (swipeStrip.ts) */
  let swipe: SwipeStrip | null = null;
  let followed = -1;
  let held = -1;
  let holdTimer = 0;
  const topForNote = (i: number) => {
    const c = CASES.notesRun[0] + (CASES.notesRun[1] - CASES.notesRun[0]) * (i / Math.max(1, cards.length - 1));
    return topFor(CHAPTER + (CHAPTER2 - CHAPTER) * c);
  };

  const rebuild = () => {
    renderShelf();
    cards = [...shelf.querySelectorAll<HTMLElement>(".shelf-card")];
    info = shelf.querySelector<HTMLElement>(".shelf-info");
    swipe?.destroy();
    swipe = null;
    followed = -1;
    const stage = shelf.querySelector<HTMLElement>(".shelf-stage");
    if (shelf.dataset.format === "strip" && stage) {
      stage.scrollLeft = 0;
      swipe = swipeStrip(stage, {
        items: () => cards,
        onMove: (idx) => setCurrent(idx),
        onUserSettle: (i) => {
          if (!shelfOn) return;
          held = i;
          clearTimeout(holdTimer);
          holdTimer = window.setTimeout(() => (held = -1), 2500);
          scrollTo({ top: topForNote(i), behavior: "instant" as ScrollBehavior });
        },
      });
    }
    current = -1;
    last.length = 0;
    warmed = false;
    shelf.querySelectorAll<HTMLElement>("a").forEach((a) => (a.tabIndex = shelfOn ? 0 : -1));
    scene.onStory?.(lastP);
  };


  onLang(() => {
    /* data-i18n уже подставил новый заголовок — делим заново; заметки собираем с новыми строками */
    words = splitTitle(title);
    rebuild();
  });
  /* v68: только настоящая смена окна. Прятки адресной строки на телефоне тоже шлют resize — и каждая
     переставляла ленту прямо под пальцем (refresh кладёт scrollLeft на текущую карточку) */
  onViewport(() => {
    if (document.body.classList.contains("lite")) return;
    if (shelf.dataset.format !== shelfFormat()) rebuild();
    else swipe?.refresh();
  });

  /* подсветка под курсором (лента на телефоне): координаты в CSS-переменных карточки */
  shelf.addEventListener("pointermove", (e) => {
    const card = (e.target as HTMLElement).closest<HTMLElement>(".shelf-card");
    if (!card) return;
    const r = card.getBoundingClientRect();
    card.style.setProperty("--mx", `${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}%`);
    card.style.setProperty("--my", `${(((e.clientY - r.top) / r.height) * 100).toFixed(1)}%`);
  });

  const playOnly = (idx: number) => {
    cards.forEach((card, i) => {
      const v = card.querySelector("video");
      if (!v) return;
      if (i === idx && shelfOn && !document.hidden) {
        if (v.preload !== "auto") v.preload = "auto";
        if (v.paused) void v.play().catch(() => {});
      } else if (!v.paused) v.pause();
    });
  };

  /* прогрев заметок, пока листают кейсы: первый показ декодировал четыре картинки и грузил ролики разом —
     кадры 78–109 мс на входе в заметки. По одному, с паузами (как обложки в cases.ts) */
  let warmed = false;
  const warm = () => {
    warmed = true;
    const queue: (() => Promise<unknown>)[] = [];
    for (const img of shelf.querySelectorAll<HTMLImageElement>("img")) {
      queue.push(() => { img.loading = "eager"; return img.decode().catch(() => {}); });
    }
    for (const v of shelf.querySelectorAll<HTMLVideoElement>("video")) {
      queue.push(() => new Promise<void>((done) => {
        v.preload = "auto";
        v.addEventListener("loadeddata", () => done(), { once: true });
        window.setTimeout(done, 1500);
        v.load();
      }));
    }
    const step = () => {
      const job = queue.shift();
      if (job) void job().then(() => window.setTimeout(step, 120));
    };
    step();
  };

  /* v68: шаг на заметку кнопкой. Свайп по ленте и прокрутка страницы никуда не делись — но человек без
     колёсика (или тот, кто про свайп не догадался) теперь тоже переходит от карточки к карточке, ровно на одну
     и в обе стороны. Как и при свайпе, ставим «держим» — иначе прокрутка страницы тут же поведёт ленту сама. */
  const stepBtns = [...shelf.querySelectorAll<HTMLButtonElement>(".shelf-step")];
  const goToNote = (i: number) => {
    const idx = Math.max(0, Math.min(cards.length - 1, i));
    if (swipe) {
      held = idx;
      clearTimeout(holdTimer);
      holdTimer = window.setTimeout(() => (held = -1), 2500);
      followed = idx;
      swipe.follow(idx);
    }
    scrollTo({ top: topForNote(idx), behavior: reduced ? ("instant" as ScrollBehavior) : "smooth" });
  };
  stepBtns.forEach((b) => b.addEventListener("click", () => goToNote(current + Number(b.dataset.d))));
  /* стрелки на клавиатуре. Глава кейсов слушает те же клавиши, а на стыке они короткое время видны обе —
     поэтому там стоит встречная проверка на видимые заметки */
  addEventListener("keydown", (e) => {
    if (!shelfOn || e.metaKey || e.ctrlKey || e.altKey || document.body.classList.contains("case-open")) return;
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    const el = document.activeElement as HTMLElement | null;
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el?.isContentEditable) return;
    e.preventDefault();
    goToNote(current + (e.key === "ArrowRight" ? 1 : -1));
  });

  function setCurrent(idx: number) {
    if (idx === current) return;
    if (current >= 0) cue("progress-step", 0.5);
    current = idx;
    stepBtns[0].disabled = idx <= 0;
    stepBtns[1].disabled = idx >= cards.length - 1;
    if (now) now.textContent = pad(idx + 1);
    if (info) {
      info.classList.remove("is-in");
      info.innerHTML = body(notes[idx]);
      requestAnimationFrame(() => info?.classList.add("is-in"));
      info.querySelectorAll<HTMLElement>("a").forEach((el) => (el.tabIndex = 0));
    }
    playOnly(idx);
  }

  rebuild();

  const prev = scene.onStory;
  scene.onStory = (p) => {
    prev?.(p);
    lastP = p;
    const { c, f } = chapters(p);
    if (!warmed && c > CASES.notes[0] - 0.2) warm();

    /* ── заставка ── */
    const k = ramp(c, ...CASES.intro);
    const iv = c > 0 && k > 0 && k < 1;
    if (iv !== introOn) {
      introOn = iv;
      intro.classList.toggle("is-on", iv);
    }
    if (iv) {
      const out = ease(ramp(k, 0.72, 1));
      intro.style.setProperty("--out", out.toFixed(3));
      kicker?.style.setProperty("--in", ease(ramp(k, 0.02, 0.16)).toFixed(3));
      sub?.style.setProperty("--in", ease(ramp(k, 0.34, 0.52)).toFixed(3));
      words.forEach((w, i) => w.style.setProperty("--in", ease(ramp(k, 0.06 + i * 0.045, 0.28 + i * 0.045)).toFixed(3)));
    }

    /* ── заметки ── */
    const leave = ramp(f, ...FOOTER.leave);
    const sv = c > CASES.notes[0] && f < FOOTER.leave[1];
    if (sv !== shelfOn) {
      shelfOn = sv;
      shelf.classList.toggle("is-on", sv);
      shelf.setAttribute("aria-hidden", String(!sv));
      shelf.querySelectorAll<HTMLElement>("a").forEach((a) => (a.tabIndex = sv ? 0 : -1));
      stepBtns.forEach((b) => (b.tabIndex = sv ? 0 : -1));
      if (!sv) playOnly(-1);
    }
    if (!sv) return;
    const enter = ease(ramp(c, ...CASES.notesIn));
    shelf.style.setProperty("--enter", enter.toFixed(3));
    shelf.style.setProperty("--leave", leave.toFixed(3));
    /* v43: тот же шаг на заметку, что и на кейс, с той же мягкой остановкой у каждой (story.ts: layoutTimeline, dwell).
       Раньше вся лента шла по одной кривой: первая и последняя заметки листались медленно, средние быстро */
    const run = ramp(c, ...CASES.notesRun) * (cards.length - 1);
    const a = reduced ? run : dwell(run);
    const format = shelf.dataset.format as ShelfFormat;
    if (swipe) {
      if (held >= 0) { followed = held; if (Math.abs(run - held) < 0.05) held = -1; return; }
      followed = stickyIndex(run, followed);
      swipe.follow(followed);
      return;
    }
    const idx = Math.round(a);

    cards.forEach((card, i) => {
      const d = i - a;
      const ad = Math.abs(d);
      let tr = "";
      let o = 1;
      if (format === "stack") {
        /* колода: сверху — активная, остальные раздаются веером влево-вправо и уходят вниз */
        const spread = reduced ? 0 : 1;
        /* ближняя соседка отходит на 120px, дальние поджаты (+40px) — веер не уезжает за край и на счётчик */
        const near = Math.max(-1, Math.min(1, d));
        const fanX = (near * 120 + (d - near) * 40) * spread;
        tr = `translate3d(${fanX.toFixed(1)}px, ${(Math.min(ad, 2) * 20 + (1 - enter) * 160).toFixed(1)}px, 0) rotate(${(near * 7 * spread + (d - near) * 3 * spread).toFixed(2)}deg) scale(${(1 - Math.min(ad, 3) * 0.07).toFixed(3)})`;
        o = Math.max(0, Math.min(1, 3.2 - ad)) * enter;
      } else {
        tr = `translate3d(calc(${d.toFixed(3)} * (var(--card-w) + var(--gap))), ${((1 - enter) * 120).toFixed(1)}px, 0) scale(${(1 - Math.min(ad, 1) * 0.12).toFixed(3)})`;
        o = (1 - Math.min(ad, 2) * 0.35) * enter;
      }
      const z = String(100 - Math.round(ad * 10));
      const keyStr = tr + o.toFixed(3);
      if (last[i] !== keyStr) {
        last[i] = keyStr;
        card.style.transform = tr;
        card.style.opacity = o.toFixed(3);
        card.style.zIndex = z;
        card.style.visibility = o < 0.002 ? "hidden" : "visible";
        card.classList.toggle("is-active", ad < 0.5);
      }
    });

    setCurrent(idx);
  };

  document.addEventListener("visibilitychange", () => playOnly(document.hidden ? -1 : current));
}
