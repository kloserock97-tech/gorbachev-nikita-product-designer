/* v115: живой прототип «Плати частями» — маршрут «перенести платёж к зарплате» настоящим интерфейсом.
   Главный экран банка с карточкой рассрочки → хаб (остаток, совет по Мегамаркету, покупки) → шторка
   «Проверьте новый график» → хаб после переноса с пересчитанным графиком. Сверх маршрута: «Оставить»,
   «Отменить перенос», шторка «Откуда цифры», назад из хаба. Вёрстка по макетам кейса (Figma BzIehGAJZ6BPyHDEFYffyA),
   чужих логотипов нет: магазины — буквы в кружках, аватар банка — нейтральный квадрат. Интерфейс по-русски
   на обоих языках сайта: это экран продукта. */
import type { LiveProto } from "./types";
import "./plati.css";

const NB = " ";
const rub = (n: number) => `${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, NB)}${NB}₽`;

/* свои значки: обводка 24×24 */
const p = (d: string, cls = "lv-i") => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
const I = {
  back: p('<path d="M15 4.5 7.5 12l7.5 7.5"/>'),
  info: p('<circle cx="12" cy="12" r="9.2"/><path d="M12 11v5.5"/><circle cx="12" cy="7.6" r="0.6" fill="currentColor"/>'),
  card: p('<rect x="3.5" y="6" width="17" height="12.5" rx="3"/><path d="M3.5 10.5h17M7 15h3"/>'),
  swap: p('<path d="M6 9h12l-3.5-3.5M18 15H6l3.5 3.5"/>'),
  cal: p('<rect x="4" y="5.5" width="16" height="14.5" rx="3.2"/><path d="M4 10.2h16M8.5 3.5v4M15.5 3.5v4"/>'),
  calS: p('<rect x="4" y="5.5" width="16" height="14.5" rx="3.2"/><path d="M4 10.2h16M8.5 3.5v4M15.5 3.5v4"/>', "lv-i lv-i--s"),
  dots: p('<circle cx="6" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="18" cy="12" r="1.4" fill="currentColor" stroke="none"/>'),
  x: p('<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>'),
  arrow: p('<path d="M4.5 12h14M13 6.5l5.5 5.5-5.5 5.5"/>'),
  shieldS: p('<path d="M12 3.5 19 6.2v5.3c0 4.2-3 7.5-7 9-4-1.5-7-4.8-7-9V6.2z"/><path d="m9 12 2.2 2.2L15.2 10"/>', "lv-i lv-i--s"),
  cardS: p('<rect x="3.5" y="6" width="17" height="12.5" rx="3"/><path d="M3.5 10.5h17"/>', "lv-i lv-i--s"),
  checkS: p('<path d="m5 12.5 4.2 4L19 7"/>', "lv-i lv-i--s"),
  clockS: p('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>', "lv-i lv-i--s"),
  pinS: p('<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>', "lv-i lv-i--s"),
  trend: p('<path d="m4 16.5 5.2-5.2 3.8 3.8 7-7M15 8h5v5"/>'),
  right: p('<path d="m9 5 7 7-7 7"/>'),
  up: p('<path d="m6 15 6-6 6 6"/>'),
  down: p('<path d="m6 9 6 6 6-6"/>'),
  search: p('<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/>'),
  chat: p('<path d="M12 4.5c4.7 0 8.5 3.1 8.5 7s-3.8 7-8.5 7c-1.1 0-2.2-.2-3.2-.5L4.5 19.5l1.2-3.6C4.3 14.6 3.5 13.1 3.5 11.5c0-3.9 3.8-7 8.5-7z"/>'),
  grid: '<svg class="lv-grid4" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="8" height="8" rx="2.5"/><rect x="13" y="3" width="8" height="8" rx="2.5"/><rect x="3" y="13" width="8" height="8" rx="2.5"/><rect x="13" y="13" width="8" height="8" rx="2.5"/></svg>',
  eye: p('<path d="M3 12s3.3-6 9-6c1.6 0 3 .5 4.2 1.1M21 12s-3.3 6-9 6c-1.6 0-3-.5-4.2-1.1"/><path d="M9.6 14.4a3.2 3.2 0 0 1 4.8-4.8M4.5 19.5l15-15"/>'),
  qr: p('<rect x="4" y="4" width="6" height="6" rx="1.5"/><rect x="14" y="4" width="6" height="6" rx="1.5"/><rect x="4" y="14" width="6" height="6" rx="1.5"/><path d="M14 14h2.5v2.5M20 14v.01M14 20h.01M17.5 20H20v-3"/>'),
  upArrow: p('<path d="M12 19.5v-15M6 10.5l6-6 6 6"/>'),
  sliders: p('<path d="M5 7h9M18 7h1M5 17h1M10 17h9"/><circle cx="16" cy="7" r="2.2"/><circle cx="8" cy="17" r="2.2"/>'),
  star: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2.8 2.6 6 6.4.6-4.9 4.3 1.5 6.3L12 16.7 6.4 20l1.5-6.3L3 9.4l6.4-.6z"/></svg>',
  /* таб-бар */
  tHome: p('<path d="M4 10.5 12 4l8 6.5V19a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19z"/><path d="M9.5 20.5v-6h5v6"/>'),
  tSave: p('<rect x="4" y="4" width="16" height="16" rx="3.5"/><path d="M8.5 16v-3M12 16V8.5M15.5 16v-5"/>'),
  tLife: p('<path d="m12 3.8 2.5 5.3 5.8.7-4.3 4 1.1 5.7L12 16.7l-5.1 2.8 1.1-5.7-4.3-4 5.8-.7z"/>'),
  tPay: p('<rect x="4" y="4" width="16" height="16" rx="3.5"/><path d="M8 12h8M13 8.5l3.5 3.5-3.5 3.5"/>'),
  tCred: p('<rect x="3.5" y="5.5" width="17" height="13" rx="3.5"/><path d="M3.5 10h17M14 14.5h3"/>'),
};
const SB = `<div class="lv-sb" aria-hidden="true"><b>9:41</b><span>
  <svg width="19" height="12" viewBox="0 0 19 12"><rect x="0" y="8" width="3.2" height="4" rx="1"/><rect x="5" y="5.5" width="3.2" height="6.5" rx="1"/><rect x="10" y="3" width="3.2" height="9" rx="1"/><rect x="15" y="0" width="3.2" height="12" rx="1"/></svg>
  <svg width="17" height="12" viewBox="0 0 17 12"><path d="M8.5 2.2c2.4 0 4.6.9 6.3 2.5l1.3-1.4A10.9 10.9 0 0 0 8.5.3 10.9 10.9 0 0 0 .9 3.3l1.3 1.4a9 9 0 0 1 6.3-2.5zm0 3.8c1.4 0 2.7.5 3.6 1.4l1.3-1.4A7.2 7.2 0 0 0 8.5 4a7.2 7.2 0 0 0-4.9 2l1.3 1.4c1-.9 2.2-1.4 3.6-1.4zm0 3.6-2 2.1 2 2.1 2-2.1z"/></svg>
  <svg width="27" height="13" viewBox="0 0 27 13"><rect x="0.6" y="0.6" width="22.8" height="11.8" rx="3.6" fill="none" stroke="currentColor" stroke-opacity=".4" stroke-width="1.2"/><rect x="2.4" y="2.4" width="19.2" height="8.2" rx="2.2"/><path d="M25 4.4v4.2c.9-.3 1.5-1.1 1.5-2.1S25.9 4.7 25 4.4z" fill-opacity=".45"/></svg>
</span></div>`;
const TABS = `<nav class="lv-tabs" aria-hidden="true">
  <span class="is-on">${I.tHome}Главный</span><span>${I.tSave}Накопления</span><span>${I.tLife}Для жизни</span><span>${I.tPay}Платежи</span><span>${I.tCred}Кредиты</span></nav>`;
