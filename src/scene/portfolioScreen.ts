import * as THREE from "three";
import { getMe } from "../data/me";
import { getLang, onLang } from "../i18n";

/* v27: тексты экрана берутся на текущем языке; при переключении страница перерисовывается */
const ME = getMe;
/* v78: подписи первого экрана (баннер и три кнопки) — здесь, а не в me.ts: они часть вёрстки экрана */
const HERO = () => getLang() === "ru"
  ? { line: "Цифровые продукты  •  Интерфейсы  •  Системы", buttons: ["Обо мне", "Проекты", "Контакты"] }
  : { line: "Digital products  •  Interfaces  •  Systems", buttons: ["About", "Projects", "Contact"] };

/* Экран ретро-компьютера — рабочий стол начала 2000-х: обои с холмом, окно браузера
   с личной домашней страницей, панель задач с кнопкой Start и часами.

   Две текстуры:
   - chrome — всё неподвижное (обои, рамка окна, меню, адресная строка, статус,
     панель задач) в размер экрана; на месте страницы в ней дыра с прозрачностью;
   - page — сама страница одной длинной полосой.
   Шейдер склеивает их и сдвигает страницу на величину прокрутки, рисует ползунок —
   при прокрутке ничего не перерисовывается и заново не загружается в видеокарту.
   Часы перерисовывают только chrome, раз в минуту.

   Поверх — свой шейдер кинескопа, слабый: монитор 2000-х почти плоский. v29: переписан с нуля по правилу
   «чужое не публикуем» — экран-«сквиркл» вместо скруглённого прямоугольника, искажение с добавочным членом
   четвёртой степени, разъезд каналов по радиусу, эллиптическая виньетка, свой хэш помех. Значок у «Start» —
   свой холм с солнцем, без чужих логотипов. */

const BASE = import.meta.env.BASE_URL;
const SW = 1024;
const SCREEN_ASPECT = 0.25 / 0.232;
const SH = Math.round(SW / SCREEN_ASPECT);

/* раскладка окна в пикселях экрана */
const WIN = { x0: 26, y0: 22, x1: SW - 26, y1: SH - 66 };
const TITLE_H = 42, MENU_H = 28, ADDR_H = 36, STATUS_H = 28, SCROLL_W = 22, TASK_H = 52;
const PAGE = { x0: WIN.x0 + 6, y0: WIN.y0 + TITLE_H + MENU_H + ADDR_H + 2, x1: WIN.x1 - 6 - SCROLL_W, y1: WIN.y1 - STATUS_H - 4 };
const TRACK = { x0: PAGE.x1, y0: PAGE.y0 + SCROLL_W, x1: PAGE.x1 + SCROLL_W, y1: PAGE.y1 - SCROLL_W };
const PW = PAGE.x1 - PAGE.x0;
/* страница вёрстается в логических пикселях и рисуется крупнее: на экране монитора
   в кадре 1 : 1 текст был мелковат */
const K = 1.3;
const PWL = PW / K;
const VIEW_H = PAGE.y1 - PAGE.y0;

const UI = `Tahoma, Verdana, "Segoe UI", "DejaVu Sans", sans-serif`;
const BODY = `Verdana, Tahoma, "DejaVu Sans", sans-serif`;
const DISPLAY = `"Trebuchet MS", "Arial Black", Verdana, sans-serif`;
const LINK = "#0033cc";
const TEXT = "#1b1b1b";
const BEIGE = "#ece9d8";

const screenVertex = /* glsl */ `
#include <common>
varying vec2 vUv;
void main() {
  vUv = uv;
  vec3 transformed = position;
  #include <project_vertex>
}`;

