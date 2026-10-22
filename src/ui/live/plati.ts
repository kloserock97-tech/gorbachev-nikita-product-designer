/* v115: живой прототип «Плати частями» — маршрут «перенести платёж к зарплате» настоящим интерфейсом.
   Главный экран банка с карточкой рассрочки → хаб (остаток, совет по Мегамаркету, покупки) → шторка
   «Проверьте новый график» → хаб после переноса с новым графиком и подсказкой «Платёж перенесён».
   Кроме маршрута — только то, что есть в макетах: «Оставить 28 августа» закрывает шторку, «Отменить перенос»
   возвращает совет, «Откуда цифры» открывает разбор расчёта, стрелка «назад» ведёт на главный.
   Вёрстка, значки и картинки — из Figma Никиты (BzIehGAJZ6BPyHDEFYffyA, страница «Screens»): значки — SVG
   из макета, 3D-предметы, листки календаря и форма билета — экспорт @2x в public/cases/plati-chastyami/live/.
   Логотипов банка и магазинов нет: магазины — буквы в кружках, аватар — нейтральный квадрат, вместо значка
   бонусов — звезда, с карты в «веере» стёрто название банка. Интерфейс по-русски на обоих языках сайта. */
import type { LiveProto } from "./types";
import "./plati.css";

const NB = " ";
const rub = (n: number) => `${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, NB)}${NB}₽`;

