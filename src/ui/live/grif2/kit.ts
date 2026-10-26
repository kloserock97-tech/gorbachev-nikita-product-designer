/* 26.10: общий набор для живых прототипов на экранах из Figma (вынесен из flows.ts GRIF, чтобы все кейсы собирались
   одинаково). Сценарий — функция (stage, ctx, шаг): показывает экран шага, оживляет его и ставит кольцо-подсказку на
   настоящий слой экрана; нажали — сценарий переходит к следующему шагу и сообщает движку (ctx.go), чтобы панель слева
   переключилась. Шаги сценария = шаги в данных кейса (CasePrototype.steps), по порядку. */
import type { LiveCtx, LiveInstance, LiveProto } from "../types";
import type { Renderer } from "./render";
import { createStage, type Stage } from "./stage";

export type Flow = (s: Stage, ctx: LiveCtx, step: number) => void;

/** куда нажать: кольцо отдельным слоем поверх экрана (stage.mark) — на самом слое его срезали бы родители */
export function hint(s: Stage, el: HTMLElement | null, onTap: () => void) {
  s.mark(el);
  if (!el) return;
  el.dataset.hot = "";
  el.addEventListener("click", (e) => { e.stopPropagation(); onTap(); }, { once: true });
}

/** модуль прототипа: design.w — ширина кадра в Figma; r — экраны кейса; liven — оживление экранов кейса */
export function make(design: { w: number }, flow: Flow, r?: Renderer, liven?: (el: HTMLElement, key: string, instant: boolean) => void): LiveProto {
  return {
    design,
    mount(root, ctx): LiveInstance {
      const s = createStage(root, { base: ctx.base, calm: ctx.calm, r, liven });
      const show = (k: number) => flow(s, ctx, k);
      show(0);
      return { show, destroy: () => s.destroy() };
    },
  };
}

/** переход по шагам внутри сценария: go(k) — сообщить движку и показать шаг k */
export const stepper = (flow: Flow, s: Stage, ctx: LiveCtx) => (k: number) => { ctx.go(k); flow(s, ctx, k); };

/* ход в чате: ответ человека выезжает справа, ответ собирается по частям, длинный текст проявляется словами */
export function turn(s: Stage, onReady: () => void, opts: { thread?: string; user?: string; agent?: string } = {}) {
  const thread = s.find(opts.thread ?? "Thread");
  const msgs = [...(thread?.children ?? [])] as HTMLElement[];
  const user = [...msgs].reverse().find((m) => m.dataset.n === (opts.user ?? "User message"));
  const agent = [...msgs].reverse().find((m) => m.dataset.n === (opts.agent ?? "Agent message"));
  let t = 0;
  if (user) { user.classList.add("g2-from-right"); t = 360; }
  const dur = s.reveal(agent ?? null, 320, 0, (kid, at) => {
    const text = [...kid.querySelectorAll<HTMLElement>("div"), kid].find((n) => !n.children.length && (n.textContent ?? "").length > 48);
    return text ? s.stream(text, t + at, 26) : 0;
  });
  /* reveal считает от нуля — сдвигаем на время выезда ответа человека */
  if (t && agent) [...agent.children].forEach((k) => ((k as HTMLElement).style.animationDelay = `${t}ms`));
  s.later(t + dur, onReady);
}

/** экран входит лесенкой: дети слоя name появляются по очереди (30–60 мс) */
export function stagger(el: HTMLElement, sel: string, step = 45, from = 60, cls = "g2-rise") {
  [...el.querySelectorAll<HTMLElement>(sel)].forEach((n, i) => { n.style.animationDelay = `${from + i * step}ms`; n.classList.add(cls); });
}