/* include-ы <common> и <project_vertex> обязательны: без них программа не собирается */
const screenFragment = /* glsl */ `
#include <common>
uniform sampler2D uChrome, uPage;
uniform float uTime, uCurve, uChroma, uCorner, uVignette, uVignetteSoft;
uniform float uScan, uScanCount, uFlicker, uAspect, uScroll, uView;
uniform vec4 uRect, uTrack;
uniform vec2 uScreenPx;
/* скролл-история: фото на весь экран и помехи при переключении */
uniform sampler2D uPhoto;
uniform float uPhotoMix, uStatic;
varying vec2 vUv;
float hash21(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

vec3 screenAt(vec2 w) {
  vec4 chrome = texture2D(uChrome, w);
  vec2 cu = (w - uRect.xy) / (uRect.zw - uRect.xy);
  float inPage = step(0.0, cu.x) * step(cu.x, 1.0) * step(0.0, cu.y) * step(cu.y, 1.0);
  vec3 page = texture2D(uPage, vec2(cu.x, uScroll + clamp(cu.y, 0.0, 1.0) * uView)).rgb * inPage;
  vec3 col = mix(page, chrome.rgb, chrome.a);

  /* ползунок полосы прокрутки в духе 2000-х: светло-голубой с рамкой и насечкой */
  vec2 tu = (w - uTrack.xy) / (uTrack.zw - uTrack.xy);
  float room = 1.0 - uView;
  float top = room > 0.0 ? uScroll / room * room : 0.0;
  float inTrack = step(0.0, tu.x) * step(tu.x, 1.0) * step(top, tu.y) * step(tu.y, top + uView);
  vec2 px = vec2(tu.x, (tu.y - top) / max(uView, 1e-4)) * (uTrack.zw - uTrack.xy) * uScreenPx * vec2(1.0, uView);
  vec2 size = (uTrack.zw - uTrack.xy) * uScreenPx * vec2(1.0, uView);
  float edge = step(px.x, 1.5) + step(size.x - 1.5, px.x) + step(px.y, 1.5) + step(size.y - 1.5, px.y);
  vec3 thumb = mix(vec3(0.78, 0.85, 0.99), vec3(0.62, 0.73, 0.96), tu.x);
  float grip = step(abs(px.y - size.y * 0.5), 7.0) * step(0.5, fract((px.y - size.y * 0.5) / 3.0)) * step(abs(px.x - size.x * 0.5), 4.5);
  thumb = mix(thumb, vec3(0.52, 0.64, 0.92), grip);
  thumb = mix(thumb, vec3(0.44, 0.56, 0.86), min(1.0, edge));
  return mix(col, thumb, inTrack);
}

void main() {
  vec2 c = vUv - 0.5;
  /* выпуклость стекла: квадратичный член плюс слабый член четвёртой степени — края гнутся сильнее центра */
  float r2 = dot(c, c);
  vec2 w = 0.5 + c * (1.0 + uCurve * r2 * (1.0 + 1.6 * r2));

  /* Форма кинескопа — суперэллипс («сквиркл»): у настоящих экранов нет прямых углов со скруглением,
     кромка сходит на нет плавно. Степень формы выводится из uCorner: меньше скругление — ближе к квадрату. */
  vec2 p = (w - 0.5) * 2.0;
  float n = clamp(0.9 / max(uCorner, 0.01), 4.0, 40.0);
  float shape = pow(pow(abs(p.x), n) + pow(abs(p.y), n), 1.0 / n);
  float d = (shape - 1.0) * 0.5;
  /* за кромкой картинки пластину не рисуем — видно стекло самой модели */
  if (d > 0.004) discard;

  /* Разъезд каналов — наружу от центра, по радиусу, и растёт к краям */
  vec2 spread = c * (0.0016 + r2 * uChroma * 2.0);
  vec3 col = vec3(screenAt(w + spread).r, screenAt(w).g, screenAt(w - spread).b);
  if (uPhotoMix > 0.001 || uStatic > 0.001) {
    /* помехи полосами: строки рывками съезжают вбок, поверх — снег */
    float band = floor(w.y * 34.0);
    float jump = hash21(vec2(band, floor(uTime * 24.0)));
    vec2 pw = w + vec2((jump - 0.5) * 0.12 * uStatic * step(0.5, jump), 0.0);
    vec3 photo = vec3(texture2D(uPhoto, pw + spread * 2.0).r, texture2D(uPhoto, pw).g, texture2D(uPhoto, pw - spread * 2.0).b);
    col = mix(col, photo, uPhotoMix);
    float snow = hash21(floor(w * vec2(300.0, 280.0)) + floor(uTime * 30.0) * 1.7);
    col = mix(col, vec3(snow * 0.9), uStatic * 0.6);
  }

  /* строки развёртки: узкие тёмные промежутки между яркими строками, а не ровная синусоида */
  float row = abs(fract(w.y * uScanCount / 6.2831853) - 0.5) * 2.0;
  col *= 1.0 - uScan * 1.6 * smoothstep(0.55, 1.0, row);
  /* мерцание из двух несоизмеримых частот, чтобы не читалось как ровная пульсация */
  col *= 1.0 + (sin(uTime * 9.7) * 0.6 + sin(uTime * 23.3) * 0.4) * uFlicker;
  /* виньетка по эллипсу экрана, а не по кругу */
  float ell = length((w - 0.5) * vec2(1.0, 1.0 / max(uAspect, 0.01)) * 1.08);
  col *= 1.0 - smoothstep(uVignette - uVignetteSoft, uVignette + uVignetteSoft, ell);
  col *= 1.0 - smoothstep(-0.004, 0.004, d);

  gl_FragColor = vec4(col, 1.0);
}`;

type Icon = "game" | "cube" | "spark";

export class PortfolioScreen {
  readonly material: THREE.ShaderMaterial;
  private chrome = document.createElement("canvas");
  private page = document.createElement("canvas");
  private cg: CanvasRenderingContext2D;
  private pg: CanvasRenderingContext2D;
  private chromeTex: THREE.CanvasTexture;
  private pageTex: THREE.CanvasTexture;
  private photo = new Image();
  private contentH = VIEW_H * 4;
  private scroll = 0;
  private scrollTo = 0;
  private active = false;
  private minute = -1;
  /* v78: первый экран страницы — баннер и три кнопки (как на картинке Никиты). Кнопки листают страницу к разделу.
     Места кнопок и разделов — в логических пикселях страницы, их пишет layout */
  private buttons: { x: number; y: number; w: number; h: number; to: number }[] = [];
  private anchors: number[] = [];
  private hover = -1;

  constructor() {
    this.chrome.width = SW;
    this.chrome.height = SH;
    this.page.width = PW;
    this.page.height = this.contentH;
    this.cg = this.chrome.getContext("2d")!;
    this.pg = this.page.getContext("2d")!;
    this.chromeTex = this.makeTexture(this.chrome);
    this.pageTex = this.makeTexture(this.page);
    const uv = (x: number, y: number) => [x / SW, y / SH];
    this.material = new THREE.ShaderMaterial({
      vertexShader: screenVertex,
      fragmentShader: screenFragment,
      uniforms: {
        uChrome: { value: this.chromeTex },
        uPage: { value: this.pageTex },
        uTime: { value: 0 },
        uCurve: { value: 0.1 },
        uChroma: { value: 0.004 },
        uCorner: { value: 0.035 },
        uVignette: { value: 0.72 },
        uVignetteSoft: { value: 0.5 },
        uScan: { value: 0.035 },
        uScanCount: { value: 640 },
        uFlicker: { value: 0.008 },
        uAspect: { value: SCREEN_ASPECT },
        uScroll: { value: 0 },
        uView: { value: 0.25 },
        uRect: { value: new THREE.Vector4(...uv(PAGE.x0, PAGE.y0), ...uv(PAGE.x1, PAGE.y1)) },
        uTrack: { value: new THREE.Vector4(...uv(TRACK.x0, TRACK.y0), ...uv(TRACK.x1, TRACK.y1)) },
        uScreenPx: { value: new THREE.Vector2(SW, SH) },
        uPhoto: { value: null as THREE.Texture | null },
        uPhotoMix: { value: 0 },
        uStatic: { value: 0 },
      },
    });
    this.drawChrome();
    this.drawPage();
    onLang(() => { this.drawChrome(); this.drawPage(); });
    this.photo.onload = () => this.drawPage();
    this.photo.src = `${BASE}${ME().photo}`;
  }

  private makeTexture(canvas: HTMLCanvasElement) {
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    /* UV приходят из glTF и отсчитываются сверху — автоматический переворот их сломает */
    t.flipY = false;
    t.anisotropy = 8;
    return t;
  }