const ltr = (k: string, t: string) => `<i class="lv-ltr lv-ltr--${k}">${t}</i>`;
const calLeaf = (m: string, d: string, mod = "") => `<span class="lv-cal${mod}" aria-hidden="true"><b>${m}</b><em>${d}</em></span>`;
/* два листка календаря и стрелка «переезда» — своя картинка */
const ART_MOVE = (cls: string, id: string) => `<svg class="${cls}" viewBox="0 0 120 90" aria-hidden="true">
  <defs><linearGradient id="${id}" x1="0" x2="1"><stop offset="0" stop-color="#bfeccc"/><stop offset="1" stop-color="#5fc483"/></linearGradient></defs>
  <g transform="rotate(-9 30 56)"><rect x="10" y="34" width="40" height="44" rx="7" fill="#eef0ef" stroke="#d3d7d5"/><rect x="10" y="34" width="40" height="11" rx="6" fill="#d9dddb"/>
  ${[0, 1, 2].map((r) => [0, 1, 2].map((c) => `<rect x="${17 + c * 9}" y="${51 + r * 8}" width="6" height="5" rx="1.5" fill="#a9b0ad"/>`).join("")).join("")}</g>
  <g transform="rotate(6 90 48)"><rect x="70" y="26" width="40" height="44" rx="7" fill="#f3faf5" stroke="#cfe7d7"/><rect x="70" y="26" width="40" height="11" rx="6" fill="#7fd39d"/>
  ${[0, 1, 2].map((r) => [0, 1, 2].map((c) => `<rect x="${77 + c * 9}" y="${43 + r * 8}" width="6" height="5" rx="1.5" fill="${r === 1 && c === 1 ? "#2fa65a" : "#cfe2d6"}"/>`).join("")).join("")}</g>
  <path d="M26 30c8-18 22-6 34-14s18-8 26 0" fill="none" stroke="url(#${id})" stroke-width="5" stroke-linecap="round"/>
  <path d="m80 9 9 6-10 4z" fill="#5fc483"/></svg>`;
const COINS = `<div class="lv-coins" aria-hidden="true"><i class="lv-coin" style="left:2px;top:4px"></i><i class="lv-coin lv-coin--ring" style="left:48px;top:0"></i><i class="lv-coin" style="left:0;top:30px"></i><i class="lv-coin" style="left:46px;top:28px"></i></div>`;
const MAP = `<svg class="lv-map" viewBox="0 0 48 48" aria-hidden="true"><path d="M-2 30 50 16M14-2l8 52M30-2l-4 52" stroke="#e3e6ea" stroke-width="5" fill="none"/><path d="M24 11c-4.4 0-8 3.4-8 7.7 0 5.7 8 13.3 8 13.3s8-7.6 8-13.3c0-4.3-3.6-7.7-8-7.7z" fill="#2b74e8"/><circle cx="24" cy="18.6" r="3" fill="#fff"/></svg>`;

/* график Мегамаркета: до переноса и после */
const TL = {
  before: [["1 июля", "done"], ["15 июля", "done"], ["28 августа", "now"], ["11 сентября", "later"]],
  after: [["1 июля", "done"], ["15 июля", "done"], ["6 сентября", "now"], ["20 сентября", "later"]],
} as const;

function html() {
  const tl = TL.before.map(([d, s], k) => `<span class="is-${s}"><i>${s === "done" ? I.checkS : ""}</i><em data-tl="${k}">${d}</em><b>${rub(3100)}</b></span>`).join("");
  return `<div class="lv-plati">
  <section class="lv-scr lv-home" aria-label="Главный экран банка">
    ${SB}
    <div class="lv-scroll">
      <div class="lv-top"><i class="lv-ava" aria-hidden="true"></i><span class="lv-search">${I.search}Поиск</span>${I.chat}${I.grid}</div>
      <div class="lv-bal"><p class="lv-bal-sum">${I.eye}${rub(103913)}${I.right}</p><p class="lv-bonus">1${NB}240 <i>${I.star}</i></p></div>
      <div class="lv-quick" aria-hidden="true"><span>${I.qr}QR-код</span><span>${I.upArrow}Перевести</span><span>${I.sliders}Настроить</span></div>
      <div class="lv-w lv-press" role="button" tabindex="0" data-a="open" aria-label="Плати частями: открыть">
        <div class="lv-w-head"><span class="lv-w-ico" aria-hidden="true"><i class="lv-coin" style="width:16px;height:13px;left:4px;top:13px"></i><i class="lv-coin" style="width:16px;height:13px;left:14px;top:15px"></i><i class="lv-coin lv-coin--ring" style="width:16px;height:13px;left:14px;top:5px;box-shadow:inset 0 0 0 4px #9fe5bf"></i></span>
          <b>Плати частями</b><span class="lv-w-more">3 покупки ${I.right}</span></div>
        <p class="lv-w-lab">Ближайший платёж</p>
        <div class="lv-w-row"><b class="lv-w-sum">${rub(3100)}</b><p class="lv-w-left"><b>${rub(12450)}</b>остаток по всем</p></div>
        <p class="lv-w-store">${ltr("mm", "М")}<b>Мегамаркет</b> · 28 августа</p>
        <div class="lv-tip"><i class="lv-tip-ico">${I.cal}</i><div class="lv-tip-txt"><b>Лучше после зарплаты</b><span>6 сентября <em class="lv-free">бесплатно</em></span></div>
          <button type="button" class="lv-btn-g lv-press" data-a="quick">Перенести</button></div>
        <div class="lv-next">Дальше <span>${ltr("mv", "М")}5 сен</span><span>${ltr("rv", "R")}12 сен</span></div>
      </div>
      <div class="lv-transfers" aria-hidden="true"><b>Переводы</b><div class="lv-people"><span><i>А</i>Анна</span><span><i>Д</i>Дима</span><span><i>М</i>Мама</span><span><i>+</i>Новый</span></div></div>
    </div>
    ${TABS}
    <i class="lv-shade"></i>
  </section>

  <section class="lv-scr lv-hub" aria-label="Плати частями" inert>
    <div class="lv-hub-head">${SB}<div class="lv-nav"><button type="button" class="lv-press" data-a="home" aria-label="Назад">${I.back}</button><h3>Плати частями</h3><button type="button" class="lv-press" data-a="numbers" aria-label="Откуда цифры">${I.info}</button></div></div>
    <div class="lv-scroll" data-hub-scroll>
      <div class="lv-sum"><p>Осталось выплатить</p><h2>${rub(12450)}</h2>${COINS}</div>
      <div class="lv-bar"><i></i></div>
      <p class="lv-bar-cap"><span>3 покупки · 7 из 12 платежей</span><span>последний — 12 сен</span></p>
      <div class="lv-acts" aria-hidden="true"><span><i>${I.card}</i>Оплатить</span><span><i>${I.swap}</i>Другая дата</span><span><i>${I.cal}<b class="lv-dot"></b></i>Календарь</span><span><i>${I.dots}</i>Ещё</span></div>

      <div class="lv-slot">
        <div class="lv-card" data-card="advice">
          <div class="lv-card-head">${ltr("mm", "М")}<b>Мегамаркет</b>2 из 4 оплачено<button type="button" class="lv-x lv-press" data-a="keep" aria-label="Скрыть совет">${I.x}</button></div>
          <div class="lv-adv"><div><h4>28 августа спишем<br>${rub(3100)}</h4><p>останется ${rub(2300)} на 8${NB}дней до зарплаты</p></div>${ART_MOVE("", "lvpg1")}</div>
          <div class="lv-dates"><span class="lv-was">${I.calS}28 авг</span>${I.arrow}<span class="lv-will">${I.calS}6 сен</span><em class="lv-tag">бесплатно</em></div>
          <div class="lv-duo"><button type="button" class="lv-btn-g lv-press" data-a="move">Перенести на 6 сен</button><button type="button" class="lv-btn-soft lv-press" data-a="keep">Оставить</button></div>
          <div class="lv-chips"><span class="lv-chip">${I.cardS}спишем с •• 4417</span><span class="lv-chip">${I.shieldS}не влияет на историю</span></div>
          <button type="button" class="lv-why lv-press" data-a="numbers"><i>${I.trend}</i><b>Откуда цифры</b><span>остаётся ${rub(5400)}${I.right}</span></button>
        </div>
        <div class="lv-card lv-kept" data-card="kept" hidden>
          <div><b>Оставили 28 августа</b>спишем ${rub(3100)} за Мегамаркет</div>
          <button type="button" class="lv-press" data-a="unkeep">Вернуть совет</button>
        </div>
        <div class="lv-card lv-done" data-card="done" hidden>
          <div class="lv-done-top"><div><h4>Готово — платёж Мегамаркета теперь 6${NB}сентября</h4><p>Свободных денег до зарплаты стало больше ровно на платёж${NB}— ${rub(3100)}</p></div>${calLeaf("СЕН", "6", " lv-cal--g lv-cal--big")}</div>
          <button type="button" class="lv-wide lv-press" data-a="undo">Отменить перенос</button>
          <div class="lv-chips"><span class="lv-chip">${I.clockS}отмена возможна до 5 сентября</span></div>
        </div>
      </div>

      <h3 class="lv-h2">Мои покупки</h3>
      <div class="lv-seg" aria-hidden="true"><span class="is-on">Активные <b>3</b></span><span>Завершённые <b>6</b></span><span>Все <b>9</b></span></div>
      <div class="lv-list">
        <div class="lv-row">${ltr("mm", "М")}<div class="lv-row-main"><b>Мегамаркет</b><span>2 из 4 оплачено · по ${rub(3100)}</span></div><p class="lv-row-sum"><b>${rub(6200)}</b>осталось</p>${I.up}</div>
        <div class="lv-tl" data-tl-box><i class="lv-tl-rest"></i>${tl}</div>
        <div class="lv-row">${ltr("mv", "М")}<div class="lv-row-main"><b>М.Видео</b><span>2 из 4 оплачено · <i class="lv-nw">${rub(2300)} 5${NB}сен</i></span><span class="lv-chip">${I.cardS}после зарплаты</span></div><p class="lv-row-sum"><b>${rub(4600)}</b>осталось</p>${I.down}</div>
        <div class="lv-row">${ltr("rv", "R")}<div class="lv-row-main"><b>Rendez-Vous</b><span>3 из 4 оплачено · <i class="lv-nw">${rub(1650)} 12${NB}сен</i></span><span class="lv-chip">${I.checkS}остался последний платёж</span></div><p class="lv-row-sum"><b>${rub(1650)}</b>осталось</p>${I.down}</div>
      </div>
      <div class="lv-offer" aria-hidden="true">
        <div class="lv-offer-top"><span class="lv-offer-tag">${ltr("sm", "С")}СПОРТМАСТЕР · ВЧЕРА</span>
          <p class="lv-offer-sum">${rub(1800)} <span>× 4 платежа</span></p><div class="lv-offer-bars"><i></i><i></i><i></i><i></i></div>
          <p>всего ${rub(7200)} · первый через 2 недели</p><div class="lv-offer-art"><i></i><i></i><b>₽</b></div></div>
        <div class="lv-perf"></div>
        <div class="lv-offer-bot"><span class="lv-btn-g">Разделить покупку</span><span>${I.shieldS}бесплатно · 14 дней</span></div>
      </div>
      <p class="lv-more">ещё 2 покупки · OZON и Летуаль</p>
      <div class="lv-near" aria-hidden="true">${MAP}<div><b>Где рядом можно частями</b>12 магазинов в 15 минутах пешком</div>${I.right}</div>
    </div>
    ${TABS}
  </section>

  <div class="lv-back" data-a="dismiss"></div>

  <div class="lv-sheet lv-mv" role="dialog" aria-label="Проверьте новый график" data-sheet="move" inert>
    <i class="lv-grab"></i>
    <div class="lv-sheet-in">
      ${ART_MOVE("lv-mv-art", "lvpg2")}
      <h3>Проверьте новый график</h3>
      <p class="lv-mv-sub">Двигаем только этот платёж — ${rub(3100)}. Остальные покупки и их даты не меняются.</p>
      <div class="lv-ticket">
        <div class="lv-ticket-cal"><span>${calLeaf("АВГ", "28", " lv-cal--x")}было</span>${I.arrow}<span>${calLeaf("СЕН", "6", " lv-cal--g")}станет</span></div>
        <div class="lv-perf"></div>
        <dl><div><dt>Сумма платежа</dt><dd>${rub(3100)}</dd></div><div><dt>Комиссия за перенос</dt><dd class="is-g">0${NB}₽</dd></div>
          <div><dt>До зарплаты останется</dt><dd class="is-g"><small>2${NB}300 → </small><span data-left>${rub(5400)}</span></dd></div></dl>
      </div>
      <div class="lv-pay"><p class="lv-pay-h"><i>${I.cal}</i>6 сентября — сразу после зарплаты</p>
        <div class="lv-chips"><span class="lv-chip">${I.checkS}1-й перенос — 0${NB}₽</span><span class="lv-chip">${I.cardS}дальше — 99${NB}₽</span><span class="lv-chip">${I.shieldS}история не пострадает</span></div></div>
      <button type="button" class="lv-cta lv-press" data-a="confirm"><span>Перенести платёж</span><i class="lv-spin"></i></button>
      <button type="button" class="lv-link lv-press" data-a="dismiss">Оставить 28 августа</button>
    </div>
  </div>

  <div class="lv-sheet lv-nm" role="dialog" aria-label="Откуда цифры" data-sheet="numbers" inert>
    <i class="lv-grab"></i>
    <div class="lv-sheet-in">
      <h3>Откуда цифры</h3>
      <p class="lv-nm-sub">Считаем по вашим поступлениям и тратам за последние три месяца. Данные обновляются каждую ночь.</p>
      <p class="lv-nm-row">Останется до 5 сентября <span>до зарплаты · 16 дней</span></p>
      <div class="lv-nm-big"><b>${rub(5400)}</b><span><strong>≈ ${rub(340)}</strong>в день до 5 сентября</span></div>
      <div class="lv-split"><i class="lv-grow" style="flex:8.4;background:#3a4650"></i><i class="lv-grow" style="flex:34.2;background:#97a4ad"></i><i class="lv-grow" style="flex:5.4;background:#d6dade"></i></div>
      <div class="lv-legend">
        <span><em style="background:#3a4650"></em>рассрочки<b>${rub(8400)}</b></span><span><em style="background:#97a4ad"></em>траты<b>${rub(34200)}</b></span><span><em style="background:#d6dade"></em>остаётся<b>${rub(5400)}</b></span>
        <span>доход в месяц<b>${rub(48000)}</b></span><span>на рассрочки<b>17%</b></span><span>граница<b>25%</b></span>
      </div>
      <p class="lv-months-h">Рассрочки по месяцам <b>${rub(8400)} в августе</b></p>
      <div class="lv-months">${[38, 48, 58, 64, 70, 76].map((h) => `<i class="lv-grow" style="height:${h}px"></i>`).join("")}</div>
      <div class="lv-months-l">${["мар", "апр", "май", "июн", "июл", "авг"].map((m) => `<span>${m}</span>`).join("")}</div>
      <div class="lv-note"><i>${I.cal}</i><p>Доход — среднее за 3 месяца, без разовых поступлений. Траты — обязательные платежи и покупки, кроме рассрочек. Остаток — то, что реально свободно до следующей зарплаты.</p></div>
      <button type="button" class="lv-wide lv-press" data-a="dismiss">Понятно</button>
    </div>
  </div>
  <i class="lv-homebar"></i>
