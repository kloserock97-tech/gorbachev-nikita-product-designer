/* GLSL сцены. Трава — одна травинка, размноженная InstancedBufferGeometry, всё движение
   в вершинном шейдере: трава растёт по холму, ветер — бегущие волны по лугу, у курсора есть след; свет — HDRI через сферические гармоники
   (как LightProbe в three), тень реквизита — своя карта глубины с PCF.

   Все цвета — линейный HDR. Тонмаппинг и sRGB делает OutputPass в конце
   цепочки постобработки, поэтому в шейдерах нет tonemapping_fragment. */

export const TRAIL_SLOTS = 6;

/* общий свет: для травы считается в вершинах (её полмиллиона, фрагменты
   перекрываются в несколько слоёв), для земли — во фрагментах */
const LIGHT_PARS = /* glsl */ `
uniform float uBackLight;
uniform vec3 uSunDir;
uniform vec3 uSunCol;
uniform vec3 uSH[9];
uniform float uAmbient;
uniform vec3 uFogCol;
uniform sampler2D uShadowMap;
uniform mat4 uShadowMatrix;
uniform float uShadowTexel;
uniform float uShadowOn;

uniform float uHaze;
/* облака: xy — сдвиг узора по ветру, z — покрытие (0 — теней нет); uWet — мокрая трава после дождя */
uniform vec3 uCloud;
uniform float uWet;

/* Тени облаков, плывущие по лугу (GoT). Узор — сумма четырёх синусоид, а не шум с хешем:
   ту же функцию повторяет JS (src/scene/weather.ts), чтобы кресло и собака темнели
   ровно тогда, когда под ними проходит тень. 1 — солнце, ~0.4 — под облаком. */
float cloudShade(vec3 w){
  if (uCloud.z < 0.001) return 1.0;
  vec2 p = w.xz * 0.11 + uCloud.xy;
  float n = 0.5 + 0.22 * sin(p.x + p.y * 0.6) + 0.18 * sin(-0.7 * p.x + 1.3 * p.y + 1.7)
              + 0.12 * sin(2.1 * p.x + 1.9 * p.y + 4.1) + 0.08 * sin(-2.9 * p.x + 0.8 * p.y + 2.3);
  float edge = 1.0 - uCloud.z;
  return mix(1.0, 0.4, smoothstep(edge - 0.07, edge + 0.07, n));
}
#ifndef DOG_UNIFORM
#define DOG_UNIFORM
/* собака: xyz — точка на земле под корпусом, w — видна ли (0..1) */
uniform vec4 uDog;
uniform vec2 uDogDir;
#endif

/* Воздух: дальняя дымка плюс высотный туман у подножия холма (как height fog
   в Ghost of Tsushima) — низины и дальние склоны тонут в тёплом свете заката */
float airFog(vec3 w, float dist){
  float distant = smoothstep(9.0, 30.0, dist) * 0.55;
  float low = (1.0 - exp(-dist * 0.035)) * exp(-max(w.y - 0.2, 0.0) * 1.15) * 0.55;
  return clamp(distant + low * uHaze, 0.0, 0.8);
}

/* облучённость из SH9 — та же формула, что shGetIrradianceAt в three */
vec3 shIrradiance(vec3 n){
  vec3 r = uSH[0] * 0.886227;
  r += uSH[1] * 1.023328 * n.y;
  r += uSH[2] * 1.023328 * n.z;
  r += uSH[3] * 1.023328 * n.x;
  r += uSH[4] * 0.858086 * n.x * n.y;
  r += uSH[5] * 0.858086 * n.y * n.z;
  r += uSH[6] * (0.743125 * n.z * n.z - 0.247708);
  r += uSH[7] * 0.858086 * n.x * n.z;
  r += uSH[8] * 0.429043 * (n.x * n.x - n.y * n.y);
  return max(r, vec3(0.0));
}

/* Мягкая тень реквизита. Карта глубины снята ортокамерой один раз после
   загрузки (реквизит неподвижен). 12 точек диска Пуассона с поворотом от
   позиции дают полутень без полос; радиус растёт с расстоянием до
   заслонителя — у ножек тень чёткая, от спинки размытая. */
const vec2 POISSON[12] = vec2[](
  vec2(-0.326, -0.406), vec2(-0.840, -0.074), vec2(-0.696, 0.457), vec2(-0.203, 0.621),
  vec2(0.962, -0.195), vec2(0.473, -0.480), vec2(0.519, 0.767), vec2(0.185, -0.893),
  vec2(0.507, 0.064), vec2(0.896, 0.412), vec2(-0.322, -0.933), vec2(-0.792, -0.598)
);
/* p — позиция уже в пространстве карты теней (0..1) */
float propShadowAt(vec3 p, vec3 w){
  if (uShadowOn < 0.5) return 0.0;
  if (p.x < 0.0 || p.x > 1.0 || p.y < 0.0 || p.y > 1.0 || p.z > 1.0) return 0.0;
  /* оценка расстояния до заслонителя — для ширины полутени */
  float blocker = texture2D(uShadowMap, p.xy).r;
  float gap = clamp((p.z - blocker) * 40.0, 0.0, 1.0);
  float radius = uShadowTexel * mix(2.0, 9.0, gap);
  float a = fract(sin(dot(w.xz, vec2(12.9898, 78.233))) * 43758.5453) * 6.2831;
  mat2 rot = mat2(cos(a), sin(a), -sin(a), cos(a));
  float s = 0.0;
  for (int i = 0; i < 12; i++){
    float d = textureLod(uShadowMap, p.xy + rot * POISSON[i] * radius, 0.0).r;
    s += step(d + 0.0015, p.z);
  }
  return s / 12.0;
}
/* Тень собаки: собака добавлена отдельно от реквизита и живая, в запечённую карту глубины её не снять, поэтому
   мягкое пятно-эллипс вдоль корпуса, сдвинутое от «небесного» ключа, плюс контактная
   тень у лап. Гаснет с высотой точки над землёй. */
float dogShadow(vec3 w){
  if (uDog.w < 0.01) return 0.0;
  vec2 d = w.xz - (uDog.xz + vec2(-0.04, 0.08));
  vec2 f = vec2(dot(d, uDogDir), dot(d, vec2(-uDogDir.y, uDogDir.x)));
  float e = length(f / vec2(0.26, 0.2));
  float blob = (1.0 - smoothstep(0.35, 1.0, e)) * 0.62;
  float fade = 1.0 - smoothstep(0.05, 0.4, w.y - uDog.y);
  return blob * fade * uDog.w;
}
float propShadow(vec3 w){
  vec4 sc = uShadowMatrix * vec4(w, 1.0);
  return propShadowAt(sc.xyz * 0.5 + 0.5, w);
}
`;

/* Общий вершинный код для травы и клевера: ветер из прокручиваемого шума
   (как в Ghost of Tsushima — пятна порывов, а не ровные синусоиды) и след курсора. */
