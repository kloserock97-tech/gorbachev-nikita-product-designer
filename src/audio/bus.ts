/* Шина звуковых сигналов (docs/prompts/sound.md). Интерфейс зовёт cue("open") где угодно — пока звук не
   включён, это пустой вызов: движок (ambient.ts + uisfx) грузится отдельным чанком только после
   первого включения, и до этого страница не платит за звук ни байтом, ни тактом. */
export type Cue =
  | "press" | "hover" | "open" | "close" | "expand" | "collapse" | "toggle-on" | "toggle-off"
  | "swipe" | "checkpoint" | "progress-step" | "forward" | "select";

type Impl = (cue: Cue, volume?: number) => void;
let impl: Impl | null = null;

export const setCueImpl = (f: Impl | null) => { impl = f; };
/** сигнал интерфейса; volume — доля от громкости по умолчанию для этого сигнала */
export const cue = (name: Cue, volume?: number) => impl?.(name, volume);
