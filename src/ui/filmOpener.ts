/* 23.10: ролик интерфейса открывает кейс (плотная вёрстка, CaseStory.compact). Раньше фильм стоял под прототипом
   и начинался с трёх секунд логотипа на чёрном: к нему доезжали уставшими, а первое, что видели, — заставка.

   Теперь так. Сразу под шапкой кейса ролик стоит небольшой карточкой с постером. На прокрутке он прилипает к окну
   и раскрывается до полной ширины колонки (--p 0 → 1: масштаб и скругление), а когда раскрылся больше чем наполовину —
   включается. Крутится только отрезок start…end, без заставок с логотипом. Под роликом — шкала глав: видно, что
   внутри, сколько идёт текущая глава, и любую можно включить нажатием.
   Ушёл с экрана — пауза. «Меньше движения» — ролик сразу во всю ширину и не стартует сам: включается нажатием
   на главу или на сам ролик. */
import type { CaseStory } from "../data/caseStory";
import { getLang } from "../i18n";
import { tidy } from "../lib/typograph";
import "./film-opener.css";

type Film = NonNullable<CaseStory["decisions"]["film"]>;
const esc = (s: string) => tidy(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const T = {
  label: { ru: "Фильм интерфейса", en: "Interface film" },
  chapters: { ru: "Главы ролика", en: "Film chapters" },
  play: { ru: "Включить ролик", en: "Play the film" },
};
const tr = (x: { ru: string; en: string }) => (getLang() === "ru" ? x.ru : x.en);

export function openerBlock(f: Film) {
  const ch = f.chapters ?? [];
  const len = Math.round((f.end ?? 0) - (f.start ?? 0));
  return `<section class="fo" data-fo aria-label="${esc(f.caption)}">
    <div class="fo-track">
      <div class="fo-pin">
        <div class="fo-frame">
          <video muted playsinline preload="none" width="${f.w}" height="${f.h}" poster="${esc(f.poster)}" data-start="${f.start ?? 0}" data-end="${f.end ?? ""}" aria-label="${esc(f.caption)}"><source src="${esc(f.src)}" type="video/mp4"></video>
          <button type="button" class="fo-play" aria-label="${tr(T.play)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.6v12.8a.8.8 0 0 0 1.2.7l10-6.4a.8.8 0 0 0 0-1.4l-10-6.4A.8.8 0 0 0 8 5.6Z"/></svg></button>
        </div>
        ${ch.length ? `<div class="fo-bar">
          <p class="fo-label"><i aria-hidden="true"></i>${tr(T.label)}${len > 0 ? ` · ${len} ${getLang() === "ru" ? "с" : "s"}` : ""}</p>
          <ol class="fo-ch" aria-label="${tr(T.chapters)}">${ch.map((c, k) => `<li><button type="button" data-t="${c.t}" data-k="${k}"><span class="fo-line"><i></i></span><b>${esc(c.label)}</b></button></li>`).join("")}</ol>
        </div>` : ""}
      </div>
    </div>
  </section>`;
}

export function mountOpener(root: HTMLElement, scroller: HTMLElement) {
  const box = root.querySelector<HTMLElement>("[data-fo]");
  if (!box) return () => {};
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const track = box.querySelector<HTMLElement>(".fo-track")!;
  const v = box.querySelector<HTMLVideoElement>("video")!;
  const start = +v.dataset.start! || 0;
  const end = +v.dataset.end! || 0;
  const btns = [...box.querySelectorAll<HTMLButtonElement>(".fo-ch button")];
  const marks = btns.map((b) => +b.dataset.t!);
  let p = calm ? 1 : 0;
  let seen = false, inView = false, raf = 0, wanted = false;
  box.classList.toggle("is-calm", calm);

  const load = () => { if (v.preload !== "auto") { v.preload = "auto"; v.load(); } };
  const play = () => {
    load();
    if (!seen) { v.currentTime = start; seen = true; }
    wanted = true;
    v.play().catch(() => {});
  };
  const pause = () => { wanted = false; v.pause(); };

  /* раскрытие: 0, пока верх ролика в нижней половине окна, 1 — когда он поднялся на четверть окна выше верха */
  const tick = () => {
    raf = 0;
    const vh = scroller.clientHeight;
    if (!vh) return;
    const top = track.getBoundingClientRect().top - scroller.getBoundingClientRect().top;
    const bottom = top + track.offsetHeight;
    inView = bottom > 0 && top < vh;
    if (!calm) {
      p = Math.min(1, Math.max(0, (vh * 0.55 - top) / (vh * 0.8)));
      box.style.setProperty("--p", p.toFixed(3));
    }
    if (calm) return;
    if (inView && p > 0.55) { if (!wanted || v.paused) play(); }
    else if (wanted) pause();
  };
  const onScroll = () => { if (!raf) raf = requestAnimationFrame(tick); };

  /* глава: активная — последняя начавшаяся; её полоска заполняется, пройденные — целиком */
  const paint = () => {
    const t = v.currentTime;
    let k = 0;
    marks.forEach((m, i) => { if (t >= m) k = i; });
    btns.forEach((b, i) => {
      const from = marks[i], to = marks[i + 1] ?? (end || v.duration || from + 1);
      const f = i < k ? 1 : i > k ? 0 : Math.min(1, Math.max(0, (t - from) / (to - from)));
      b.style.setProperty("--f", f.toFixed(3));
      b.toggleAttribute("aria-current", i === k);
    });
  };
  const onTime = () => {
    if (end && v.currentTime >= end) { v.currentTime = start; }
    paint();
  };
  v.addEventListener("timeupdate", onTime);
  v.addEventListener("play", () => box.classList.add("is-playing"));
  v.addEventListener("pause", () => box.classList.remove("is-playing"));

  btns.forEach((b) => b.addEventListener("click", () => {
    load();
    seen = true;
    v.currentTime = +b.dataset.t!;
    play();
    paint();
  }));
  box.querySelector(".fo-play")!.addEventListener("click", () => play());
  v.addEventListener("click", () => (v.paused ? play() : pause()));

  scroller.addEventListener("scroll", onScroll, { passive: true });
  const ro = new ResizeObserver(onScroll);
  ro.observe(scroller);
  tick();
  paint();
  return () => { scroller.removeEventListener("scroll", onScroll); ro.disconnect(); cancelAnimationFrame(raf); v.pause(); };
}