  /** Скролл-история: mix — доля фотографии на экране, noise — сила помех. Фото грузится при первом вызове. */
  /** загрузить фото и залить в видеопамять заранее, пока пользователь на холме */
  preloadPhoto(renderer?: THREE.WebGLRenderer) {
    const u = this.material.uniforms;
    if (u.uPhoto.value) return;
    const tex = new THREE.TextureLoader().load(`${BASE}ui/hero-photo.webp`, (t) => renderer?.initTexture(t));
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.flipY = false; // UV экрана отсчитываются сверху, как у холстов
    tex.anisotropy = 8;
    u.uPhoto.value = tex;
  }

  setPhoto(mix: number, noise: number) {
    const u = this.material.uniforms;
    if ((mix > 0 || noise > 0) && !u.uPhoto.value) this.preloadPhoto();
    u.uPhotoMix.value = u.uPhoto.value ? mix : 0;
    u.uStatic.value = noise;
  }

  /** Страница в руках: прокрутка включена. Вне фокуса листается к началу. */
  setActive(on: boolean) {
    this.active = on;
    if (!on) this.scrollTo = 0;
  }

  scrollBy(px: number) {
    if (!this.active) return;
    this.scrollTo = THREE.MathUtils.clamp(this.scrollTo + px, 0, Math.max(0, this.contentH - VIEW_H));
  }

  scrollPage(dir: number) {
    this.scrollBy(dir * VIEW_H * 0.85);
  }

  scrollHome(end: boolean) {
    this.scrollBy(end ? this.contentH : -this.contentH);
  }

  /** Высота видимой части страницы в пикселях полосы — для прокрутки пальцем. */
  get viewHeight() {
    return VIEW_H;
  }

  update(time: number, dt: number) {
    const u = this.material.uniforms;
    u.uTime.value = time;
    this.scroll += (this.scrollTo - this.scroll) * (1 - Math.exp(-dt * (this.active ? 10 : 3)));
    u.uScroll.value = this.scroll / this.contentH;
    u.uView.value = Math.min(1, VIEW_H / this.contentH);
    const m = new Date().getMinutes();
    if (m !== this.minute) this.drawChrome();
  }

  dispose() {
    this.chromeTex.dispose();
    this.pageTex.dispose();
    this.material.dispose();
  }

  /* ───────────────────────── рамка: обои, окно, панель задач ───────────────────────── */