/* значки из макета (экспорт SVG из Figma), размер задаёт CSS */
const svg = (vb: string, inner: string, cls = "") => `<svg${cls ? ` class="${cls}"` : ""} viewBox="${vb}" fill="none" aria-hidden="true">${inner}</svg>`;
const S = (c: string, w = 1.7) => `stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`;
const I = {
  search: svg("0 0 18 18", `<path d="M11.775 11.775L15.375 15.375M2.625 7.875C2.625 4.975 4.975 2.625 7.875 2.625C10.775 2.625 13.125 4.975 13.125 7.875C13.125 10.775 10.775 13.125 7.875 13.125C4.975 13.125 2.625 10.775 2.625 7.875Z" ${S("#5F6B75", 1.6)}/>`, "lv-ic18"),
  chat: svg("0 0 24 24", `<path d="M4 10.65C4 6.85 7.1 3.75 10.9 3.75H13.1C16.9 3.75 20 6.85 20 10.65C20 14.45 16.9 17.55 13.1 17.55H8.7L4.7 20.25L5.4 16.85C4.5 15.25 4 13.05 4 10.65Z" ${S("#101418")}/>`, "lv-ic24"),
  grid: svg("0 0 24 24", ["M5.5 3.6H8.7C9.75 3.6 10.6 4.45 10.6 5.5V8.7C10.6 9.75 9.75 10.6 8.7 10.6H5.5C4.45 10.6 3.6 9.75 3.6 8.7V5.5C3.6 4.45 4.45 3.6 5.5 3.6Z", "M15.3 3.6H18.5C19.55 3.6 20.4 4.45 20.4 5.5V8.7C20.4 9.75 19.55 10.6 18.5 10.6H15.3C14.25 10.6 13.4 9.75 13.4 8.7V5.5C13.4 4.45 14.25 3.6 15.3 3.6Z", "M5.5 13.4H8.7C9.75 13.4 10.6 14.25 10.6 15.3V18.5C10.6 19.55 9.75 20.4 8.7 20.4H5.5C4.45 20.4 3.6 19.55 3.6 18.5V15.3C3.6 14.25 4.45 13.4 5.5 13.4Z", "M15.3 13.4H18.5C19.55 13.4 20.4 14.25 20.4 15.3V18.5C20.4 19.55 19.55 20.4 18.5 20.4H15.3C14.25 20.4 13.4 19.55 13.4 18.5V15.3C13.4 14.25 14.25 13.4 15.3 13.4Z"].map((d) => `<path d="${d}" fill="#101418"/>`).join(""), "lv-ic24"),
  eye: svg("0 0 22 22", `<path d="M4.217 17.783L17.783 4.217M2.75 11C5.5 6.875 8.25 5.042 11 5.042C13.75 5.042 16.5 6.875 19.25 11C16.5 15.125 13.75 16.958 11 16.958C8.25 16.958 5.5 15.125 2.75 11ZM8.25 11C8.25 9.481 9.481 8.25 11 8.25C12.519 8.25 13.75 9.481 13.75 11C13.75 12.519 12.519 13.75 11 13.75C9.481 13.75 8.25 12.519 8.25 11Z" ${S("#5A5A62")}/>`, "lv-ic22"),
  chevBal: svg("0 0 20 20", `<path d="M7.333 4.667L12.667 10L7.333 15.333" ${S("#5A5A62", 2)}/>`, "lv-ic20"),
  qr: svg("0 0 24 24", `<path d="M13.9 13.9V16.6M20.5 16.6V20.5M13.9 20.5H17.2M17.2 13.9V14M5.2 3.5H8.4C9.339 3.5 10.1 4.261 10.1 5.2V8.4C10.1 9.339 9.339 10.1 8.4 10.1H5.2C4.261 10.1 3.5 9.339 3.5 8.4V5.2C3.5 4.261 4.261 3.5 5.2 3.5ZM15.6 3.5H18.8C19.739 3.5 20.5 4.261 20.5 5.2V8.4C20.5 9.339 19.739 10.1 18.8 10.1H15.6C14.661 10.1 13.9 9.339 13.9 8.4V5.2C13.9 4.261 14.661 3.5 15.6 3.5ZM5.2 13.9H8.4C9.339 13.9 10.1 14.661 10.1 15.6V18.8C10.1 19.739 9.339 20.5 8.4 20.5H5.2C4.261 20.5 3.5 19.739 3.5 18.8V15.6C3.5 14.661 4.261 13.9 5.2 13.9Z" ${S("#101418", 1.8)}/>`, "lv-ic24"),
  up: svg("0 0 24 24", `<path d="M12 19.3V4.7M18.1 10.8L12 4.7L5.9 10.8" ${S("#101418", 1.8)}/>`, "lv-ic24"),
  gear: svg("0 0 24 24", `<path transform="translate(1.74 1.74)" fill-rule="evenodd" clip-rule="evenodd" d="M17.91 8.28L20.52 8.54V11.98L17.91 12.24L17.75 12.77L17.56 13.28L17.33 13.78L17.07 14.27L18.73 16.3L16.3 18.73L14.27 17.07L13.78 17.33L13.28 17.56L12.77 17.75L12.24 17.91L11.98 20.52H8.54L8.28 17.91L7.75 17.75L7.24 17.56L6.74 17.33L6.25 17.07L4.22 18.73L1.79 16.3L3.45 14.27L3.19 13.78L2.96 13.28L2.77 12.77L2.61 12.24L0 11.98V8.54L2.61 8.28L2.77 7.75L2.96 7.24L3.19 6.74L3.45 6.25L1.79 4.22L4.22 1.79L6.25 3.45L6.74 3.19L7.24 2.96L7.75 2.77L8.28 2.61L8.54 0H11.98L12.24 2.61L12.77 2.77L13.28 2.96L13.78 3.19L14.27 3.45L16.3 1.79L18.73 4.22L17.07 6.25L17.33 6.74L17.56 7.24L17.75 7.75L17.91 8.28ZM13.96 10.26L13.87 9.44L13.59 8.65L13.15 7.95L12.57 7.37L11.87 6.93L11.08 6.65L10.26 6.56L9.44 6.65L8.65 6.93L7.95 7.37L7.37 7.95L6.93 8.65L6.65 9.44L6.56 10.26L6.65 11.08L6.93 11.87L7.37 12.57L7.95 13.15L8.65 13.59L9.44 13.87L10.26 13.96L11.08 13.87L11.87 13.59L12.57 13.15L13.15 12.57L13.59 11.87L13.87 11.08L13.96 10.26Z" fill="#101418"/>`, "lv-ic24"),
  cal18: svg("0 0 18 18", `<path d="M6 2.588V5.738M12 2.588V5.738M2.625 7.988H15.375M4.575 4.088H13.425C14.502 4.088 15.375 4.961 15.375 6.038V13.463C15.375 14.54 14.502 15.413 13.425 15.413H4.575C3.498 15.413 2.625 14.54 2.625 13.463V6.038C2.625 4.961 3.498 4.088 4.575 4.088Z" ${S("#3C4750")}/>`, "lv-ic18"),
  cal17: svg("0 0 17 17", `<path d="M5.667 2.444V5.419M11.333 2.444V5.419M2.479 7.544H14.521M4.321 3.86H12.679C13.696 3.86 14.521 4.685 14.521 5.702V12.715C14.521 13.732 13.696 14.556 12.679 14.556H4.321C3.304 14.556 2.479 13.732 2.479 12.715V5.702C2.479 4.685 3.304 3.86 4.321 3.86Z" ${S("#3C4750")}/>`, "lv-ic17"),
  cal15: (c: string) => svg("0 0 15 15", `<path d="M5 2.156V4.781M10 2.156V4.781M2.188 6.656H12.813M3.813 3.406H11.188C12.085 3.406 12.813 4.134 12.813 5.031V11.219C12.813 12.116 12.085 12.844 11.188 12.844H3.813C2.915 12.844 2.188 12.116 2.188 11.219V5.031C2.188 4.134 2.915 3.406 3.813 3.406Z" ${S(c, 1.8)}/>`, "lv-ic15"),
  arrowR: svg("0 0 16 16", `<path d="M3 8H13M8.933 12.067L13 8L8.933 3.933" ${S("#0E7A34", 2)}/>`, "lv-ic16"),
  close: svg("0 0 15 15", `<path d="M3.875 3.875L11.125 11.125M11.125 3.875L3.875 11.125" ${S("#9AA3AB", 1.9)}/>`, "lv-ic15"),
  wallet12: (c = "#5F6B75") => svg("0 0 12 12", `<path d="M1.7 5.05H10.3M8.2 7.45H8.95M3.2 2.75H8.8C9.628 2.75 10.3 3.422 10.3 4.25V7.75C10.3 8.578 9.628 9.25 8.8 9.25H3.2C2.372 9.25 1.7 8.578 1.7 7.75V4.25C1.7 3.422 2.372 2.75 3.2 2.75Z" ${S(c)}/>`, "lv-ic12"),
  shield12: svg("0 0 12 12", `<path d="M4.4 6.025L5.6 7.225L7.8 4.725M6 1.625L10 3.125V5.925C10 8.175 8.25 9.775 6 10.375C3.75 9.775 2 8.175 2 5.925V3.125L6 1.625Z" ${S("#5F6B75")}/>`, "lv-ic12"),
  shield14: svg("0 0 14 14", `<path d="M5.133 7.029L6.533 8.429L9.1 5.513M7 1.896L11.667 3.646V6.913C11.667 9.538 9.625 11.404 7 12.104C4.375 11.404 2.333 9.538 2.333 6.913V3.646L7 1.896Z" ${S("#5A6670")}/>`, "lv-ic14"),
  check12: (c = "#5F6B75") => svg("0 0 12 12", `<path d="M2.4 6.2L4.9 8.7L9.6 3.3" ${S(c)}/>`, "lv-ic12"),
  clock12: svg("0 0 12 12", `<path d="M6 3.4V6.1L7.8 7.2M1.75 6C1.75 3.653 3.653 1.75 6 1.75C8.347 1.75 10.25 3.653 10.25 6C10.25 8.347 8.347 10.25 6 10.25C3.653 10.25 1.75 8.347 1.75 6Z" ${S("#5F6B75")}/>`, "lv-ic12"),
  trend: svg("0 0 15 15", `<path d="M2.5 10.375L5.75 7.125L7.875 9.25L12.5 4.625M12.5 7.5V4.625H9.625" ${S("#5F6B75")}/>`, "lv-ic15"),
  check13: svg("0 0 13 13", `<path d="M2.6 6.717L5.308 9.425L10.4 3.575" ${S("#FFFFFF", 2.6)}/>`, "lv-ic13"),
  pin: svg("0 0 14 14", `<path d="M7 12.133C7 12.133 11.083 8.867 11.083 5.95C11.083 3.675 9.275 1.867 7 1.867C4.725 1.867 2.917 3.675 2.917 5.95C2.917 8.867 7 12.133 7 12.133Z" ${S("#5B6470")}/><path d="M5.483 5.833C5.483 4.996 6.162 4.317 7 4.317C7.838 4.317 8.517 4.996 8.517 5.833C8.517 6.671 7.838 7.35 7 7.35C6.162 7.35 5.483 6.671 5.483 5.833Z" ${S("#5B6470")}/>`, "lv-ic14"),
  wallet24: svg("0 0 24 24", `<path d="M3.4 10.1H20.6M16.4 14.9H17.9M6.4 5.5H17.6C19.257 5.5 20.6 6.843 20.6 8.5V15.5C20.6 17.157 19.257 18.5 17.6 18.5H6.4C4.743 18.5 3.4 17.157 3.4 15.5V8.5C3.4 6.843 4.743 5.5 6.4 5.5Z" ${S("#FFFFFF")}/>`, "lv-ic24"),
  swap24: svg("0 0 24 24", `<path d="M4.5 8.8H16.4M13.4 11.8L16.4 8.8L13.4 5.8M19.5 15.2H7.6M10.6 18.2L7.6 15.2L10.6 12.2" ${S("#16202A")}/>`, "lv-ic24"),
  cal24: svg("0 0 24 24", `<path d="M8 3.45V7.65M16 3.45V7.65M3.5 10.65H20.5M6.1 5.45H17.9C19.336 5.45 20.5 6.614 20.5 8.05V17.95C20.5 19.386 19.336 20.55 17.9 20.55H6.1C4.664 20.55 3.5 19.386 3.5 17.95V8.05C3.5 6.614 4.664 5.45 6.1 5.45Z" ${S("#16202A")}/>`, "lv-ic24"),
  dots24: svg("0 0 24 24", [5.5, 12, 18.5].map((x) => `<circle cx="${x}" cy="12" r="1.6" fill="#16202A"/>`).join(""), "lv-ic24"),
  back: svg("0 0 12 20", `<path d="M10 2L2 10L10 18" ${S("#121215", 2.2)}/>`, "lv-back-ic"),
  info: svg("0 0 22 22", `<circle cx="11" cy="11" r="9.1" stroke="#121215" stroke-width="1.8"/><circle cx="11" cy="6.6" r="1.2" fill="#121215"/><path d="M11 9.8V15.6" stroke="#121215" stroke-width="1.8" stroke-linecap="round"/>`, "lv-ic22"),
  map: svg("0 0 46 46", `<rect width="46" height="46" rx="16" fill="#fff"/><path d="M-4 31L15 21L31 28L50 17M9 -2L15 21L11 48M35 -2L31 28L37 48" stroke="#DDDDE1" stroke-width="3"/><path d="M23 12C25.8 12 28 14.2 28 17C28 20.7 23 26 23 26C23 26 18 20.7 18 17C18 14.2 20.2 12 23 12Z" fill="#1A6BD6"/><circle cx="23" cy="17" r="1.9" fill="#fff"/>`, "lv-map"),
  chevW: svg("0 0 6 12", `<path d="M0.9 0.9L5.9 5.9L0.9 10.9" stroke="#9AA3AE" stroke-width="1.8" stroke-linecap="round"/>`, "lv-chw"),
  chevWhy: svg("0 0 7 13", `<path d="M0.9 0.9L6.9 6.4L0.9 11.9" stroke="#8A929B" stroke-width="1.8" stroke-linecap="round"/>`, "lv-chwhy"),
  chevUp: svg("0 0 11 8", `<path d="M0.9 6.273L5.9 1.273L10.9 6.273" stroke="#9AA3AE" stroke-width="1.8" stroke-linecap="round"/>`, "lv-chud"),
  chevDown: svg("0 0 11 8", `<path d="M10.9 0.9L5.9 5.9L0.9 0.9" stroke="#9AA3AE" stroke-width="1.8" stroke-linecap="round"/>`, "lv-chud"),
  chevNear: svg("0 0 9 16", `<path d="M1.5 1.5L7 8L1.5 14.5" ${S("#A0A0A8", 2)}/>`, "lv-chnear"),
  /* таб-бар */
  tab: [
    `<path d="M3.6 11.4L13 4.2L22.4 11.4V21.2C22.4 21.9 21.9 22.4 21.2 22.4H4.8C4.1 22.4 3.6 21.9 3.6 21.2V11.4Z" stroke="#21A038" stroke-width="1.9" stroke-linejoin="round"/><path d="M9.8 22.4V15.2H16.2V22.4" stroke="#21A038" stroke-width="1.9" stroke-linejoin="round"/>`,
    `<path d="M19.4 4H6.6C4.943 4 3.6 5.343 3.6 7V19C3.6 20.657 4.943 22 6.6 22H19.4C21.057 22 22.4 20.657 22.4 19V7C22.4 5.343 21.057 4 19.4 4Z" stroke="#7D7D85" stroke-width="1.9"/><path d="M8.6 17V12.2M13 17V8.6M17.4 17V14.4" stroke="#7D7D85" stroke-width="1.9" stroke-linecap="round"/>`,
    `<path d="M13 3.8L15.9 9.6L22.4 10.5L17.7 15L18.8 21.4L13 18.4L7.2 21.4L8.3 15L3.6 10.5L10.1 9.6L13 3.8Z" stroke="#7D7D85" stroke-width="1.9" stroke-linejoin="round"/>`,
    `<path d="M19.2 5.2H6.8C5.033 5.2 3.6 6.633 3.6 8.4V17.6C3.6 19.367 5.033 20.8 6.8 20.8H19.2C20.967 20.8 22.4 19.367 22.4 17.6V8.4C22.4 6.633 20.967 5.2 19.2 5.2Z" stroke="#7D7D85" stroke-width="1.9"/><path d="M8.4 13H16.4M13.4 9.8L16.8 13L13.4 16.2" stroke="#7D7D85" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>`,
    `<path d="M19.4 6.4H6.6C4.833 6.4 3.4 7.833 3.4 9.6V16.8C3.4 18.567 4.833 20 6.6 20H19.4C21.167 20 22.6 18.567 22.6 16.8V9.6C22.6 7.833 21.167 6.4 19.4 6.4Z" stroke="#7D7D85" stroke-width="1.9"/><path d="M3.4 11.2H22.6" stroke="#7D7D85" stroke-width="1.9"/><path d="M19.2 14H17.4C16.737 14 16.2 14.537 16.2 15.2V15.8C16.2 16.463 16.737 17 17.4 17H19.2C19.863 17 20.4 16.463 20.4 15.8V15.2C20.4 14.537 19.863 14 19.2 14Z" fill="#7D7D85"/>`,
  ].map((d) => svg("0 0 26 26", d, "lv-ic26")),
  /* своё, в макете нет экспортируемого слоя: бесконтактная оплата, глобус; звезда — вместо значка бонусной программы банка */
  contactless: svg("0 0 24 24", `<path d="M8 8.5a5 5 0 0 1 0 7M11.5 6a8.5 8.5 0 0 1 0 12M15 3.5a12 12 0 0 1 0 17" ${S("#5B6470")}/>`, "lv-ic20"),
  globe: svg("0 0 24 24", `<circle cx="12" cy="12" r="8.5" ${S("#16202A")}/><path d="M3.5 12h17M12 3.5c2.4 2.5 3.5 5.4 3.5 8.5s-1.1 6-3.5 8.5c-2.4-2.5-3.5-5.4-3.5-8.5s1.1-6 3.5-8.5z" ${S("#16202A")}/>`, "lv-ic24"),
  star: svg("0 0 24 24", `<path d="m12 2.8 2.6 6 6.4.6-4.9 4.3 1.5 6.3L12 16.7 6.4 20l1.5-6.3L3 9.4l6.4-.6z" fill="#fff"/>`),
  /* значок подсказки «перенесено» — галочка из макета на зелёном круге */
  ok: svg("0 0 13 13", `<path d="M2.6 6.717L5.308 9.425L10.4 3.575" ${S("#FFFFFF", 2.2)}/>`),
};
const SB = `<div class="lv-sb" aria-hidden="true"><b>9:41</b>${svg("0 0 90 14", `<path d="M2 8H1C.448 8 0 8.448 0 9v2c0 .552.448 1 1 1h1c.552 0 1-.448 1-1V9c0-.552-.448-1-1-1ZM7 6H6c-.552 0-1 .448-1 1v4c0 .552.448 1 1 1h1c.552 0 1-.448 1-1V7c0-.552-.448-1-1-1ZM12 3.5h-1c-.552 0-1 .448-1 1V11c0 .552.448 1 1 1h1c.552 0 1-.448 1-1V4.5c0-.552-.448-1-1-1ZM17 1h-1c-.552 0-1 .448-1 1v9c0 .552.448 1 1 1h1c.552 0 1-.448 1-1V2c0-.552-.448-1-1-1Z" fill="#121215"/><path d="M28.5 4.6c2.9-2.4 7.1-2.4 10 0M30.9 7.6c1.5-1.2 3.7-1.2 5.2 0" stroke="#121215" stroke-width="1.8" stroke-linecap="round"/><circle cx="33.5" cy="10.7" r="1.4" fill="#121215"/><rect x="66.5" y="2" width="20" height="10" rx="2.7" stroke="#121215" stroke-opacity=".4"/><rect x="67.8" y="3.3" width="14" height="7.4" rx="1.8" fill="#121215"/><path d="M88.6 5.4v3.2c.8-.3 1.3-.9 1.3-1.6s-.5-1.3-1.3-1.6Z" fill="#121215" fill-opacity=".4"/>`, "lv-sb-ind")}</div>`;
const TABS = `<nav class="lv-tabs" aria-hidden="true">${["Главный", "Накопления", "Для жизни", "Платежи", "Кредиты"].map((t, k) => `<span${k ? "" : ' class="is-on"'}>${I.tab[k]}${t}</span>`).join("")}</nav>`;
const ltr = (k: string, t: string) => `<i class="lv-ltr lv-ltr--${k}">${t}</i>`;

