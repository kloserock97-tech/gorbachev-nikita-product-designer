/* Кейсы для ленты в главе «Кейсы», меню Work и страницы на экране компьютера.
   Источник: порядок и ссылки — Main page/Cases.html (+ EN/Cases.en.html), подзаголовки — лиды
   Main cases/*.html. Оригинальные знаки — в public/cases/brands.
   v64: у кейса вместо обложки-картинки «вид» (look): предмет без фона (public/cases/objects/<id>.avif и .webp,
   вырезан из прежних обложек, исходники и промпты — docs/case-preview-art-direction.md), светлая сцена в цвет кейса,
   чернила и акцент. Этим видом пользуются карточка в ленте, меню «Кейсы», герой страницы кейса и блок
   «следующий кейс»: цвет кейса везде один.
   v27: у каждого кейса есть русский двойник — название, подзаголовок и метка берутся по текущему
   языку (getCases()). Порядок, id и обложки от языка не зависят. */
import { getLang } from "../i18n";

/** kind — для фильтра в меню Work: веб (и десктоп) или мобайл */
export type CaseKind = "web" | "mobile";
/** вид кейса: сцена — два тона сверху вниз; предмет — ширина, сдвиг слева и снизу в долях ширины и высоты карточки */
export type CaseLook = {
  stage: [string, string]; ink: string; accent: string;
  /* v68: фирменная подложка карточки вместо ровного градиента — обложка самого продукта.
     Карточка тогда показывает не условный цвет, а то, как продукт выглядит на самом деле. У кого такой
     обложки нет, остаётся градиент: система не ломается, просто у одних карточек фон богаче. */
  backdrop?: string;
  /* avif: false — у предмета есть только webp. Источник avif в <picture> нельзя ставить «на всякий случай»:
     если файл не отдаётся, браузер не откатывается на <img>, а просто не показывает ничего. */
  object: { w: number; x: number; y: number; ratio: number; avif?: boolean };
  /** настоящий экран продукта для героя страницы кейса; у «Электронного дома» экранов в открытом доступе нет */
  screen?: { src: string; w: number; h: number; device: "browser" | "phone" };
  /* v77: диорама для главы «Кейсы» по референсам Никиты — предмет-сцена без карточки (стекло, мох, парящие
     плашки), вырезанный из картинки с прозрачностью. Сгенерированный экран на ней кривой, поэтому поверх кладётся
     настоящий screen: quad — углы экрана в долях картинки (левый верх, правый верх, правый низ, левый низ). */
  /* v78: сцена на three.js вместо картинки-диорамы (src/caseScene). Картинка остаётся запасным вариантом:
     она видна, пока сцена грузится, и если WebGL не поднялся. */
  scene?: import("../caseScene/registry").SceneId;
  diorama?: {
    src: string; w: number; h: number; quad?: [number, number][];
    /** где картинка стояла на референсе (кадр 1672×941): центр x, y и ширина в долях кадра; nw — ширина на телефоне в долях экрана */
    at: [number, number, number]; nw?: number;
    /** на телефоне по центру экрана встаёт эта доля ширины картинки (главный предмет), по умолчанию середина */
    nx?: number;
    /** цвет свечения вокруг сцены, «r,g,b»; по умолчанию тёплый */
    glow?: string;
    /** где встаёт низ строки «Далее» — доля высоты картинки; по умолчанию над самым верхом сцены */
    next?: number;
  };
};
/* v69: короткая цифра для обложки на главной. Взята из «Результатов» самого кейса — не новая цифра, а та же,
   вынесенная вперёд: на обложке человек должен увидеть, что изменилось, ещё до того как откроет кейс. */
export type CaseStat = { value: string; label: string };
export type CaseItem = { id: string; title: string; subtitle: string; tag: string; kind: CaseKind[]; look: CaseLook; stat: CaseStat; brand?: string };
/** адрес предмета кейса; avif легче вдвое, webp — запасной */
export const caseObject = (id: string, ext: "avif" | "webp" = "avif") => `cases/objects/${id}.${ext}`;
type Ru = { title: string; subtitle: string; tag: string; stat: CaseStat };