const FIELD_PARS = /* glsl */ `
uniform float uTime;
uniform float uWind;
uniform vec2 uWindDir;
uniform vec4 uTrail[${TRAIL_SLOTS}];
uniform float uPushR;
uniform float uTrailOn;
#ifndef DOG_UNIFORM
#define DOG_UNIFORM
/* собака: xyz — точка на земле под корпусом, w — видна ли (0..1) */
uniform vec4 uDog;
uniform vec2 uDogDir;
#endif
/* размер пикселя буфера сцены в метрах на расстоянии 1 м: 2·tan(fov/2) / высота в пикселях */
uniform float uPixelWorld;
uniform float uCoverageMax;
uniform float uMinPixels;

/* "Hash without Sine" — Copyright (c) 2014 David Hoskins, MIT (shadertoy.com/view/4djSRW). Точность не
   падает на больших координатах экземпляров травы, поэтому он, а не синусный хэш. */
float hash12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float vnoise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash12(i), hash12(i + vec2(1.0, 0.0)), u.x), mix(hash12(i + vec2(0.0, 1.0)), hash12(i + vec2(1.0, 1.0)), u.x), u.y);
}
/* сила порыва в точке луга: крупные пятна плывут по ветру, мелкие — быстрее;
   бегущая волна оставлена слабой подложкой, чтобы по склону всё ещё «шло» */
float gustAt(vec2 p){
  vec2 scroll = uWindDir * uTime;
  float n = vnoise(p * 0.16 - scroll * 0.42) * 0.62 + vnoise(p * 0.52 - scroll * 1.1) * 0.38;
  float wave = sin(dot(p, uWindDir) * 0.85 - uTime * 1.55) * 0.5 + 0.5;
  float g = smoothstep(0.28, 0.82, n) * 0.8 + wave * 0.2;
  return g * g;
}
/* волна интро: кольцо бежит от кресла, xy — куда пригнуть (наружу), z — сила */
uniform vec3 uWave; /* радиус, сила, полуширина кольца */
vec3 waveAt(vec2 p){
  if (uWave.y < 0.001) return vec3(0.0);
  float d = length(p);
  float x = (d - uWave.x) / uWave.z;
  float k = exp(-x * x) * uWave.y;
  return vec3(d > 1e-4 ? p / d * k : vec2(0.0), k);
}
/* след курсора: направление, куда раздвинуть, и сила примятия */
vec3 trailPush(vec2 p, vec2 fallbackDir){
  float press = 0.0;
  vec2 push = vec2(0.0);
  if (uTrailOn > 0.5) for (int i = 0; i < ${TRAIL_SLOTS}; i++){
    vec4 tr = uTrail[i];
    if (tr.w < 0.002) continue;
    vec2 d = p - tr.xz;
    float dl = length(d);
    float f = smoothstep(uPushR, 0.0, dl) * tr.w;
    push += (dl > 1e-4 ? d / dl : fallbackDir) * f * f;
    press = max(press, f);
  }
  /* собака сидит — трава вокруг неё примята и раздвинута */
  if (uDog.w > 0.01){
    vec2 d = p - uDog.xz;
    float dl = length(d);
    float f = smoothstep(0.26, 0.0, dl) * uDog.w;
    push += (dl > 1e-4 ? d / dl : fallbackDir) * f * f * 0.8;
    press = max(press, f * 0.85);
  }
  return vec3(push, press);
}
`;

export const grassVertex = /* glsl */ `
${LIGHT_PARS}
${FIELD_PARS}

attribute vec3 aOffset;
attribute vec3 aNormal;
attribute vec4 aRnd;     /* yaw, длина, —, тон */
attribute float aClump;  /* тон кочки: крупный шум + ячейка Вороного */
attribute vec2 aLean;    /* наклон кончика к центру кочки, в долях длины */

varying float vT;
varying float vTone;
varying float vClump;
varying float vPress;
varying float vGust;
varying vec3 vW;
varying vec3 vSky;
varying vec3 vSun;
varying float vSpec;
varying float vBack;
varying float vFog;
varying vec3 vShadowP;
varying float vEdge;

void main(){
  float t = uv.y;
  vT = t;
  vEdge = uv.x;
  float len = aRnd.y;

  /* трава растёт скорее вверх, чем по нормали склона */
  vec3 up = normalize(mix(vec3(0.0, 1.0, 0.0), aNormal, 0.3));
  vec3 widthDir = vec3(cos(aRnd.x), 0.0, sin(aRnd.x));
  vec3 faceDir = normalize(cross(widthDir, up));
  float bend = t * t;

  vec2 p = aOffset.xz;
  vec3 wv = waveAt(p);
  /* пригнутая волной трава светлеет изнанкой так же, как от порыва */
  float gust = max(gustAt(p), wv.z * 0.85);
  vGust = gust;
  float flutter = sin(uTime * 5.1 + aRnd.x * 9.0 + p.x * 3.3) * 0.07
                + sin(uTime * 3.3 + aRnd.w * 11.0) * 0.04;

  /* кончик: пучок клонится к центру своей кочки (Вороной, GoT) + ветер + дрожь */
  vec2 tip = aLean;
  tip += uWindDir * (0.08 + gust * 0.66) * uWind;
  tip += vec2(widthDir.x, widthDir.z) * flutter * min(uWind, 1.6);
  tip += wv.xy * 0.5;

  vec3 tp = trailPush(p, widthDir.xz);
  tip += tp.xy * 1.25;
  float press = tp.z;
  vPress = press;

  /* длину сохраняем: чем сильнее кончик ушёл вбок, тем ниже он опускается */
  float tl = length(tip);
  if (tl > 0.94) tip *= 0.94 / tl;
  float lift = sqrt(max(0.0, 1.0 - dot(tip, tip)));
  lift *= 1.0 - press * 0.35;

  /* Утолщение при виде с ребра (GoT): травинка, повёрнутая к камере боком,
     иначе становится нитью в полпикселя — рябит и оставляет дыры в дёрне */
  vec3 toCamBase = cameraPosition - aOffset;
  vec2 vxz = normalize(toCamBase.xz + 1e-5);
  float edgeOn = 1.0 - abs(dot(normalize(faceDir.xz + 1e-5), vxz));
  float baseDist = length(toCamBase);
  /* Сохранение покрытия (AMD GPUOpen): плотность травы падает ~1/d², поэтому
     оставшиеся дальние травинки шире — дёрн не редеет и не рассыпается на пиксели. */
  float coverage = clamp(baseDist / 4.5, 1.0, uCoverageMax);
  /* aRnd.z — множитель ширины: 0 у обычной травы (значит 1), узкие длинные листья пампасов — ~0.2 */
  float width = len * 0.075 * (aRnd.z > 0.0 ? aRnd.z : 1.0) * (1.0 + edgeOn * 1.1) * coverage;
  /* Не тоньше ~1.1 пикселя: субпиксельная травинка то попадает в пиксель, то нет —
     это и есть «пиксельный шум» травы при любом сглаживании */
  width = max(width, baseDist * uPixelWorld * uMinPixels);

  vec3 world = aOffset
             + widthDir * position.x * width * (1.0 - press * 0.3)
             + up * (t * len * lift)
             + vec3(tip.x, 0.0, tip.y) * len * bend;

  vTone = aRnd.w;
  vClump = aClump;

  vec3 bladeN = normalize(faceDir + vec3(tip.x, 0.0, tip.y) * 0.8);
  vec3 N = normalize(mix(up, bladeN, 0.45));

  vec4 wp = modelMatrix * vec4(world, 1.0);
  vW = wp.xyz;
  vec3 toCam = cameraPosition - wp.xyz;
  float dist = length(toCam);
  vec3 V = toCam / dist;
  /* лезвие двустороннее: нормаль разворачиваем к камере */
  if (dot(N.xz, V.xz) < 0.0) N = normalize(vec3(-N.x, N.y, -N.z));
  /* Скруглённая нормаль (GoT): края травинки смотрят в стороны, центр — прямо,
     плоская лента освещается как круглый стебель. Геометрии не добавляет. */
  N = normalize(N + widthDir * (position.x * 2.0) * 0.6);
  /* вдали нормаль сводится к нормали склона (GoT, гайды по мерцанию травы):
     свет перестаёт скакать от пикселя к пикселю */
  N = normalize(mix(N, aNormal, smoothstep(5.0, 15.0, dist) * 0.75));

  vSky = shIrradiance(N) * uAmbient;
  float cloud = cloudShade(wp.xyz);
  vSun = uSunCol * max(dot(N, uSunDir), 0.0) * cloud;
  /* блик низкого солнца на скруглённой нормали — живой отблеск по гребню */
  vec3 H = normalize(uSunDir + V);
  /* блик по середине травинки, не на самом кончике (иначе дальние треугольники
     дают светлую «крупу» точек), и гаснет вдали */
  vSpec = pow(max(dot(N, H), 0.0), 28.0) * smoothstep(0.25, 0.65, t) * (1.0 - 0.7 * smoothstep(0.8, 1.0, t)) * smoothstep(14.0, 5.0, dist) * cloud * (1.0 + uWet * 3.0);
  /* солнце за холмом просвечивает кончики — только против света */
  /* просвет — в верхней трети травинки, но не в самой вершине: вершина кончика
     меньше пикселя, и свет, собранный в ней, давал цепочки ярких точек */
  vBack = pow(max(dot(-V, uSunDir), 0.0), 6.0) * smoothstep(0.35, 0.75, t) * (1.0 - 0.55 * smoothstep(0.8, 1.0, t)) * uBackLight * cloud;
  vFog = airFog(wp.xyz, dist);
  vec4 sc = uShadowMatrix * wp;
  vShadowP = sc.xyz * 0.5 + 0.5;

  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

export const grassFragment = /* glsl */ `
${LIGHT_PARS}
varying float vT;
varying float vTone;
varying float vClump;
varying float vPress;
varying float vGust;
varying vec3 vW;
varying vec3 vSky;
varying vec3 vSun;
varying float vSpec;
varying float vBack;
varying float vFog;
varying vec3 vShadowP;
varying float vEdge;
uniform float uA2C;

