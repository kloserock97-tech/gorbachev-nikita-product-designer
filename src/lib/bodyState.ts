/* v79: состояния страницы живут классами на <body>: is-ready (загрузка позади), story-away (интерфейс холма
   уехал), pc-focus (открыт компьютер), case-open (открыта страница кейса). Кто показывает что-то дорогое
   (видео, WebGL), подписывается и останавливается, когда его не видно. */
const subs: (() => void)[] = [];
let observer: MutationObserver | null = null;

/** вызвать fn при каждой смене классов body (и один раз сразу) */
export function onBodyState(fn: () => void) {
  subs.push(fn);
  observer ??= new MutationObserver(() => { for (const f of subs) f(); });
  observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
  fn();
}

export const bodyHas = (cls: string) => document.body.classList.contains(cls);
