import * as THREE from "three";
import { heightAt } from "./terrain";

/* Голограмма «прогрузки локации» для интро (референс — картинки холма в
   голубой сетке). Три части, все в тот же HDR-буфер сцены поверх травы:
   · сетка по рельефу чуть над травой: вне «загруженной» зоны тонирует траву
     в тёмную бирюзу и рисует линии; сначала треугольная сеть с узлами, потом
     квадратная;
   · изогнутые стены-экран вокруг сцены: сетка, точки на пересечениях, пакеты
     и потоки данных;
   · каркас реквизита выше линии материализации + нити из неба к креслу.
   Смешивание premultiplied: rgb = тонировка·a + линии, так одна выборка и
   затемняет, и светится. Вне интро группа скрыта — ноль стоимости. */

export type HologramState = {
  /* общая видимость 0..1 */
  holo: number;
  /* радиус «загруженной» зоны вокруг кресла, м */
  reveal: number;
  /* 1 — треугольная сеть с узлами, 0 — квадратная сетка */
  net: number;
  /* стены проявляются снизу вверх, 0..1 */
  walls: number;
  /* высота линии материализации реквизита в мире: ниже — настоящий, выше — каркас */
  cut: number;
};

const COLOR = new THREE.Color(0.32, 0.86, 1.25);

const common = /* glsl */ `
uniform float uTime;
uniform float uHolo;
uniform vec3 uWave;
uniform vec3 uColor;
float hh(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
/* линия толщиной ~w пикселей по координате, кратной 1 */
float gridLine(vec2 c, float w){
  vec2 f = abs(fract(c - 0.5) - 0.5) / max(fwidth(c), vec2(1e-5));
  return 1.0 - clamp(min(f.x, f.y) / w, 0.0, 1.0);
}
float ring(float d){
  if (uWave.y < 0.001) return 0.0;
  float x = (d - uWave.x) / (uWave.z * 1.4);
  return exp(-x * x) * uWave.y;
}
`;

const groundVertex = /* glsl */ `
varying vec3 vW;
varying float vDepth;
void main(){
  vec4 w = modelMatrix * vec4(position, 1.0);
  vW = w.xyz;
  vec4 mv = viewMatrix * w;
  vDepth = -mv.z;
  gl_Position = projectionMatrix * mv;
}
`;

const groundFragment = /* glsl */ `
${common}
uniform float uReveal;
uniform float uNet;
varying vec3 vW;
varying float vDepth;

/* треугольная сеть: решётка со сдвигом узлов по шуму, диагональ ячейки */
float triNet(vec2 p, out float node){
  vec2 c = p / 0.42;
  vec2 i = floor(c), f = fract(c);
  /* сдвиг линий шумом ячейки — сеть неровная, как на картинке 4 */
  float j = (hh(i) - 0.5) * 0.35;
  vec2 g = vec2(c.x + j * f.y, c.y + j * f.x);
  float l = gridLine(g, 1.1);
  float dg = abs(fract(c.x - c.y + 0.5) - 0.5) / max(fwidth(c.x - c.y), 1e-5);
  l = max(l, 1.0 - clamp(dg / 1.1, 0.0, 1.0));
  /* узлы — квадратики на пересечениях, часть ярче */
  vec2 q = abs(fract(c + 0.5) - 0.5) / max(fwidth(c), vec2(1e-5));
  float sq = 1.0 - clamp(max(q.x, q.y) / 2.6, 0.0, 1.0);
  node = sq * step(0.35, hh(floor(c + 0.5) + 17.0));
  return l;
}

void main(){
  float d = length(vW.xz);
  /* вне загруженной зоны — голограмма; у кромки зоны яркая полоса */
  float outside = smoothstep(uReveal, uReveal + 2.2, d);
  float edge = exp(-pow((d - uReveal - 0.4) / 0.5, 2.0)) * step(0.05, uReveal);
  float far = 1.0 - smoothstep(18.0, 30.0, vDepth);

  float node = 0.0;
  float tri = triNet(vW.xz, node);
  float sqr = gridLine(vW.xz / 0.6, 1.1);
  float fine = gridLine(vW.xz / 0.1875, 0.8) * 0.18;
  float lines = mix(sqr + fine, tri, uNet);
  float glow = mix(0.0, node * 2.2, uNet);

  float wv = ring(d);
  /* лёгкое мерцание, чтобы сетка «жила» */
  float flick = 0.85 + 0.15 * sin(uTime * 7.0 + hh(floor(vW.xz * 2.0)) * 40.0);

  float a = outside * 0.55 * far;
  vec3 tint = vec3(0.01, 0.06, 0.075);
  vec3 lit = uColor * ((lines * 2.2 + glow) * flick * far * outside
           + edge * (0.12 + lines * 2.4) + wv * (0.05 + lines * 3.2));
  gl_FragColor = vec4((tint * a + lit) * uHolo, a * uHolo);
}
`;

