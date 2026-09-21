/* Регулятор качества (v22.2). Стартовая калибровка меряет интервалы кадров за ~секунду — на общей
   видеокарте (соседняя вкладка, ноутбук на батарее) один неудачный замер ронял ступень до DPR 1.26 без
   MSAA и половины травы и держал её две недели («качество опять упало»). Интервалы к тому же упираются
   в развёртку экрана и потолок FPS, так что запас по ним не виден.

   Здесь меряется время работы видеокарты за кадр (EXT_disjoint_timer_query_webgl2), пока человек
   спокойно смотрит на холм. Есть запас — ступень выше, перегруз — ниже. Против «дыхания» картинки:
   окна по 60 кадров, пауза после смены, не больше 4 смен за визит, на ступень, с которой уже
   спускались, не возвращаемся; после трёх спокойных окон регулятор засыпает. Нет расширения — ничего
   не делает, остаётся стартовая калибровка. */

type Ladder = readonly (readonly [number, number, number, boolean])[];

/* стоимость ступени относительно верхней: вершины травы ∝ её доле, пиксели ∝ DPR² и MSAA.
   Замер на Intel Arc 140T при DPR 1.51: MSAA 4× — 20 мс, 2× — 15, без — 9 */
const MSAA = (m: number) => (m >= 4 ? 1 : m >= 2 ? 0.72 : 0.42);
const tierCost = ([s, m, b]: readonly [number, number, number, boolean]) => 0.3 * b + 0.7 * s * s * MSAA(m);

export class QualityGovernor {
  private ext: { TIME_ELAPSED_EXT: number; GPU_DISJOINT_EXT: number } | null;
  private pending: WebGLQuery[] = [];
  private active: WebGLQuery | null = null;
  private samples: number[] = [];
  private skip = 30;
  private changes = 0;
  private calm = 0;
  private ceiling: number; // выше этой ступени (меньшего индекса) не поднимаемся — оттуда уже спускались
  asleep = false;

  constructor(private gl: WebGL2RenderingContext, private ladder: Ladder, private budgetMs = 15) {
    this.ext = gl.getExtension("EXT_disjoint_timer_query_webgl2") as typeof this.ext;
    this.ceiling = 0;
    if (!this.ext) this.asleep = true;
  }

  begin() {
    if (this.asleep || !this.ext || this.active || this.pending.length > 4) return;
    const q = this.gl.createQuery();
    if (!q) return;
    this.gl.beginQuery(this.ext.TIME_ELAPSED_EXT, q);
    this.active = q;
  }

  end() {
    if (!this.active || !this.ext) return;
    this.gl.endQuery(this.ext.TIME_ELAPSED_EXT);
    this.pending.push(this.active);
    this.active = null;
  }

  /** сбросить окно (смена ступени, уход с холма) */
  reset(skip = 30) {
    for (const q of this.pending) this.gl.deleteQuery(q);
    this.pending = [];
    this.samples = [];
    this.skip = skip;
  }

  /**
   * Забрать готовые замеры; вернуть новую ступень или null.
   * tier — текущая; idle — человек на холме, ничего не анимируется поверх.
   */
  poll(tier: number, idle: boolean): number | null {
    if (this.asleep || !this.ext) return null;
    const gl = this.gl;
    const disjoint = gl.getParameter(this.ext.GPU_DISJOINT_EXT);
    while (this.pending.length) {
      const q = this.pending[0];
      if (!gl.getQueryParameter(q, gl.QUERY_RESULT_AVAILABLE)) break;
      const ns = gl.getQueryParameter(q, gl.QUERY_RESULT) as number;
      gl.deleteQuery(q);
      this.pending.shift();
      if (disjoint || !idle) continue;
      if (this.skip > 0) { this.skip--; continue; }
      this.samples.push(ns / 1e6);
    }
    if (!idle) { this.samples = []; return null; }
    if (this.samples.length < 60) return null;
    const sorted = this.samples.slice().sort((a, b) => a - b);
    const med = sorted[sorted.length >> 1];
    this.samples = [];

    const cur = tierCost(this.ladder[tier]);
    /* перегруз: даже медиана выше бюджета — вниз на ступень, туда больше не поднимаемся */
    if (med > this.budgetMs * 1.12 && tier < this.ladder.length - 1 && this.changes < 4) {
      this.changes++;
      this.calm = 0;
      this.ceiling = tier + 1;
      this.reset();
      return tier + 1;
    }
    /* запас: прогноз стоимости ступени выше укладывается с 15% запасом */
    if (tier > this.ceiling && this.changes < 4) {
      const next = tierCost(this.ladder[tier - 1]);
      if (med * (next / cur) < this.budgetMs * 0.85) {
        this.changes++;
        this.calm = 0;
        this.reset();
        return tier - 1;
      }
    }
    if (++this.calm >= 3) this.asleep = true;
    return null;
  }
}