const cases: CaseItem[] = [
  { id: "grif-ai", title: "GRIF AI", subtitle: "An assistant that brings ready-made actions. I designed it solo", tag: "AI assistant · 2026", kind: ["web"], look: { stage: ["#eef3fb", "#d3e1f6"], ink: "#14213d", accent: "#2f5fd0", backdrop: "cases/grif-ai/brand-cover.webp", object: { w: 1.18, x: -0.06, y: -0.03, ratio: 888 / 851 }, screen: { src: "cases/grif-ai/05.webp", w: 1024, h: 640, device: "browser" }, scene: "grif-ai", diorama: { src: "cases/grif-ai/diorama.webp", w: 1260, h: 791, at: [0.5323, 0.5797, 0.7536], nw: 1.3, glow: "214,232,96" } }, stat: { value: "5 days", label: "from idea to a shipped feature, down from three weeks" }, brand: "grif-app.webp" },
  { id: "ai-agents", title: "AI Agent Risk Management", subtitle: "Agent risk assessment out of Jira and Excel: 6 manual handoffs → 0", tag: "Sber · Enterprise · 2025", kind: ["web"], look: { stage: ["#edf6f0", "#d2e8da"], ink: "#12281c", accent: "#1f8a4c", object: { w: 1.14, x: -0.07, y: -0.01, ratio: 900 / 731 }, screen: { src: "cases/ai-agents/01.webp", w: 1440, h: 900, device: "browser" }, scene: "ai-agents", diorama: { src: "cases/ai-agents/diorama.webp", w: 1370, h: 620, at: [0.5664, 0.4463, 0.8194], nw: 1.35, nx: 0.477, glow: "170,230,110", next: 0.145 } }, stat: { value: "6 → 0", label: "manual handoffs on the assessment route" }, brand: "sber.svg" },
  { id: "design-lead", title: "Design Got a Seat", subtitle: "Design moved out of service work and into product calls", tag: "Design lead · Sber · 2025–2026", kind: ["web"], look: { stage: ["#f6f1e7", "#e7dcc6"], ink: "#2a2318", accent: "#a9752b", object: { w: 0.62, x: 0.19, y: -0.05, ratio: 900 / 1156, avif: false }, scene: "design-lead", diorama: { src: "cases/design-lead/diorama.webp", w: 1340, h: 530, at: [0.5742, 0.3932, 0.8014], nw: 1.45, nx: 0.47, glow: "255,196,120", next: 0.225 } }, stat: { value: "0", label: "mockups reach engineering without a design review" }, brand: "sber.svg" },
  { id: "community", title: "Community", subtitle: "City stories for Mos.ru: from zero to a first version in nine months", tag: "Web platform · Mos.ru · 2024", kind: ["web"], look: { stage: ["#fcefe6", "#f6d9c6"], ink: "#3a1d12", accent: "#d9603b", object: { w: 1.32, x: -0.16, y: 0.02, ratio: 900 / 547 }, screen: { src: "cases/community/01.webp", w: 1440, h: 788, device: "browser" }, scene: "community", diorama: { src: "cases/community/diorama.webp", w: 1235, h: 590, at: [0.5218, 0.4623, 0.7386], nw: 1.45, nx: 0.498, glow: "255,120,100", next: 0.071 } }, stat: { value: "250+", label: "residents' stories in the first three months" }, brand: "community.svg" },
  { id: "moderator-dashboard", title: "Moderator Dashboard", subtitle: "A workspace of their own for moderators: −38% steps per task", tag: "B2B dashboard · Mos.ru · 2024", kind: ["web"], look: { stage: ["#f1eef9", "#dbd3ee"], ink: "#231a3a", accent: "#6b55c9", object: { w: 1.16, x: -0.02, y: -0.05, ratio: 900 / 773 }, screen: { src: "cases/figma/moderator-queue.webp", w: 1440, h: 1156, device: "browser" }, scene: "moderator", diorama: { src: "cases/moderator-dashboard/diorama.webp", w: 1310, h: 620, at: [0.5712, 0.4888, 0.7835], nw: 1.35, nx: 0.47, glow: "255,190,110", next: 0.105 } }, stat: { value: "−38 %", label: "steps to check one comment" }, brand: "community.svg" },
  { id: "stop-spam", title: "Stop Spam", subtitle: "First-run setup for an anti-spam app: +25% reach working protection", tag: "iOS · Android · 2022", kind: ["mobile"], look: { stage: ["#e9f4f7", "#cbe3ea"], ink: "#0f2a31", accent: "#15899d", object: { w: 1.28, x: -0.12, y: -0.02, ratio: 900 / 698 }, screen: { src: "cases/figma/spam-welcome.webp", w: 402, h: 874, device: "phone" }, scene: "stop-spam" }, stat: { value: "+25 %", label: "reach working protection" }, brand: "stop-spam.webp" },
  { id: "plati-chastyami", title: "Pay in Parts", subtitle: "Instalment status on the bank home screen: five steps to the answer, then none", tag: "Concept · Fintech · 2026", kind: ["mobile"], look: { stage: ["#effaf3", "#cfeadd"], ink: "#0f2a1c", accent: "#1FA53A", object: { w: 0.62, x: 0.19, y: -0.02, ratio: 786 / 1704 }, screen: { src: "cases/plati-chastyami/01-sbol-widget.webp", w: 786, h: 1704, device: "phone" }, scene: "plati-chastyami", diorama: { src: "cases/plati-chastyami/diorama.webp", w: 1100, h: 700, at: [0.5323, 0.5048, 0.6579], nw: 1.3, nx: 0.468, glow: "255,200,110", next: 0.057 } }, stat: { value: "5 → 0", label: "steps to the answer" } },
  { id: "restaurant-guru", title: "Restaurant Guru", subtitle: "Home screen for three jobs: one place in view became three or four", tag: "Concept · iOS · 2026", kind: ["mobile"], look: { stage: ["#fbf0ef", "#f1dad9"], ink: "#2A1D1A", accent: "#9E1B32", object: { w: 0.62, x: 0.19, y: -0.02, ratio: 786 / 1704 }, screen: { src: "cases/restaurant-guru/01-home.webp", w: 786, h: 1704, device: "phone" }, scene: "restaurant-guru", diorama: { src: "cases/restaurant-guru/diorama.webp", w: 1060, h: 720, at: [0.4964, 0.4995, 0.634], quad: [[457 / 1060, 43 / 720], [686 / 1060, 58 / 720], [612 / 1060, 578 / 720], [395 / 1060, 550 / 720]] } }, stat: { value: "3–4", label: "places in view, up from one" } },
];

