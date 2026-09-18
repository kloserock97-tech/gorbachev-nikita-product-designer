/* v35: подзадачи внутри кейса. Страница кейса открывается основным user flow (caseDetails), а чипсы
   под шапкой переключают на отдельные задачи, решённые попутно: фильтр, сортировка, конвейер агентов,
   лидерство. У каждой свой адрес: #/work/<кейс>/<подзадача>. В основном flow пункты, у которых есть
   подробный разбор, помечены ссылкой на подзадачу (hints).
   Тексты — из страниц кейсов (Main cases/*.html, EN/*.en.html) и презентации «Open to lead roles»;
   ничего не досочинено. */
import { getLang } from "../i18n";
import type { CaseImage } from "./caseDetails";
import en from "./caseTracks.en";
import ru from "./caseTracks.ru";

export type TrackOption = { name: string; text: string; chosen?: boolean; image?: CaseImage };
export type TrackStep = { title: string; text: string };

/** один раздел подзадачи; все поля кроме id/label/title необязательны — рисуется то, что заполнено */
export type TrackPart = {
  id: string;
  /** короткая подпись во вкладках панели */
  label: string;
  title: string;
  /** что нашёл / контекст */
  found?: string;
  /** что сделал, абзацем */
  did?: string;
  points?: string[];
  /** варианты решения рядом (например, два фильтра) */
  options?: TrackOption[];
  /** шаги процесса или маршрута */
  steps?: TrackStep[];
  /** было → стало одной парой */
  before?: { label: string; text: string; note?: string };
  effect?: string;
  /** принцип, который можно назвать вслух */
  why?: string;
  /** ошибка или вывод, забранный с собой */
  lesson?: { title: string; text: string };
  images?: CaseImage[];
};

export type CaseTrack = {
  id: string;
  /** подпись чипса */
  chip: string;
  kicker: string;
  title: string;
  tagline: string;
  facts?: [string, string][];
  metrics?: { value: string; label: string }[];
  parts: TrackPart[];
  quote?: string | null;
};

/** пометка в основном flow: у пункта раздела есть подробный разбор в подзадаче */
export type TrackHint = { section: "problem" | "solution" | "results"; point: number; track: string };

export type CaseTracks = {
  /** подпись первого чипса — основной flow кейса */
  main: string;
  tracks: CaseTrack[];
  hints: TrackHint[];
};

export type TrackSet = Record<string, CaseTracks>;

export function getTracks(caseId: string): CaseTracks | null {
  const set: TrackSet = getLang() === "ru" ? ru : en;
  return set[caseId] ?? null;
}