void main(){
  /* Alpha-to-coverage по краю травинки: расстояние до края в пикселях через
     fwidth, видеокарта переводит альфу в долю сэмплов MSAA. Край наклонной
     тонкой травинки перестаёт быть «лесенкой» из ярких и тёмных пикселей. */
  /* Alpha-to-coverage по краю травинки — см. конец шейдера */
  /* Альбедо живой травы (линейное): оливковый, а не «газонный» зелёный.
     Реальная трава в закатном свете — жёлто-зелёная в кончиках и почти
     коричнево-оливковая у корня; синего в ней меньше, чем кажется. */
  vec3 root = vec3(0.012, 0.016, 0.006);
  vec3 mid  = vec3(0.058, 0.098, 0.024);
  vec3 tip  = vec3(0.165, 0.235, 0.060);
  vec3 dry  = vec3(0.300, 0.265, 0.115);

  vec3 col = mix(root, mid, smoothstep(0.0, 0.55, vT));
  col = mix(col, tip, smoothstep(0.45, 1.0, vT) * (0.35 + 0.65 * vClump));
  /* сухие и выгоревшие кончики у каждой пятой травинки — главный признак живого луга */
  col = mix(col, dry, smoothstep(0.72, 1.0, vTone) * 0.5 * smoothstep(0.35, 1.0, vT));
  col *= 0.62 + 0.62 * vClump * vClump;
  /* мокрая трава темнее и насыщеннее — вода заполняет микрорельеф листа */
  col *= mix(1.0, 0.72, uWet);

  /* самозатенение внутри дёрна: у корня неба почти не видно */
  float ao = mix(0.14, 1.0, smoothstep(0.0, 0.85, vT));
  float shadow = max(propShadowAt(vShadowP, vW), dogShadow(vW));

  vec3 c = col * (vSky * mix(1.0, 0.35, shadow) + vSun * (1.0 - shadow)) * ao;
  c += col * uSunCol * vBack * 1.1 * (1.0 - shadow);
  /* блик — светлее и желтее альбедо, как восковой налёт на листе */
  c += vec3(0.55, 0.52, 0.30) * uSunCol * vSpec * 0.08 * (1.0 - shadow);

  /* Видимый ветер (GoT): пригнутые порывом травинки поворачиваются светлой
     изнанкой — по лугу бегут серебристые пятна */
  c += vec3(0.075, 0.085, 0.05) * vGust * vGust * vT * uAmbient;
  c *= 1.0 - vPress * 0.15;
  c = mix(c, uFogCol, vFog);
  float coverage = 1.0;
  if (uA2C > 0.5) {
    /* uv.x: 0 — левый край, 1 — правый; у кончика края сходятся, fwidth это учитывает */
    float e = min(vEdge, 1.0 - vEdge);
    coverage = clamp(e / max(fwidth(vEdge), 1e-4) + 0.25, 0.0, 1.0);
  }
  gl_FragColor = vec4(c, coverage);
}
`;

/* ---- растения луга: колоски, полевые цветы и пампасная трава ----
   Как в Ghost of Tsushima: процедурная трава плюс редкие «дополнения» —
   цветы и пампасы (у GoT — ликорисы и пампасная трава), всё инстансами.
   Геометрия собирается в JS, части различает aPart:
     4 — стебель, 3 — колос семян, 5 — метёлка пампасов, 6 — венчик цветка.
   Край метёлок и лепестков мягкий через alpha-to-coverage. */
export const plantVertex = /* glsl */ `
${LIGHT_PARS}
${FIELD_PARS}

attribute float aPart;
attribute vec2 aLeafUV;
attribute vec3 aOffset;
attribute vec4 aPlant;   /* yaw, масштаб, тон, фаза */
attribute vec3 aColor;   /* цвет венчика (у цветов) */
uniform float uPlantHeight; /* высота растения до масштаба — от неё считается раскачка */

varying float vPart;
varying vec2 vLeafUV;
varying float vTone;
varying vec3 vW;
varying vec3 vLight;
varying float vFog;
varying vec3 vShadowP;
varying float vH;
varying float vBackP;
varying vec3 vColor;

