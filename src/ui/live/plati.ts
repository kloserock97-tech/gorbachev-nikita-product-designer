/* v115: живой прототип «Плати частями» — маршрут «перенести платёж к зарплате» настоящим интерфейсом.
   Главный экран банка с карточкой рассрочки → хаб (остаток, совет по Мегамаркету, покупки) → шторка
   «Проверьте новый график» → хаб после переноса с новым графиком. Кроме маршрута — только то, что есть
   в макетах: «Оставить 28 августа» закрывает шторку, «Отменить перенос» возвращает совет, «Откуда цифры»
   открывает разбор расчёта, стрелка «назад» ведёт на главный.
   Вёрстка по Figma (BzIehGAJZ6BPyHDEFYffyA, страница «Screens»). Чужих логотипов нет: магазины — буквы
   в кружках, аватар — нейтральный квадрат, 3D-предметы заменены своими CSS/SVG. Интерфейс по-русски
   на обоих языках сайта: это экран продукта. */
import type { LiveProto } from "./types";
import "./plati.css";

const NB = " ";
const rub = (n: number) => `${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, NB)}${NB}₽`;

/* свои значки: обводка 24×24 */
const p = (d: string, cls = "lv-i") => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
const I = {
  info: p('<circle cx="12" cy="12" r="9.5"/><path d="M12 11v5.5"/><circle cx="12" cy="7.6" r="0.7" fill="currentColor"/>'),
  wallet: p('<rect x="3.5" y="6" width="17" height="12.5" rx="3"/><path d="M3.5 10.5h17M7 15h3"/>'),
  swap: p('<path d="M6 9h12l-3.5-3.5M18 15H6l3.5 3.5"/>'),
  cal: p('<rect x="4" y="5.5" width="16" height="14.5" rx="3.2"/><path d="M4 10.2h16M8.5 3.5v4M15.5 3.5v4"/>'),
  dots: p('<circle cx="6" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="18" cy="12" r="1.5" fill="currentColor" stroke="none"/>'),
  x: p('<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>'),
  arrow: p('<path d="M4.5 12h14M13 6.5l5.5 5.5-5.5 5.5"/>'),
  shield: p('<path d="M12 3.5 19 6.2v5.3c0 4.2-3 7.5-7 9-4-1.5-7-4.8-7-9V6.2z"/><path d="m9 12 2.2 2.2L15.2 10"/>'),
  card: p('<rect x="3.5" y="6" width="17" height="12.5" rx="3"/><path d="M3.5 10.5h17"/>'),
  check: p('<path d="m5 12.5 4.2 4L19 7"/>'),
  clock: p('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>'),
  pin: p('<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>'),
  trend: p('<path d="m4 16.5 5.2-5.2 3.8 3.8 7-7M15 8h5v5"/>'),
  search: p('<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/>'),
  chat: p('<path d="M12 4.5c4.7 0 8.5 3.1 8.5 7s-3.8 7-8.5 7c-1.1 0-2.2-.2-3.2-.5L4.5 19.5l1.2-3.6C4.3 14.6 3.5 13.1 3.5 11.5c0-3.9 3.8-7 8.5-7z"/>'),
  grid: '<svg class="lv-i lv-fill" viewBox="0 0 24 24" aria-hidden="true" style="stroke:none"><rect x="3" y="3" width="8" height="8" rx="2.5"/><rect x="13" y="3" width="8" height="8" rx="2.5"/><rect x="3" y="13" width="8" height="8" rx="2.5"/><rect x="13" y="13" width="8" height="8" rx="2.5"/></svg>',
  eye: p('<path d="M3 12s3.3-6 9-6c1.6 0 3 .5 4.2 1.1M21 12s-3.3 6-9 6c-1.6 0-3-.5-4.2-1.1"/><path d="M9.6 14.4a3.2 3.2 0 0 1 4.8-4.8M4.5 19.5l15-15"/>', "lv-i lv-eye"),
  chev: p('<path d="m9 5 7 7-7 7"/>', "lv-i lv-chev"),
  qr: p('<rect x="4" y="4" width="6" height="6" rx="1.5"/><rect x="14" y="4" width="6" height="6" rx="1.5"/><rect x="4" y="14" width="6" height="6" rx="1.5"/><path d="M14 14h2.5v2.5M20 14v.01M14 20h.01M17.5 20H20v-3"/>'),
  up: p('<path d="M12 19.5v-15M6 10.5l6-6 6 6"/>'),
  /* шестерёнка: восемь зубцов и отверстие маской */
  gear: '<svg class="lv-i" viewBox="0 0 24 24" aria-hidden="true" style="stroke:none"><defs><mask id="lvgm"><rect width="24" height="24" fill="#fff"/><circle cx="12" cy="12" r="3" fill="#000"/></mask></defs><g fill="currentColor" mask="url(#lvgm)"><circle cx="12" cy="12" r="7"/>'
    + [0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<rect x="10.3" y="2" width="3.4" height="5" rx="1" transform="rotate(${a} 12 12)"/>`).join("") + "</g></svg>",
  contactless: p('<path d="M8 8.5a5 5 0 0 1 0 7M11.5 6a8.5 8.5 0 0 1 0 12M15 3.5a12 12 0 0 1 0 17"/>'),
  globe: p('<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.4 2.5 3.5 5.4 3.5 8.5s-1.1 6-3.5 8.5c-2.4-2.5-3.5-5.4-3.5-8.5s1.1-6 3.5-8.5z"/>'),
  star: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2.8 2.6 6 6.4.6-4.9 4.3 1.5 6.3L12 16.7 6.4 20l1.5-6.3L3 9.4l6.4-.6z"/></svg>',
  tHome: p('<path d="M4 10.5 12 4l8 6.5V19a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19z"/><path d="M9.5 20.5v-6h5v6"/>'),
  tSave: p('<rect x="4" y="4" width="16" height="16" rx="3.5"/><path d="M8.5 16v-3M12 16V8.5M15.5 16v-5"/>'),
  tLife: p('<path d="m12 3.8 2.5 5.3 5.8.7-4.3 4 1.1 5.7L12 16.7l-5.1 2.8 1.1-5.7-4.3-4 5.8-.7z"/>'),
  tPay: p('<rect x="4" y="4" width="16" height="16" rx="3.5"/><path d="M8 12h8M13 8.5l3.5 3.5-3.5 3.5"/>'),
  tCred: p('<rect x="3.5" y="5.5" width="17" height="13" rx="3.5"/><path d="M3.5 10h17M14 14.5h3"/>'),
};
/* тонкие шевроны с точными пропорциями из макета */
const CH_R = '<svg viewBox="0 0 7 12" aria-hidden="true"><path d="M1 1l5 5-5 5"/></svg>';
const CH_U = '<svg viewBox="0 0 12 7" aria-hidden="true"><path d="M1 6l5-5 5 5"/></svg>';
const CH_D = '<svg viewBox="0 0 12 7" aria-hidden="true"><path d="M1 1l5 5 5-5"/></svg>';
const SB = `<div class="lv-sb" aria-hidden="true"><b>9:41</b><span>
  <svg width="18" height="12" viewBox="0 0 18 12"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5.5" width="3" height="6.5" rx="1"/><rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg>
  <svg width="16" height="12" viewBox="0 0 17 12"><path d="M8.5 2.2c2.4 0 4.6.9 6.3 2.5l1.3-1.4A10.9 10.9 0 0 0 8.5.3 10.9 10.9 0 0 0 .9 3.3l1.3 1.4a9 9 0 0 1 6.3-2.5zm0 3.8c1.4 0 2.7.5 3.6 1.4l1.3-1.4A7.2 7.2 0 0 0 8.5 4a7.2 7.2 0 0 0-4.9 2l1.3 1.4c1-.9 2.2-1.4 3.6-1.4zm0 3.6-2 2.1 2 2.1 2-2.1z"/></svg>
  <svg width="25" height="12" viewBox="0 0 27 13" style="margin-left:4px"><rect x="0.6" y="0.6" width="22.8" height="11.8" rx="3.6" fill="none" stroke="currentColor" stroke-opacity=".4" stroke-width="1.2"/><rect x="2.4" y="2.4" width="16" height="8.2" rx="2.2"/><path d="M25 4.4v4.2c.9-.3 1.5-1.1 1.5-2.1S25.9 4.7 25 4.4z" fill-opacity=".45"/></svg>
</span></div>`;
const TABS = `<nav class="lv-tabs" aria-hidden="true">
  <span class="is-on">${I.tHome}Главный</span><span>${I.tSave}Накопления</span><span>${I.tLife}Для жизни</span><span>${I.tPay}Платежи</span><span>${I.tCred}Кредиты</span></nav>`;
const ltr = (k: string, t: string) => `<i class="lv-ltr lv-ltr--${k}">${t}</i>`;
const leaf = (m: string, d: string, mod = "") => `<span class="lv-cal${mod}" aria-hidden="true"><b>${m}</b><i>${d}</i></span>`;
/* два листка календаря и стрелка «переезда» — своя картинка вместо 3D-предмета из макета */
const ART = (id: string) => `<svg class="lv-art" viewBox="0 0 112 112" aria-hidden="true">
  <defs><linearGradient id="${id}" x1="0" x2="1"><stop offset="0" stop-color="#c4efd2"/><stop offset="1" stop-color="#5fc483"/></linearGradient></defs>
  <g transform="rotate(-9 30 66)"><rect x="9" y="44" width="40" height="44" rx="7" fill="#eef0ef" stroke="#d3d7d5"/><rect x="9" y="44" width="40" height="11" rx="6" fill="#d9dddb"/>
  ${[0, 1, 2].map((r) => [0, 1, 2].map((c) => `<rect x="${16 + c * 9}" y="${61 + r * 8}" width="6" height="5" rx="1.5" fill="#a9b0ad"/>`).join("")).join("")}</g>
  <g transform="rotate(6 84 58)"><rect x="64" y="36" width="40" height="44" rx="7" fill="#f3faf5" stroke="#cfe7d7"/><rect x="64" y="36" width="40" height="11" rx="6" fill="#7fd39d"/>
  ${[0, 1, 2].map((r) => [0, 1, 2].map((c) => `<rect x="${71 + c * 9}" y="${53 + r * 8}" width="6" height="5" rx="1.5" fill="${r === 1 && c === 1 ? "#2fa65a" : "#cfe2d6"}"/>`).join("")).join("")}</g>
  <path d="M24 40c8-18 22-6 34-14s18-8 24 0" fill="none" stroke="url(#${id})" stroke-width="5" stroke-linecap="round"/>
  <path d="m76 19 9 6-10 4z" fill="#5fc483"/></svg>`;
const COINS = `<div class="lv-coins" aria-hidden="true"><i class="lv-coin" style="left:4px;top:10px"></i><i class="lv-coin lv-coin--ring" style="left:56px;top:4px"></i><i class="lv-coin" style="left:0;top:42px"></i><i class="lv-coin" style="left:52px;top:38px"></i></div>`;
const MAP = `<svg class="lv-map" viewBox="0 0 46 46" aria-hidden="true"><path d="M-2 29 48 15M13-2l8 50M29-2l-4 50" stroke="#e3e6ea" stroke-width="5" fill="none"/><path d="M23 10c-4.4 0-8 3.4-8 7.7 0 5.7 8 13.3 8 13.3s8-7.6 8-13.3c0-4.3-3.6-7.7-8-7.7z" fill="#2b74e8"/><circle cx="23" cy="17.6" r="3" fill="#fff"/></svg>`;

/* график Мегамаркета до и после переноса */
const TL = {
  before: ["1 июля", "15 июля", "28 августа", "11 сентября"],
  after: ["1 июля", "15 июля", "6 сентября", "20 сентября"],
};
const TL_STATE = ["done", "done", "now", "later"];

function html() {
  const tl = TL.before.map((d, k) => `<span class="is-${TL_STATE[k]}"><em>${TL_STATE[k] === "done" ? I.check.replace('class="lv-i"', "") : ""}</em><small data-tl="${k}">${d}</small><b>${rub(3100)}</b></span>`).join("");
  return `<div class="lv-plati">
  <section class="lv-scr lv-home" aria-label="Главный экран банка">
    <i class="lv-bg" aria-hidden="true"></i>
    ${SB}
    <div class="lv-scroll">
      <div class="lv-top"><i class="lv-ava" aria-hidden="true"></i><span class="lv-search">${I.search}Поиск</span><span class="lv-top-acts">${I.chat}${I.grid}</span></div>
      <div class="lv-bal"><p class="lv-bal-sum">${I.eye}${rub(103913)}${I.chev}</p><p class="lv-bonus">1${NB}240 <i>${I.star}</i></p></div>
      <div class="lv-quick" aria-hidden="true"><span>${I.qr}QR-код</span><span>${I.up}Перевести</span><span>${I.gear}Настроить</span></div>
      <div class="lv-home-c">
        <div class="lv-w" role="button" tabindex="0" data-a="open" aria-label="Плати частями: открыть">
          <div class="lv-w-top"><span class="lv-w-ico" aria-hidden="true"><i class="lv-coin" style="width:17px;height:10px;left:5px;top:15px;box-shadow:0 2px 0 #8f959a"></i><i class="lv-coin" style="width:17px;height:10px;left:13px;top:19px;box-shadow:0 2px 0 #8f959a"></i><i class="lv-coin lv-coin--ring" style="width:17px;height:10px;left:13px;top:9px;box-shadow:inset 0 0 0 3px #a3e8c2,0 2px 0 #7fd2a3"></i></span>
            <b>Плати частями</b><span class="lv-w-more">3 покупки ${CH_R}</span></div>
          <p class="lv-w-cap">Ближайший платёж</p>
          <div class="lv-w-row"><div><p class="lv-w-sum">${rub(3100)}</p><p class="lv-w-store">${ltr("mm", "М")}<b>Мегамаркет</b>· 28 августа</p></div>
            <p class="lv-w-all"><b>${rub(12450)}</b>остаток по всем</p></div>
          <div class="lv-tip"><i>${I.cal}</i><div class="lv-tip-t"><b>Лучше после зарплаты</b><span>6 сентября <em>бесплатно</em></span></div><button type="button" data-a="open">Перенести</button></div>
          <i class="lv-hr"></i>
          <div class="lv-next">Дальше <span>${ltr("mv", "М")}5 сен</span><span>${ltr("rv", "R")}12 сен</span></div>
        </div>
        <div class="lv-tr" aria-hidden="true"><b>Переводы</b>
          <p class="lv-tr-f">По номеру телефона или карты${I.contactless}</p>
          <div class="lv-tr-p"><span><i style="color:#121215">${I.swap}</i>Между своими</span><span><i style="color:#121215">${I.globe}</i>В другую страну</span><span><i style="background:#1a6bd6">С</i>Света</span><span><i style="background:#c2261b">НЛ</i>Николай Леонтьев</span><span><i style="background:#5f6b75">АЧ</i>Антон Чехов</span></div>
        </div>
      </div>
    </div>
    <i class="lv-scrim" aria-hidden="true"></i>
    ${TABS}
    <i class="lv-shade"></i>
  </section>

  <section class="lv-scr lv-hub" aria-label="Плати частями" inert>
    <div class="lv-hub-head">${SB}<div class="lv-nav"><button type="button" class="lv-navback" data-a="home" aria-label="Назад"><svg viewBox="0 0 12 20"><path d="M10 2 2 10l8 8"/></svg></button><h3>Плати частями</h3><span>${I.info}</span></div></div>
    <div class="lv-scroll" data-hub-scroll>
      <div class="lv-hero">
        <p>Осталось выплатить</p><h2>${rub(12450)}</h2>${COINS}
        <div class="lv-bar"><i></i></div>
        <p class="lv-bar-cap"><span>3 покупки · 7 из 12 платежей</span><span>последний — 12 сен</span></p>
        <div class="lv-acts" aria-hidden="true"><span><i>${I.wallet}</i>Оплатить</span><span><i>${I.swap}</i>Другая дата</span><span><i>${I.cal}</i>Календарь<b class="lv-dot"></b></span><span><i>${I.dots}</i>Ещё</span></div>
      </div>
      <div class="lv-hub-c">
        <div class="lv-card" data-card="advice">
          <div class="lv-c-head">${ltr("mm", "М")}<b>Мегамаркет</b>2 из 4 оплачено<span class="lv-x">${I.x}</span></div>
          <div class="lv-gist"><div><h4>28 августа спишем ${rub(3100)}</h4><p>останется ${rub(2300)} на 8${NB}дней до зарплаты</p></div>${ART("lvpg1")}</div>
          <div class="lv-prev"><span class="lv-was">${I.cal}<s>28 авг</s></span>${I.arrow}<span class="lv-will">${I.cal}6 сен</span><em class="lv-sticker">бесплатно</em></div>
          <div class="lv-duo"><button type="button" class="lv-go" data-a="move">Перенести на 6 сен</button><button type="button" class="lv-stay" tabindex="-1">Оставить</button></div>
          <div class="lv-chips"><span class="lv-chip">${I.card}спишем с •• 4417</span><span class="lv-chip">${I.shield}не влияет на историю</span></div>
          <i class="lv-hair"></i>
          <button type="button" class="lv-why" data-a="numbers"><i>${I.trend}</i><b>Откуда цифры</b><span>остаётся ${rub(5400)}${CH_R}</span></button>
        </div>
        <div class="lv-card lv-done" data-card="done" hidden>
          <div class="lv-gist"><div><h4>Готово — платёж<br>Мегамаркета теперь<br>6${NB}сентября</h4><p>Свободных денег до зарплаты стало больше ровно на${NB}платёж${NB}— ${rub(3100)}</p></div>${leaf("СЕН", "6", " lv-cal--g lv-cal--big")}</div>
          <button type="button" class="lv-wide" data-a="undo">Отменить перенос</button>
          <div class="lv-chips"><span class="lv-chip">${I.clock}отмена возможна до 5 сентября</span></div>
        </div>

        <h3 class="lv-h">Мои покупки</h3>
        <div class="lv-seg" aria-hidden="true"><span class="is-on">Активные <b>3</b></span><span>Завершённые <b>6</b></span><span>Все <b>9</b></span></div>
        <div class="lv-list">
          <div class="lv-p is-big">${ltr("mm", "М")}<div class="lv-p-t"><b>Мегамаркет</b><span>2 из 4 оплачено · по ${rub(3100)}</span></div><p class="lv-p-r"><b>${rub(6200)}</b>осталось</p>${CH_U}</div>
          <div class="lv-tl"><i></i>${tl}</div>
          <i class="lv-hr"></i>
          <div class="lv-p">${ltr("mv", "М")}<div class="lv-p-t"><b>М.Видео</b><span>2 из 4 оплачено · ${rub(2300)} 5${NB}сен</span><span class="lv-chip">${I.card}после зарплаты</span></div><p class="lv-p-r"><b>${rub(4600)}</b>осталось</p>${CH_D}</div>
          <i class="lv-hr"></i>
          <div class="lv-p">${ltr("rv", "R")}<div class="lv-p-t"><b>Rendez-Vous</b><span>3 из 4 оплачено · ${rub(1650)} 12${NB}сен</span><span class="lv-chip">${I.check}остался последний платёж</span></div><p class="lv-p-r"><b>${rub(1650)}</b>осталось</p>${CH_D}</div>
        </div>
        <div class="lv-offer" aria-hidden="true">
          <div class="lv-ticket">
            <div class="lv-ticket-top"><span class="lv-tag">${ltr("sm", "С")}СПОРТМАСТЕР · ВЧЕРА</span>
              <p class="lv-t-sum">${rub(1800)} <span>× 4 платежа</span></p><div class="lv-t-bars"><i></i><i></i><i></i><i></i></div>
              <p>всего ${rub(7200)} · первый через 2 недели</p><div class="lv-t-art"><i></i><i></i><b>₽</b></div></div>
            <div class="lv-perf"></div>
            <div class="lv-stub"><span>Разделить покупку</span><span>${I.shield}бесплатно · 14 дней</span></div>
          </div>
          <p class="lv-more">ещё 2 покупки · OZON и Летуаль</p>
        </div>
        <div class="lv-near" aria-hidden="true">${MAP}<div><b>Где рядом можно частями</b><span>${I.pin}12 магазинов в 15 минутах<br>пешком</span></div>${CH_R}</div>
      </div>
    </div>
    ${TABS}
  </section>

  <div class="lv-back" data-a="dismiss"></div>

  <div class="lv-sheet lv-mv" role="dialog" aria-label="Проверьте новый график" data-sheet="move" inert>
    <i class="lv-grab"></i>
    <div class="lv-sheet-in">
      ${ART("lvpg2")}
      <h3>Проверьте новый график</h3>
      <p class="lv-sub">Двигаем только этот платёж — ${rub(3100)}.<br>Остальные покупки и их даты не меняются.</p>
      <div class="lv-cmp">
        <div class="lv-cmp-d"><span>${leaf("АВГ", "28", " lv-cal--x")}было</span><span>${leaf("СЕН", "6", " lv-cal--g")}станет</span></div>
        <div class="lv-cmp-cut"></div>
        <dl><div><dt>Сумма платежа</dt><dd>${rub(3100)}</dd></div><div><dt>Комиссия за перенос</dt><dd class="is-g">0${NB}₽</dd></div>
          <div><dt>До зарплаты останется</dt><dd class="is-g"><small>2${NB}300 → </small>${rub(5400)}</dd></div></dl>
      </div>
      <div class="lv-pay"><p class="lv-pay-h"><i class="lv-ico30">${I.cal}</i>6 сентября — сразу после зарплаты</p>
        <div class="lv-chips"><span class="lv-chip">${I.check}1-й перенос — 0${NB}₽</span><span class="lv-chip">${I.card}дальше — 99${NB}₽</span><span class="lv-chip">${I.shield}история не пострадает</span></div></div>
      <button type="button" class="lv-cta" data-a="confirm">Перенести платёж</button>
      <button type="button" class="lv-link" data-a="dismiss">Оставить 28 августа</button>
    </div>
  </div>

  <div class="lv-sheet lv-nm" role="dialog" aria-label="Откуда цифры" data-sheet="numbers" inert>
    <i class="lv-grab"></i>
    <div class="lv-sheet-in">
      <h3>Откуда цифры</h3>
      <p class="lv-sub">Считаем по вашим поступлениям и тратам за последние три месяца. Данные обновляются каждую ночь.</p>
      <p class="lv-nm-top">Останется до 5 сентября <span>до зарплаты · 16 дней</span></p>
      <div class="lv-nm-sum"><b>${rub(5400)}</b><span><strong>≈ ${rub(340)}</strong>в день до 5 сентября</span></div>
      <div class="lv-scale"><i style="width:55px;background:#3c4750"></i><i style="width:224px;background:#97a3ac"></i><i style="width:36px;background:#d3d8dc"></i></div>
      <div class="lv-stats">
        <span><span><em style="background:#3c4750"></em>рассрочки</span><b>${rub(8400)}</b></span><span><span><em style="background:#97a3ac"></em>траты</span><b>${rub(34200)}</b></span><span><span><em style="background:#d3d8dc"></em>остаётся</span><b>${rub(5400)}</b></span>
        <span>доход в месяц<b>${rub(48000)}</b></span><span>на рассрочки<b>17%</b></span><span>граница<b>25%</b></span>
      </div>
      <p class="lv-dyn">Рассрочки по месяцам <b>${rub(8400)} в августе</b></p>
      <div class="lv-months">${[28, 35, 43, 47, 52, 56].map((h) => `<i style="height:${h}px"></i>`).join("")}${["мар", "апр", "май", "июн", "июл", "авг"].map((m) => `<span>${m}</span>`).join("")}</div>
      <div class="lv-note"><i class="lv-ico30">${I.cal}</i><p>Доход — среднее за 3 месяца, без разовых поступлений. Траты — обязательные платежи и покупки, кроме рассрочек. Остаток — то, что реально свободно до следующей зарплаты.</p></div>
      <button type="button" class="lv-wide" data-a="dismiss">Понятно</button>
    </div>
  </div>
</div>`;
}

type State = { hub: boolean; sheet: "" | "move" | "numbers"; moved: boolean };

const proto: LiveProto = {
  design: { w: 393 },
  mount(root, ctx) {
    root.innerHTML = html();
    const app = root.querySelector<HTMLElement>(".lv-plati")!;
    app.classList.toggle("is-calm", ctx.calm);
    const $ = (s: string) => app.querySelector<HTMLElement>(s)!;
    const home = $(".lv-home");
    const hub = $(".lv-hub");
    const hubScroll = $("[data-hub-scroll]");
    const homeScroll = $(".lv-home .lv-scroll");
    const advice = $("[data-card=advice]");
    const done = $("[data-card=done]");
    const sheets = { move: $("[data-sheet=move]"), numbers: $("[data-sheet=numbers]") };
    const tlLabels = [...app.querySelectorAll<HTMLElement>("[data-tl]")];
    const hint = { open: $(".lv-w"), move: $("[data-a=move]"), confirm: $("[data-a=confirm]") };

    const st: State = { hub: false, sheet: "", moved: false };
    let step = 0;
    let timer = 0;

    /* состояние на экран; anim — карточка «Готово» въезжает, когда человек сам подтвердил перенос */
    function apply(anim = false) {
      app.classList.toggle("is-hub", st.hub);
      app.classList.toggle("is-sheet", !!st.sheet);
      app.classList.toggle("is-moved", st.moved);
      home.inert = st.hub || !!st.sheet;
      hub.inert = !st.hub || !!st.sheet;
      (Object.keys(sheets) as ("move" | "numbers")[]).forEach((n) => {
        const open = st.sheet === n;
        if (open && !sheets[n].classList.contains("is-open")) sheets[n].querySelector<HTMLElement>(".lv-sheet-in")!.scrollTop = 0;
        sheets[n].classList.toggle("is-open", open);
        sheets[n].inert = !open;
      });
      const show = st.moved ? done : advice;
      if (show.hidden && anim && !ctx.calm) { show.classList.remove("lv-enter"); void show.offsetWidth; show.classList.add("lv-enter"); }
      advice.hidden = st.moved;
      done.hidden = !st.moved;
      tlLabels.forEach((el, k) => { el.textContent = (st.moved ? TL.after : TL.before)[k]; });
      /* куда нажать */
      const target = step === 0 && !st.hub ? hint.open
        : step === 1 && st.hub && !st.sheet ? hint.move
        : step === 2 && st.sheet === "move" ? hint.confirm
        : null;
      app.querySelectorAll(".pt-hint").forEach((el) => { if (el !== target) el.classList.remove("pt-hint"); });
      target?.classList.add("pt-hint");
    }

    const reach = (k: number) => { step = k; ctx.go(k); };
    const toTop = () => hubScroll.scrollTo({ top: 0, behavior: ctx.calm ? "auto" : "smooth" });

    const act: Record<string, () => void> = {
      open() { st.hub = true; st.sheet = ""; reach(st.moved ? 3 : 1); apply(); },
      home() {
        Object.assign(st, { hub: false, sheet: "", moved: false });
        reach(0); apply();
        clearTimeout(timer);
        timer = window.setTimeout(() => { hubScroll.scrollTop = 0; }, ctx.calm ? 0 : 480);
      },
      move() { st.sheet = "move"; reach(2); apply(); },
      numbers() { if (!st.sheet) { st.sheet = "numbers"; apply(); } },
      dismiss() { const was = st.sheet; st.sheet = ""; if (was === "move") reach(1); apply(); },
      confirm() { if (st.sheet !== "move") return; st.sheet = ""; st.moved = true; toTop(); reach(3); apply(true); },
      undo() { st.moved = false; reach(1); apply(true); },
    };

    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement).closest<HTMLElement>("[data-a]");
      if (!el || !app.contains(el)) return;
      const f = act[el.dataset.a!];
      if (f) { e.preventDefault(); f(); }
    };
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "Enter" || e.key === " ") && (e.target as HTMLElement).classList.contains("lv-w")) { e.preventDefault(); act.open(); }
    };
    app.addEventListener("click", onClick);
    app.addEventListener("keydown", onKey);
    apply();

    return {
      /* состояние в начале шага k (последний — итог) */
      show(k) {
        clearTimeout(timer);
        step = k;
        Object.assign(st, { hub: k > 0, sheet: k === 2 ? "move" : "", moved: k >= 3 });
        if (k === 0) homeScroll.scrollTop = 0;
        if (k === 1 || k === 3) hubScroll.scrollTop = 0;
        apply();
      },
      destroy() {
        clearTimeout(timer);
        app.removeEventListener("click", onClick);
        app.removeEventListener("keydown", onKey);
        root.innerHTML = "";
      },
    };
  },
};
export default proto;
