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
  object: { w: number; x: number; y: number; ratio: number };
  /** настоящий экран продукта для героя страницы кейса; у «Электронного дома» экранов в открытом доступе нет */
  screen?: { src: string; w: number; h: number; device: "browser" | "phone" };
};
export type CaseItem = { id: string; title: string; subtitle: string; tag: string; kind: CaseKind[]; look: CaseLook; brand?: string };
/** адрес предмета кейса; avif легче вдвое, webp — запасной */
export const caseObject = (id: string, ext: "avif" | "webp" = "avif") => `cases/objects/${id}.${ext}`;
type Ru = { title: string; subtitle: string; tag: string };

const cases: CaseItem[] = [
  { id: "grif-ai", title: "GRIF AI", subtitle: "An assistant that brings ready-made actions. One designer: me", tag: "AI assistant · 2026", kind: ["web"], look: { stage: ["#eef3fb", "#d3e1f6"], ink: "#14213d", accent: "#2f5fd0", object: { w: 1.18, x: -0.06, y: -0.03, ratio: 900 / 865 }, screen: { src: "cases/grif-ai/05.webp", w: 1024, h: 640, device: "browser" } }, brand: "grif.svg" },
  { id: "ai-agents", title: "AI Agent Risk Management", subtitle: "Agent risk assessment out of Jira and Excel: 6 manual handoffs → 0", tag: "Sber · Enterprise · 2025", kind: ["web"], look: { stage: ["#edf6f0", "#d2e8da"], ink: "#12281c", accent: "#1f8a4c", object: { w: 1.14, x: -0.07, y: -0.01, ratio: 900 / 720 }, screen: { src: "cases/ai-agents/01.webp", w: 1600, h: 1128, device: "browser" } }, brand: "sber.svg" },
  { id: "community", title: "Community", subtitle: "City stories for Mos.ru: from zero to a first version in nine months", tag: "Web platform · Mos.ru · 2024", kind: ["web"], look: { stage: ["#fcefe6", "#f6d9c6"], ink: "#3a1d12", accent: "#d9603b", object: { w: 1.32, x: -0.16, y: 0.02, ratio: 900 / 545 }, screen: { src: "cases/community/01.webp", w: 1473, h: 806, device: "browser" } }, brand: "community.svg" },
  { id: "moderator-dashboard", title: "Moderator Dashboard", subtitle: "A workspace of their own for moderators: −38% steps per task", tag: "B2B dashboard · Mos.ru · 2024", kind: ["web"], look: { stage: ["#f1eef9", "#dbd3ee"], ink: "#231a3a", accent: "#6b55c9", object: { w: 1.16, x: -0.02, y: -0.05, ratio: 900 / 760 }, screen: { src: "cases/figma/moderator-queue.png", w: 1440, h: 1156, device: "browser" } }, brand: "community.svg" },
  { id: "stop-spam", title: "Stop Spam", subtitle: "First-run setup for an anti-spam app: +25% reach working protection", tag: "iOS · Android · 2026", kind: ["mobile"], look: { stage: ["#e9f4f7", "#cbe3ea"], ink: "#0f2a31", accent: "#15899d", object: { w: 1.28, x: -0.12, y: -0.02, ratio: 900 / 712 }, screen: { src: "cases/figma/spam-welcome.png", w: 402, h: 874, device: "phone" } }, brand: "stop-spam.png" },
];

const ru: Record<string, Ru> = {
  "grif-ai": { title: "GRIF AI", subtitle: "Ассистент сам приносит готовые действия. Дизайнер в проекте один", tag: "ИИ-ассистент · 2026" },
  "ai-agents": { title: "Управление ИИ-агентами", subtitle: "Оценка рисков агентов без Jira и Excel: 6 передач из рук в руки → 0", tag: "Сбер · Enterprise · 2025" },
  "community": { title: "Сообщество", subtitle: "Городские истории для Mos.ru: с нуля до первой версии за 9 месяцев", tag: "Веб-платформа · Mos.ru · 2024" },
  "moderator-dashboard": { title: "Кабинет модератора", subtitle: "Свой кабинет для модераторов: −38% шагов на задачу", tag: "B2B-кабинет · Mos.ru · 2024" },
  "stop-spam": { title: "Стоп Спам", subtitle: "Первый запуск антиспама: +25% доходят до включённой защиты", tag: "iOS · Android · 2026" },
};

/** список на текущем языке: тот же порядок и те же обложки */
export function getCases(): CaseItem[] {
  if (getLang() === "en") return cases;
  return cases.map((c) => {
    const r = ru[c.id];
    return r ? { ...c, ...r } : c;
  });
}

