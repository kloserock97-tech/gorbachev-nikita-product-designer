/* v72: одинокое дерево на правом плече холма — для глубины первого экрана. Крона встаёт над гребнем между
   креслом и карточкой проектов, солнце у неё за спиной: край кроны светится на просвет, а в просветах листвы
   видно небо, и лучи идут прямо сквозь неё.

   Всё процедурное, из одного зерна, как луг: скелет ветвей, кора из конических сегментов, листва — пучки
   карточек с текстурой листьев, нарисованной на холсте при запуске. Ни модели, ни картинки грузить не нужно,
   и ничьих ассетов в нём нет. Свет, воздух и ветер — те же функции, что у травы (shaders.ts, barkFragment и
   leafFragment), поэтому дерево стоит в той же погоде, что и холм. */
import * as THREE from "three";
import { makeRng } from "./terrain";
import { barkFragment, barkVertex, leafFragment, leafVertex } from "./shaders";

type V = THREE.Vector3;
type Limb = { pts: V[]; rad: number[] };

const UP = new THREE.Vector3(0, 1, 0);

/* Текстура пучка: полсотни листьев от середины наружу и тонкие черешки. R — яркость листа, G — тон
   (жёлтый или оливковый), A — форма. Мипмапы строит видеокарта, край заостряет шейдер */
