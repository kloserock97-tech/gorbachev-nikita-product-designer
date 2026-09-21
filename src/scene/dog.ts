import * as THREE from "three";
import { clamp01 } from "../lib/math";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { heightAt } from "./terrain";
import { createUmbrellaHat, type UmbrellaHat } from "./umbrellaHat";

/* Собака Никиты — Келли (low-poly-dog, перекрашена под фото) сидит у кресла и живёт головой.

   Позы «Sit» и «Curl» собраны в Blender (tools/blender-build-dog.py). Поверх позы каждый кадр:
   - голова и шея поворачиваются к цели: курсор над холмом → точка под курсором;
     иначе собака то смотрит на зрителя, то оглядывается по сторонам, то на кресло;
   - уши изредка дёргаются, хвост виляет порывами, корпус едва заметно дышит.
   Повороты накладываются вокруг осей собаки, пересчитанных в систему родителя кости,
   поэтому не зависят от того, как в риге ориентированы сами кости.
   Тень и примятая трава — в шейдерах по uDog / uDogDir.

   v24: в дождь на Келли опускается кепка с зонтиком (umbrellaHat.ts) — падает сверху, пружинит
   и раскрывается; кончился дождь — складывается и улетает вверх. В футере (закат) Келли спит
   клубочком на кресле: пересадка — пока кадр размыт, дыхание медленное и глубокое, изредка ухо. */

const BASE = import.meta.env.BASE_URL;
const MODEL_HEIGHT = 3.0; // рост модели в её единицах
const DOG_HEIGHT = 0.5; // рост сидя с головой, м
const SCALE = DOG_HEIGHT / MODEL_HEIGHT;
const SPOT = new THREE.Vector2(-0.78, 0.72); // слева перед креслом, в стороне от столика
const FACING = 0.35; // куда смотрит корпус: чуть к зрителю и к креслу
/* центр клубочка и низ позы «Curl» в единицах модели (из CURL_BOUNDS сборки) */
const CURL_CENTER = new THREE.Vector3(0.62, 0, -0.41);
const CURL_BOTTOM = -0.13;
const BED_TURN = Number(new URLSearchParams(location.search).get("bedturn") ?? -0.6); // клубочек вдоль сиденья
const BED_FORWARD = 0.07;
const BED_SINK = Number(new URLSearchParams(location.search).get("bedsink") ?? 0.05); // подушка проминается

/* ?dog=raw — поза из Blender без поворотов головы, ушей и хвоста (для проверки позы);
   ?dog=sleep — сразу клубочком на кресле, ?dog=rain — сразу в кепке (для кадров) */
const RAW = /[?&]dog=raw/.test(location.search);
const FORCE_SLEEP = /[?&]dog=sleep/.test(location.search);
const FORCE_RAIN = /[?&]dog=rain/.test(location.search);
const UP = new THREE.Vector3(0, 1, 0);
const SIDE = new THREE.Vector3(1, 0, 0);

type Look = { kind: "viewer" | "chair" | "side" | "sky"; until: number; side: number };
type Pose = Map<string, { q: THREE.Quaternion; p: THREE.Vector3 }>;
export type DogState = { rain: boolean; sleep: boolean };

const easeOutBack = (x: number) => { const c = 1.6; return 1 + (c + 1) * (x - 1) ** 3 + c * (x - 1) ** 2; };

export class Dog {
  readonly group = new THREE.Group();
  private bones: Record<string, THREE.Bone | undefined> = {};
  private sitPose: Pose = new Map();
  private curlPose: Pose | null = null;
  private time = 0;
  private look: Look = { kind: "viewer", until: 3, side: 1 };
  private yaw = 0; // текущий поворот головы, рад
  private pitch = 0;
  private wag = 0; // сила виляния, гаснет
  private nextWag = 2;
  private earFlick = 0;
  private earSide = 1;
  private nextEar = 3;
  private target = new THREE.Vector3();
  private tmpQ = new THREE.Quaternion();
  private parentQ = new THREE.Quaternion();
  private axisW = new THREE.Vector3();
  private groupQ = new THREE.Quaternion();
  private invQ = new THREE.Quaternion();
  private localT = new THREE.Vector3();
  private sitY = 0;
  private bed: { pos: THREE.Vector3; yaw: number } | null = null;
  private sleeping = false;
  private umbrella: UmbrellaHat | null = null;
  private hatWant = false;
  private hatClock = 10;
  private hatLevel = 0; // 0 — снята, 1 — надета и раскрыта (для выхода из середины анимации)
  ready = false;