/* график Мегамаркета до и после переноса */
const TL = {
  before: ["1 июля", "15 июля", "28 августа", "11 сентября"],
  after: ["1 июля", "15 июля", "6 сентября", "20 сентября"],
};
const TL_STATE = ["done", "done", "now", "later"];

function html(A: string) {
  const img = (f: string, cls: string, w: number, h: number) => `<img class="${cls}" src="${A}${f}" width="${w}" height="${h}" alt="" decoding="async" draggable="false">`;
  const tl = TL.before.map((d, k) => `<span class="is-${TL_STATE[k]}"><em>${TL_STATE[k] === "done" ? I.check13 : ""}</em><small data-tl="${k}">${d}</small><b>${rub(3100)}</b></span>`).join("");
  return `<div class="lv-plati">
  <section class="lv-scr lv-home" aria-label="Главный экран банка">
    <i class="lv-bg" aria-hidden="true"></i>
    ${SB}
    <div class="lv-scroll">
      <div class="lv-top"><i class="lv-ava" aria-hidden="true"></i><span class="lv-search">${I.search}Поиск</span><span class="lv-top-acts">${I.chat}${I.grid}</span></div>
      <div class="lv-bal"><p class="lv-bal-sum">${I.eye}${rub(103913)}${I.chevBal}</p><p class="lv-bonus">1${NB}240 <i>${I.star}</i></p></div>
      <div class="lv-quick" aria-hidden="true"><span>${I.qr}QR-код</span><span>${I.up}Перевести</span><span>${I.gear}Настроить</span></div>
      <div class="lv-home-c">
        <div class="lv-w" role="button" tabindex="0" data-a="open" aria-label="Плати частями: открыть">
          <div class="lv-w-top">${img("icon.webp", "lv-w-ico", 34, 34)}<b>Плати частями</b><span class="lv-w-more">3 покупки ${I.chevW}</span></div>
          <p class="lv-w-cap">Ближайший платёж</p>
          <div class="lv-w-row"><div><p class="lv-w-sum">${rub(3100)}</p><p class="lv-w-store">${ltr("mm", "М")}<b>Мегамаркет</b>· 28 августа</p></div>
            <p class="lv-w-all"><b>${rub(12450)}</b>остаток по всем</p></div>
          <div class="lv-tip"><i>${I.cal18}</i><div class="lv-tip-t"><b>Лучше после зарплаты</b><span>6 сентября <em>бесплатно</em></span></div><button type="button" data-a="open">Перенести</button></div>
          <i class="lv-hr"></i>
          <div class="lv-next">Дальше <span>${ltr("mv", "М")}5 сен</span><span>${ltr("rv", "R")}12 сен</span></div>
        </div>
        <div class="lv-tr" aria-hidden="true"><b>Переводы</b>
          <p class="lv-tr-f">По номеру телефона или карты${I.contactless}</p>
          <div class="lv-tr-p"><span><i>${I.swap24}</i>Между своими</span><span><i>${I.globe}</i>В другую страну</span><span><i style="background:#1a6bd6">С</i>Света</span><span><i style="background:#c2261b">НЛ</i>Николай Леонтьев</span><span><i style="background:#5f6b75">АЧ</i>Антон Чехов</span></div>
        </div>
      </div>
    </div>
    <i class="lv-scrim" aria-hidden="true"></i>
    ${TABS}
    <i class="lv-shade"></i>
  </section>

  <section class="lv-scr lv-hub" aria-label="Плати частями" inert>
    <div class="lv-hub-head">${SB}<div class="lv-nav"><button type="button" class="lv-navback" data-a="home" aria-label="Назад">${I.back}</button><h3>Плати частями</h3><span>${I.info}</span></div></div>
    <p class="lv-toast" role="status" aria-live="polite" hidden><i>${I.ok}</i>Платёж перенесён на 6 сентября</p>
    <div class="lv-scroll" data-hub-scroll>
      <div class="lv-hero">
        ${img("sign.webp", "lv-sign", 116, 116)}
        <p class="lv-hero-cap">Осталось выплатить</p><h2>${rub(12450)}</h2>
        <div class="lv-bar"><i></i></div>
        <p class="lv-bar-cap"><span>3 покупки · 7 из 12 платежей</span><span>последний — 12 сен</span></p>
        <div class="lv-acts" aria-hidden="true"><span><i>${I.wallet24}</i>Оплатить</span><span><i>${I.swap24}</i>Другая дата</span><span><i>${I.cal24}</i>Календарь<b class="lv-dot"></b></span><span><i>${I.dots24}</i>Ещё</span></div>
      </div>
      <div class="lv-hub-c">
        <div class="lv-card" data-card="advice">
          <div class="lv-c-head">${ltr("mm", "М")}<b>Мегамаркет</b>2 из 4 оплачено<span class="lv-x">${I.close}</span></div>
          <div class="lv-gist"><div><h4>28 августа спишем ${rub(3100)}</h4><p>останется ${rub(2300)} на 8${NB}дней до зарплаты</p></div>${img("move.webp", "lv-art", 112, 112)}</div>
          <div class="lv-prev"><span class="lv-was">${I.cal15("#9AA3AB")}<s>28 авг</s></span>${I.arrowR}<span class="lv-will">${I.cal15("#0E7A34")}6 сен</span><em class="lv-sticker">бесплатно</em></div>
          <div class="lv-duo"><button type="button" class="lv-go" data-a="move">Перенести на 6 сен</button><button type="button" class="lv-stay" tabindex="-1">Оставить</button></div>
          <div class="lv-chips"><span class="lv-chip">${I.wallet12()}спишем с •• 4417</span><span class="lv-chip">${I.shield12}не влияет на историю</span></div>
          <i class="lv-hair"></i>
          <button type="button" class="lv-why" data-a="numbers"><i>${I.trend}</i><b>Откуда цифры</b><span>остаётся ${rub(5400)}${I.chevWhy}</span></button>
        </div>
        <div class="lv-card lv-done" data-card="done" hidden>
          <div class="lv-gist"><div><h4>Готово — платёж<br>Мегамаркета теперь<br>6${NB}сентября</h4><p>Свободных денег до зарплаты стало больше ровно на${NB}платёж${NB}— ${rub(3100)}</p></div><span class="lv-leafbox">${img("leaf-sep6-big.webp", "lv-leafbig", 145, 158)}</span></div>
          <button type="button" class="lv-wide" data-a="undo">Отменить перенос</button>
          <div class="lv-chips"><span class="lv-chip">${I.clock12}отмена возможна до 5 сентября</span></div>
        </div>

        <h3 class="lv-h">Мои покупки</h3>
        <div class="lv-seg" aria-hidden="true"><span class="is-on">Активные <b>3</b></span><span>Завершённые <b>6</b></span><span>Все <b>9</b></span></div>
        <div class="lv-list">
          <div class="lv-p is-big">${ltr("mm", "М")}<div class="lv-p-t"><b>Мегамаркет</b><span>2 из 4 оплачено · по ${rub(3100)}</span></div><p class="lv-p-r"><b>${rub(6200)}</b>осталось</p>${I.chevUp}</div>
          <div class="lv-tl"><i></i>${tl}</div>
          <i class="lv-hr"></i>
          <div class="lv-p">${ltr("mv", "М")}<div class="lv-p-t"><b>М.Видео</b><span>2 из 4 оплачено · ${rub(2300)} 5${NB}сен</span><span class="lv-chip">${I.wallet12("#5A6570")}после зарплаты</span></div><p class="lv-p-r"><b>${rub(4600)}</b>осталось</p>${I.chevDown}</div>
          <i class="lv-hr"></i>
          <div class="lv-p">${ltr("rv", "R")}<div class="lv-p-t"><b>Rendez-Vous</b><span>3 из 4 оплачено · ${rub(1650)} 12${NB}сен</span><span class="lv-chip">${I.check12("#5A6570")}остался последний платёж</span></div><p class="lv-p-r"><b>${rub(1650)}</b>осталось</p>${I.chevDown}</div>
        </div>
        <div class="lv-offer" aria-hidden="true">
          <div class="lv-ticket">
            ${img("ticket.webp", "lv-ticket-bg", 393, 260)}
            <div class="lv-ticket-top"><span class="lv-tag">${ltr("sm", "С")}СПОРТМАСТЕР · ВЧЕРА</span>
              <p class="lv-t-sum">${rub(1800)} <span>× 4 платежа</span></p><div class="lv-t-bars"><i></i><i></i><i></i><i></i></div>
              <p class="lv-t-note">всего ${rub(7200)} · первый через 2 недели</p>
              <span class="lv-t-obj">${img("cards.webp", "", 101, 101)}</span></div>
            <i class="lv-perf"></i>
            <div class="lv-stub"><span>Разделить покупку</span><span>${I.shield14}бесплатно · 14 дней</span></div>
          </div>
          <p class="lv-more">ещё 2 покупки · OZON и Летуаль</p>
        </div>
        <div class="lv-near" aria-hidden="true">${I.map}<div><b>Где рядом можно частями</b><span>${I.pin}12 магазинов в 15 минутах<br>пешком</span></div>${I.chevNear}</div>
      </div>
    </div>
    ${TABS}
  </section>

  <div class="lv-back" data-a="dismiss"></div>

  <div class="lv-sheet lv-mv" role="dialog" aria-label="Проверьте новый график" data-sheet="move" inert>
    <i class="lv-grab"></i>
    <div class="lv-sheet-in">
      ${img("move.webp", "lv-art", 94, 94)}
      <h3>Проверьте новый график</h3>
      <p class="lv-sub">Двигаем только этот платёж — ${rub(3100)}.<br>Остальные покупки и их даты не меняются.</p>
      <div class="lv-cmp">
        <div class="lv-cmp-d"><span>${img("leaf-aug28.webp", "lv-leaf", 64, 74)}было</span>${I.arrowR}<span>${img("leaf-sep6.webp", "lv-leaf", 64, 74)}станет</span></div>
        <div class="lv-cmp-cut"></div>
        <dl><div><dt>Сумма платежа</dt><dd>${rub(3100)}</dd></div><div><dt>Комиссия за перенос</dt><dd class="is-g">0${NB}₽</dd></div>
          <div><dt>До зарплаты останется</dt><dd class="is-g"><small>2${NB}300 → </small>${rub(5400)}</dd></div></dl>
      </div>
      <div class="lv-pay"><p class="lv-pay-h"><i class="lv-ico30">${I.cal17}</i>6 сентября — сразу после зарплаты</p>
        <div class="lv-chips"><span class="lv-chip">${I.check12()}1-й перенос — 0${NB}₽</span><span class="lv-chip">${I.wallet12()}дальше — 99${NB}₽</span><span class="lv-chip">${I.shield12}история не пострадает</span></div></div>
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
      <div class="lv-note"><i class="lv-ico30">${I.cal17}</i><p>Доход — среднее за 3 месяца, без разовых поступлений. Траты — обязательные платежи и покупки, кроме рассрочек. Остаток — то, что реально свободно до следующей зарплаты.</p></div>
      <button type="button" class="lv-wide" data-a="dismiss">Понятно</button>
    </div>
  </div>
</div>`;
}