const wallVertex = /* glsl */ `
varying vec2 vArc;
varying vec3 vW;
void main(){
  vec4 w = modelMatrix * vec4(position, 1.0);
  vW = w.xyz;
  /* по дуге цилиндра, в метрах */
  vArc = vec2(uv.x * 6.2831853 * 14.0, w.y);
  gl_Position = projectionMatrix * viewMatrix * w;
}
`;

const wallFragment = /* glsl */ `
${common}
uniform float uWalls;
varying vec2 vArc;
varying vec3 vW;
void main(){
  vec2 c = vArc / 1.6;
  float major = gridLine(c, 0.9);
  float minor = gridLine(c * 4.0, 0.7) * 0.22;
  /* точки на пересечениях крупной сетки */
  vec2 q = abs(fract(c + 0.5) - 0.5) / max(fwidth(c), vec2(1e-5));
  float dot_ = 1.0 - clamp(length(q) / 2.4, 0.0, 1.0);
  /* пакеты данных: квадраты в случайных ячейках мелкой сетки, мигают */
  vec2 cell = floor(vArc / 0.4);
  float pk = step(0.985, hh(cell + floor(uTime * 1.5)));
  vec2 pq = abs(fract(vArc / 0.4) - 0.5);
  float packet = pk * step(max(pq.x, pq.y), 0.28);
  /* потоки: в редких колонках вниз бегут штрихи */
  float col = floor(vArc.x / 0.4);
  float stream = step(0.93, hh(vec2(col, 3.0)));
  float dash = step(0.72, fract(vArc.y * 1.3 + uTime * (1.5 + hh(vec2(col, 9.0)) * 2.5)));
  float xs = abs(fract(vArc.x / 0.4) - 0.5) / max(fwidth(vArc.x / 0.4), 1e-5);
  stream *= dash * (1.0 - clamp(xs / 1.2, 0.0, 1.0));

  /* проявление снизу вверх с яркой кромкой */
  float front = mix(-3.0, 17.0, uWalls);
  float shown = 1.0 - smoothstep(front - 0.4, front, vW.y);
  float lead = exp(-pow((vW.y - front) / 0.35, 2.0)) * step(0.001, uWalls) * step(uWalls, 0.999);
  /* к верху гаснет, как на референсе */
  float fade = 1.0 - smoothstep(9.0, 15.0, vW.y);

  float wv = ring(length(vW.xz));
  float lines = (major * 1.1 + minor * 1.6 + dot_ * 3.0 + packet * 2.0 + stream * 1.6) * shown * fade;
  /* лёгкая серо-синяя плёнка экрана — на кремовом небе без неё голубые линии теряются */
  float a = mix(0.12, 0.3, smoothstep(2.0, 12.0, vW.y)) * shown * fade;
  vec3 lit = uColor * (lines * (1.0 + wv * 2.5) + lead * (0.6 + major * 2.0) + wv * 0.08);
  gl_FragColor = vec4((vec3(0.04, 0.09, 0.12) * a + lit) * uHolo, a * uHolo);
}
`;