  constructor(
    private uniforms: { uDog: { value: THREE.Vector4 }; uDogDir: { value: THREE.Vector2 } },
    private reduced = false,
  ) {
    this.group.visible = false;
  }

  /** материалы, которые впервые показываются посреди прокрутки или по кнопке погоды — прогреть заранее */
  get warmObjects(): THREE.Object3D[] {
    return this.umbrella ? [this.umbrella.hat] : [];
  }

  async load(loader: GLTFLoader) {
    const gltf = await loader.loadAsync(`${BASE}models/dog.glb`).catch(() => null);
    if (!gltf) return;
    const model = gltf.scene;
    model.scale.setScalar(SCALE);
    model.traverse((o) => {
      const mesh = o as THREE.SkinnedMesh;
      if ((o as THREE.Bone).isBone) this.bones[o.name] = o as THREE.Bone;
      if (!mesh.isMesh) return;
      mesh.frustumCulled = false; // скин двигает вершины за пределы исходной рамки
      mesh.receiveShadow = true; // тень кресла ложится и на собаку
      const m = mesh.material as THREE.MeshStandardMaterial;
      if (m) { m.roughness = 0.9; m.metalness = 0; m.envMapIntensity = 0.8; }
    });
    this.group.add(model);

    /* Позы статичные: миксер нужен один раз — снимаем кватернионы и смещения костей обеих поз,
       дальше каждый кадр кости возвращаются к запомненной позе и повороты накладываются заново */
    const mixer = new THREE.AnimationMixer(model);
    const capture = (clip: THREE.AnimationClip | undefined): Pose | null => {
      if (!clip) return null;
      const action = mixer.clipAction(clip);
      action.play();
      mixer.update(0);
      const pose: Pose = new Map();
      for (const [name, bone] of Object.entries(this.bones)) if (bone) pose.set(name, { q: bone.quaternion.clone(), p: bone.position.clone() });
      action.stop();
      return pose;
    };
    this.curlPose = capture(gltf.animations.find((a) => /curl/i.test(a.name)));
    this.sitPose = capture(gltf.animations.find((a) => /sit/i.test(a.name)) ?? gltf.animations[0]) ?? new Map();
    mixer.stopAllAction();
    mixer.uncacheRoot(model);
    this.applyPose(this.sitPose);

    this.sitY = heightAt(SPOT.x, SPOT.y);
    this.placeSit();
    this.group.visible = true;
    this.attachHat();
    this.ready = true;
  }

  /** место для сна — сиденье кресла (мировая точка) и направление к зрителю */
  setBed(seat: THREE.Vector3, towards: THREE.Vector3) {
    /* клубочек открыт левым боком к зрителю: локальная +X модели смотрит на камеру */
    const yaw = Math.atan2(-(towards.z - seat.z), towards.x - seat.x) + BED_TURN;
    /* лучи ловят и заднюю подушку у спинки — центр сиденья сдвигаем к переднему краю */
    const toward = this.localT.set(towards.x - seat.x, 0, towards.z - seat.z).normalize();
    this.bed = { pos: seat.clone().addScaledVector(toward, BED_FORWARD), yaw };
  }

  /** голова в мире — для подписи «z z z» над спящей Келли */
  headWorld(out: THREE.Vector3) {
    const head = this.bones["Cabeça"];
    if (!head || !this.ready) return null;
    return head.getWorldPosition(out);
  }
  get isSleeping() {
    return this.sleeping;
  }

  private placeSit() {
    this.group.position.set(SPOT.x, this.sitY - 0.012, SPOT.y);
    this.group.rotation.y = FACING;
    this.uniforms.uDog.value.set(SPOT.x, this.sitY, SPOT.y, 1);
    this.uniforms.uDogDir.value.set(Math.sin(FACING), Math.cos(FACING));
  }

  private placeBed() {
    const bed = this.bed!;
    this.group.rotation.y = bed.yaw;
    /* центр клубочка — в центр сиденья; низ позы — на подушку, с лёгким проседанием */
    const c = this.localT.copy(CURL_CENTER).multiplyScalar(SCALE).applyAxisAngle(UP, bed.yaw);
    this.group.position.set(bed.pos.x - c.x, bed.pos.y - CURL_BOTTOM * SCALE - BED_SINK, bed.pos.z - c.z);
    /* на кресле трава не примята и тени на склоне нет */
    this.uniforms.uDog.value.w = 0;
  }