function leafTexture(rng: () => number): THREE.Texture {
  const S = 256;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const g = c.getContext("2d")!;
  g.clearRect(0, 0, S, S);
  g.lineCap = "round";
  for (let i = 0; i < 7; i++) {
    const a = rng() * Math.PI * 2;
    g.strokeStyle = "rgba(90,60,40,1)";
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(S / 2, S / 2);
    g.lineTo(S / 2 + Math.cos(a) * S * 0.36, S / 2 + Math.sin(a) * S * 0.36);
    g.stroke();
  }
  for (let i = 0; i < 120; i++) {
    const ang = rng() * Math.PI * 2;
    const r = Math.sqrt(rng()) * S * 0.38;
    const x = S / 2 + Math.cos(ang) * r, y = S / 2 + Math.sin(ang) * r;
    const len = S * (0.05 + rng() * 0.035), wid = len * (0.45 + rng() * 0.15);
    const rot = ang + (rng() - 0.5) * 1.2;
    const bright = Math.round(150 + rng() * 105), tone = Math.round(rng() * 255);
    g.save();
    g.translate(x, y);
    g.rotate(rot);
    g.fillStyle = `rgba(${bright},${tone},0,1)`;
    g.beginPath();
    g.moveTo(-len / 2, 0);
    g.quadraticCurveTo(0, -wid, len / 2, 0);
    g.quadraticCurveTo(0, wid, -len / 2, 0);
    g.fill();
    g.restore();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.NoColorSpace; // каналы — данные, не цвет
  t.anisotropy = 4;
  return t;
}

export type TreeOptions = { base: V; height: number; lean: V; seed?: number; msaa: boolean };

export function createTree(uniforms: Record<string, THREE.IUniform>, o: TreeOptions) {
  const rng = makeRng(o.seed ?? 0x51a7e);
  const limbs: Limb[] = [];
  const clusters: { p: V; d: V }[] = [];
  const MAX = 4;
  /* чистый ствол почти до середины: крона поднята над креслом с компьютером, а не лежит на них */
  const trunkLen = o.height * 0.44;
  const tropism = o.lean.clone().add(UP).normalize();
  /* Оболочка кроны — сплюснутый шар над стволом, как у дуба на открытом месте. Точка ветви за её пределами
     мягко подтягивается внутрь: без этого ведущий побег уходил пикой вверх, до самого меню, а крона
     разваливалась на отдельные клочья, как у акации */
  const envC = new THREE.Vector3(o.lean.x * o.height * 0.25, o.height * 0.66, o.lean.z * o.height * 0.25);
  const envR = new THREE.Vector3(o.height * 0.44, o.height * 0.33, o.height * 0.4);
  const inCrown = (p: V) => {
    const q = p.clone().sub(envC);
    const e = Math.sqrt((q.x / envR.x) ** 2 + (q.y / envR.y) ** 2 + (q.z / envR.z) ** 2);
    if (e > 1) p.copy(envC).addScaledVector(q, (1 + (e - 1) * 0.12) / e);
    return p;
  };

  /* ветвь: несколько изогнутых сегментов, дочерние ветви — по спирали с золотым углом, ведущий побег
     продолжает ствол под малым углом; ветви клонятся к свету (tropism), тонкие провисают и несут листву */
  const grow = (start: V, dir: V, len: number, r: number, depth: number) => {
    const n = depth === 0 ? 4 : 3;
    const pts: V[] = [start.clone()];
    const rad: number[] = [r];
    let d = dir.clone();
    for (let i = 0; i < n; i++) {
      const jitter = new THREE.Vector3(rng() - 0.5, (rng() - 0.5) * 0.4, rng() - 0.5).multiplyScalar(depth === 0 ? 0.22 : 0.5);
      d = d.add(jitter).lerp(tropism, depth === 0 ? 0.12 : 0.1).normalize();
      if (depth >= 3) d.y -= 0.12 * (rng() * 0.6 + 0.4);
      d.normalize();
      const next = pts[i].clone().addScaledVector(d, len / n);
      pts.push(depth > 0 ? inCrown(next) : next);
      rad.push(r * (1 - ((i + 1) / n) * 0.42));
    }
    limbs.push({ pts, rad });
    if (depth >= MAX - 1) {
      for (let i = Math.floor(n / 2); i <= n; i++) clusters.push({ p: pts[i].clone(), d: d.clone() });
      if (depth >= MAX) return;
    }
    const kids = depth === 0 ? 4 : 2 + (rng() < 0.55 ? 1 : 0);
    let az = rng() * Math.PI * 2;
    for (let k = 0; k < kids; k++) {
      const leader = k === 0;
      const t = leader ? 1 : (depth === 0 ? 0.72 : 0.35) + rng() * (depth === 0 ? 0.28 : 0.6);
      const at = Math.min(n - 1e-3, t * n);
      const i = Math.floor(at), f = at - i;
      const p = pts[i].clone().lerp(pts[i + 1], f);
      const rAt = rad[i] + (rad[i + 1] - rad[i]) * f;
      az += 2.39996; // золотой угол
      const angle = leader ? 0.25 + rng() * 0.2 : 0.65 + rng() * 0.45;
      const side = new THREE.Vector3(Math.cos(az), 0, Math.sin(az));
      side.addScaledVector(d, -side.dot(d)).normalize();
      const cd = d.clone().multiplyScalar(Math.cos(angle)).addScaledVector(side, Math.sin(angle)).normalize();
      const cl = len * (leader ? 0.62 : 0.58 + rng() * 0.16);
      /* Ведущий побег продолжает ствол той же толщины, что у его конца: раньше он начинался на пятую часть
         тоньше, и на стыке была ступенька с открытым торцом — ствол выглядел сломанным. Основание любой ветви
         утоплено в родительскую на её радиус, чтобы при изгибе в стыке не просвечивала щель */
      const r0 = Math.max(0.012, rAt * (leader ? 1 : 0.62));
      grow(p.clone().addScaledVector(cd, -rAt * 0.8), cd, cl + rAt * 0.8, r0, depth + 1);
    }
  };
  grow(new THREE.Vector3(0, -0.4, 0), o.lean.clone().multiplyScalar(0.35).add(UP).normalize(), trunkLen + 0.4, o.height * 0.036, 0);

  /* кора: каждая ветвь — одна трубка по своим точкам. Отдельные конусы на каждый отрезок давали на стыках
     светлые кольца (торцы разного радиуса ловили контровой свет). Кольца ориентируются по средней касательной,
     опорный вектор — один на ветвь, чтобы трубка не перекручивалась. Ветки тоньше 1.5 см с двадцати метров не
     видны — у них только листва */
  const bp: number[] = [], bn: number[] = [], bi: number[] = [];
  for (const { pts, rad } of limbs) {
    if (rad[0] < 0.015) continue;
    const k = rad[0] > 0.06 ? 9 : 5;
    const dir0 = new THREE.Vector3().subVectors(pts[pts.length - 1], pts[0]).normalize();
    const ref = Math.abs(dir0.y) < 0.9 ? UP : new THREE.Vector3(1, 0, 0);
    const base = bp.length / 3;
    for (let i = 0; i < pts.length; i++) {
      const tan = new THREE.Vector3().subVectors(pts[Math.min(i + 1, pts.length - 1)], pts[Math.max(i - 1, 0)]).normalize();
      const u = new THREE.Vector3().crossVectors(tan, ref).normalize();
      const v = new THREE.Vector3().crossVectors(tan, u);
      /* у самого основания ствол расширяется к корням */
      const r = rad[i] * (limbs[0].pts === pts && i === 0 ? 1.35 : 1);
      for (let j = 0; j < k; j++) {
        const t = (j / k) * Math.PI * 2;
        const cs = Math.cos(t), sn = Math.sin(t);
        const nx = u.x * cs + v.x * sn, ny = u.y * cs + v.y * sn, nz = u.z * cs + v.z * sn;
        bp.push(pts[i].x + nx * r, pts[i].y + ny * r, pts[i].z + nz * r);
        bn.push(nx, ny, nz);
      }
    }
    for (let i = 0; i < pts.length - 1; i++) {
      for (let j = 0; j < k; j++) {
        const a = base + i * k + j, b = base + i * k + ((j + 1) % k), c2 = a + k, d2 = b + k;
        bi.push(a, b, c2, b, d2, c2);
      }
    }
    /* скруглённый торец: у тонкой ветви конец спрятан в листве, но открытая труба на просвет читалась дырой */
    const n = pts.length;
    const tip = new THREE.Vector3().subVectors(pts[n - 1], pts[n - 2]).normalize();
    const cap = pts[n - 1].clone().addScaledVector(tip, rad[n - 1] * 0.7);
    const ci = bp.length / 3;
    bp.push(cap.x, cap.y, cap.z);
    bn.push(tip.x, tip.y, tip.z);
    const last = base + (n - 1) * k;
    for (let j = 0; j < k; j++) bi.push(last + j, last + ((j + 1) % k), ci);
  }
  const barkGeo = new THREE.BufferGeometry();
  barkGeo.setAttribute("position", new THREE.Float32BufferAttribute(bp, 3));
  barkGeo.setAttribute("normal", new THREE.Float32BufferAttribute(bn, 3));
  barkGeo.setIndex(bi);
  barkGeo.computeBoundingSphere();

  /* крона: центр и радиус — по пучкам */
  const crown = new THREE.Vector3();
  clusters.forEach((c) => crown.add(c.p));
  crown.divideScalar(Math.max(1, clusters.length));
  let crownR = 0;
  clusters.forEach((c) => (crownR = Math.max(crownR, c.p.distanceTo(crown))));
  /* подбивка: часть пучков повторяется ближе к центру кроны — иначе сквозь неё просвечивало небо целыми
     окнами и крона читалась ворохом веток, а не массой листвы */
  for (const c of clusters.slice()) if (rng() < 0.6) clusters.push({ p: c.p.clone().lerp(crown, 0.3 + rng() * 0.35), d: c.d.clone() });

  /* листва: в каждом пучке 3–4 карточки со случайным наклоном */
  const lp: number[] = [], luv: number[] = [], lc: number[] = [], ll: number[] = [], li: number[] = [];
  const q = new THREE.Quaternion(), e = new THREE.Euler();
  const corner = [[-0.5, -0.5, 0, 0], [0.5, -0.5, 1, 0], [0.5, 0.5, 1, 1], [-0.5, 0.5, 0, 1]];
  for (const c of clusters) {
    const depth = THREE.MathUtils.clamp(c.p.distanceTo(crown) / Math.max(crownR, 1e-3), 0, 1);
    const cards = 5 + (rng() < 0.5 ? 1 : 0);
    for (let k = 0; k < cards; k++) {
      const size = o.height * (0.09 + rng() * 0.045);
      const center = c.p.clone().add(new THREE.Vector3(rng() - 0.5, rng() - 0.5, rng() - 0.5).multiplyScalar(size * 0.7));
      e.set((rng() - 0.5) * Math.PI, rng() * Math.PI * 2, (rng() - 0.5) * Math.PI);
      q.setFromEuler(e);
      const rnd = rng();
      const base = lp.length / 3;
      for (const [x, y, uu, vv] of corner) {
        const p = new THREE.Vector3(x * size, y * size, 0).applyQuaternion(q).add(center);
        lp.push(p.x, p.y, p.z);
        luv.push(uu, vv);
        lc.push(c.p.x, c.p.y, c.p.z);
        ll.push(rnd, depth);
      }
      li.push(base, base + 1, base + 2, base, base + 2, base + 3);
    }
  }
  const leafGeo = new THREE.BufferGeometry();
  leafGeo.setAttribute("position", new THREE.Float32BufferAttribute(lp, 3));
  leafGeo.setAttribute("uv", new THREE.Float32BufferAttribute(luv, 2));
  leafGeo.setAttribute("aCluster", new THREE.Float32BufferAttribute(lc, 3));
  leafGeo.setAttribute("aLeaf", new THREE.Float32BufferAttribute(ll, 2));
  leafGeo.setIndex(li);
  leafGeo.computeBoundingSphere();

  const shared = { ...uniforms, uTreeBase: { value: o.base.clone() }, uTreeH: { value: o.height } };
  const bark = new THREE.Mesh(barkGeo, new THREE.ShaderMaterial({ vertexShader: barkVertex, fragmentShader: barkFragment, uniforms: shared }));
  const leafMat = new THREE.ShaderMaterial({
    vertexShader: leafVertex,
    fragmentShader: leafFragment,
    side: THREE.DoubleSide,
    uniforms: { ...shared, uCrown: { value: crown }, uLeafTex: { value: leafTexture(rng) }, uA2C: { value: o.msaa ? 1 : 0 } },
  });
  leafMat.alphaToCoverage = true;
  const leaves = new THREE.Mesh(leafGeo, leafMat);
  const group = new THREE.Group();
  group.name = "tree";
  group.position.copy(o.base);
  group.add(bark, leaves);
  /* после травы: ранний тест глубины отсекает закрытое гребнем */
  bark.renderOrder = 2;
  leaves.renderOrder = 3;
  return {
    group,
    /** поставить на склон: x, z — точка у земли, y — её высота, s — масштаб (форма та же) */
    place(x: number, y: number, z: number, s: number) {
      group.position.set(x, y, z);
      group.scale.setScalar(s);
      (shared.uTreeBase.value as THREE.Vector3).set(x, y, z);
    },
    /** MSAA на ступени качества: без него край листа — альфа-тест, с ним — покрытие */
    setMsaa(on: boolean) { leafMat.uniforms.uA2C.value = on ? 1 : 0; },
    stats: { limbs: limbs.length, clusters: clusters.length, cards: li.length / 6, barkTris: bi.length / 3 },
  };
}