  private drawChrome() {
    const g = this.cg;
    this.minute = new Date().getMinutes();
    g.clearRect(0, 0, SW, SH);

    /* обои: небо и зелёный холм */
    const sky = g.createLinearGradient(0, 0, 0, SH);
    sky.addColorStop(0, "#2f6fd6"); sky.addColorStop(0.55, "#8fc3f5"); sky.addColorStop(1, "#cfe6fb");
    g.fillStyle = sky; g.fillRect(0, 0, SW, SH);
    g.fillStyle = "rgba(255,255,255,0.75)";
    for (const [x, y, r] of [[160, 120, 60], [230, 100, 46], [760, 180, 70], [840, 160, 50]]) { g.beginPath(); g.ellipse(x, y, r * 1.8, r * 0.55, 0, 0, Math.PI * 2); g.fill(); }
    const hill = g.createLinearGradient(0, SH * 0.5, 0, SH);
    hill.addColorStop(0, "#6fbf3c"); hill.addColorStop(1, "#2f7a1c");
    g.fillStyle = hill;
    g.beginPath(); g.moveTo(0, SH); g.quadraticCurveTo(SW * 0.35, SH * 0.48, SW, SH * 0.72); g.lineTo(SW, SH); g.fill();

    /* окно: тень, рамка, заголовок */
    g.fillStyle = "rgba(0,0,0,0.28)";
    this.round(g, WIN.x0 + 6, WIN.y0 + 8, WIN.x1 - WIN.x0, WIN.y1 - WIN.y0, 10); g.fill();
    const frame = g.createLinearGradient(0, WIN.y0, 0, WIN.y0 + TITLE_H);
    frame.addColorStop(0, "#3d8cff"); frame.addColorStop(0.12, "#0a5ee6"); frame.addColorStop(0.6, "#0053e0"); frame.addColorStop(1, "#0a44c2");
    g.fillStyle = "#0a4fd3";
    this.round(g, WIN.x0, WIN.y0, WIN.x1 - WIN.x0, WIN.y1 - WIN.y0, 10); g.fill();
    g.fillStyle = frame;
    this.roundTop(g, WIN.x0, WIN.y0, WIN.x1 - WIN.x0, TITLE_H, 10); g.fill();
    g.fillStyle = "rgba(255,255,255,0.35)"; g.fillRect(WIN.x0 + 8, WIN.y0 + 2, WIN.x1 - WIN.x0 - 16, 2);

    /* значок и название */
    this.globe(g, WIN.x0 + 24, WIN.y0 + TITLE_H / 2, 11);
    g.font = `bold 19px ${UI}`; g.textBaseline = "middle";
    g.fillStyle = "rgba(0,0,40,0.55)"; g.fillText(ME().windowTitle, WIN.x0 + 45, WIN.y0 + TITLE_H / 2 + 2);
    g.fillStyle = "#fff"; g.fillText(ME().windowTitle, WIN.x0 + 44, WIN.y0 + TITLE_H / 2 + 1);

    /* кнопки окна */
    const bs = 28, by = WIN.y0 + (TITLE_H - bs) / 2;
    ["min", "max", "close"].forEach((k, i) => {
      const bx = WIN.x1 - 10 - (3 - i) * (bs + 4) + 4;
      const grad = g.createLinearGradient(0, by, 0, by + bs);
      if (k === "close") { grad.addColorStop(0, "#f0a08a"); grad.addColorStop(0.5, "#e0522e"); grad.addColorStop(1, "#c7391b"); }
      else { grad.addColorStop(0, "#7fb2ff"); grad.addColorStop(0.5, "#2f76f0"); grad.addColorStop(1, "#1c5ad8"); }
      g.fillStyle = grad; this.round(g, bx, by, bs, bs, 5); g.fill();
      g.strokeStyle = "#fff"; g.lineWidth = 1.5; this.round(g, bx + 0.75, by + 0.75, bs - 1.5, bs - 1.5, 5); g.stroke();
      g.lineWidth = 3; g.beginPath();
      if (k === "min") { g.moveTo(bx + 8, by + 19); g.lineTo(bx + 16, by + 19); }
      if (k === "max") { g.strokeRect(bx + 8, by + 8, 12, 11); }
      if (k === "close") { g.moveTo(bx + 9, by + 9); g.lineTo(bx + 19, by + 19); g.moveTo(bx + 19, by + 9); g.lineTo(bx + 9, by + 19); }
      g.stroke();
    });

    /* тело окна: меню, адресная строка, статус */
    const bx0 = WIN.x0 + 4, bx1 = WIN.x1 - 4;
    g.fillStyle = BEIGE; g.fillRect(bx0, WIN.y0 + TITLE_H, bx1 - bx0, WIN.y1 - WIN.y0 - TITLE_H - 4);
    let y = WIN.y0 + TITLE_H;
    g.font = `15px ${UI}`; g.fillStyle = TEXT;
    let mx = bx0 + 12;
    for (const item of ["File", "Edit", "View", "Favorites", "Tools", "Help"]) { g.fillText(item, mx, y + MENU_H / 2 + 1); mx += g.measureText(item).width + 22; }
    g.fillStyle = "#c5c2b2"; g.fillRect(bx0, y + MENU_H - 1, bx1 - bx0, 1);
    y += MENU_H;
    g.fillStyle = "#6d6d6d"; g.font = `15px ${UI}`; g.fillText("Address", bx0 + 10, y + ADDR_H / 2 + 1);
    const ax = bx0 + 76, aw = bx1 - ax - 62;
    g.fillStyle = "#fff"; g.fillRect(ax, y + 5, aw, ADDR_H - 10);
    g.strokeStyle = "#7f9db9"; g.lineWidth = 1; g.strokeRect(ax + 0.5, y + 5.5, aw - 1, ADDR_H - 11);
    this.globe(g, ax + 14, y + ADDR_H / 2, 7);
    g.fillStyle = TEXT; g.fillText(ME().address, ax + 28, y + ADDR_H / 2 + 1);
    const go = g.createLinearGradient(0, y + 6, 0, y + ADDR_H - 6);
    go.addColorStop(0, "#5fd45f"); go.addColorStop(1, "#2a9a2a");
    g.fillStyle = go; this.round(g, bx1 - 54, y + 6, 22, ADDR_H - 12, 4); g.fill();
    g.fillStyle = "#fff"; g.beginPath(); g.moveTo(bx1 - 47, y + 12); g.lineTo(bx1 - 38, y + ADDR_H / 2); g.lineTo(bx1 - 47, y + ADDR_H - 12); g.fill();
    g.fillStyle = TEXT; g.fillText("Go", bx1 - 27, y + ADDR_H / 2 + 1);

    /* дыра под страницу, рамка вокруг неё и полоса прокрутки */
    g.strokeStyle = "#7f9db9"; g.lineWidth = 2; g.strokeRect(PAGE.x0 - 1, PAGE.y0 - 1, PAGE.x1 - PAGE.x0 + SCROLL_W + 2, PAGE.y1 - PAGE.y0 + 2);
    g.clearRect(PAGE.x0, PAGE.y0, PW, VIEW_H);
    g.fillStyle = "#f3f1e6"; g.fillRect(TRACK.x0, PAGE.y0, SCROLL_W, VIEW_H);
    for (const [ay, up] of [[PAGE.y0, true], [PAGE.y1 - SCROLL_W, false]] as const) {
      const ag = g.createLinearGradient(TRACK.x0, 0, TRACK.x1, 0);
      ag.addColorStop(0, "#c8d6fb"); ag.addColorStop(1, "#9fb8f2");
      g.fillStyle = ag; this.round(g, TRACK.x0 + 1, ay + 1, SCROLL_W - 2, SCROLL_W - 2, 3); g.fill();
      g.fillStyle = "#4d6185"; g.beginPath();
      const cx = TRACK.x0 + SCROLL_W / 2, cy = ay + SCROLL_W / 2;
      if (up) { g.moveTo(cx - 5, cy + 3); g.lineTo(cx, cy - 3); g.lineTo(cx + 5, cy + 3); } else { g.moveTo(cx - 5, cy - 3); g.lineTo(cx, cy + 3); g.lineTo(cx + 5, cy - 3); }
      g.fill();
    }
    g.clearRect(TRACK.x0 + 1, TRACK.y0, SCROLL_W - 2, TRACK.y1 - TRACK.y0);
    g.fillStyle = "#f3f1e6"; g.fillRect(TRACK.x0 + 1, TRACK.y0, SCROLL_W - 2, TRACK.y1 - TRACK.y0);
    /* трек непрозрачный, ползунок рисует шейдер поверх */

    const sy = WIN.y1 - STATUS_H - 4;
    g.fillStyle = "#c5c2b2"; g.fillRect(bx0, sy + 2, bx1 - bx0, 1);
    g.font = `14px ${UI}`; g.fillStyle = TEXT; g.textBaseline = "middle";
    g.fillText("Done", bx0 + 12, sy + STATUS_H / 2 + 3);
    g.fillText("Internet", bx1 - 90, sy + STATUS_H / 2 + 3);
    this.globe(g, bx1 - 106, sy + STATUS_H / 2 + 3, 7);

    /* панель задач */
    const ty = SH - TASK_H;
    const bar = g.createLinearGradient(0, ty, 0, SH);
    bar.addColorStop(0, "#3c8cf3"); bar.addColorStop(0.1, "#245edb"); bar.addColorStop(0.9, "#1e55d0"); bar.addColorStop(1, "#1941a5");
    g.fillStyle = bar; g.fillRect(0, ty, SW, TASK_H);
    const st = g.createLinearGradient(0, ty, 0, SH);
    st.addColorStop(0, "#5ec85e"); st.addColorStop(0.5, "#3a9f3a"); st.addColorStop(1, "#2c872c");
    g.fillStyle = st; g.beginPath(); g.moveTo(0, ty); g.lineTo(130, ty); g.quadraticCurveTo(150, ty, 150, ty + 18); g.lineTo(150, SH); g.lineTo(0, SH); g.fill();
    g.font = `bold 22px ${UI}`; g.textBaseline = "middle";
    g.fillStyle = "rgba(0,0,0,0.35)"; g.fillText("Start", 50, ty + TASK_H / 2 + 2);
    g.fillStyle = "#fff"; g.fillText("Start", 48, ty + TASK_H / 2);
    this.flag(g, 26, ty + TASK_H / 2, 10);
    g.fillStyle = "#3c81f3"; this.round(g, 166, ty + 7, 250, TASK_H - 14, 4); g.fill();
    g.fillStyle = "#1e4fb8"; this.round(g, 166, ty + 7, 250, TASK_H - 14, 4); g.fill();
    this.globe(g, 186, ty + TASK_H / 2, 9);
    g.font = `15px ${UI}`; g.fillStyle = "#fff"; g.fillText(ME().site, 204, ty + TASK_H / 2 + 1);
    g.fillStyle = "#0f8be8"; g.fillRect(SW - 130, ty, 130, TASK_H);
    g.fillStyle = "rgba(255,255,255,0.25)"; g.fillRect(SW - 130, ty, 1, TASK_H);
    const now = new Date();
    g.fillStyle = "#fff"; g.font = `16px ${UI}`;
    g.fillText(`${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`, SW - 64, ty + TASK_H / 2 + 1);
    this.leaf(g, SW - 104, ty + TASK_H / 2);

    this.chromeTex.needsUpdate = true;
  }

