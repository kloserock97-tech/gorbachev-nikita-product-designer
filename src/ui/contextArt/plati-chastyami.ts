/* 26.10: сцены «Контекста картинками» для кейса plati-chastyami (ключи — в context.art данных кейса). Сцена — HTML-строка
   внутри плитки .ca-tile: размеры в cqw, общие детали (.ca-win, .ca-line…) — из context-art.css, свои — в plati-chastyami.css.
   Движение — только transform/opacity, старт по .ca-card.is-in, «меньше движения» — конечный вид.
   Интерфейс банка светлый: белые карточки на сером фоне приложения, один сплошной акцент — зелёный Сбера (#21A038),
   как в макетах кейса. Слов почти нет, цифры и даты — те же, что на экранах концепта. */
import { getLang } from "../../i18n";
import "./plati-chastyami.css";

const L = (ru: string, en: string) => (getLang() === "ru" ? ru : en);

export const scenes: Record<string, () => string> = {
  /* статус на главном: мятная шапка с балансом, под ней карточка рассрочки — сумма, остаток и кнопка переноса */
  home: () => `
    <div class="ca-pc-phone">
      <div class="ca-pc-head"><i class="ca-pc-bal"></i></div>
      <div class="ca-pc-card">
        <div class="ca-pc-row"><i class="ca-pc-ico"></i><i class="ca-pc-l" style="--w:38%"></i></div>
        <div class="ca-pc-row ca-pc-row--sum"><b>3 100 ₽</b><i class="ca-pc-l" style="--w:22%"></i></div>
        <div class="ca-pc-row ca-pc-row--go"><i class="ca-pc-l" style="--w:40%"></i><i class="ca-pc-btn"></i></div>
      </div>
    </div>`,
  /* перенос к зарплате: старая дата зачёркивается, рядом встаёт новая и чип «бесплатно» */
  move: () => `
    <div class="ca-pc-move">
      <span class="ca-pc-date ca-pc-date--old"><b>${L("28 авг", "28 Aug")}</b><i class="ca-pc-strike"></i></span>
      <i class="ca-pc-arrow"></i>
      <span class="ca-pc-date ca-pc-date--new"><b>${L("6 сен", "6 Sep")}</b></span>
      <span class="ca-pc-free">${L("бесплатно", "free")}</span>
    </div>`,
  /* стоп продаж: плитки витрины гаснут и оседают, на их место поднимается план разгрузки со шкалой */
  pause: () => `
    <div class="ca-pc-shop"><i style="--i:0"></i><i style="--i:1"></i><i style="--i:2"></i></div>
    <div class="ca-pc-plan">
      <i class="ca-pc-l" style="--w:46%"></i>
      <div class="ca-pc-stack"><i class="is-a"></i><i class="is-b"></i><i class="is-c"></i></div>
    </div>`,
  /* совет можно проверить: кольцо «безопасно потратить» и кнопка, которую нажимает сам человек */
  why: () => `
    <div class="ca-pc-why">
      <div class="ca-pc-ring"><i></i><b>340 ₽</b></div>
      <div class="ca-pc-ok"><i class="ca-pc-l" style="--w:70%"></i><span class="ca-pc-btn ca-pc-btn--wide"><i class="ca-pc-tap"></i></span></div>
    </div>`,
  /* живых скриншотов нет: запись экрана — рамка телефона с красной точкой и лента кадров */
  rec: () => `
    <div class="ca-pc-rec">
      <div class="ca-pc-mini"><i class="ca-pc-dot"></i><i class="ca-pc-l" style="--w:60%"></i><i class="ca-pc-l" style="--w:80%"></i><i class="ca-pc-l" style="--w:50%"></i></div>
      <div class="ca-pc-frames"><i></i><i></i><i class="is-on"></i><i></i><i></i></div>
    </div>`,
  /* шрифт не тот: буквы близким шрифтом, за ними пунктиром контур того, которого нет */
  font: () => `
    <div class="ca-pc-font"><span class="ca-pc-ghost">Аа</span><span class="ca-pc-real">Аа</span></div>`,
};