void main(){
  float c = cos(aPlant.x), s = sin(aPlant.x);
  vec3 lp = position * aPlant.y;
  lp.xz = mat2(c, -s, s, c) * lp.xz;

  /* качаются верхушки: сила растёт с высотой над землёй */
  vec2 p = aOffset.xz;
  float h = clamp(lp.y / (uPlantHeight * aPlant.y), 0.0, 1.0);
  vH = h;
  float gust = gustAt(p);
  vec2 sway = uWindDir * (0.004 + gust * 0.014) * uWind
            + vec2(sin(uTime * 2.3 + aPlant.w * 6.28), cos(uTime * 1.9 + aPlant.w * 5.1)) * 0.0025;
  vec3 tp = trailPush(p, vec2(c, s));
  sway += tp.xy * 0.03 + waveAt(p).xy * 0.012;
  lp.xz += sway * h * h * 3.0 * (uPlantHeight / 0.12);
  lp.y *= 1.0 - tp.z * 0.45;

  vec4 wp = modelMatrix * vec4(aOffset + lp, 1.0);
  vW = wp.xyz;
  vec3 toCam = cameraPosition - wp.xyz;
  float dist = length(toCam);
  vec3 V = toCam / dist;

  /* венчики смотрят в небо, всё остальное — к небу и к камере */
  vec3 N = aPart > 5.5 ? normalize(vec3(sway.x * 4.0, 1.0, sway.y * 4.0)) : normalize(vec3(toCam.x, dist * 0.8, toCam.z));
  float cloud = cloudShade(wp.xyz);
  vLight = shIrradiance(N) * uAmbient + uSunCol * max(dot(N, uSunDir), 0.0) * 0.7 * cloud;
  /* метёлки и лепестки просвечивают против низкого солнца */
  vBackP = pow(max(dot(-V, uSunDir), 0.0), 4.0) * uBackLight * cloud;
  vFog = airFog(wp.xyz, dist);
  vec4 sc = uShadowMatrix * wp;
  vShadowP = sc.xyz * 0.5 + 0.5;

  vPart = aPart;
  vLeafUV = aLeafUV;
  vTone = aPlant.z;
  vColor = aColor;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

export const plantFragment = /* glsl */ `
${LIGHT_PARS}
varying float vPart;
varying vec2 vLeafUV;
varying float vTone;
varying vec3 vW;
varying vec3 vLight;
varying float vFog;
varying vec3 vShadowP;
varying float vH;
varying float vBackP;
varying vec3 vColor;

float hash21(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

void main(){
  vec3 col;
  float alpha = 1.0;
  float translucency = 0.0;
  if (vPart > 5.5) {
    /* венчик: 5 лепестков по полярному углу, тёмная серединка */
    float r = length(vLeafUV);
    float ang = atan(vLeafUV.y, vLeafUV.x);
    float petal = 0.62 + 0.38 * cos(ang * 5.0);
    float edge = petal - r;
    alpha = clamp(edge / max(fwidth(r), 1e-4) + 0.5, 0.0, 1.0);
    col = mix(vec3(0.20, 0.13, 0.03), vColor * 0.85, smoothstep(0.14, 0.24, r));
    col *= 0.85 + 0.15 * r;
    translucency = 0.6;
  } else if (vPart > 4.5) {
    /* метёлка пампасов: перистая, к концу сужается, волокна вдоль */
    float y = vLeafUV.y, x = vLeafUV.x;
    /* плотное перо: широкое у основания, сходится к кончику; волокна рвут только край */
    float width = pow(sin(min(y * 1.15, 1.0) * 3.14159 * 0.5), 0.6) * (1.0 - 0.75 * y * y);
    float fibres = 0.8 + 0.2 * hash21(vec2(floor(x * 7.0 + y * 2.0), floor(y * 40.0)));
    float d = width * fibres - abs(x) * 0.9;
    alpha = clamp(d / max(fwidth(x), 1e-4) + 0.5, 0.0, 1.0);
    col = mix(vec3(0.30, 0.26, 0.19), vec3(0.52, 0.47, 0.36), smoothstep(0.0, 0.8, y) * (0.7 + 0.3 * vTone));
    translucency = 0.55;
  } else if (vPart > 3.5) {
    /* стебель: соломенно-зелёный, к верху суше */
    col = mix(vec3(0.05, 0.075, 0.022), vec3(0.12, 0.11, 0.05), vH * vTone);
  } else {
    /* колос семян (тимофеевка/мятлик): сухой, зернистый */
    float grain = hash21(floor(vLeafUV * vec2(3.0, 16.0)));
    col = mix(vec3(0.10, 0.10, 0.045), vec3(0.20, 0.18, 0.09), vTone) * (0.75 + 0.35 * grain);
    col *= 1.0 - 0.6 * smoothstep(0.55, 1.0, abs(vLeafUV.x));
  }
  float shadow = max(propShadowAt(vShadowP, vW), dogShadow(vW));
  float ao = vPart > 4.5 ? 1.0 : mix(0.4, 1.0, vH);
  col *= mix(1.0, 0.8, uWet);
  vec3 c = col * vLight * ao * mix(1.0, 0.45, shadow);
  c += col * uSunCol * vBackP * translucency * (1.0 - shadow);
  c = mix(c, uFogCol, vFog);
  gl_FragColor = vec4(c, alpha);
}
`;
export const groundVertex = /* glsl */ `
varying vec3 vW;
varying vec3 vN;
varying float vDist;
void main(){
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vW = wp.xyz;
  vN = normalize(mat3(modelMatrix) * normal);
  vDist = distance(cameraPosition, wp.xyz);
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

export const groundFragment = /* glsl */ `
${LIGHT_PARS}
varying vec3 vW;
varying vec3 vN;
varying float vDist;

float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float n2(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1, 0)), u.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), u.x), u.y);
}

