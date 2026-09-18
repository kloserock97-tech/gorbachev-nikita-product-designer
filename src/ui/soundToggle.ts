import { cue } from "../audio/bus";
import type { SoundState } from "../audio/ambient";
import { chapters } from "../scene/story";
import { onLang, t as tr } from "../i18n";

/* Кнопка звука в доке (docs/prompts/sound.md).
   - Браузер не даёт играть без жеста, скролл жестом не считается: звук включается по кнопке или по
     первому клику/тапу/клавише, если человек его раньше не выключал (localStorage) и не просил
     экономить трафик (Save-Data).
   - AudioContext создаётся прямо в обработчике жеста (iOS требует resume синхронно), а сам движок —
     ambient.ts + uisfx — догружается отдельным чанком после этого.
   - Параметры звука обновляются 10 раз в секунду по таймеру, а не в кадре сцены; на скрытой вкладке
     и после выключения контекст засыпает. Клавиша M — вкл/выкл. */

type Scene = {
  windNow: number;
  weatherKind: SoundState["weather"];
  storyProgress: number;
  computerFocused: boolean;
};

const KEY = "hill-sound";

export function initSound(scene: Scene) {
  const btn = document.querySelector<HTMLButtonElement>(".dock-sound");
  if (!btn) return;
  const read = () => { try { return localStorage.getItem(KEY); } catch { return null; } };
  const save = (v: string) => { try { localStorage.setItem(KEY, v); } catch { /* приватный режим */ } };
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;

  let ctx: AudioContext | null = null;
  let engine: Awaited<ReturnType<typeof import("../audio/ambient").createAmbient>> | null = null;
  let loading: Promise<void> | null = null;
  let enabled = false;
  let timer = 0;
  let last = 0;

  const paint = () => {
    btn.setAttribute("aria-pressed", String(enabled));
    btn.setAttribute("aria-label", tr(enabled ? "nav.sound.on" : "nav.sound.off"));
    document.body.classList.toggle("sound-on", enabled);
  };
  paint();
  onLang(paint);

  const tick = () => {
    if (!engine) return;
    const t = performance.now();
    const dt = Math.min(0.5, (t - last) / 1000);
    last = t;
    const { s, c, f } = chapters(scene.storyProgress);
    /* в футере холм снова «живой»: s как на первом экране */
    engine.update({ wind: scene.windNow, weather: scene.weatherKind, s: f > 0.15 ? 0 : s, c, f, focus: scene.computerFocused }, dt);
  };

  const enable = (announce: boolean) => {
    if (enabled) return;
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    /* в том же синхронном обработчике жеста */
    ctx ??= new AC({ latencyHint: "playback" });
    void ctx.resume();
    enabled = true;
    paint();
    loading ??= import("../audio/ambient").then((m) => { engine = m.createAmbient(ctx!); });
    loading.then(() => {
      if (!enabled || !engine) return;
      last = performance.now();
      clearInterval(timer);
      timer = window.setInterval(tick, 100);
      tick();
      if (announce) cue("toggle-on", 0.8);
    }).catch((e) => console.warn("звук не загрузился", e));
  };
  const disable = () => {
    if (!enabled) return;
    enabled = false;
    paint();
    clearInterval(timer);
    engine?.fadeOut();
    window.setTimeout(() => { if (!enabled) void ctx?.suspend(); }, 700);
  };

  btn.addEventListener("click", (e) => {
    e.preventDefault();
    if (enabled) { disable(); save("off"); } else { enable(true); save("on"); }
  });
  addEventListener("keydown", (e) => {
    if (e.key !== "m" && e.key !== "M") return;
    if ((e.target as HTMLElement).closest("input, textarea, [contenteditable]") || e.metaKey || e.ctrlKey || e.altKey) return;
    if (enabled) { disable(); save("off"); } else { enable(true); save("on"); }
  });

  /* первый жест на странице включает фон, если звук не выключали */
  if (read() !== "off" && !conn?.saveData) {
    const first = (e: Event) => {
      if ((e.target as Element | null)?.closest?.(".dock-sound")) return; // кнопку обработает её click
      if (e instanceof KeyboardEvent && (e.key === "m" || e.key === "M")) return;
      off();
      enable(false);
    };
    const off = () => {
      removeEventListener("pointerup", first, true);
      removeEventListener("keydown", first, true);
    };
    addEventListener("pointerup", first, true);
    addEventListener("keydown", first, true);
  }

  /* для CDP-проверок */
  Object.assign(window, { __sound: { get state() { return ctx?.state ?? "none"; }, get enabled() { return enabled; }, get loaded() { return !!engine; } } });

  document.addEventListener("visibilitychange", () => {
    if (!ctx) return;
    if (document.hidden) void ctx.suspend();
    else if (enabled) void ctx.resume();
  });
}
