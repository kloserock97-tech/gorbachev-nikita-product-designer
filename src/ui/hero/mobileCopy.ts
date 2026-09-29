/* v85.3: на вертикальном телефонном экране текстовый блок первого экрана стоит так, что середина кнопки
   «Смотреть кейсы» — на уровне верхушки кроны дерева. Раньше заголовок начинался сразу под доком и «прилипал» к нему.

   Крона — объект сцены: где она на экране, зависит от пропорций окна (дерево и камера пересчитываются по ним),
   поэтому её высоту даёт сцена (HillScene.treeTopClient), а где внутри блока середина кнопки — разметка.
   Результат — одна переменная --m-copy-top на .stage (отступ блока сверху, hero-mobile.css), ниже прежнего
   минимума она блок не поднимает. Считаем на изменении размера, смене языка и после загрузки шрифтов: в кадре
   DOM не читаем (v44). Меряем offsetTop — он не видит translate, которым тексты въезжают при появлении. */
import { onLang } from "../../i18n";
import { onViewport } from "../storyScroll";

type Scene = { treeTopClient?(): number | null };

/* та же граница, что у телефонной колонки в hero-mobile.css; горизонтальный узкий экран раскладывается иначе */
const PORTRAIT = matchMedia("(max-width: 900px) and (max-aspect-ratio: 1 / 1)");

export function initMobileCopy(scene: Scene) {
  const stage = document.getElementById("stage");
  const head = document.querySelector<HTMLElement>(".headline");
  const cta = document.querySelector<HTMLElement>(".cta");
  if (!stage || !head || !cta) return;
  /* смещение элемента от верха .stage по цепочке offsetParent */
  const offsetIn = (el: HTMLElement) => {
    let y = 0;
    for (let e: HTMLElement | null = el; e && e !== stage; e = e.offsetParent as HTMLElement | null) y += e.offsetTop;
    return y;
  };
  let raf = 0;
  const place = () => {
    raf = 0;
    if (!PORTRAIT.matches) { stage.style.removeProperty("--m-copy-top"); return; }
    const tree = scene.treeTopClient?.();
    if (tree == null || !Number.isFinite(tree)) return;
    /* середина кнопки от верха блока (заголовка) — от отступа блока не зависит */
    const ctaMid = offsetIn(cta) + cta.offsetHeight / 2 - offsetIn(head);
    /* холст на телефоне закреплён у верха окна: высота кроны в окне = её высота на странице при прокрутке 0 */
    const stageTop = stage.getBoundingClientRect().top + scrollY;
    stage.style.setProperty("--m-copy-top", `${Math.round(tree - stageTop - ctaMid)}px`);
  };
  /* два кадра: сцена успевает пересчитать камеру и дерево под новый размер окна */
  const schedule = () => { if (!raf) raf = requestAnimationFrame(() => requestAnimationFrame(place)); };
  onViewport(schedule);
  onLang(schedule);
  PORTRAIT.addEventListener("change", schedule);
  document.fonts?.ready.then(schedule);
  schedule();
}
