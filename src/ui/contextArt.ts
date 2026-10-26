/* 26.10: «Контекст» картинками — цели и ограничения кейса встают в «Коротко» карточками, у каждой своя маленькая
   сцена из интерфейса продукта. Образец подачи — принципы на сайте Legora: у пункта не абстрактная иконка, а кусочек
   самого продукта. Сцены свои, свёрстаны здесь же: тёмный фрагмент интерфейса GRIF на плитке в цвет кейса.

   Всё внутри плитки меряется в cqw (ширина плитки), поэтому сцена одинаково собрана и на 1440, и на телефоне.
   Движение запускается, когда карточка появилась на экране (класс is-in от общего появления по прокрутке):
   подсказки выскакивают по очереди, крутится шаг, тает отсчёт отмены. «Меньше движения» — сразу конечный вид. */
import type { CaseStory } from "../data/caseStory";
import { getLang, t } from "../i18n";
import { pad2 as pad } from "../lib/format";
import { tidy } from "../lib/typograph";
import "./context-art.css";
import { scenes as community } from "./contextArt/community";
import { scenes as aiAgents } from "./contextArt/ai-agents";
import { scenes as moderator } from "./contextArt/moderator-dashboard";
import { scenes as plati } from "./contextArt/plati-chastyami";
import { scenes as guru } from "./contextArt/restaurant-guru";

const esc = (s: string) => tidy(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const L = (ru: string, en: string) => (getLang() === "ru" ? ru : en);

/* сцены: только форма, слов почти нет — подпись под плиткой и так говорит, о чём она */
const ART: Record<string, () => string> = {
  /* точки входа: поле ввода с мигающей кареткой и три подсказки под ним, одна подсвечена */
  entry: () => `
    <div class="ca-win ca-win--entry">
      <div class="ca-input"><i class="ca-caret"></i><i class="ca-line" style="--w:46%"></i><i class="ca-send"></i></div>
      <div class="ca-chips"><i style="--i:0"></i><i class="is-hot" style="--i:1"></i><i style="--i:2"></i></div>
    </div>`,
  /* видно, что делает: шаг со спиннером и мерцающей строкой, ниже — источники ответа */
  live: () => `
    <div class="ca-win ca-win--live">
      <div class="ca-step"><i class="ca-spin"></i><i class="ca-line ca-shimmer" style="--w:64%"></i></div>
      <div class="ca-bar"><i></i></div>
      <i class="ca-line" style="--w:88%"></i><i class="ca-line" style="--w:72%"></i>
      <div class="ca-srcs"><i style="--i:0;--c:#ea4335"></i><i style="--i:1;--c:#e8e8ea"></i><i style="--i:2;--c:#4285f4"></i></div>
    </div>`,
  /* без «да» не уходит: черновик с кнопкой «Отправить» и плашка отмены с тающим кольцом */
  confirm: () => `
    <div class="ca-win ca-win--confirm">
      <i class="ca-line" style="--w:52%"></i><i class="ca-line" style="--w:90%"></i><i class="ca-line" style="--w:78%"></i>
      <div class="ca-actions"><i class="ca-ghost"></i><i class="ca-btn"></i></div>
    </div>
    <div class="ca-toast"><i class="ca-ring"></i><b>${esc(L("Отменить", "Undo"))}</b></div>`,
  /* до инвестраунда: дорожка «концепция → MVP → раунд», последняя точка светится */
  round: () => `
    <div class="ca-track">
      <i class="ca-rail"><i></i></i>
      <span style="--i:0"><i></i><b>${esc(L("Идея", "Idea"))}</b></span>
      <span style="--i:1"><i></i><b>MVP</b></span>
      <span class="is-goal" style="--i:2"><i></i><b>${esc(L("Раунд", "Round"))}</b></span>
    </div>`,
  /* маленький бюджет: одна монетка там, где должна быть стопка */
  budget: () => `
    <div class="ca-coins">
      <i class="is-ghost"></i><i class="is-ghost"></i><i class="is-ghost"></i><i class="is-real"></i>
    </div>`,
  /* ни дизайн-системы: пустые ячейки под компоненты, в одной появляется первая кнопка */
  nods: () => `
    <div class="ca-slots">
      <i></i><i></i><i></i><i></i><i class="is-first"><b></b></i><i></i>
    </div>`,
};

/* 26.10: у каждого кейса свои сцены (src/ui/contextArt/<id>.ts); сцены GRIF — выше, в ART */
const SCENES: Record<string, Record<string, () => string>> = { "grif-ai": ART, community, "ai-agents": aiAgents, "moderator-dashboard": moderator, "plati-chastyami": plati, "restaurant-guru": guru };

/** цели и ограничения картинками — внутри «Коротко»; пусто, если у кейса нет context.art */
export function contextArtBlock(s: CaseStory, mini: (label: string) => string) {
  const art = s.context.art;
  if (!art) return "";
  const goals = s.context.goals ?? [];
  const cons = s.context.constraints ?? [];
  const own = SCENES[s.id] ?? {};
  const tile = (key: string | undefined) => { const sc = key ? own[key] : undefined; return sc ? `<div class="ca-tile ca-tile--${key}" aria-hidden="true">${sc()}</div>` : ""; };
  return `
    ${goals.length ? `<div class="cs-block ca-block">${mini(t("cs.goals"))}
      <ol class="ca-goals">${goals.map((g, k) => `<li class="ca-card" data-reveal style="--rd:${k}">${tile(art.goals?.[k])}<p><span>${pad(k + 1)}</span>${esc(g)}</p></li>`).join("")}</ol>
    </div>` : ""}
    ${cons.length ? `<div class="cs-block ca-block">${mini(t("cs.constraints"))}
      <ol class="ca-cons">${cons.map((c, k) => `<li class="ca-card ca-card--row" data-reveal style="--rd:${k}">${tile(art.constraints?.[k])}<div><b>${esc(c.title)}</b><p>${esc(c.text)}</p></div></li>`).join("")}</ol>
    </div>` : ""}`;
}