  private applyPose(pose: Pose) {
    for (const [name, v] of pose) {
      const b = this.bones[name];
      if (!b) continue;
      b.quaternion.copy(v.q);
      b.position.copy(v.p);
    }
  }

  /* кепка крепится к кости головы в позе «Sit»: над макушкой, козырёк — по направлению морды */
  private attachHat() {
    const head = this.bones["Cabeça"], snout = this.bones["Focinho"];
    if (!head || !snout) return;
    this.group.updateMatrixWorld(true);
    const h = head.getWorldPosition(new THREE.Vector3());
    const s = snout.getWorldPosition(new THREE.Vector3());
    const fwd = s.clone().sub(h).setY(0).normalize();
    const right = new THREE.Vector3().crossVectors(UP, fwd).normalize();
    const u = createUmbrellaHat();
    u.hat.position.copy(h).lerp(s, 0.4).addScaledVector(UP, 0.04);
    u.hat.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(right, UP, fwd));
    u.hat.updateMatrixWorld(true);
    head.attach(u.hat);
    this.umbrella = u;
  }

  /** cursor — точка на холме под курсором (или null), camera — позиция камеры */
  update(dt: number, cursor: THREE.Vector3 | null, camera: THREE.Vector3, state: DogState) {
    if (!this.ready) return;
    this.time += dt;
    const sleep = (state.sleep || FORCE_SLEEP) && !!this.curlPose && !!this.bed;
    if (sleep !== this.sleeping) {
      this.sleeping = sleep;
      if (sleep) this.placeBed();
      else this.placeSit();
    }
    this.applyPose(sleep ? this.curlPose! : this.sitPose);
    const model = this.group.children[0];
    model.updateMatrixWorld(true);
    this.group.getWorldQuaternion(this.groupQ);
    this.updateHat(dt, (state.rain || FORCE_RAIN) && !sleep);
    if (RAW) return;
    if (sleep) return this.sleepMotion(dt);

    /* куда смотреть */
    if (cursor) this.target.copy(cursor);
    else {
      if (this.time > this.look.until) this.pickLook();
      const p = this.group.position;
      if (this.look.kind === "viewer") this.target.copy(camera);
      else if (this.look.kind === "chair") this.target.set(0, p.y + 0.5, 0);
      else if (this.look.kind === "sky") this.target.set(p.x + this.look.side * 2, p.y + 3, p.z - 3);
      else this.target.set(p.x + this.look.side * 4, p.y + 0.2, p.z + 1.5);
    }
    const local = this.group.worldToLocal(this.localT.copy(this.target));
    const wantYaw = THREE.MathUtils.clamp(Math.atan2(local.x, local.z), -1.25, 1.25);
    const wantPitch = THREE.MathUtils.clamp(Math.atan2(local.y - 0.45, Math.hypot(local.x, local.z)) * 0.6, -0.35, 0.45);
    const speed = cursor ? 7 : 3.2;
    const k = 1 - Math.exp(-dt * (this.reduced ? 1.5 : speed));
    this.yaw += (wantYaw - this.yaw) * k;
    this.pitch += (wantPitch - this.pitch) * k;

    this.turn("Pescoço", UP, this.yaw * 0.45);
    this.turn("Cabeça", UP, this.yaw * 0.55);
    this.turn("Cabeça", SIDE, -this.pitch);

    /* дыхание */
    this.turn("Coluna_03", SIDE, Math.sin(this.time * 2.4) * 0.018);

    /* хвост: порывы виляния; чаще, когда на собаку смотрят курсором */
    this.nextWag -= dt * (cursor ? 2.5 : 1);
    if (this.nextWag <= 0) { this.wag = 1; this.nextWag = 3 + Math.random() * 6; }
    this.wag = Math.max(0, this.wag - dt * 0.45);
    const w = Math.sin(this.time * 13) * 0.45 * this.wag * this.wag;
    this.turn("Rabo_01", UP, w);
    this.turn("Rabo_02", UP, w * 1.3);

    this.flickEar(dt, 2.5, 5);
  }

  /* сон: медленный глубокий вдох, голова чуть приподнимается на вдохе, изредка ухо и кончик хвоста */
  private sleepMotion(dt: number) {
    const breath = Math.sin(this.time * 1.25);
    const amp = this.reduced ? 0.4 : 1;
    this.turn("Coluna_02", SIDE, breath * 0.03 * amp);
    this.turn("Coluna_03", SIDE, breath * 0.025 * amp);
    this.turn("Pescoço", SIDE, -breath * 0.02 * amp);
    this.turn("Rabo_02", UP, Math.sin(this.time * 0.7) * 0.05 * amp);
    this.flickEar(dt, 6, 8);
  }

  private flickEar(dt: number, base: number, spread: number) {
    this.nextEar -= dt;
    if (this.nextEar <= 0) { this.earFlick = 1; this.earSide = Math.random() < 0.5 ? 1 : -1; this.nextEar = base + Math.random() * spread; }
    this.earFlick = Math.max(0, this.earFlick - dt * 3.2);
    const flick = Math.sin((1 - this.earFlick) * Math.PI * 2) * this.earFlick * 0.35;
    this.turn(this.earSide > 0 ? "Orelha_L" : "Orelha_R", SIDE, flick);
  }

  /* Кепка: надеть — падает сверху с пружиной, зонтик раскрывается с перелётом и медленно крутится;
     снять — зонтик складывается, кепка подпрыгивает и улетает вверх, уменьшаясь */
  private updateHat(dt: number, want: boolean) {
    const u = this.umbrella;
    if (!u) return;
    if (want !== this.hatWant) {
      this.hatWant = want;
      this.hatClock = 0;
    }
    this.hatClock += dt;
    const t = this.hatClock;
    const { hat, rig, canopy } = u;
    if (want) {
      if (this.reduced) {
        const k = clamp01(t / 0.5);
        hat.visible = true;
        rig.position.y = 0;
        rig.scale.setScalar(Math.max(0.01, k));
        canopy.scale.set(1, 1, 1);
        this.hatLevel = k;
      } else {
        /* затухающая пружина: с 18 см вниз, провал в макушку гасим — кепка не проваливается в голову */
        const y = 0.18 * Math.exp(-6.5 * t) * Math.cos(10.5 * t);
        rig.position.y = y < 0 ? y * 0.25 : y;
        rig.scale.setScalar(0.55 + 0.45 * clamp01(t * 3.5));
        const open = easeOutBack(clamp01((t - 0.22) / 0.55));
        canopy.scale.set(Math.max(0.08, open), 0.55 + 0.45 * Math.min(1, open), Math.max(0.08, open));
        hat.visible = true;
        this.hatLevel = clamp01(t / 0.8);
      }
      canopy.rotation.y += dt * (0.5 + 5 * Math.max(0, 1 - t * 1.4));
      rig.rotation.z = Math.sin(this.time * 1.7) * 0.05;
    } else if (hat.visible) {
      const from = this.hatLevel;
      const k = clamp01(t / 0.6);
      if (this.reduced || from < 0.2) {
        rig.scale.setScalar(Math.max(0.01, (1 - k) * Math.max(from, 0.2)));
      } else {
        const close = clamp01(t / 0.25);
        canopy.scale.set(Math.max(0.08, 1 - close * 0.9), 1 - close * 0.3, Math.max(0.08, 1 - close * 0.9));
        const lift = clamp01((t - 0.15) / 0.45);
        rig.position.y = -0.012 * Math.sin(clamp01(t / 0.15) * Math.PI) + 0.35 * lift * lift;
        rig.scale.setScalar(Math.max(0.01, 1 - lift));
        canopy.rotation.y += dt * 4;
      }
      if (k >= 1) { hat.visible = false; this.hatLevel = 0; }
    }
  }

  private pickLook() {
    const r = Math.random();
    const kind: Look["kind"] = r < 0.45 ? "viewer" : r < 0.65 ? "chair" : r < 0.9 ? "side" : "sky";
    this.look = { kind, until: this.time + 1.8 + Math.random() * 3.5, side: Math.random() < 0.5 ? -1 : 1 };
  }

  /* поворот кости на angle вокруг оси собаки (в её системе) — пересчёт в систему родителя кости */
  private turn(name: string, axisDog: THREE.Vector3, angle: number) {
    const bone = this.bones[name];
    if (!bone || !bone.parent || Math.abs(angle) < 1e-5) return;
    bone.parent.getWorldQuaternion(this.parentQ);
    this.axisW.copy(axisDog).applyQuaternion(this.groupQ);
    this.tmpQ.setFromAxisAngle(this.axisW, angle);
    /* local' = parent⁻¹ · R · parent · local */
    this.invQ.copy(this.parentQ).invert();
    this.tmpQ.premultiply(this.invQ).multiply(this.parentQ);
    bone.quaternion.premultiply(this.tmpQ);
    bone.updateMatrixWorld(true);
  }
}