  /* ───────────────────────── домашняя страница ───────────────────────── */

  private drawPage() {
    const h = Math.min(4096, Math.ceil(this.layout(false) * K));
    if (h !== this.page.height) {
      this.page.height = h;
      this.contentH = h;
      this.scrollTo = Math.min(this.scrollTo, Math.max(0, h - VIEW_H));
      this.pageTex.dispose();
    }
    this.layout(true);
    this.pageTex.needsUpdate = true;
  }

  private layout(paint: boolean): number {
    const g = this.pg;
    const M = 34, inner = PWL - M * 2;
    g.setTransform(K, 0, 0, K, 0, 0);
    g.textBaseline = "alphabetic";
    g.textAlign = "left";
    if (paint) {
      g.fillStyle = "#ffffff"; g.fillRect(0, 0, PWL, this.page.height / K);
    }

    /* v78: первый экран — ровно одна высота окна: космос с горизонтом Земли, имя, фото и три кнопки */
    const heroH = Math.round(VIEW_H / K);
    const hero = this.heroLayout(heroH);
    if (paint) this.paintHero(g, heroH, hero);
    this.buttons = hero.buttons.map((b, i) => ({ ...b, to: i }));
    let y = heroH + 36;

    /* обо мне: фото и анкета */
    this.anchors[0] = y - 46;
    y = this.sectionBar(g, ME().sections[0], M, y, inner, paint);
    /* v78: второе фото убрано — портрет уже есть на первом экране; анкета на всю ширину */
    const tx = M, tw = inner;
    let ty = y;
    const labelW = 128, rowH = 44;
    for (const [k, v] of ME().profile) {
      if (paint) {
        g.fillStyle = BEIGE; g.fillRect(tx, ty, labelW, rowH);
        g.fillStyle = "#fff"; g.fillRect(tx + labelW, ty, tw - labelW, rowH);
        g.strokeStyle = "#aca899"; g.lineWidth = 1; g.strokeRect(tx + 0.5, ty + 0.5, tw - 1, rowH);
        g.fillStyle = "#aca899"; g.fillRect(tx + labelW, ty, 1, rowH);
        g.font = `bold 15px ${BODY}`; g.fillStyle = "#333"; g.fillText(k, tx + 12, ty + 28);
        g.font = `16px ${BODY}`; g.fillStyle = TEXT; g.fillText(v, tx + labelW + 12, ty + 28);
      }
      ty += rowH;
    }
    ty += 18;
    g.font = `16px ${BODY}`;
    ty = this.wrap(g, ME().hello, tx, ty + 6, tw, 26, paint, TEXT);
    y = ty + 22;

    this.anchors[1] = y - 46;
    y = this.sectionBar(g, ME().sections[1], M, y, inner, paint);
    g.font = `17px ${BODY}`;
    for (const p of ME().now) y = this.wrap(g, p, M, y + 4, inner, 28, paint, TEXT) + 12;
    y += 16;

    /* цитата — жёлтая заметка */
    const noteH = 96;
    if (paint) {
      g.save(); g.translate(PWL / 2, y + noteH / 2); g.rotate(-0.012);
      g.fillStyle = "rgba(0,0,0,0.14)"; g.fillRect(-inner / 2 + 90 + 5, -noteH / 2 + 6, inner - 180, noteH);
      g.fillStyle = "#fff6a8"; g.fillRect(-inner / 2 + 90, -noteH / 2, inner - 180, noteH);
      g.textAlign = "center"; g.font = `bold 14px ${BODY}`; g.fillStyle = "#8a7a12"; g.fillText("WORDS TO LIVE BY", 0, -18);
      g.font = `italic bold 24px ${DISPLAY}`; g.fillStyle = "#3a3208"; g.fillText(`“${ME().quote}”`, 0, 20);
      g.restore(); g.textAlign = "left";
    }
    y += noteH + 40;

    y = this.sectionBar(g, ME().sections[2], M, y, inner, paint);
    for (const h of ME().hobbies) {
      if (paint) this.icon(g, h.icon as Icon, M + 18, y - 8);
      g.font = `16px ${BODY}`;
      y = this.wrap(g, h.text, M + 50, y, inner - 50, 25, paint, TEXT) + 14;
    }
    y += 12;

    this.anchors[2] = y - 46;
    y = this.sectionBar(g, ME().sections[3], M, y, inner, paint);
    for (const [k, v] of ME().contacts) {
      g.font = `bold 16px ${BODY}`;
      if (paint) { g.fillStyle = "#333"; g.fillText(`${k}:`, M, y); }
      g.font = `16px ${BODY}`;
      if (paint) { g.fillStyle = LINK; g.fillText(v, M + 160, y); g.fillRect(M + 160, y + 3, g.measureText(v).width, 1.5); }
      y += 32;
    }
    y += 10;
    if (paint) {
      /* кнопка гостевой книги и счётчик посещений */
      const bw = 230, bhh = 38;
      const bgd = g.createLinearGradient(0, y, 0, y + bhh);
      bgd.addColorStop(0, "#ffffff"); bgd.addColorStop(1, "#dcd9c8");
      g.fillStyle = bgd; this.round(g, M, y, bw, bhh, 4); g.fill();
      g.strokeStyle = "#003c74"; g.lineWidth = 1.5; this.round(g, M + 0.75, y + 0.75, bw - 1.5, bhh - 1.5, 4); g.stroke();
      g.font = `15px ${UI}`; g.fillStyle = TEXT; g.textAlign = "center"; g.fillText("Sign my guestbook", M + bw / 2, y + 25); g.textAlign = "left";
      g.font = `15px ${BODY}`; g.fillStyle = "#555"; g.fillText("You are visitor number", M + bw + 40, y + 25);
      const digits = "000026";
      let dx = M + bw + 40 + g.measureText("You are visitor number").width + 12;
      for (const d of digits) {
        g.fillStyle = "#111"; g.fillRect(dx, y + 4, 22, 30);
        g.font = `bold 20px "Courier New", monospace`; g.fillStyle = "#7dff5a"; g.fillText(d, dx + 5, y + 26);
        dx += 25;
      }
    }
    y += 70;
    if (paint) this.bevelRule(g, M, y, inner);
    y += 34;
    g.font = `13px ${BODY}`;
    if (paint) {
      g.textAlign = "center"; g.fillStyle = "#666";
      g.fillText("Best viewed at 1024×768 · Last updated: September 2026 · © Nikita Gorbachev", PWL / 2, y);
      g.fillText("Made with a lot of grass", PWL / 2, y + 22);
      g.textAlign = "left";
    }
    return y + 50;
  }

