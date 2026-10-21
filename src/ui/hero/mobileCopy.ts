/* v85.3: на вертикальном телефонном экране текстовый блок первого экрана стоит так, что середина кнопки
   «Смотреть кейсы» — на уровне верхушки кроны дерева. Раньше заголовок начинался сразу под доком и «прилипал» к нему.

   Крона — объект сцены: где она на экране, зависит от пропорций окна (дерево и камера пересчитываются по ним),
   поэтому её высоту даёт сцена (HillScene.treeTopClient), а где внутри блока середина кнопки — разметка.
   Результат — одна переменная --m-copy-top на .stage (отступ блока сверху, hero-mobile.css), ниже прежнего
   минимума она блок не поднимает. Считаем на изменении размера, смене языка и после загрузки шрифтов: в кадре
   DOM не читаем (v44). Меряем offsetTop — он не видит translate, которым тексты въезжают при появлении.

   v102: на широком экране — то же по просьбе Никиты: верх заглавных «Н» и «Г» имени стоит на уровне верхушки кроны.
   Где в строке верх букв, говорят метрики шрифта (canvas measureText): базовая линия в строке inline-блока и высота
   заглавной. Результат — --copy-shift на .stage, на него сдвинуты имя, серая строка, темы и кнопка (hill-ui.css).
   Блок только опускается и не ниже 180u — иначе кнопка подошла бы к нижнему ряду цифр */
import { onLang } from "../../i18n";
import { onViewport } from "../storyScroll";

type Scene = { treeTopClient?(reach?: number): number | null };

/* та же граница, что у телефонной колонки в hero-mobile.css; горизонтальный узкий экран раскладывается иначе */
const PORTRAIT = matchMedia("(max-width: 900px) and (max-aspect-ratio: 1 / 1)");
/* широкая раскладка — та же граница, что у блока min-width: 901px в hill-ui.css */
const WIDE = matchMedia("(min-width: 901px)");
const ruler = document.createElement("canvas").getContext("2d");
const REACH = 0.6;

export function initMobileCopy(scene: Scene) {
  const stage = document.getElementById("stage");
  const head = document.querySelector<HTMLElement>(".headline");
  const cta = document.querySelector<HTMLElement>(".cta");
  const name = document.querySelector<HTMLElement>(".headline span:first-child i");
  if (!stage || !head || !cta) return;
  /* смещение элемента от верха .stage по цепочке offsetParent */
  const offsetIn = (el: HTMLElement) => {
    let y = 0;
    for (let e: HTMLElement | null = el; e && e !== stage; e = e.offsetParent as HTMLElement | null) y += e.offsetTop;
    return y;
  };
  let raf = 0;
  let shift = 0;
  /* верх заглавной буквы имени от верха .stage, без текущего сдвига */
  const capTop = () => {
    if (!name || !ruler) return null;
    const cs = getComputedStyle(name);
    ruler.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    const first = (name.textContent ?? "").trim().charAt(0) || "N";
    const m = ruler.measureText(first);
    const fa = m.fontBoundingBoxAscent, fd = m.fontBoundingBoxDescent;
    if (!Number.isFinite(fa) || !Number.isFinite(fd)) return null;
    /* у inline-блока строка высотой line-height, содержимое шрифта — по её середине */
    const baseline = (name.offsetHeight - (fa + fd)) / 2 + fa;
    return offsetIn(name) - shift + baseline - m.actualBoundingBoxAscent;
  };
  const placeWide = () => {
    /* на широком кадре крона крупнее и чётче — её видимая верхушка ближе к краю рамки дерева (замер по кадрам) */
    const tree = scene.treeTopClient?.(REACH);
    const cap = capTop();
    if (tree == null || cap == null || !Number.isFinite(tree)) return;
    const u = stage.offsetWidth / 1600;
    const stageTop = stage.getBoundingClientRect().top + scrollY;
    shift = Math.round(Math.min(180 * u, Math.max(0, tree - stageTop - cap)));
    stage.style.setProperty("--copy-shift", `${shift}px`);
  };
  const place = () => {
    raf = 0;
    if (WIDE.matches) { stage.style.removeProperty("--m-copy-top"); placeWide(); return; }
    shift = 0;
    stage.style.removeProperty("--copy-shift");
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
  WIDE.addEventListener("change", schedule);
  document.fonts?.ready.then(schedule);
  schedule();
}
