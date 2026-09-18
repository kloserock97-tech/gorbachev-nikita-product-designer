import * as THREE from "three";

/* Бегущая строка за компьютером (как «it's wearable» у oryzo.ai): одна строка текста в
   CanvasTexture, закольцованная по ширине. Рисуется в финальном шейдере между «бумагой» и
   слоем компьютера — буквы проходят за ним, а тень компьютера ложится на них.
   Белые буквы на прозрачном: цвет задаёт шейдер.

   v19: строка — начало текста About. В конце она встаёт заголовком «Hi there!» левой колонки,
   поэтому метрики фиксированы и известны DOM-слою: кегль — FONT·высоты текстуры, базовая линия —
   на BASE высоты сверху, текст начинается с x = 0 (левый отступ глифа такой же, как в DOM). */
export const KINETIC_HEAD = "Hi there!";
export const KINETIC_TEXT = `${KINETIC_HEAD} I’m Nikita, a Senior/Lead Product Designer  ✦  `;
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
  const k: Kinetic = { texture: null!, ratio: 1, headFrac: 0.2, dispose: () => k.texture.dispose() };
  /* размер канваса у загруженной текстуры не меняем (three хранит её неизменяемой) —
     когда приезжает шрифт, собираем новую */
  const draw = () => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    ctx.font = font;
    const w = Math.min(8192, Math.ceil(ctx.measureText(KINETIC_TEXT).width));
    const head = ctx.measureText(KINETIC_HEAD).width;
    canvas.width = w;
    canvas.height = H;
    ctx.font = font; // смена размера канваса сбрасывает контекст
    ctx.fillStyle = "#fff";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(KINETIC_TEXT, 0, H * KINETIC_BASE);
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
    document.fonts?.load(font).then((faces) => {
      if (faces.length) draw();
      else document.fonts.addEventListener("loadingdone", ensure, { once: true });
    }).catch(() => {});
  };
  ensure();
  return k;
}
