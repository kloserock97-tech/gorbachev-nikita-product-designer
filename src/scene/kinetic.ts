import * as THREE from "three";
import { onLang, t } from "../i18n";

/* Бегущая строка за компьютером (как «it's wearable» у oryzo.ai): одна строка текста в
   CanvasTexture, закольцованная по ширине. Рисуется в финальном шейдере между «бумагой» и
   слоем компьютера — буквы проходят за ним, а тень компьютера ложится на них.
   Белые буквы на прозрачном: цвет задаёт шейдер.

   v19: строка — начало текста About. В конце она встаёт заголовком «Hi there!» левой колонки,
   поэтому метрики фиксированы и известны DOM-слою: кегль — FONT·высоты текстуры, базовая линия —
   на BASE высоты сверху, текст начинается с x = 0 (левый отступ глифа такой же, как в DOM). */
/* v57: строка идёт на языке страницы. Заголовок — тот же ключ, что у DOM-заголовка (about.hi),
   иначе в русской версии строка вставала бы словом «Hi there!» на место «Привет!». */
const kineticHead = () => t("about.hi");
const kineticText = () => `${kineticHead()} ${t("about.marquee")}  ✦  `;
export const KINETIC_FONT = 0.72;
export const KINETIC_BASE = 0.76;

export type Kinetic = {
  texture: THREE.CanvasTexture;
  /** ширина текстуры / высота */
  ratio: number;
  /** доля ширины, которую занимает «Hi there!» */
  headFrac: number;
  dispose(): void;
};

/** onTexture — заранее залить текстуру в видеопамять (renderer.initTexture) */
export function createKinetic(onTexture?: (t: THREE.Texture) => void): Kinetic {
  const H = 300;
  const font = `700 ${Math.round(H * KINETIC_FONT)}px Manrope, "Segoe UI", sans-serif`;
  let offLang = () => {};
  const k: Kinetic = { texture: null!, ratio: 1, headFrac: 0.2, dispose: () => { offLang(); k.texture.dispose(); } };
  /* размер канваса у загруженной текстуры не меняем (three хранит её неизменяемой) —
     когда приезжает шрифт, собираем новую */
  const draw = () => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    const text = kineticText();
    ctx.font = font;
    const w = Math.min(8192, Math.ceil(ctx.measureText(text).width));
    const head = ctx.measureText(kineticHead()).width;
    canvas.width = w;
    canvas.height = H;
    ctx.font = font; // смена размера канваса сбрасывает контекст
    ctx.fillStyle = "#fff";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(text, 0, H * KINETIC_BASE);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.NoColorSpace;
    /* мипмапы: в конце строка уменьшается до кегля заголовка — без них буквы рябят.
       Шва у повтора нет: координата непрерывная, RepeatWrapping, производные ровные */
    texture.generateMipmaps = true;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.anisotropy = 4;
    texture.wrapS = THREE.RepeatWrapping;
    k.texture?.dispose();
    k.texture = texture;
    k.ratio = w / H;
    k.headFrac = head / w;
    onTexture?.(texture);
  };
  draw();
  /* Manrope грузится с Google Fonts асинхронно: пока стиль не приехал, шрифт даже не объявлен
     (fonts.check() тогда врёт «готово»). load() вернёт пустой список — ждём следующей загрузки шрифтов */
  const ensure = () => {
    /* текст передаём обязательно: Google Fonts режет Manrope по unicode-range, и без него
       кириллический кусок шрифта не запросится — русская строка нарисуется запасным шрифтом */
    document.fonts?.load(font, kineticText()).then((faces) => {
      if (faces.length) draw();
      else document.fonts.addEventListener("loadingdone", ensure, { once: true });
    }).catch(() => {});
  };
  ensure();
  offLang = onLang(() => { draw(); ensure(); });
  return k;
}
