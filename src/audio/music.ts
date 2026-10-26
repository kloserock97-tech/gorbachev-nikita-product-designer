/* Заглавная музыка: «Northern Resonance» (filipposalaris830, Pixabay Content License) — public/music/theme.mp3,
   первые 106,75 с исходника. Грузится вместе с движком звука, то есть только после включения звука.

   Сетка трека измерена по огибающей атак: 110,56 уд/мин, такт 2,171 с, первая доля на 0,385 с.
   Части по тактам: 0–12 — тихая (голос и пэды, без баса), 12–16 — входит бас, 16–27 — самая плотная часть
   («припев»), 27–32 — провал, 32–48 — второй заход.
   - На холме играет тихая часть: с начала до такта 12, дальше петлёй с такта 4.
   - Вход в главу «Кейсы» ставит переход в припев (такт 16) на ближайшую сильную долю — он звучит под заставку
     «сейчас будут кейсы». Дальше трек идёт сам до такта 48 и возвращается в петлю тихой части; провал 28–31
     (до −34 дБ, а природы в «Кейсах» нет — была почти тишина, как будто песня кончилась) пропускается.
   - Выход из «Кейсов» в любую сторону — вверх на холм или к порталу и футеру — на ближайшей доле такта уводит
     трек в тихую часть медленной сменой (новый кусок входит за 1,5 с, старый гаснет за 2,5 с). Раньше трек
     оставался где был, и наверху после футера звучал провал (такты 27–32) — как будто песня кончилась.
   - С хода портала (FOOTER.portal[0]) музыка плавно вдвое тише. Из футера обратно в «Кейсы» — снова припев.
   - Трек всё же доиграл до конца файла (таймер звука долго стоял) — запускается заново с тихой части.
   - Открытый кейс — пауза; после закрытия музыка продолжается с того же места.
   Переход — «хвостом»: новый кусок входит за 0,12 с, старый гаснет за 0,6 с, так ревёрб не обрывается.
   Время считается по ctx.currentTime: пока контекст спит (звук выключен, вкладка скрыта), трек тоже стоит. */

const BPM = 110.56;
const BAR = (4 * 60) / BPM;
const FIRST = 0.385;
const bar = (n: number) => FIRST + n * BAR;
const ramp = (x: number, a: number, b: number) => Math.min(1, Math.max(0, (x - a) / (b - a)));

const LOOP_FROM = bar(4);
const LOOP_TO = bar(12);
const CHORUS = bar(16);
const CHORUS_END = bar(27);
const DIP_FROM = bar(28);
const DIP_TO = bar(31);
const SONG_TO = bar(48);

const VOLUME = 0.5;
/* в футере — доля от VOLUME */
const CALM_VOLUME = 0.5;
const CALM_FROM = 0.04;
const IN = 0.12;
const OUT = 0.6;
/* переход ставится не ближе, чем через столько секунд: start и огибающие нужно успеть запланировать */
const LEAD = 0.15;

export type MusicState = {
  c: number; // глава «Кейсы» 0…1
  f: number; // футер 0…1: с хода портала музыка тише и спокойнее
  caseOpen: boolean;
};

type Voice = { src: AudioBufferSourceNode; g: GainNode; at: number; from: number };

