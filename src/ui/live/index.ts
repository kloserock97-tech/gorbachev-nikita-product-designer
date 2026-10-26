/* v115: живые прототипы кейсов — каждый своим чанком, грузится, когда блок подъехал к экрану */
import type { LiveProto } from "./types";

export const LIVE: Record<string, () => Promise<{ default: LiveProto }>> = {
  /* 26.10: прежние модули ручной вёрстки (plati, agents, community) заменены экранами из Figma — <кейс>2/flows.ts */
  /* 24.10: GRIF на финальных экранах из Figma — знакомство и письмо после встречи */
  "grif-onboarding": () => import("./grif2/flows").then((m) => ({ default: m.grifOnboarding })),
  "grif-chat": () => import("./grif2/flows").then((m) => ({ default: m.grifChat })),
};

/* 26.10: прототипы на экранах из Figma у всех кейсов (как GRIF). Модуль src/ui/live/<папка>/flows.ts с экспортом
   flows: Record<сценарий, LiveProto> подключается сам, ключ в данных кейса — «<папка>:<сценарий>». Реестр выше
   для них править не нужно. */
const FLOWS = import.meta.glob<{ flows: Record<string, LiveProto> }>("./*/flows.ts");

export function liveLoader(key?: string): (() => Promise<{ default: LiveProto }>) | null {
  if (!key) return null;
  if (LIVE[key]) return LIVE[key];
  const [dir, flow] = key.split(":");
  const load = flow ? FLOWS[`./${dir}/flows.ts`] : undefined;
  if (!load) return null;
  return () => load().then((m) => {
    const p = m.flows?.[flow];
    if (!p) throw new Error(`нет сценария ${key}`);
    return { default: p };
  });
}