type State = { hub: boolean; sheet: "" | "move" | "numbers"; moved: boolean };

const proto: LiveProto = {
  design: { w: 393 },
  mount(root, ctx) {
    root.innerHTML = html(`${ctx.base}cases/plati-chastyami/live/`);
    const app = root.querySelector<HTMLElement>(".lv-plati")!;
    app.classList.toggle("is-calm", ctx.calm);
    const $ = (s: string) => app.querySelector<HTMLElement>(s)!;
    const home = $(".lv-home");
    const hub = $(".lv-hub");
    const hubScroll = $("[data-hub-scroll]");
    const homeScroll = $(".lv-home .lv-scroll");
    const advice = $("[data-card=advice]");
    const done = $("[data-card=done]");
    const toast = $(".lv-toast");
    const sheets = { move: $("[data-sheet=move]"), numbers: $("[data-sheet=numbers]") };
    const tlLabels = [...app.querySelectorAll<HTMLElement>("[data-tl]")];
    const hint = { open: $(".lv-w"), move: $("[data-a=move]"), confirm: $("[data-a=confirm]") };

    const st: State = { hub: false, sheet: "", moved: false };
    let step = 0;
    let timer = 0;
    let toastT = 0;
    let glowT = 0;

    /* «Платёж перенесён»: тёмная плашка под шапкой и короткая зелёная подсветка карточки «Готово» */
    function celebrate() {
      clearTimeout(toastT); clearTimeout(glowT);
      toast.hidden = false;
      toast.classList.remove("is-out", "is-in"); void toast.offsetWidth; toast.classList.add("is-in");
      done.classList.remove("is-glow"); void done.offsetWidth; done.classList.add("is-glow");
      glowT = window.setTimeout(() => done.classList.remove("is-glow"), ctx.calm ? 1600 : 1900);
      toastT = window.setTimeout(() => {
        if (ctx.calm) { toast.hidden = true; return; }
        toast.classList.add("is-out");
        toastT = window.setTimeout(() => { toast.hidden = true; toast.classList.remove("is-out", "is-in"); }, 260);
      }, 2600);
    }
    function quiet() {
      clearTimeout(toastT); clearTimeout(glowT);
      toast.hidden = true; toast.classList.remove("is-in", "is-out");
      done.classList.remove("is-glow");
    }

    /* состояние на экран; anim — карточка въезжает, когда человек сам подтвердил или отменил перенос */
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
        quiet();
        Object.assign(st, { hub: false, sheet: "", moved: false });
        reach(0); apply();
        clearTimeout(timer);
        timer = window.setTimeout(() => { hubScroll.scrollTop = 0; }, ctx.calm ? 0 : 480);
      },
      move() { st.sheet = "move"; reach(2); apply(); },
      numbers() { if (!st.sheet) { st.sheet = "numbers"; apply(); } },
      dismiss() { const was = st.sheet; st.sheet = ""; if (was === "move") reach(1); apply(); },
      confirm() {
        if (st.sheet !== "move") return;
        st.sheet = ""; st.moved = true; toTop(); reach(3); apply(true);
        /* подсказка — когда шторка уехала и карточка встала */
        clearTimeout(timer);
        timer = window.setTimeout(celebrate, ctx.calm ? 0 : 380);
      },
      undo() { quiet(); st.moved = false; reach(1); apply(true); },
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
        quiet();
        step = k;
        Object.assign(st, { hub: k > 0, sheet: k === 2 ? "move" : "", moved: k >= 3 });
        if (k === 0) homeScroll.scrollTop = 0;
        if (k === 1 || k === 3) hubScroll.scrollTop = 0;
        apply();
      },
      destroy() {
        clearTimeout(timer); quiet();
        app.removeEventListener("click", onClick);
        app.removeEventListener("keydown", onKey);
        root.innerHTML = "";
      },
    };
  },
};
export default proto;