void main(){
  /* Земля в цвет нижнего яруса травы (как terrain texture под травой в GoT):
     в зазорах между травинками видна не почва, а «глубина дёрна» — тёмная
     оливковая зелень с продольными штрихами и редкими пятнами сухой ветоши. */
  float n = n2(vW.xz * 1.7) * 0.6 + n2(vW.xz * 6.0) * 0.4;
  float streak = n2(vec2(vW.x * 38.0, vW.z * 9.0)) * 0.5 + n2(vec2(vW.x * 9.0, vW.z * 38.0)) * 0.5;
  vec3 soil = mix(vec3(0.020, 0.026, 0.008), vec3(0.048, 0.070, 0.018), n * 0.6 + streak * 0.4);
  soil = mix(soil, vec3(0.060, 0.052, 0.022), smoothstep(0.72, 0.9, n2(vW.xz * 0.9 + 4.0)) * 0.5);
  vec3 N = normalize(vN);
  float shadow = max(propShadow(vW), dogShadow(vW));
  vec3 light = shIrradiance(N) * uAmbient * 0.6 * mix(1.0, 0.3, shadow)
             + uSunCol * max(dot(N, uSunDir), 0.0) * (1.0 - shadow) * cloudShade(vW);
  vec3 c = soil * light * mix(1.0, 0.7, uWet);
  c = mix(c, uFogCol, airFog(vW, vDist));
  gl_FragColor = vec4(c, 1.0);
}
`;

/* ---- дымка: несколько больших полупрозрачных «простыней» тумана у склона ----
   Прозрачность — из прокручиваемого по ветру шума, у земли мягко гаснет
   (высота холма посчитана той же аналитической формулой, что в terrain.ts,
   без мелких кочек) — вместо soft particles по буферу глубины, которого нет. */
export const mistVertex = /* glsl */ `
varying vec2 vUv;
varying vec3 vW;
void main(){
  vUv = uv;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vW = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;
export const mistFragment = /* glsl */ `
uniform float uTime;
uniform vec2 uWindDir;
uniform vec3 uColor;
uniform float uOpacity;
uniform float uSeed;
varying vec2 vUv;
varying vec3 vW;

/* Hash without Sine — Copyright (c) 2014 David Hoskins, MIT */
float h21(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1, 0)), u.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), u.x), u.y); }
float fbm3(vec2 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 3; i++){ s += a * vn(p); p = p * 2.03 + 7.1; a *= 0.5; } return s / 0.875; }
float hillAt(vec2 p){ return 2.3 * exp(-(p.x * p.x / 46.24 + p.y * p.y / 19.36)); }

void main(){
  /* v14: сначала дешёвые маски — края простыни и земля; шум считаем только там, где туман
     вообще может быть. Искажение — две октавы вместо четырёх, основной шум — три
     (было 4 + 4 октавы, 32 хеша на пиксель на четырёх плоскостях в четверть экрана) */
  float edge = smoothstep(0.0, 0.25, vUv.x) * smoothstep(1.0, 0.75, vUv.x) * smoothstep(1.0, 0.35, vUv.y);
  float ground = smoothstep(-0.05, 0.45, vW.y - hillAt(vW.xz));
  float mask = edge * ground * uOpacity;
  if (mask < 0.003) discard;
  vec2 flow = uWindDir * uTime * 0.18;
  vec2 q = vec2(vW.x * 0.22, vW.y * 0.9) - vec2(flow.x, 0.0) + uSeed;
  vec2 wq = q * 1.7 + uTime * 0.03;
  float warp = vn(wq) * 0.667 + vn(wq * 2.03 + 7.1) * 0.333;
  float n = fbm3(q + warp * 0.8);
  float a = smoothstep(0.35, 0.85, n) * mask;
  if (a < 0.003) discard;
  gl_FragColor = vec4(uColor, a);
}
`;

/* ---- струи ветра: тонкие почти прозрачные ленты над травой ----
   Лента из N сегментов летит по ветру, изгибается шумом и за время жизни
   проявляется и гаснет. Вся анимация — в шейдере, JS только задаёт старт. */
export const wispVertex = /* glsl */ `
uniform float uTime;
uniform vec2 uWindDir;
attribute vec4 aStart;   /* x, y над землёй, z, время старта */
attribute vec3 aParam;   /* длина жизни, длина ленты, фаза */
varying float vA;
varying float vSide;
varying float vS;
varying float vPhase;
float hillAt(vec2 p){ return 2.3 * exp(-(p.x * p.x / 46.24 + p.y * p.y / 19.36)); }
void main(){
  float life = aParam.x;
  float age = mod(uTime - aStart.w, life + 3.0);
  float u = clamp(age / life, 0.0, 1.0);
  float s = position.x;          /* 0…1 вдоль ленты */
  vSide = position.y;           /* −1…1 поперёк */
  vec3 wind = vec3(uWindDir.x, 0.0, uWindDir.y);
  vec3 side = vec3(-uWindDir.y, 0.0, uWindDir.x);
  float along = age * 1.6 - s * aParam.y;
  vec3 p = vec3(aStart.x, 0.0, aStart.z) + wind * along;
  p += side * (sin(along * 1.3 + aParam.z * 6.28) * 0.35 + sin(along * 0.47 + aParam.z) * 0.6);
  p.y = hillAt(p.xz) + aStart.y + sin(along * 0.9 + aParam.z * 3.0) * 0.05;
  vec4 mv = viewMatrix * vec4(p, 1.0);
  /* широкая мягкая лента (в видовом пространстве вверх): не «леска», а струя воздуха */
  mv.y += position.y * 0.07 * sin(s * 3.14159);
  vS = s;
  vPhase = aParam.z;
  vA = sin(s * 3.14159) * sin(u * 3.14159) * step(age, life);
  gl_Position = projectionMatrix * mv;
}
`;
export const wispFragment = /* glsl */ `
uniform vec3 uColor;
uniform float uOpacity;
uniform float uTime;
varying float vA;
varying float vSide;
varying float vS;
varying float vPhase;
void main(){
  /* поперёк — гауссов профиль, вдоль — рваные разрывы, чтобы струя не читалась линией */
  float across = exp(-vSide * vSide * 4.0);
  float breakup = 0.5 + 0.5 * sin(vS * 23.0 + vPhase * 40.0 - uTime * 1.3) * sin(vS * 9.0 + vPhase * 13.0);
  float a = vA * across * breakup * uOpacity;
  if (a < 0.002) discard;
  gl_FragColor = vec4(uColor, a);
}
`;

/* небо по референсу: холодный серо-голубой зенит, почти белая середина,
   тёплая жёлто-персиковая полоса у горизонта. Солнце — HDR-диск с ореолом
   (значения выше 1): его подхватывают god rays и bloom. */
export const skyVertex = /* glsl */ `
varying vec3 vDir;
void main(){
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vDir = wp.xyz - cameraPosition;
  gl_Position = projectionMatrix * viewMatrix * wp;
  gl_Position.z = gl_Position.w;
}
`;

export const skyFragment = /* glsl */ `
uniform vec3 uZenith;
uniform vec3 uHigh;
uniform vec3 uMid;
uniform vec3 uHorizon;
uniform vec3 uGlow;
uniform vec3 uSunDir;
uniform vec3 uSunCol;
uniform float uSunDisc;
varying vec3 vDir;

void main(){
  vec3 d = normalize(vDir);
  float e = d.y;
  vec3 c = mix(uHorizon, uMid, smoothstep(-0.02, 0.17, e));
  c = mix(c, uHigh, smoothstep(0.13, 0.40, e));
  c = mix(c, uZenith, smoothstep(0.34, 0.90, e));

  /* тёплое свечение по азимуту солнца — шире у горизонта */
  vec3 sd = normalize(vec3(uSunDir.x, 0.0, uSunDir.z));
  float toward = max(dot(normalize(vec3(d.x, 0.0, d.z)), sd), 0.0);
  c = mix(c, uGlow, pow(toward, 4.0) * (1.0 - smoothstep(-0.05, 0.25, e)) * 0.6);

  /* диск и ореол солнца */
  float cosA = max(dot(d, uSunDir), 0.0);
  float halo = pow(cosA, 900.0) * 2.2 + pow(cosA, 90.0) * 0.45 + pow(cosA, 12.0) * 0.06;
  float disc = smoothstep(0.99965, 0.99985, cosA) * uSunDisc;
  c += uSunCol * (halo + disc);

  /* дизеринг против полос в плавном градиенте */
  float dither = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5;
  c += dither / 400.0;
  gl_FragColor = vec4(c, 1.0);
}
`;

/* надпись-призрак за холмом (как «SYLVA» в оригинале, только в глубине сцены) */
export const ghostVertex = /* glsl */ `
varying vec2 vUv;
void main(){
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;
export const ghostFragment = /* glsl */ `
uniform sampler2D uMap;
uniform vec3 uColor;
uniform float uOpacity;
varying vec2 vUv;
void main(){
  float a = texture2D(uMap, vUv).r * uOpacity;
  if (a < 0.002) discard;
  gl_FragColor = vec4(uColor, a);
}
`;

/* ---------------- постобработка ---------------- */

export const fullscreenVertex = /* glsl */ `
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

/* v22.1: дорогие эффекты светлой страницы и кейсов — на четверти разрешения, в финале одна выборка.
   Раньше финальный проход делал по 16 выборок на каждый пиксель полного кадра (5.4 Мп при DPR 2.25):
   прокрутка кейсов шла ~28 fps, About подтормаживал.
   uMode 0 — размытие задника (диск Вогеля), 1 — мягкая тень компьютера (два кольца со смещением). */
export const quarterFragment = /* glsl */ `
uniform sampler2D tInput;
uniform float uR;
uniform float uAspect;  /* ширина/высота кадра */
uniform int uMode;
varying vec2 vUv;
float ign(vec2 p){ return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))); }
void main(){
  float rot = ign(gl_FragCoord.xy) * 6.2831;
  if (uMode == 0) {
    vec3 acc = vec3(0.0);
    for (int k = 0; k < 16; k++) {
      float a = float(k) * 2.39996 + rot;
      float r = uR * sqrt((float(k) + 0.5) / 16.0);
      acc += textureLod(tInput, vUv + vec2(cos(a) * r / uAspect, sin(a) * r), 0.0).rgb;
    }
    gl_FragColor = vec4(acc / 16.0, 1.0);
  } else {
    float sh = 0.0;
    for (int k = 0; k < 16; k++) {
      float a = float(k) * 0.3927 + rot;
      float r = (k % 2 == 0 ? 0.045 : 0.022) * uAspect;
      sh += textureLod(tInput, vUv + vec2(-0.008 + cos(a) * r * 0.8, 0.03 + sin(a) * r), 0.0).a;
    }
    gl_FragColor = vec4(sh / 16.0, 0.0, 0.0, 1.0);
  }
}`;

/* маска для лучей: только яркое около солнца — его ореол (трава так не светится) */
export const godMaskFragment = /* glsl */ `
uniform sampler2D tColor;
uniform vec2 uSun;        /* солнце в UV экрана */
uniform float uAspect;
varying vec2 vUv;
void main(){
  vec3 c = texture2D(tColor, vUv).rgb;
  float lum = dot(c, vec3(0.2126, 0.7152, 0.0722));
  vec2 d = (vUv - uSun) * vec2(uAspect, 1.0);
  float near = exp(-dot(d, d) * 30.0);
  /* белое небо (~0.9) в маску не попадает — только ореол и диск солнца */
  gl_FragColor = vec4(c * near * smoothstep(1.15, 2.6, lum), 1.0);
}
`;

/* радиальное размытие к солнцу — классика GPU Gems 3, гл. 13 */
export const godBlurFragment = /* glsl */ `
uniform sampler2D tInput;
uniform vec2 uSun;
uniform float uStep;
uniform float uDecay;
varying vec2 vUv;
const int SAMPLES = 36;
void main(){
  vec2 delta = (uSun - vUv) * uStep / float(SAMPLES);
  vec2 uv = vUv;
  vec3 sum = vec3(0.0);
  float w = 1.0, total = 0.0;
  /* сдвиг старта на шум убирает ступеньки сэмплов */
  uv += delta * fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715)))); /* IGN */
  for (int i = 0; i < SAMPLES; i++){
    sum += textureLod(tInput, uv, 0.0).rgb * w;
    total += w;
    w *= uDecay;
    uv += delta;
  }
  gl_FragColor = vec4(sum / total, 1.0);
}
`;

/* Финальный проход — один полноэкранный шаг прямо на экран (как EffectPass у
   pmndrs/postprocessing: все эффекты слиты в один шейдер):
   растяжение с резкостью (CAS) → лучи → экспозиция → тонмаппинг → цветокоррекция
   (vibrance, контраст вокруг средне-серого, баланс белого) → sRGB → виньетка → дизер.
   Тонмапперы: 0 — Khronos PBR Neutral, 1 — AgX, 2 — AgX «Punchy» (look из Blender). */
export const finalFragment = /* glsl */ `
uniform sampler2D tScene;
uniform sampler2D tRays;
uniform float uRays;
uniform vec3 uRayTint;
uniform float uVignette;
uniform float uGrain;
uniform float uExposure;
uniform vec2 uTexel;       /* размер текселя буфера сцены */
uniform float uSharp;      /* 0 — без резкости, 1 — максимум CAS */
uniform int uTone;
uniform float uVibrance;   /* насыщенность, бережная к уже насыщенным цветам */
uniform float uContrast;   /* контраст в лог-пространстве вокруг 0.18 */
uniform vec3 uWhiteBalance;
uniform float uFocus;
uniform float uGlitch;     /* интро: полосы со сдвигом и RGB-расслоением, 0..1 */
uniform float uGlitchSeed; /* меняется рывками — полосы прыгают, а не плывут */
uniform float uBlack;      /* интро: провал в темноту */
uniform float uRadial;     /* скролл-история: zoom-blur от центра, как в переходе igloo */
/* Скролл-история: заливка снизу рваным краем (igloo TransitionEffect) — «страница» About;
   компьютер рисуется своим проходом (tPC, premultiplied) поверх заливки */
uniform float uFill;
uniform vec3 uFillColor;
uniform sampler2D tPC;
uniform float uOverlay;
uniform float uStudio;     /* v17: студийный фон светлой страницы — пятно света, глубина, контактная тень */
uniform vec4 uPCRect;      /* компьютер в UV кадра: x0, y0, x1, y1 */
uniform vec2 uSpot;        /* центр светового пятна за компьютером */
uniform sampler2D tKinetic; /* v18: бегущая строка за компьютером */
uniform float uKinetic;
uniform vec4 uKinetic2;    /* ширина/высота текстуры, сдвиг, центр полосы по y, высота полосы */
uniform vec3 uKinKeep;     /* v19: копия N, доля «Hi there!», сила — остальной текст гаснет при превращении в заголовок */
uniform float uTear;       /* v19: нижний край оторванной страницы About (доли высоты кадра) */
uniform float uBgBlur;     /* v19: размытие сцены-фона в главе «Кейсы» (само размытие — в четвертном проходе) */
uniform sampler2D tShadow; /* v22.1: мягкая тень компьютера, посчитанная на четверти разрешения */
uniform sampler2D tAlt;    /* v32: второй фон (луг) — для смешивания с холмом на выходе из кейсов */
uniform float uAlt;        /* 0 — только tScene, 0…1 — доля tAlt */
varying vec2 vUv;

const vec3 LUMA = vec3(0.2126, 0.7152, 0.0722);

/* Khronos PBR Neutral — референсная формула Khronos Group (github.com/KhronosGroup/ToneMapping), Apache-2.0 */
vec3 neutralTonemap(vec3 color){
  const float startCompression = 0.8 - 0.04;
  const float desaturation = 0.15;
  float x = min(color.r, min(color.g, color.b));
  float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
  color -= offset;
  float peak = max(color.r, max(color.g, color.b));
  if (peak < startCompression) return color;
  float d = 1.0 - startCompression;
  float newPeak = 1.0 - d * d / (peak + d - startCompression);
  color *= newPeak / peak;
  float g = 1.0 - 1.0 / (desaturation * (peak - newPeak) + 1.0);
  return mix(color, vec3(newPeak), g);
}

/* AgX — копия AgXToneMapping из three.js (Copyright © 2010-2026 three.js authors, MIT; через Filament и Blender), плюс look */
const mat3 SRGB_TO_REC2020 = mat3(vec3(0.6274, 0.0691, 0.0164), vec3(0.3293, 0.9195, 0.0880), vec3(0.0433, 0.0113, 0.8956));
const mat3 REC2020_TO_SRGB = mat3(vec3(1.6605, -0.1246, -0.0182), vec3(-0.5876, 1.1329, -0.1006), vec3(-0.0728, -0.0083, 1.1187));
const mat3 AGX_INSET = mat3(vec3(0.856627153315983, 0.137318972929847, 0.11189821299995), vec3(0.0951212405381588, 0.761241990602591, 0.0767994186031903), vec3(0.0482516061458583, 0.101439036467562, 0.811302368396859));
const mat3 AGX_OUTSET = mat3(vec3(1.1271005818144368, -0.1413297634984383, -0.14132976349843826), vec3(-0.11060664309660323, 1.157823702216272, -0.11060664309660294), vec3(-0.016493938717834573, -0.016493938717834257, 1.2519364065950405));
vec3 agxContrast(vec3 x){
  vec3 x2 = x * x; vec3 x4 = x2 * x2;
  return 15.5 * x4 * x2 - 40.14 * x4 * x + 31.96 * x4 - 6.868 * x2 * x + 0.4298 * x2 + 0.1191 * x - 0.00232;
}
vec3 agxTonemap(vec3 color, bool punchy){
  const float minEv = -12.47393;
  const float maxEv = 4.026069;
  color = AGX_INSET * (SRGB_TO_REC2020 * color);
  color = clamp((log2(max(color, 1e-10)) - minEv) / (maxEv - minEv), 0.0, 1.0);
  color = agxContrast(color);
  if (punchy) {
    /* look «Punchy» из Blender: power 1.35, saturation 1.4 */
    float l = dot(color, LUMA);
    color = pow(max(color, 0.0), vec3(1.35));
    color = l + 1.4 * (color - l);
  }
  color = AGX_OUTSET * color;
  color = pow(max(vec3(0.0), color), vec3(2.2));
  return clamp(REC2020_TO_SRGB * color, 0.0, 1.0);
}

vec3 toSrgb(vec3 c){
  c = clamp(c, 0.0, 1.0);
  return mix(pow(c, vec3(0.41666)) * 1.055 - 0.055, c * 12.92, vec3(lessThanEqual(c, vec3(0.0031308))));
}

/* выборки внутри циклов — textureLod(…, 0.0): у этих буферов нет мипмапов, а неявные производные в цикле
   ANGLE/D3D разворачивает с предупреждением X3595 и компилирует дольше */
/* Interleaved gradient noise (Jimenez, CoD:AW) — почти blue noise без текстуры:
   зерно и дизер не собираются в пятна, как у fract(sin()) */
float ign(vec2 p){ return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))); }

float hash11(float n){ return fract(sin(n * 12.9898 + 4.1414) * 43758.5453); }
float hash21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash21(i), hash21(i + vec2(1.0, 0.0)), u.x), mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x), u.y);
}

/* HDR → экран: контраст в лог-пространстве, тонмаппинг, vibrance, sRGB. Общий для сцены
   и для отдельного прохода компьютера, чтобы на стыке слоёв цвет не прыгал */
vec3 grade(vec3 hdr){
  vec3 lg = log2(max(hdr, 1e-5) / 0.18);
  hdr = 0.18 * pow(vec3(2.0), lg * uContrast);
  vec3 c = uTone == 0 ? neutralTonemap(hdr) : agxTonemap(hdr, uTone == 2);
  float lum = dot(c, LUMA);
  float sat = max(c.r, max(c.g, c.b)) - min(c.r, min(c.g, c.b));
  c = max(mix(vec3(lum), c, 1.0 + uVibrance * (1.0 - sat)), 0.0);
  return toSrgb(c);
}

void main(){
  vec3 rays = texture2D(tRays, vUv).rgb * uRayTint * uRays;
  /* глитч интро (конец кадра SYS_CAM у референса): горизонтальные полосы разной
     высоты сдвигаются рывком, в сдвинутых — расслоение каналов */
  vec2 uv = vUv;
  float split = 0.0;
  if (uGlitch > 0.001) {
    float rows = mix(14.0, 60.0, hash11(floor(uGlitchSeed) * 3.1));
    float band = floor(vUv.y * rows);
    float on = step(1.0 - uGlitch * 0.75, hash11(band + floor(uGlitchSeed) * 7.7));
    uv.x = fract(uv.x + (hash11(band * 1.37 + uGlitchSeed) - 0.5) * 0.18 * uGlitch * on);
    /* блоки: крупная пикселизация в части полос */
    float px = mix(1.0, 90.0, on * step(0.6, hash11(band * 5.3 + uGlitchSeed)));
    uv = px > 1.0 ? (floor(uv * vec2(px * 1.6, px)) + 0.5) / vec2(px * 1.6, px) : uv;
    split = (0.004 + 0.02 * on) * uGlitch;
  }
  /* Сцена рисуется в буфер ниже родного DPR, канвас — в родном. Растягиваем сами
     с адаптивной резкостью по мотивам AMD FidelityFX CAS: крест из 5 выборок,
     резкость сильнее там, где локальный контраст низкий, и слабее на краях. */
  vec3 e = texture2D(tScene, uv).rgb;
  if (split > 0.0) {
    e.r = texture2D(tScene, uv + vec2(split, 0.0)).r;
    e.b = texture2D(tScene, uv - vec2(split, 0.0)).b;
  }
  if (uSharp > 0.001) {
    vec3 b = texture2D(tScene, uv - vec2(0.0, uTexel.y)).rgb;
    vec3 h = texture2D(tScene, uv + vec2(0.0, uTexel.y)).rgb;
    vec3 d = texture2D(tScene, uv - vec2(uTexel.x, 0.0)).rgb;
    vec3 f = texture2D(tScene, uv + vec2(uTexel.x, 0.0)).rgb;
    vec3 e1 = min(e, vec3(1.0));
    vec3 mn = min(e1, min(min(b, h), min(d, f)));
    vec3 mx = min(max(e1, max(max(b, h), max(d, f))), vec3(1.0));
    vec3 amp = sqrt(clamp(min(mn, 1.0 - mx) / max(mx, vec3(1e-4)), 0.0, 1.0));
    vec3 w = -amp * mix(0.125, 0.2, uSharp);
    e = max((w * (min(b, 1.0) + min(h, 1.0) + min(d, 1.0) + min(f, 1.0)) + e) / (1.0 + 4.0 * w), vec3(0.0));
  }
  /* v32: луг ↔ холм под размытием — оба фона уже размыты в четверти, просто смешиваем */
  if (uAlt > 0.001) e = mix(e, texture2D(tAlt, uv).rgb, uAlt);

  /* Фокус на кресле: нижние ~20% кадра мягко расфокусированы, как у длинного
     объектива (кинематографичные планы GoT). Размытие дешёвое — 8 выборок по
     кругу из готового HDR-кадра, до тонмаппинга и цветокоррекции, поэтому цвет
     не отличается; заодно прячет зазоры переднего плана. */
  float fore = smoothstep(0.2, 0.0, vUv.y) * uFocus;
  if (fore > 0.01) {
    vec3 acc = vec3(0.0);
    float r = fore * 3.2;
    for (int k = 0; k < 8; k++) {
      float a = float(k) * 0.785398 + 0.39;
      vec2 o = vec2(cos(a), sin(a)) * uTexel * r * (k % 2 == 0 ? 1.0 : 0.55);
      acc += textureLod(tScene, uv + o, 0.0).rgb;
    }
    e = mix(e, acc / 8.0, smoothstep(0.0, 1.0, fore));
  }
  /* Zoom-blur от центра (переход igloo, TransitionEffect): 12 выборок вдоль луча к центру,
     сильнее к краям — центр кадра, где встаёт компьютер, остаётся читаемым */
  if (uRadial > 0.001) {
    vec2 toC = uv - 0.5;
    vec3 acc = vec3(0.0);
    float wsum = 0.0;
    for (int k = 0; k < 12; k++) {
      float s = float(k) / 11.0;
      float wk = 1.0 - s * 0.5;
      acc += textureLod(tScene, 0.5 + toC * (1.0 - uRadial * s * length(toC) * 2.0), 0.0).rgb * wk;
      wsum += wk;
    }
    e = mix(e, acc / wsum, min(1.0, uRadial * 4.0));
  }
  /* глава «Кейсы»: tScene уже размытый задник из четвертного прохода (quarterFragment) */
  /* контраст до тонмаппинга — в лог-пространстве вокруг средне-серого (см. grade) */
  vec3 c = grade((e + rays) * uExposure * uWhiteBalance);
  vec2 q = vUv - 0.5;
  c *= 1.0 - dot(q, q) * uVignette;

  /* заливка поднимается снизу: наклон и два слоя шума рвут край, как облако (igloo);
     «бумага» с мелким зерном — как фон экрана About на Tilda */
  float paperMask = 0.0;
  float tearD = 1.0;
  if (uFill > 0.0005) {
    float edge = uv.x * 0.16 + (vnoise(uv * 3.0) - 0.5) * 0.22 + (vnoise(uv * 9.0) - 0.5) * 0.088;
    float level = uFill * 2.0 - 0.5;
    paperMask = clamp(1.0 - smoothstep(level - 0.14, level + 0.14, uv.y + edge), 0.0, 1.0);
    /* v19: страница оторвана снизу и уходит вверх — рваный край бумаги (крупные зубцы + волокна),
       под краем на сцене — тень от листа */
    if (uTear > -0.19) {
      float jag = (vnoise(vec2(uv.x * 7.0, 3.1)) - 0.5) * 0.07 + (vnoise(vec2(uv.x * 38.0, 7.7)) - 0.5) * 0.022 + (hash21(vec2(floor(uv.x / uTexel.x * 0.5), 1.0)) - 0.5) * 0.004;
      float d = uv.y - (uTear + jag);
      tearD = d;
      float px = uTexel.y * 1.5;
      c *= 1.0 - (1.0 - smoothstep(-0.07, 0.0, d)) * step(d, 0.0) * 0.28;
      paperMask *= smoothstep(-px, px, d);
    }
    vec3 paper = uFillColor;
    /* студийный фон вместо плоской бумаги (v17, по мотивам oryzo.ai): за компьютером светлое
       пятно, к краям кадр мягко уходит в тёплый серый — появляется воздух и глубина; из угла
       внизу слева остаётся тёплое свечение заката, из которого мы пришли; под компьютером —
       мягкая контактная тень, от которой он «висит» над полом, а не наклеен */
    if (uStudio > 0.001) {
      float aspect = uTexel.y / uTexel.x;
      vec2 d = (uv - uSpot) * vec2(aspect, 1.0);
      float spot = exp(-dot(d, d) * 1.5);
      vec3 room = mix(vec3(0.83, 0.82, 0.80), vec3(0.992, 0.988, 0.975), spot);
      vec2 g = (uv - vec2(-0.08, -0.12)) * vec2(aspect, 1.0);
      room = mix(room, vec3(1.0, 0.80, 0.62), exp(-dot(g, g) * 2.6) * 0.42);
      vec2 g2 = (uv - vec2(1.06, 1.1)) * vec2(aspect, 1.0);
      room = mix(room, vec3(0.80, 0.84, 0.90), exp(-dot(g2, g2) * 3.0) * 0.25);
      float w = max(uPCRect.z - uPCRect.x, 0.001);
      vec2 cs = vec2((uv.x - (uPCRect.x + uPCRect.z) * 0.5) / (w * 0.62), (uv.y - (uPCRect.y - w * 0.07)) / (w * 0.085 * aspect));
      room *= 1.0 - exp(-dot(cs, cs) * 1.4) * 0.2;
      paper = mix(paper, room, uStudio);
    }
    paper += (hash21(floor(gl_FragCoord.xy)) - 0.5) * 0.04;
    /* кант рваной бумаги: у самого края лист чуть темнее (толщина, тень волокон), за краем —
       рваные белые волокна, торчащие наружу */
    if (uTear > -0.19) {
      float rim = 1.0 - smoothstep(0.0, uTexel.y * 5.0, tearD);
      paper *= 1.0 - rim * 0.14;
      float fiber = step(0.62, vnoise(vec2(uv.x * 260.0, 2.0))) * (1.0 - smoothstep(-uTexel.y * 7.0, 0.0, tearD)) * step(-uTexel.y * 7.0, tearD);
      c = mix(c, vec3(0.93, 0.925, 0.91), fiber * 0.85 * step(tearD, 0.0));
    }
    c = mix(c, paper, paperMask);
  }
  /* бегущая строка: огромные буквы едут по скроллу за компьютером — по «бумаге», под тенью и ПК */
  if (uKinetic > 0.001) {
    float kv = (uv.y - uKinetic2.z) / uKinetic2.w + 0.5;
    float aspect = uTexel.y / uTexel.x;
    float ku = uv.x * aspect / (uKinetic2.w * uKinetic2.x) + uKinetic2.y;
    /* выборка вне ветвления — у мипмапов производные должны быть ровными */
    float ink = texture2D(tKinetic, vec2(ku, clamp(kv, 0.0, 1.0))).a * step(0.0, kv) * step(kv, 1.0);
    /* превращение в заголовок: остаётся только «Hi there!» копии N */
    float head = smoothstep(uKinKeep.x - 0.003, uKinKeep.x, ku) * (1.0 - smoothstep(uKinKeep.x + uKinKeep.y, uKinKeep.x + uKinKeep.y + 0.006, ku));
    ink *= mix(1.0, head, uKinKeep.z);
    c = mix(c, vec3(0.078, 0.078, 0.059), ink * uKinetic * paperMask);
  }
  /* компьютер своим слоем: мягкая тень на бумаге, затем сам ПК тем же грейдом */
  if (uOverlay > 0.5) {
    vec4 pc = texture2D(tPC, uv);
    /* мягкая тень: два кольца выборок альфы со смещением вниз-вправо — посчитана на четверти разрешения */
    float sh = texture2D(tShadow, uv).r;
    c *= 1.0 - smoothstep(0.0, 1.0, sh) * 0.16 * paperMask;
    if (pc.a > 0.002) c = mix(c, grade(pc.rgb / pc.a * uExposure * uWhiteBalance), clamp(pc.a, 0.0, 1.0));
  }
  /* неподвижный дизер+зерно на IGN: убирает полосы в градиенте неба и не мигает */
  c += (ign(gl_FragCoord.xy) - 0.5) * uGrain;
  c *= 1.0 - uBlack;
  gl_FragColor = vec4(c, 1.0);
}
`;
/* пыльца за курсором — небольшой пул частиц, переиспользуемых по кругу */
export const pollenVertex = /* glsl */ `
attribute vec3 aVel;
attribute float aBirth;
attribute vec2 aRnd;
uniform float uTime;
uniform float uLife;
uniform float uScale;
varying float vA;
void main(){
  float age = uTime - aBirth;
  if (age < 0.0 || age > uLife){ vA = 0.0; gl_PointSize = 0.0; gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
  float u = age / uLife;
  vec3 p = position + aVel * age * (1.0 - 0.4 * u)
         + vec3(sin(aRnd.y * 6.28 + age * 2.4) * 0.08 * u, 0.22 * age, cos(aRnd.y * 4.1 + age * 1.9) * 0.05 * u);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_PointSize = aRnd.x * uScale / max(-mv.z, 0.1) * (0.5 + 0.5 * (1.0 - u));
  vA = smoothstep(0.0, 0.08, u) * (1.0 - smoothstep(0.45, 1.0, u));
  gl_Position = projectionMatrix * mv;
}
`;
export const pollenFragment = /* glsl */ `
uniform vec3 uColor;
varying float vA;
void main(){
  vec2 q = gl_PointCoord - 0.5;
  float d = dot(q, q) * 4.0;
  float a = exp(-d * 3.0) * vA;
  if (a < 0.01) discard;
  gl_FragColor = vec4(uColor * (1.0 + a), a * 0.85);
}
`;
