import { setCueImpl, type Cue } from "./bus";

/* Звук холма (docs/prompts/sound.md). Грузится отдельным чанком только когда человек включил звук.

   Природный фон — не запись, а маленький Web Audio-граф: так он ничего не весит по сети и живёт
   вместе со сценой (порывы травы слышны, погода меняет звук).
   - ветер: «бурый» шум → низкочастотный фильтр, громкость медленно дышит случайным блужданием;
   - шелест травы: тот же шум выше 1.8 кГц, растёт на порывах (uWind);
   - птицы: короткие фразы из одного осциллятора с огибающими частоты и громкости, в стерео,
     редко (раз в 3–10 с); узлы живут только пока звучит фраза;
   - дождь (погода rain) и сверчки (dusk);
   - v20.2: тональную «солнечную» подкладку (синусы 110–165 Гц) убрали — без громкого ветра она гудела.
   Всё управляется из update() ~10 раз в секунду через setTargetAtTime — в кадре сцены звук не работает.
   UI-сигналы — готовые файлы UI SFX (uisfx.com, характер zen, CC0), тот же AudioContext. */

export type SoundState = {
  wind: number; // uWind сцены: ~1 обычный ветер, до ~2.7 на порыве
  weather: "clear" | "cloudy" | "rain" | "dusk";
  s: number; // глава 1 скролл-истории 0…1
  c: number; // глава «Кейсы» 0…1
  f: number; // футер 0…1
  focus: boolean; // камера у экрана компьютера
};

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const ramp = (x: number, a: number, b: number) => clamp01((x - a) / (b - a));