export function createMusic(ctx: AudioContext) {
  const now = () => ctx.currentTime;
  const out = ctx.createGain();
  out.gain.value = 0;
  out.connect(ctx.destination);

  let buf: AudioBuffer | null = null;
  let voice: Voice | null = null;
  /* прежний голос, пока гаснет после перехода */
  let tail: Voice | null = null;
  /* следующий переход уже запланирован: до этого момента планировщик трек не трогает */
  let busyUntil = 0;
  let paused: number | null = null;
  let wasCases = false;
  let chorusAt = -1e9;

  void fetch(`${import.meta.env.BASE_URL}music/theme.mp3`)
    .then((r) => r.arrayBuffer())
    .then((ab) => ctx.decodeAudioData(ab))
    .then((b) => { buf = b; })
    .catch((e) => console.warn("музыка не загрузилась", e));

  const at = (v: Voice) => v.from + (now() - v.at);
  /** где сейчас трек, в секундах исходника; до запланированного перехода — там, где ещё играет прежний голос */
  const pos = () => (!voice ? 0 : tail && now() < voice.at ? at(tail) : at(voice));
  const stop = (v: Voice, when: number) => {
    v.src.stop(when);
    v.src.onended = () => { v.src.disconnect(); v.g.disconnect(); };
  };

  /** запустить трек с места from в момент when; прежний голос гаснет «хвостом» */
  const play = (from: number, when: number, fadeIn = IN, fadeOut = OUT) => {
    if (!buf) return;
    const src = ctx.createBufferSource();
    const g = ctx.createGain();
    src.buffer = buf;
    g.gain.setValueAtTime(0, when);
    g.gain.setTargetAtTime(1, when, fadeIn / 3);
    src.connect(g).connect(out);
    src.start(when, Math.max(0, from));
    if (voice) {
      voice.g.gain.setTargetAtTime(0, when, fadeOut / 3);
      stop(voice, when + fadeOut * 2);
    }
    tail = voice;
    voice = { src, g, at: when, from };
    busyUntil = when;
  };

  /** момент (по часам контекста) первой сильной доли трека не раньше чем через LEAD */
  const nextBar = (v: Voice) => {
    const n = Math.ceil((pos() + LEAD - FIRST) / BAR);
    return v.at + (bar(n) - v.from);
  };

  const pause = () => {
    if (!voice || paused !== null) return;
    paused = pos();
    for (const v of [voice, tail]) {
      if (!v) continue;
      v.g.gain.cancelScheduledValues(now());
      v.g.gain.setTargetAtTime(0, now(), 0.1);
      stop(v, now() + 0.4);
    }
    voice = tail = null;
    busyUntil = 0;
  };
  const resume = () => {
    if (paused === null) return;
    play(paused, now() + 0.05, 0.8);
    paused = null;
  };

  const update = (st: MusicState) => {
    if (!buf) return;
    out.gain.setTargetAtTime(VOLUME * (1 - (1 - CALM_VOLUME) * ramp(st.f, CALM_FROM, 0.3)), now(), 0.6);
    if (st.caseOpen) { pause(); return; }
    resume();
    /* «Кейсы» — от начала главы до хода портала; всё остальное (холм, About, футер) — тихая часть */
    const cases = st.c > 0.02 && st.f <= CALM_FROM;
    /* первый старт: на холме — с начала, если звук включили уже в «Кейсах» — сразу с припева */
    if (!voice) {
      wasCases = cases;
      play(cases ? CHORUS : 0, now() + 0.05, cases ? 1.5 : 2.5);
      if (cases) chorusAt = now();
      return;
    }
    if (now() < busyUntil) return;

    const p = pos();
    if (p > buf.duration - 0.3) {
      play(LOOP_FROM, now() + 0.05, 1.5);
    } else if (!cases && wasCases && p >= LOOP_TO) {
      play(LOOP_FROM, nextBar(voice), 1.5, 2.5);
    } else if (cases && !wasCases && now() - chorusAt > 40 && (p < LOOP_TO || p > CHORUS_END)) {
      /* припев — по входу в главу, если его не играли последние 40 с и трек сейчас не в нём */
      play(CHORUS, nextBar(voice));
      chorusAt = busyUntil;
    } else if (p < LOOP_TO && p > LOOP_TO - 1) {
      play(LOOP_FROM, voice.at + (LOOP_TO - voice.from));
    } else if (p < DIP_FROM && p > DIP_FROM - 1) {
      play(DIP_TO, voice.at + (DIP_FROM - voice.from));
    } else if (p > SONG_TO - 1) {
      play(LOOP_FROM, voice.at + (SONG_TO - voice.from));
    }
    wasCases = cases;
  };

  return {
    update,
    /** музыка играет: фон природы под ней приглушается */
    get playing() { return !!voice; },
    /** для CDP-проверок: где трек и загружен ли он */
    get position() { return pos(); },
    get loaded() { return !!buf; },
    /** выключение звука: громкость в ноль; трек стоит вместе с уснувшим контекстом */
    fadeOut: () => {
      out.gain.cancelScheduledValues(now());
      out.gain.setTargetAtTime(0, now(), 0.25);
    },
  };
}
