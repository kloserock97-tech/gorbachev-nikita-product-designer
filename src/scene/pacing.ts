/* v139 (стенд Detroit 09.11): ровные 30 кадров вместо рваных 40, если устройство не держит 60.

   Detroit на PS4 и PS4 Pro идёт в 30 кадров — не уступка железу, а выбор: кино без управления камерой не нужна частота
   шутера, а вдвое больший бюджет кадра уходит в картинку. Здесь то же как страховка: качество не трогаем (разрешение,
   трава, лучи — те же), меняется только частота. Пока сцена спокойно держит 60, ничего не происходит.
   Если медиана интервала между отрисованными кадрами три секунды подряд хуже 21 мс (меньше ~48 кадров), потолок
   переходит на 30 и остаётся там до конца визита: ровные 33 мс выглядят плавнее, чем скачки 20–30 мс.
   Меряется только на открытом холме после загрузки и заставки, с паузой 2 с на прогрев (компиляция шейдеров на старте
   и переходы между главами бывают тяжелее на миг — это не повод). ?pace=0 — выключить, ?pacems= — порог,
   ?fps= в адресе — частота задана руками, тогда логика не вмешивается. */

export class FramePacer {
  private readonly off: boolean;
  private readonly limit: number;
  private gaps: number[] = [];
  private last = 0;
  private eligibleSince = 0;
  private badSince = 0;
  locked = false;
  median = 0;

  constructor() {
    const q = new URLSearchParams(location.search);
    this.off = q.get("pace") === "0" || q.has("fps");
    this.limit = Number(q.get("pacems") ?? 21);
  }

  /** после каждого отрисованного кадра; true — один раз, когда пора перейти на 30 кадров */
  frame(now: number, eligible: boolean): boolean {
    if (this.off || this.locked) return false;
    const gap = this.last ? now - this.last : 0;
    this.last = now;
    if (!eligible || document.hidden || !gap || gap > 200) { this.reset(); return false; }
    if (!this.eligibleSince) this.eligibleSince = now;
    if (now - this.eligibleSince < 2000) return false;
    this.gaps.push(gap);
    if (this.gaps.length > 60) this.gaps.shift();
    if (this.gaps.length < 30) return false;
    this.median = [...this.gaps].sort((a, b) => a - b)[this.gaps.length >> 1];
    if (this.median <= this.limit) { this.badSince = 0; return false; }
    if (!this.badSince) this.badSince = now;
    if (now - this.badSince < 3000) return false;
    this.locked = true;
    return true;
  }

  private reset() {
    this.eligibleSince = 0;
    this.badSince = 0;
    this.gaps.length = 0;
  }
}