  /* ───────────────────────── первый экран ───────────────────────── */

  private heroLayout(h: number) {
    const bw = 318, bh = 70, gap = 14;
    const bx = PWL - 30 - bw;
    const by0 = h - 30 - (bh * 3 + gap * 2);
    const photo = { x: 30, y: by0 - 4, w: bx - 30 - 24, h: bh * 3 + gap * 2 + 8 };
    return { photo, buttons: [0, 1, 2].map((i) => ({ x: bx, y: by0 + i * (bh + gap), w: bw, h: bh })) };
  }

  private paintHero(g: CanvasRenderingContext2D, h: number, hero: ReturnType<PortfolioScreen["heroLayout"]>) {
    const W = PWL;
    /* всё первого экрана — в пределах его высоты: край шара Земли иначе заливал страницу ниже */
    g.save(); g.beginPath(); g.rect(0, 0, W, h); g.clip();
    /* космос: глубокий синий сверху, светлее к горизонту */
    const sky = g.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, "#0b2fb8"); sky.addColorStop(0.42, "#1f63ec"); sky.addColorStop(1, "#3f8cff");
    g.fillStyle = sky; g.fillRect(0, 0, W, h);
    /* Земля: край огромного шара, светится голубым */
    const R = W * 1.35, cx = W / 2, cy = 236 + R;
    const halo = g.createRadialGradient(cx, cy, R - 6, cx, cy, R + 40);
    halo.addColorStop(0, "rgba(190,235,255,0.9)"); halo.addColorStop(0.25, "rgba(120,200,255,0.55)"); halo.addColorStop(1, "rgba(80,160,255,0)");
    g.fillStyle = halo; g.beginPath(); g.arc(cx, cy, R + 40, 0, Math.PI * 2); g.fill();
    const earth = g.createLinearGradient(0, 236, 0, h);
    earth.addColorStop(0, "#5aa8ff"); earth.addColorStop(0.18, "#2a74e6"); earth.addColorStop(1, "#1a4fc4");
    g.fillStyle = earth; g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.fill();
    /* облачные разводы на планете */
    g.save(); g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.clip();
    g.fillStyle = "rgba(255,255,255,0.10)";
    for (const [x, y, rx, ry] of [[120, 262, 90, 7], [330, 256, 130, 6], [560, 266, 110, 8], [240, 300, 150, 10], [520, 320, 120, 9], [80, 360, 120, 12]]) { g.beginPath(); g.ellipse(x, y, rx, ry, -0.04, 0, Math.PI * 2); g.fill(); }
    g.restore();
    /* звёзды: мелкие точки и крупные жёлтые искры */
    g.fillStyle = "rgba(255,255,255,0.75)";
    for (let i = 0; i < 40; i++) g.fillRect((i * 97.3) % W, (i * 53.7) % 220, 1.6, 1.6);
    g.fillStyle = "#ffe14a";
    for (const [x, y, r] of [[W * 0.33, 30, 9], [W * 0.72, 44, 12], [22, 150, 7], [W * 0.23, 170, 8], [W - 60, 186, 14], [W - 36, 216, 7]]) this.sparkle(g, x, y, r);
    /* орбита вокруг имени — дугами, чтобы не перечёркивать буквы */
    g.save(); g.translate(W / 2, 96); g.rotate(-0.05);
    g.strokeStyle = "#ffd23a"; g.lineWidth = 3; g.lineCap = "round";
    for (const [a, b] of [[0.94, 1.32], [1.9, 2.08], [0.02, 0.2]]) { g.beginPath(); g.ellipse(0, 0, W * 0.47, 44, 0, Math.PI * a, Math.PI * b); g.stroke(); }
    g.restore();
    /* имя: золото с тёмно-синей обводкой, наклон — как у логотипов тех лет */
    const name = ME().profile[0][1];
    g.textAlign = "center"; g.textBaseline = "alphabetic";
    let fs = 66;
    g.font = `italic 900 ${fs}px ${DISPLAY}`;
    while (g.measureText(name).width > W - 70 && fs > 30) { fs -= 2; g.font = `italic 900 ${fs}px ${DISPLAY}`; }
    g.lineJoin = "round";
    g.lineWidth = 12; g.strokeStyle = "#0a1a6a"; g.strokeText(name, W / 2, 112);
    g.lineWidth = 5; g.strokeStyle = "#ff9a1a"; g.strokeText(name, W / 2, 112);
    const gold = g.createLinearGradient(0, 112 - fs * 0.8, 0, 112);
    gold.addColorStop(0, "#fffbc4"); gold.addColorStop(0.45, "#ffd42a"); gold.addColorStop(1, "#ff8e14");
    g.fillStyle = gold; g.fillText(name, W / 2, 112);
    g.font = `bold 40px ${DISPLAY}`;
    g.lineWidth = 6; g.strokeStyle = "#0a2a8a"; g.strokeText(ME().tagline, W / 2, 160);
    g.fillStyle = "#ffffff"; g.fillText(ME().tagline, W / 2, 160);
    g.font = `16px "Courier New", "Lucida Console", monospace`; g.fillStyle = "#e8f0ff";
    g.fillText(HERO().line, W / 2, 196);
    g.textAlign = "left";

