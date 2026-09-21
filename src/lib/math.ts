/* Мелкая математика, которая нужна всем: сцене, звуку, загрузчику, интерфейсу.
   До v63 clamp01 и ramp были объявлены в четырёх файлах, smooth — в трёх. */
export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
/** линейно 0…1, пока x идёт от a к b */
export const ramp = (x: number, a: number, b: number) => clamp01((x - a) / (b - a));
/** то же со сглаженными краями (smoothstep); порядок аргументов как у ramp: от, до, значение — первым идёт диапазон */
export const smooth = (a: number, b: number, x: number) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