const propVertex = /* glsl */ `
varying vec3 vW;
varying vec3 vN;
void main(){
  vec4 w = modelMatrix * vec4(position, 1.0);
  vW = w.xyz;
  vN = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * w;
}
`;

const propFragment = /* glsl */ `
${common}
uniform float uCut;
varying vec3 vW;
varying vec3 vN;
void main(){
  float above = smoothstep(uCut - 0.004, uCut + 0.004, vW.y);
  if (above < 0.01) discard;
  vec3 v = normalize(cameraPosition - vW);
  float fres = pow(1.0 - abs(dot(normalize(vN), v)), 2.0);
  /* каркас: мировая сетка 4 см по трём осям, каждая гаснет там, где идёт вдоль поверхности */
  vec3 g = abs(fract(vW / 0.04 - 0.5) - 0.5) / max(fwidth(vW / 0.04), vec3(1e-5));
  vec3 l = 1.0 - clamp(g / 1.0, 0.0, 1.0);
  vec3 an = abs(normalize(vN));
  float wire = max(max(l.x * (1.0 - an.x), l.y * (1.0 - an.y)), l.z * (1.0 - an.z));
  float band = exp(-pow((vW.y - uCut) / 0.012, 2.0)) * 3.0;
  vec3 lit = uColor * (wire * 0.9 + fres * 0.8 + 0.06 + band);
  float a = 0.35 * above;
  gl_FragColor = vec4((vec3(0.02, 0.06, 0.08) * a + lit * above) * uHolo, a * uHolo);
}
`;

const threadFragment = /* glsl */ `
uniform float uHolo;
uniform vec3 uColor;
varying float vY;
void main(){
  gl_FragColor = vec4(uColor * 0.5 * (1.0 - smoothstep(4.0, 12.0, vY)) * uHolo, 0.0);
}
`;
const threadVertex = /* glsl */ `
varying float vY;
void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vY = w.y; gl_Position = projectionMatrix * viewMatrix * w; }
`;

export class Hologram {
  readonly group = new THREE.Group();
  private uniforms: Record<string, THREE.IUniform>;
  private propMat: THREE.ShaderMaterial;
  /* материалы реквизита, которым добавлен срез материализации */
  private cutUniform = { value: 1e3 };

  constructor(shared: { uTime: THREE.IUniform; uWave: THREE.IUniform }) {
    this.uniforms = {
      uTime: shared.uTime,
      uWave: shared.uWave,
      uHolo: { value: 0 },
      uColor: { value: COLOR },
      uReveal: { value: 0 },
      uNet: { value: 1 },
      uWalls: { value: 0 },
      uCut: this.cutUniform,
    };
    const premult = {
      transparent: true,
      depthWrite: false,
      blending: THREE.CustomBlending,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneMinusSrcAlphaFactor,
      blendSrcAlpha: THREE.OneFactor,
      blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
    } as const;

    /* сетка по рельефу — на 12 см над землёй, линии идут сквозь траву */
    const size = 44, seg = 180;
    const geo = new THREE.PlaneGeometry(size, size, seg, seg);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) pos.setY(i, heightAt(pos.getX(i), pos.getZ(i)) + 0.12);
    const ground = new THREE.Mesh(geo, new THREE.ShaderMaterial({ ...premult, vertexShader: groundVertex, fragmentShader: groundFragment, uniforms: this.uniforms }));
    ground.renderOrder = 4;
    ground.frustumCulled = false;

    /* стены: открытый цилиндр вокруг сцены, камера внутри */
    const wallGeo = new THREE.CylinderGeometry(14, 14, 20, 128, 1, true);
    const walls = new THREE.Mesh(wallGeo, new THREE.ShaderMaterial({ ...premult, vertexShader: wallVertex, fragmentShader: wallFragment, uniforms: this.uniforms, side: THREE.DoubleSide }));
    walls.position.set(0, 7, -1);
    walls.renderOrder = 3;
    walls.frustumCulled = false;

    this.propMat = new THREE.ShaderMaterial({ ...premult, vertexShader: propVertex, fragmentShader: propFragment, uniforms: this.uniforms, side: THREE.DoubleSide });