export function createAmbient(ctx: AudioContext) {
  const now = () => ctx.currentTime;
  const set = (p: AudioParam, v: number, tc = 0.35) => p.setTargetAtTime(v, now(), tc);

  /* ── выход: общий фильтр «глохнет» на переходах, общая громкость плавно въезжает ── */
  const out = ctx.createGain();
  out.gain.value = 0;
  const muffle = ctx.createBiquadFilter();
  muffle.type = "lowpass";
  muffle.frequency.value = 16000;
  muffle.Q.value = 0.5;
  /* срез инфранизов и постоянной составляющей шумов на общем выходе — не гудит на наушниках */
  const sub = ctx.createBiquadFilter();
  sub.type = "highpass";
  sub.frequency.value = 45;
  muffle.connect(sub).connect(out).connect(ctx.destination);

  /* ── шум: 4 с «бурого» (для ветра) и розоватого (шелест, дождь), моно, генерируется один раз ── */
  const len = Math.floor(ctx.sampleRate * 4);
  const brown = ctx.createBuffer(1, len, ctx.sampleRate);
  const pink = ctx.createBuffer(1, len, ctx.sampleRate);
  {
    const b = brown.getChannelData(0), p = pink.getChannelData(0);
    let last = 0, b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      last = (last + 0.02 * w) / 1.02;
      b[i] = last * 3.5;
      b0 = 0.99765 * b0 + w * 0.099046;
      b1 = 0.963 * b1 + w * 0.2965164;
      b2 = 0.57 * b2 + w * 1.0526913;
      p[i] = (b0 + b1 + b2 + w * 0.1848) * 0.11;
    }
    /* шов петли: короткий переход конца в начало, чтобы не щёлкало */
    const fade = Math.floor(ctx.sampleRate * 0.05);
    for (let i = 0; i < fade; i++) {
      const k = i / fade;
      b[len - fade + i] = b[len - fade + i] * (1 - k) + b[i] * k;
      p[len - fade + i] = p[len - fade + i] * (1 - k) + p[i] * k;
    }
  }
  const loop = (buf: AudioBuffer, rate: number, offset: number) => {
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    src.playbackRate.value = rate;
    src.start(0, offset);
    return src;
  };

  /* ветер */
  const windLP = ctx.createBiquadFilter();
  windLP.type = "lowpass";
  windLP.frequency.value = 420;
  const windGain = ctx.createGain();
  windGain.gain.value = 0;
  /* срез низа: у бурого шума основная энергия внизу, и на тихом ветре она слышалась как гул.
     Два фильтра по 200 Гц подряд (−24 дБ/окт) — остаётся «шорох» воздуха 200–700 Гц */
  const windHP = ctx.createBiquadFilter();
  windHP.type = "highpass";
  windHP.frequency.value = 200;
  const windHP2 = ctx.createBiquadFilter();
  windHP2.type = "highpass";
  windHP2.frequency.value = 200;
  loop(brown, 1, 0).connect(windHP).connect(windHP2).connect(windLP).connect(windGain).connect(muffle);

  /* шелест травы: стерео-разнос — чуть разные копии шума по каналам */
  const rustleHP = ctx.createBiquadFilter();
  rustleHP.type = "highpass";
  rustleHP.frequency.value = 1800;
  const rustleLP = ctx.createBiquadFilter();
  rustleLP.type = "lowpass";
  rustleLP.frequency.value = 6500;
  const rustleGain = ctx.createGain();
  rustleGain.gain.value = 0;
  const merge = ctx.createChannelMerger(2);
  loop(pink, 1, 0.7).connect(merge, 0, 0);
  loop(pink, 0.97, 2.3).connect(merge, 0, 1);
  merge.connect(rustleHP).connect(rustleLP).connect(rustleGain).connect(muffle);

  /* дождь: широкий шум без низа */
  const rainHP = ctx.createBiquadFilter();
  rainHP.type = "highpass";
  rainHP.frequency.value = 900;
  const rainGain = ctx.createGain();
  rainGain.gain.value = 0;
  loop(pink, 1.35, 1.1).connect(rainHP).connect(rainGain).connect(muffle);


  /* сверчки: несущая ~4.3 кГц, амплитуда рубится импульсами — два узла на всё время */
  const cricketGain = ctx.createGain();
  cricketGain.gain.value = 0;
  const cricketAM = ctx.createGain();
  cricketAM.gain.value = 0;
  const cricket = ctx.createOscillator();
  cricket.frequency.value = 4300;
  cricket.connect(cricketAM).connect(cricketGain).connect(muffle);
  cricket.start();

  /* ── птицы: фраза = один осциллятор + огибающая + панорама, живёт секунду ── */
  let birdsOn = 0; // 0…1 — насколько «птичья» сейчас обстановка
  let birdVoices = 0;
  const bird = () => {
    if (birdVoices > 2 || birdsOn < 0.05) return;
    const t0 = now() + 0.05;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    const pan = ctx.createStereoPanner();
    const lp = ctx.createBiquadFilter();
    osc.type = "sine";
    g.gain.value = 0;
    pan.pan.value = Math.random() * 1.4 - 0.7;
    lp.type = "lowpass";
    /* дальние — глуше и тише */
    const near = 0.35 + Math.random() * 0.65;
    lp.frequency.value = 3500 + near * 6000;
    const amp = 0.05 * near * birdsOn;
    const f = osc.frequency, a = g.gain;
    let t = t0;
    const kind = Math.random();
    if (kind < 0.45) {
      /* трель-переливы: 5–9 нот с подтяжками */
      const n = 5 + Math.floor(Math.random() * 5);
      const base = 2400 + Math.random() * 1400;
      f.setValueAtTime(base, t);
      for (let i = 0; i < n; i++) {
        const d = 0.06 + Math.random() * 0.07;
        const to = base * (0.8 + Math.random() * 0.6);
        f.linearRampToValueAtTime(to, t + d * 0.7);
        a.setValueAtTime(0, t);
        a.linearRampToValueAtTime(amp, t + 0.012);
        a.linearRampToValueAtTime(amp * 0.6, t + d * 0.6);
        a.linearRampToValueAtTime(0, t + d);
        t += d + 0.02 + Math.random() * 0.05;
      }
    } else if (kind < 0.8) {
      /* «ти-ча, ти-ча»: пары нот сверху вниз */
      const hi = 4800 + Math.random() * 900, lo = hi * 0.78;
      const reps = 2 + Math.floor(Math.random() * 3);
      for (let i = 0; i < reps; i++) {
        for (const [from, to] of [[hi * 1.04, hi], [lo * 1.05, lo * 0.94]]) {
          f.setValueAtTime(from, t);
          f.exponentialRampToValueAtTime(to, t + 0.07);
          a.setValueAtTime(0, t);
          a.linearRampToValueAtTime(amp * 0.8, t + 0.01);
          a.linearRampToValueAtTime(0, t + 0.08);
          t += 0.11;
        }
        t += 0.06;
      }
    } else {
      /* длинный свист с вибрато — далёкая иволга */
      const base = 1700 + Math.random() * 500;
      f.setValueAtTime(base, t);
      f.linearRampToValueAtTime(base * 1.25, t + 0.25);
      f.linearRampToValueAtTime(base * 0.92, t + 0.55);
      a.setValueAtTime(0, t);
      a.linearRampToValueAtTime(amp * 0.7, t + 0.08);
      a.linearRampToValueAtTime(amp * 0.5, t + 0.4);
      a.linearRampToValueAtTime(0, t + 0.6);
      t += 0.62;
    }
    osc.connect(g).connect(lp).connect(pan).connect(muffle);
    osc.start(t0);
    osc.stop(t + 0.05);
    birdVoices++;
    osc.onended = () => {
      birdVoices--;
      osc.disconnect(); g.disconnect(); lp.disconnect(); pan.disconnect();
    };
  };
  let birdTimer = 0;
  const scheduleBird = () => {
    birdTimer = window.setTimeout(() => {
      bird();
      /* иногда отвечает вторая птица */
      if (Math.random() < 0.3) window.setTimeout(bird, 500 + Math.random() * 900);
      scheduleBird();
    }, 2500 + Math.random() * 7000 / Math.max(0.3, birdsOn));
  };
  scheduleBird();

  /* сверчки: пачка из 3–4 стрекотаний каждые ~0.9 с, расписание на полсекунды вперёд */
  let cricketsOn = 0;
  let cricketNext = 0;
  const scheduleCrickets = () => {
    if (cricketsOn < 0.05) return;
    const am = cricketAM.gain;
    while (cricketNext < now() + 1.2) {
      let t = Math.max(cricketNext, now() + 0.05);
      const n = 3 + Math.floor(Math.random() * 2);
      for (let i = 0; i < n; i++) {
        am.setValueAtTime(0, t);
        am.linearRampToValueAtTime(1, t + 0.008);
        am.linearRampToValueAtTime(0, t + 0.03);
        t += 0.045;
      }
      cricketNext = t + 0.7 + Math.random() * 0.4;
    }
  };

  /* ── состояние сцены → параметры, ~10 раз в секунду ── */
  let breath = 0.5;
  let fadeIn = 0;
  const update = (st: SoundState, dt: number) => {
    fadeIn = Math.min(1, fadeIn + dt / 3.5);
    breath = clamp01(breath + (Math.random() - 0.5) * dt * 0.9);
    const gust = clamp01((st.wind - 1) / 1.6);
    const rain = st.weather === "rain" ? 1 : 0;
    const dusk = st.weather === "dusk" ? 1 : 0;
    const cloudy = st.weather === "cloudy" ? 1 : 0;

    /* где мы в истории: холм → «глохнет», пока сетка его съедает → воздух светлой страницы → поле кейсов */
    const eaten = ramp(st.s, 0.06, 0.46);
    /* v20.1: в главе «Кейсы» природы нет — фон уходит в тишину, птицы и сверчки молчат */
    const gone = ramp(st.c, 0.0, 0.12) * (1 - ramp(st.f, 0.15, 0.5));
    const level = Math.max(0.16, 1 - eaten) * (1 - gone) * (st.focus ? 0.55 : 1);
    set(out.gain, 0.8 * level * fadeIn * fadeIn, 0.6);
    set(muffle.frequency, 16000 * Math.pow(1 - eaten, 2.2) + 650, 0.4);

    /* v20.1: ветер был слишком громким — теперь это тихая подложка своя для каждой погоды:
       ясно — едва слышно, облачно — заметнее, дождь его прячет, сумерки — почти штиль.
       Слышен в основном на порыве (кнопка ▶) и сразу стихает */
    const windBase = { clear: 0.05, cloudy: 0.1, rain: 0.03, dusk: 0.025 }[st.weather];
    const windTone = { clear: 520, cloudy: 620, rain: 480, dusk: 440 }[st.weather];
    set(windGain.gain, windBase * (0.8 + breath * 0.4) + gust * 0.09, gust > 0.05 ? 0.3 : 1.2);
    set(windLP.frequency, windTone + breath * 80 + gust * 420, 0.8);
    const rustleBase = { clear: 0.006, cloudy: 0.011, rain: 0.003, dusk: 0.004 }[st.weather];
    set(rustleGain.gain, rustleBase * (0.7 + breath * 0.6) + gust * 0.05, gust > 0.05 ? 0.25 : 1);
    set(rainGain.gain, rain * 0.08, 1.2);
    birdsOn = (1 - rain) * (1 - dusk) * (1 - cloudy * 0.6) * (1 - eaten) * (1 - gone) * (st.focus ? 0.4 : 1);
    cricketsOn = dusk * (1 - eaten) * (1 - gone);
    set(cricketGain.gain, cricketsOn * 0.012, 1);
    scheduleCrickets();
  };

  /* ── UI-сигналы: файлы UI SFX (характер zen, CC0) из public/sfx ──
     Не синтез uisfx в рантайме: замер показал 9–55 мс JS на сигнал на быстром ПК — на слабом телефоне
     это рывки кадра. MP3 весят 1–5 КБ, decodeAudioData декодирует вне основного потока. Грузятся
     в простое после включения звука; частые сигналы режутся по времени, полифония — до 4 голосов. */
  const SFX: Record<Cue, number> = {
    hover: 0.12, press: 0.2, "toggle-on": 0.2, "toggle-off": 0.18, open: 0.18, close: 0.17, forward: 0.17,
    expand: 0.16, collapse: 0.15, swipe: 0.14, "progress-step": 0.12, checkpoint: 0.18, select: 0.16,
  };
  const FILE: Partial<Record<Cue, string>> = { "toggle-off": "close", select: "press" };
  const COOLDOWN: Partial<Record<Cue, number>> = { hover: 140, "progress-step": 180 };
  const sfxOut = ctx.createGain();
  sfxOut.gain.value = 0.9;
  sfxOut.connect(ctx.destination);
  const buffers = new Map<string, AudioBuffer | Promise<AudioBuffer | null>>();
  const base = import.meta.env.BASE_URL;
  const load = (name: string) => {
    let b = buffers.get(name);
    if (!b) {
      b = fetch(`${base}sfx/${name}.mp3`)
        .then((r) => r.arrayBuffer())
        .then((ab) => ctx.decodeAudioData(ab))
        .then((buf) => { buffers.set(name, buf); return buf; })
        .catch(() => null);
      buffers.set(name, b);
    }
    return b;
  };
  const idle = (window as Window & { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 400));
  /* по одному файлу в окно простоя: разом одиннадцать загрузок и декодов давали рывок кадра на скролле */
  const queue = [...new Set(Object.keys(SFX).map((c) => FILE[c as Cue] ?? c))];
  const next = () => {
    const name = queue.shift();
    if (name) idle(() => void Promise.resolve(load(name)).then(next));
  };
  next();
  const lastAt = new Map<Cue, number>();
  let voices = 0;
  setCueImpl((name: Cue, volume = 1) => {
    if (ctx.state !== "running" || voices >= 4) return;
    const t = performance.now();
    if (t - (lastAt.get(name) ?? -1e9) < (COOLDOWN[name] ?? 60)) return;
    lastAt.set(name, t);
    const buf = buffers.get(FILE[name] ?? name);
    /* ещё не загружен — сигнал пропускаем, а не играем с опозданием */
    if (!(buf instanceof AudioBuffer)) { void load(FILE[name] ?? name); return; }
    const src = ctx.createBufferSource();
    const g = ctx.createGain();
    src.buffer = buf;
    g.gain.value = SFX[name] * volume * 2.2;
    src.connect(g).connect(sfxOut);
    voices++;
    src.onended = () => { voices--; src.disconnect(); g.disconnect(); };
    src.start();
  });

  return {
    update,
    /** выключить: общий уровень в ноль, затем контекст засыпает */
    fadeOut: () => {
      fadeIn = 0;
      out.gain.cancelScheduledValues(now());
      out.gain.setTargetAtTime(0, now(), 0.25);
    },
    dispose: () => {
      clearTimeout(birdTimer);
      setCueImpl(null);
    },
  };
}