    /* фото в рамке */
    const p = hero.photo;
    g.fillStyle = "rgba(0,20,80,0.35)"; this.round(g, p.x + 4, p.y + 6, p.w, p.h, 10); g.fill();
    const fr = g.createLinearGradient(0, p.y, 0, p.y + p.h);
    fr.addColorStop(0, "#f2f7ff"); fr.addColorStop(1, "#bcd3f7");
    g.fillStyle = fr; this.round(g, p.x, p.y, p.w, p.h, 10); g.fill();
    g.save(); this.round(g, p.x + 9, p.y + 9, p.w - 18, p.h - 18, 4); g.clip();
    g.fillStyle = "#5a3a1c"; g.fillRect(p.x + 9, p.y + 9, p.w - 18, p.h - 18);
    if (this.photo.complete && this.photo.naturalWidth) this.cover(g, this.photo, p.x + 9, p.y + 9, p.w - 18, p.h - 18, 0.2);
    g.restore();
    g.strokeStyle = "#5b86d6"; g.lineWidth = 1.5; this.round(g, p.x + 9, p.y + 9, p.w - 18, p.h - 18, 4); g.stroke();
    g.fillStyle = "#ffe14a";
    this.sparkle(g, p.x + p.w - 46, p.y + 46, 10); this.sparkle(g, p.x + 34, p.y + p.h * 0.62, 8);