    this.group.add(walls, ground);
    this.group.visible = false;
  }

  /* каркас поверх реквизита и срез материализации в его настоящих материалах */
  attachProps(props: THREE.Object3D) {
    props.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(props);
    props.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh || mesh.userData.holo) return;
      const ghost = new THREE.Mesh(mesh.geometry, this.propMat);
      ghost.userData.holo = true;
      ghost.renderOrder = 6;
      ghost.visible = this.group.visible;
      mesh.add(ghost);
      this.ghosts.push(ghost);
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      /* свои ShaderMaterial (экран компьютера) не патчим — прячем меш целиком, пока срез ниже него */
      if (mats.some((m) => (m as THREE.ShaderMaterial).isShaderMaterial)) {
        this.uncut.push({ mesh, minY: new THREE.Box3().setFromObject(mesh).min.y });
        return;
      }
      for (const m of mats) this.addCut(m);
    });
    /* нити из неба к креслу, как тонкие вертикали на референсе */
    if (!this.threads) {
      const pts: number[] = [];
      const c = box.getCenter(new THREE.Vector3());
      for (const [dx, dz] of [[-0.35, 0.1], [0.3, -0.15], [0.85, 0.05]]) pts.push(c.x + dx, box.max.y - 0.1, c.z + dz, c.x + dx, 14, c.z + dz);
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
      this.threads = new THREE.LineSegments(g, new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        vertexShader: threadVertex, fragmentShader: threadFragment, uniforms: this.uniforms,
      }));
      this.threads.frustumCulled = false;
      this.group.add(this.threads);
    }
    return box;
  }

  private ghosts: THREE.Mesh[] = [];
  private uncut: { mesh: THREE.Mesh; minY: number }[] = [];
  private threads?: THREE.LineSegments;
  private cutMaterials = new Set<THREE.Material>();
  private originalCompile = new Map<THREE.Material, THREE.Material["onBeforeCompile"]>();

  /* После интро срез больше не нужен, а discard в шейдере отключает раннюю проверку глубины
     у реквизита на всю сессию. Возвращаем материалам исходную сборку и убираем каркас. */
  detachProps() {
    for (const [m, prev] of this.originalCompile) {
      m.onBeforeCompile = prev;
      m.needsUpdate = true;
    }
    this.originalCompile.clear();
    this.cutMaterials.clear();
    for (const g of this.ghosts) g.removeFromParent();
    this.ghosts = [];
    for (const u of this.uncut) u.mesh.visible = true;
    this.uncut = [];
  }

  private addCut(m: THREE.Material) {
    if (this.cutMaterials.has(m)) return;
    this.cutMaterials.add(m);
    const cut = this.cutUniform;
    const prev = m.onBeforeCompile;
    this.originalCompile.set(m, prev);
    m.onBeforeCompile = (shader, renderer) => {
      prev?.call(m, shader, renderer);
      shader.uniforms.uHoloCut = cut;
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", "#include <common>\nvarying float vHoloY;")
        .replace("#include <project_vertex>", "#include <project_vertex>\nvHoloY = (modelMatrix * vec4(transformed, 1.0)).y;");
      shader.fragmentShader = shader.fragmentShader
        .replace("#include <common>", "#include <common>\nvarying float vHoloY;\nuniform float uHoloCut;")
        .replace("void main() {", "void main() {\n  if (vHoloY > uHoloCut) discard;");
    };
    m.needsUpdate = true;
  }

  set(s: HologramState) {
    const on = s.holo > 0.001;
    this.group.visible = on;
    for (const g of this.ghosts) g.visible = on;
    this.uniforms.uHolo.value = s.holo;
    this.uniforms.uReveal.value = s.reveal;
    this.uniforms.uNet.value = s.net;
    this.uniforms.uWalls.value = s.walls;
    this.cutUniform.value = s.cut;
    for (const u of this.uncut) u.mesh.visible = s.cut > u.minY + 0.02;
  }
}
