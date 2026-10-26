/* 26.10: типы мини-демо решений (src/ui/decisionDemos.ts) — отдельно, чтобы модули кейсов (src/ui/live/<папка>/demos.ts)
   описывали свои демо, не подтягивая движок страницы. Демо — три шага: каждый показывает экран кейса, ведёт курсор
   и обводит слой кольцом; подпись шага «1 из 3 · …» внизу. */
import type { Renderer } from "./render";
import type { Stage } from "./stage";

export type L = { ru: string; en: string };
export type Scene = {
  s: Stage;
  calm: boolean;
  wait: (ms: number) => Promise<void>;
  /** курсор к элементу (по центру или в точку fx, fy в долях элемента) */
  point: (el: HTMLElement | null, fx?: number, fy?: number) => Promise<void>;
  /** нажатие курсором (интерфейсу не передаётся) */
  press: (el: HTMLElement | null) => Promise<void>;
  ring: (el: HTMLElement | null) => void;
};
export type Beat = { cap: L; run: (s: Scene) => Promise<void>; hold?: number };
/** r — экраны кейса (по умолчанию GRIF); size — размер кадра (по умолчанию 1440 × 900); телефон (выше, чем шире)
    встаёт целиком по высоте посреди сцены 16:10; liven/fix — как у прототипа кейса */
export type Demo = {
  beats: Beat[];
  r?: Renderer;
  size?: { w: number; h: number };
  liven?: (el: HTMLElement, key: string, instant: boolean) => void;
  fix?: (el: HTMLElement, key: string) => void;
};
