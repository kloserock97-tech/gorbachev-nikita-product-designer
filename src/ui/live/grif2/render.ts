/* 24.10: экраны GRIF из Figma один в один (Grif-Design-UI, секция «Все макеты — единый язык» 1066:3810).
   Экран не свёрстан руками: конвертер обошёл дерево кадра в Figma и записал каждый слой с его координатами, заливками,
   обводками, тенями и текстом (screens.json). Здесь компактная запись разворачивается в разметку:
   · p="x,y,w,h" — абсолютное место слоя внутри родителя (как в Figma);
   · c="…" — класс из общей таблицы стилей (одинаковые слои разных экранов делят класс);
   · s="…" — иконка или логотип из общей таблицы SVG; одноцветные иконки рисуются currentColor.
   Слой ищется по имени из Figma: [data-n="…"] — так сценарии прототипа и демо находят кнопки и карточки.
   Экраны строятся по требованию и кешируются строкой; стили вставляются один раз на страницу.

   26.10: движок общий для всех кейсов (конвейер — tools/f2h). createRenderer(набор экранов, ns, картинки): у каждого
   кейса своё пространство классов .g2--<ns>, таблицы стилей разных кейсов не пересекаются. GRIF — экземпляр ниже. */
import data from "./screens.json";

export type Frame = { key: string; id: string; name: string; w: number; h: number; html: string };
export type Bundle = { frames: Frame[]; svgs: Record<string, string>; cls: Record<string, string> };
export type Renderer = ReturnType<typeof createRenderer>;

let uid = 0;

/** ns — короткое имя кейса для классов; img(name, base) — адрес картинки слоя из url(IMG:name) */
export function createRenderer(bundle: Bundle, ns: string, img: (name: string, base: string) => string) {
  const frames = new Map<string, Frame>(bundle.frames.map((f) => [f.key, f]));
  const expanded = new Map<string, string>();

  function ensureStyles(base: string) {
    if (!document.querySelector("style[data-g2]")) {
      const st = document.createElement("style");
      st.dataset.g2 = "";
      st.textContent = `.g2{position:relative;overflow:hidden;font-family:Inter,sans-serif;-webkit-font-smoothing:antialiased;text-rendering:geometricPrecision}
.g2 div,.g2 i{position:absolute;box-sizing:border-box;margin:0;display:block;font-style:normal}
.g2 i svg{display:block;width:100%;height:100%;overflow:visible}`;
      document.head.append(st);
    }
    if (document.querySelector(`style[data-g2-ns="${ns}"]`)) return;
    const rules = Object.entries(bundle.cls).map(([k, v]) => {
      const text = v.startsWith("T;");
      const body = (text ? v.slice(2) : v).replace(/url\(IMG:([\w-]+)\)/g, (_, n) => `url(${img(n, base)})`);
      return `.g2--${ns} .${k}{${body}}`;
    });
    const st = document.createElement("style");
    st.dataset.g2Ns = ns;
    st.textContent = rules.join("\n");
    document.head.append(st);
  }

  /* id внутри SVG уникальны на вставку: одинаковые иконки в нескольких экранах иначе ссылались бы на defs из скрытого экрана */
  function svgFor(key: string) {
    const s = bundle.svgs[key] ?? "";
    if (!/ id="/.test(s)) return s;
    const n = ++uid;
    return s.replace(/ id="([^"]+)"/g, ` id="$1-${n}"`).replace(/url\(#([^)]+)\)/g, `url(#$1-${n})`);
  }

  function expand(key: string) {
    let h = expanded.get(key);
    if (!h) {
      h = frames.get(key)!.html
        .replace(/ n="/g, ' data-n="')
        .replace(/ p="([-\d.]+),([-\d.]+),([\d.]+),([\d.]+)"/g, (_, l, t, w, hh) => ` style="left:${l}px;top:${t}px;width:${w}px;height:${hh}px"`)
        .replace(/ c="/g, ' class="');
      expanded.set(key, h);
    }
    return h.replace(/ s="([a-z][0-9a-z]*)"><\/i>/g, (_, k) => `>${svgFor(k)}</i>`);
  }

  /** экран целиком: корневой слой кадра стоит в 0,0 */
  function renderScreen(key: string) {
    const f = frames.get(key)!;
    const wrap = document.createElement("div");
    wrap.className = `g2 g2--${ns}`;
    wrap.dataset.screen = key;
    wrap.style.width = `${f.w}px`;
    wrap.style.height = `${f.h}px`;
    wrap.innerHTML = expand(key);
    const root = wrap.firstElementChild as HTMLElement | null;
    if (root) { root.style.left = "0px"; root.style.top = "0px"; }
    return wrap;
  }

  const screenSize = (key: string) => { const f = frames.get(key)!; return { w: f.w, h: f.h }; };
  return { ensureStyles, renderScreen, screenSize, has: (key: string) => frames.has(key) };
}

/** слой по имени из Figma (первый подходящий); contains — по части имени */
export const layer = (root: ParentNode, name: string, contains = false) =>
  root.querySelector<HTMLElement>(contains ? `[data-n*="${CSS.escape(name)}"]` : `[data-n="${CSS.escape(name)}"]`);
/** текстовый слой по точному тексту — когда имя слоя служебное («Text», «Label») */
export const byText = (root: ParentNode, text: string) =>
  [...root.querySelectorAll<HTMLElement>(".g2 div")].find((el) => !el.firstElementChild && el.textContent?.trim() === text) ?? null;

/* ── GRIF ── */
export type ScreenKey = "new" | "input" | "working" | "pending" | "question" | "done" | "feed" | "feedRun" | "feedEmpty" | "memory" | "forget" | "onb1" | "onb2" | "onb3" | "onb4" | "onb5" | "onb6";
export const grif = createRenderer(data as Bundle, "grif", (n, base) => `${base}cases/grif-ai/live2/${n === "avatar" ? "avatar" : `char-${n}`}.png`);
export const ensureStyles = grif.ensureStyles;
export const renderScreen = (key: ScreenKey) => grif.renderScreen(key);
export const screenSize = (key: ScreenKey) => grif.screenSize(key);