const ru: Record<string, Ru> = {
  "grif-ai": { title: "GRIF AI", subtitle: "Ассистент сам приносит готовые действия. Дизайнер в проекте один", tag: "ИИ-ассистент · 2026", stat: { value: "5 дней", label: "от идеи до фичи в коде вместо трёх недель" } },
  "ai-agents": { title: "Управление ИИ-агентами", subtitle: "Оценка рисков агентов без Jira и Excel: 6 ручных передач → 0", tag: "Сбер · Enterprise · 2025", stat: { value: "6 → 0", label: "ручных передач на пути оценки" } },
  "design-lead": { title: "Дизайн получил голос", subtitle: "Дизайн перестал быть оформлением в конце: задача с целью, ревью до разработки, место в решениях", tag: "Дизайн-лид · Сбер · 2025–2026", stat: { value: "0", label: "макетов уходит в разработку без ревью" } },
  "community": { title: "Сообщество", subtitle: "Городские истории для Mos.ru: с нуля до первой версии за 9 месяцев", tag: "Веб-платформа · Mos.ru · 2024", stat: { value: "250+", label: "историй жителей за первые три месяца" } },
  "moderator-dashboard": { title: "Кабинет модератора", subtitle: "Свой кабинет для модераторов: −38% шагов на задачу", tag: "B2B-кабинет · Mos.ru · 2024", stat: { value: "−38 %", label: "шагов, чтобы проверить комментарий" } },
  "stop-spam": { title: "Стоп Спам", subtitle: "Первый запуск антиспама: +25% доходят до включённой защиты", tag: "iOS · Android · 2022", stat: { value: "+25 %", label: "доходят до включённой защиты" } },
  "plati-chastyami": { title: "Плати частями", subtitle: "Статус рассрочки на главном экране банка: пять переходов до ответа, стало ноль", tag: "Концепт · Финтех · 2026", stat: { value: "5 → 0", label: "переходов до ответа" } },
  "restaurant-guru": { title: "Restaurant Guru", subtitle: "Главный экран под три задачи: три-четыре места в кадре вместо одного", tag: "Концепт · iOS · 2026", stat: { value: "3–4", label: "места в кадре вместо одного" } },
};

/** список на текущем языке: тот же порядок и те же обложки */
export function getCases(): CaseItem[] {
  if (getLang() === "en") return cases;
  return cases.map((c) => {
    const r = ru[c.id];
    return r ? { ...c, ...r } : c;
  });
}