    /* три кнопки: выбранная (наведённая) — жёлтая, без наведения — первая */
    const labels = HERO().buttons;
    const on = this.hover < 0 ? 0 : this.hover;
    hero.buttons.forEach((b, i) => {
      const sel = i === on;
      g.fillStyle = "rgba(0,20,80,0.35)"; this.round(g, b.x + 3, b.y + 5, b.w, b.h, 10); g.fill();
      const bg = g.createLinearGradient(0, b.y, 0, b.y + b.h);
      if (sel) { bg.addColorStop(0, "#fff7a8"); bg.addColorStop(0.5, "#ffe03a"); bg.addColorStop(1, "#f5c400"); }
      else { bg.addColorStop(0, "#ffffff"); bg.addColorStop(0.55, "#eef3ff"); bg.addColorStop(1, "#c9d9fa"); }
      g.fillStyle = bg; this.round(g, b.x, b.y, b.w, b.h, 10); g.fill();
      g.strokeStyle = "#1c47c8"; g.lineWidth = 3; this.round(g, b.x + 1.5, b.y + 1.5, b.w - 3, b.h - 3, 9); g.stroke();
      g.fillStyle = "rgba(255,255,255,0.6)"; this.round(g, b.x + 8, b.y + 5, b.w - 16, 5, 3); g.fill();
      this.heroIcon(g, i, b.x + 42, b.y + b.h / 2);
      g.font = `bold 30px ${DISPLAY}`; g.fillStyle = "#101c7a"; g.textBaseline = "middle";
      g.fillText(labels[i], b.x + 84, b.y + b.h / 2 + 1);
      g.strokeStyle = "#101c7a"; g.lineWidth = 3.5; g.lineJoin = "miter"; g.lineCap = "butt";
      g.beginPath(); g.moveTo(b.x + b.w - 34, b.y + b.h / 2 - 9); g.lineTo(b.x + b.w - 25, b.y + b.h / 2); g.lineTo(b.x + b.w - 34, b.y + b.h / 2 + 9); g.stroke();
      g.textBaseline = "alphabetic";
    });
    g.restore();
  }

  private heroIcon(g: CanvasRenderingContext2D, i: number, cx: number, cy: number) {
    g.lineWidth = 2.6; g.strokeStyle = "#101c7a"; g.lineJoin = "round";
    if (i === 0) {
      g.fillStyle = "#6aa8ff";
      g.beginPath(); g.arc(cx, cy - 8, 8, 0, Math.PI * 2); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(cx - 15, cy + 16); g.quadraticCurveTo(cx - 15, cy + 2, cx, cy + 2); g.quadraticCurveTo(cx + 15, cy + 2, cx + 15, cy + 16); g.closePath(); g.fill(); g.stroke();
    } else if (i === 1) {
      g.fillStyle = "#ffd23a";
      g.beginPath(); g.moveTo(cx - 17, cy - 11); g.lineTo(cx - 6, cy - 11); g.lineTo(cx - 2, cy - 7); g.lineTo(cx + 17, cy - 7); g.lineTo(cx + 17, cy + 13); g.lineTo(cx - 17, cy + 13); g.closePath(); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(cx - 17, cy - 2); g.lineTo(cx + 17, cy - 2); g.stroke();
    } else {
      g.fillStyle = "#8fc0ff";
      g.beginPath(); g.rect(cx - 17, cy - 11, 34, 23); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(cx - 17, cy - 11); g.lineTo(cx, cy + 3); g.lineTo(cx + 17, cy - 11); g.stroke();
    }
  }

  /** четырёхлучевая искра, как на картинках тех лет */
  private sparkle(g: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
    g.beginPath();
    g.moveTo(cx, cy - r); g.quadraticCurveTo(cx, cy, cx + r, cy); g.quadraticCurveTo(cx, cy, cx, cy + r);
    g.quadraticCurveTo(cx, cy, cx - r, cy); g.quadraticCurveTo(cx, cy, cx, cy - r); g.fill();
  }

  /** Точка на экране (uv модели, 0…1 сверху) → номер кнопки первого экрана или −1. Кривизну стекла учитываем так же, как шейдер. */
  private buttonAt(u: number, v: number) {
    const cx = u - 0.5, cy = v - 0.5, r2 = cx * cx + cy * cy;
    const k = 1 + this.material.uniforms.uCurve.value * r2 * (1 + 1.6 * r2);
    const x = (0.5 + cx * k) * SW - PAGE.x0, y = (0.5 + cy * k) * SH - PAGE.y0;
    if (x < 0 || y < 0 || x > PW || y > VIEW_H) return -1;
    const lx = x / K, ly = (y + this.scroll) / K;
    return this.buttons.findIndex((b) => lx >= b.x && lx <= b.x + b.w && ly >= b.y && ly <= b.y + b.h);
  }

  /** Наведение: подсветить кнопку; true — курсор над кнопкой */
  hoverAt(u: number, v: number) {
    const i = this.active ? this.buttonAt(u, v) : -1;
    if (i !== this.hover) { this.hover = i; this.layout(true); this.pageTex.needsUpdate = true; }
    return i >= 0;
  }

  /** Клик по кнопке — страница листается к её разделу; true — клик пришёлся на кнопку */
  clickAt(u: number, v: number) {
    if (!this.active) return false;
    const i = this.buttonAt(u, v);
    if (i < 0) return false;
    const y = (this.anchors[this.buttons[i].to] ?? 0) * K;
    this.scrollTo = THREE.MathUtils.clamp(y, 0, Math.max(0, this.contentH - VIEW_H));
    return true;
  }

  /* ───────────────────────── мелкие рисовалки ───────────────────────── */

  private sectionBar(g: CanvasRenderingContext2D, title: string, x: number, y: number, w: number, paint: boolean) {
    const h = 34;
    if (paint) {
      const bar = g.createLinearGradient(x, 0, x + w, 0);
      bar.addColorStop(0, "#1f4fbf"); bar.addColorStop(0.7, "#6d9bf0"); bar.addColorStop(1, "#ffffff");
      g.fillStyle = bar; g.fillRect(x, y, w, h);
      g.font = `bold 18px ${UI}`; g.fillStyle = "#fff"; g.fillText(title, x + 12, y + 23);
    }
    return y + h + 30;
  }

  private bevelRule(g: CanvasRenderingContext2D, x: number, y: number, w: number) {
    g.fillStyle = "#a0a0a0"; g.fillRect(x, y, w, 1);
    g.fillStyle = "#ffffff"; g.fillRect(x, y + 1, w, 1);
  }

  /* картинка по принципу object-fit: cover; bias — какую часть по вертикали показывать */
  private cover(g: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number, bias = 0.5) {
    const s = Math.max(w / img.naturalWidth, h / img.naturalHeight);
    const sw = w / s, sh = h / s;
    const sx = (img.naturalWidth - sw) / 2, sy = (img.naturalHeight - sh) * bias;
    g.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  }


  /** Вписывает картинку как object-fit: cover; bias — какую часть по вертикали оставить. */

  private wrap(g: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lh: number, paint: boolean, color: string) {
    let line = "";
    if (paint) g.fillStyle = color;
    for (const word of text.split(" ")) {
      const cand = line ? `${line} ${word}` : word;
      if (g.measureText(cand).width > maxW && line) { if (paint) g.fillText(line, x, y); y += lh; line = word; } else line = cand;
    }
    if (line) { if (paint) g.fillText(line, x, y); y += lh; }
    return y;
  }


  private round(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    g.beginPath(); g.roundRect(x, y, w, h, r);
  }

  private roundTop(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    g.beginPath(); g.roundRect(x, y, w, h, [r, r, 0, 0]);
  }

  private globe(g: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
    const grad = g.createRadialGradient(cx - r * 0.4, cy - r * 0.4, r * 0.1, cx, cy, r);
    grad.addColorStop(0, "#bfe6ff"); grad.addColorStop(1, "#1a74d8");
    g.fillStyle = grad; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill();
    g.strokeStyle = "rgba(255,255,255,0.8)"; g.lineWidth = Math.max(1, r / 7);
    g.beginPath(); g.ellipse(cx, cy, r * 0.45, r, 0, 0, Math.PI * 2); g.moveTo(cx - r, cy); g.lineTo(cx + r, cy); g.stroke();
  }

  /** Четыре цветных квадратика с волной — нейтральный значок «пуск», без чужого логотипа. */
  /* значок у кнопки «Start» — холм с солнцем, знак этого сайта; никаких чужих логотипов */
  private flag(g: CanvasRenderingContext2D, cx: number, cy: number, s: number) {
    g.save();
    g.fillStyle = "#ffd76a";
    g.beginPath(); g.arc(cx + s * 0.35, cy - s * 0.35, s * 0.42, 0, Math.PI * 2); g.fill();
    g.fillStyle = "#e9f7d8";
    g.beginPath(); g.moveTo(cx - s * 1.05, cy + s * 0.9);
    g.quadraticCurveTo(cx - s * 0.1, cy - s * 0.55, cx + s * 1.05, cy + s * 0.9); g.closePath(); g.fill();
    g.restore();
  }

  private leaf(g: CanvasRenderingContext2D, cx: number, cy: number) {
    g.fillStyle = "#7ddc4a"; g.beginPath(); g.ellipse(cx, cy, 5, 10, 0.6, 0, Math.PI * 2); g.fill();
  }

  private star(g: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
    g.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2, rr = i % 2 ? r * 0.35 : r;
      g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
    }
    g.fill();
  }

  private icon(g: CanvasRenderingContext2D, kind: Icon, cx: number, cy: number) {
    if (kind === "game") {
      g.fillStyle = "#555"; this.round(g, cx - 16, cy - 9, 32, 18, 8); g.fill();
      g.fillStyle = "#fff"; g.fillRect(cx - 11, cy - 1.5, 8, 3); g.fillRect(cx - 8.5, cy - 4, 3, 8);
      g.fillStyle = "#e33"; g.beginPath(); g.arc(cx + 7, cy - 2, 2.5, 0, 7); g.fill();
      g.fillStyle = "#3c3"; g.beginPath(); g.arc(cx + 11, cy + 2, 2.5, 0, 7); g.fill();
    } else if (kind === "cube") {
      g.fillStyle = "#6aa8ff"; g.beginPath(); g.moveTo(cx, cy - 14); g.lineTo(cx + 13, cy - 7); g.lineTo(cx, cy); g.lineTo(cx - 13, cy - 7); g.fill();
      g.fillStyle = "#2f6fd6"; g.beginPath(); g.moveTo(cx - 13, cy - 7); g.lineTo(cx, cy); g.lineTo(cx, cy + 14); g.lineTo(cx - 13, cy + 7); g.fill();
      g.fillStyle = "#1c4aa8"; g.beginPath(); g.moveTo(cx + 13, cy - 7); g.lineTo(cx, cy); g.lineTo(cx, cy + 14); g.lineTo(cx + 13, cy + 7); g.fill();
    } else {
      g.fillStyle = "#ffb400"; this.star(g, cx, cy, 15);
    }
  }
}