</div>`;
}

type State = { hub: boolean; sheet: "" | "move" | "numbers"; moved: boolean; kept: boolean };

const proto: LiveProto = {
  design: { w: 393 },
  mount(root, ctx) {
    root.innerHTML = html();
    const app = root.querySelector<HTMLElement>(".lv-plati")!;
    app.classList.toggle("is-calm", ctx.calm);
    const $ = <T extends HTMLElement = HTMLElement>(s: string) => app.querySelector<T>(s)!;
    const home = $(".lv-home");
    const hub = $(".lv-hub");
    const hubScroll = $("[data-hub-scroll]");
    const hubHead = $(".lv-hub-head");
    const homeScroll = $(".lv-home .lv-scroll");
    const card = { advice: $("[data-card=advice]"), kept: $("[data-card=kept]"), done: $("[data-card=done]") };
    const sheets = { move: $("[data-sheet=move]"), numbers: $("[data-sheet=numbers]") };
    const cta = $<HTMLButtonElement>("[data-a=confirm]");
    const left = $("[data-left]");
    const tlLabels = [...app.querySelectorAll<HTMLElement>("[data-tl]")];
    const hint = {
      open: $("[data-a=open]"),
      move: $(".lv-duo [data-a=move]"),
      unkeep: $("[data-a=unkeep]"),
      confirm: cta,
    };

    const st: State = { hub: false, sheet: "", moved: false, kept: false };
    let step = 0;
    let timers: number[] = [];
    let raf = 0;
    const later = (f: () => void, ms: number) => { if (ctx.calm) f(); else timers.push(window.setTimeout(f, ms)); };
    const stopAll = () => { timers.forEach(clearTimeout); timers = []; cancelAnimationFrame(raf); cta.classList.remove("is-busy"); };

    /* «до зарплаты останется» досчитывает от 2 300 до 5 400, когда шторка поднялась */
    function countUp(from: number, to: number, ms: number) {
      cancelAnimationFrame(raf);
      if (ctx.calm) { left.textContent = rub(to); return; }
      const t0 = performance.now() + 260;
      const tick = (t: number) => {
        const k = Math.min(1, Math.max(0, (t - t0) / ms));
        const e = 1 - Math.pow(1 - k, 3);
        left.textContent = rub(Math.round((from + (to - from) * e) / 10) * 10);
        if (k < 1) raf = requestAnimationFrame(tick);
      };
      left.textContent = rub(from);
      raf = requestAnimationFrame(tick);
    }

    function swapCard(name: keyof typeof card, anim: boolean) {
      (Object.keys(card) as (keyof typeof card)[]).forEach((n) => {
        const el = card[n];
        const on = n === name;
        if (on && el.hidden && anim && !ctx.calm) { el.classList.remove("lv-enter"); void el.offsetWidth; el.classList.add("lv-enter"); }
        el.hidden = !on;
      });
    }

    function paintTimeline(moved: boolean, anim: boolean) {
      const rows = moved ? TL.after : TL.before;
      tlLabels.forEach((el, k) => {
        if (el.textContent === rows[k][0]) return;
        el.textContent = rows[k][0];
        if (anim && !ctx.calm) { el.classList.remove("lv-flash"); void el.offsetWidth; el.classList.add("lv-flash"); }
      });
    }

    /* состояние на экран; anim — человек сам нажал (а не переход по списку шагов) */
    function apply(anim = true) {
      app.classList.toggle("is-hub", st.hub);
      home.inert = st.hub || !!st.sheet;
      hub.inert = !st.hub || !!st.sheet;
      app.classList.toggle("is-sheet", !!st.sheet);
      (Object.keys(sheets) as ("move" | "numbers")[]).forEach((n) => {
        const open = st.sheet === n;
        if (open && !sheets[n].classList.contains("is-open")) sheets[n].querySelector<HTMLElement>(".lv-sheet-in")!.scrollTop = 0;
        sheets[n].classList.toggle("is-open", open);
        sheets[n].inert = !open;
      });
      swapCard(st.moved ? "done" : st.kept ? "kept" : "advice", anim);
      paintTimeline(st.moved, anim);
      /* куда нажать */
      const target = st.sheet === "numbers" ? null
        : step === 0 && !st.hub ? hint.open
        : step === 1 && st.hub && !st.sheet && !st.moved ? (st.kept ? hint.unkeep : hint.move)
        : step === 2 && st.sheet === "move" ? hint.confirm
        : null;
      app.querySelectorAll(".pt-hint").forEach((el) => { if (el !== target) el.classList.remove("pt-hint"); });
      target?.classList.add("pt-hint");
    }

    const reach = (k: number) => { step = k; ctx.go(k); };
    function toTop() { hubScroll.scrollTo({ top: 0, behavior: ctx.calm ? "auto" : "smooth" }); }

    function openMove() {
      st.sheet = "move";
      reach(2);
      apply();
      countUp(2300, 5400, 700);
    }

    const act: Record<string, () => void> = {
      open() { stopAll(); st.hub = true; st.sheet = ""; reach(st.moved ? 3 : 1); apply(); },
      /* «Перенести» прямо на главном: хаб въезжает и сразу поднимается шторка */
      quick() {
        stopAll();
        if (st.moved) return act.open();
        st.hub = true; st.kept = false; hubScroll.scrollTop = 0; apply();
        later(openMove, 320);
      },
      home() { stopAll(); Object.assign(st, { hub: false, sheet: "", moved: false, kept: false }); reach(0); apply(); later(() => { hubScroll.scrollTop = 0; }, 480); },
      move() { stopAll(); openMove(); },
      keep() { st.kept = true; apply(); },
      unkeep() { st.kept = false; apply(); },
      numbers() { if (st.sheet) return; st.sheet = "numbers"; apply(); },
      dismiss() {
        if (cta.classList.contains("is-busy")) return;
        const was = st.sheet;
        st.sheet = "";
        if (was === "move") reach(1);
        apply();
      },
      confirm() {
        if (st.sheet !== "move" || cta.classList.contains("is-busy")) return;
        if (!ctx.calm) cta.classList.add("is-busy");
        later(() => {
          cta.classList.remove("is-busy");
          st.sheet = ""; st.moved = true; st.kept = false;
          toTop();
          reach(3);
          apply();
        }, 650);
      },
      undo() { stopAll(); st.moved = false; reach(1); apply(); toTop(); },
    };

    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement).closest<HTMLElement>("[data-a]");
      if (!el || !app.contains(el)) return;
      const f = act[el.dataset.a!];
      if (f) { e.preventDefault(); f(); }
    };
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if ((e.key === "Enter" || e.key === " ") && el.dataset.a === "open") { e.preventDefault(); act.open(); }
    };
    const onScroll = () => hubHead.classList.toggle("is-scrolled", hubScroll.scrollTop > 4);
    app.addEventListener("click", onClick);
    app.addEventListener("keydown", onKey);
    hubScroll.addEventListener("scroll", onScroll, { passive: true });
    apply(false);

    return {
      /* состояние в начале шага k (последний — итог) */
      show(k) {
        stopAll();
        step = k;
        const was = { ...st };
        Object.assign(st, { hub: k > 0, sheet: k === 2 ? "move" : "", moved: k >= 3, kept: false });
        if (k === 0) homeScroll.scrollTop = 0;
        if (k > 0 && (!was.hub || k === 1 || k === 3)) hubScroll.scrollTop = 0;
        apply(was.moved !== st.moved);
        if (k === 2) countUp(2300, 5400, 700);
        onScroll();
      },
      destroy() {
        stopAll();
        app.removeEventListener("click", onClick);
        app.removeEventListener("keydown", onKey);
        hubScroll.removeEventListener("scroll", onScroll);
        root.innerHTML = "";
      },
    };
  },
};
export default proto;
