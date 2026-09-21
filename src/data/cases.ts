/* Кейсы для ленты в главе «Кейсы», меню Work и страницы на экране компьютера.
   Источник: порядок и ссылки — Main page/Cases.html (+ EN/Cases.en.html), подзаголовки — лиды
   Main cases/*.html. Предметные превью 1120×630 лежат в public/cases/covers,
   оригинальные знаки — в public/cases/brands. Источники и промпты: docs/case-preview-art-direction.md.
   v27: у каждого кейса есть русский двойник — название, подзаголовок и метка берутся по текущему
   языку (getCases()). Порядок, id и обложки от языка не зависят. */
import { getLang } from "../i18n";

/** kind — для фильтра в меню Work: веб (и десктоп) или мобайл */
export type CaseKind = "web" | "mobile";
export type CaseItem = { id: string; title: string; subtitle: string; tag: string; kind: CaseKind[]; cover: string; brand?: string };
type Ru = { title: string; subtitle: string; tag: string };

const cases: CaseItem[] = [
  { id: "grif-ai", title: "GRIF AI", subtitle: "An assistant that brings ready-made actions. One designer: me", tag: "AI assistant · 2026", kind: ["web"], cover: "cases/covers/grif-ai.webp", brand: "grif.svg" },
  { id: "ai-agents", title: "AI Agent Risk Management", subtitle: "Agent risk assessment out of Jira and Excel: 6 manual handoffs → 0", tag: "Sber · Enterprise · 2025", kind: ["web"], cover: "cases/covers/ai-agents.webp", brand: "sber.svg" },
  { id: "community", title: "Community", subtitle: "City stories for Mos.ru: from zero to a first version in nine months", tag: "Web platform · Mos.ru · 2024", kind: ["web"], cover: "cases/covers/community.webp", brand: "community.svg" },
  { id: "moderator-dashboard", title: "Moderator Dashboard", subtitle: "A workspace of their own for moderators: −38% steps per task", tag: "B2B dashboard · Mos.ru · 2024", kind: ["web"], cover: "cases/covers/moderator-dashboard.webp", brand: "community.svg" },
  { id: "stop-spam", title: "Stop Spam", subtitle: "First-run setup for an anti-spam app: +25% reach working protection", tag: "iOS · Android · 2026", kind: ["mobile"], cover: "cases/covers/stop-spam.webp", brand: "stop-spam.png" },
  { id: "electronic-house", title: "Electronic House", subtitle: "UX audit of a housing-services app with four main screens rebuilt", tag: "UX audit · Mobile app · 2024", kind: ["mobile"], cover: "cases/covers/electronic-house.webp", brand: "electronic-house.webp" },
];

const ru: Record<string, Ru> = {
  "grif-ai": { title: "GRIF AI", subtitle: "Ассистент сам приносит готовые действия. Дизайнер в проекте один", tag: "ИИ-ассистент · 2026" },
  "ai-agents": { title: "Управление ИИ-агентами", subtitle: "Оценка рисков агентов без Jira и Excel: 6 передач из рук в руки → 0", tag: "Сбер · Enterprise · 2025" },
  "community": { title: "Сообщество", subtitle: "Городские истории для Mos.ru: с нуля до первой версии за 9 месяцев", tag: "Веб-платформа · Mos.ru · 2024" },
  "moderator-dashboard": { title: "Кабинет модератора", subtitle: "Свой кабинет для модераторов: −38% шагов на задачу", tag: "B2B-кабинет · Mos.ru · 2024" },
  "stop-spam": { title: "Стоп Спам", subtitle: "Первый запуск антиспама: +25% доходят до включённой защиты", tag: "iOS · Android · 2026" },
  "electronic-house": { title: "Электронный дом", subtitle: "UX-аудит приложения ЖКХ и четыре главных экрана, собранных заново", tag: "UX-аудит · Мобильное приложение · 2024" },
};

/** список на текущем языке: тот же порядок и те же обложки */
export function getCases(): CaseItem[] {
  if (getLang() === "en") return cases;
  return cases.map((c) => {
    const r = ru[c.id];
    return r ? { ...c, ...r } : c;
  });
}

