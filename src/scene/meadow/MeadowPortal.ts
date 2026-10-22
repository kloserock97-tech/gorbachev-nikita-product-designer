import * as THREE from "three";
import { terrainHeight } from "./noise";
import { PortalGarden, portalOutline } from "./PortalGarden";
import { PortalGround } from "./PortalGround";
import { PortalRing, RING_IN } from "./PortalRing";

/* v113 (Никита, по мотивам портала igloo.inc): вместо проёма в плюще — кольцо из расколотых кирпичей (PortalRing.ts),
   окно круглое, у кромки — бегущие кольца «силового поля». ?portal=ivy — прежний проём */
const IVY = typeof location !== "undefined" && /[?&]portal=ivy/.test(location.search);
const R = RING_IN - 0.06;
const ZERO = new THREE.Vector2();
function circleOutline(radius: number, steps = 64) {
  /* по часовой, как portalOutline: clip() проверяет обход */
  return Array.from({ length: steps }, (_, i) => { const a = Math.PI / 2 - (i / steps) * Math.PI * 2; return new THREE.Vector3(Math.cos(a) * radius, Math.sin(a) * radius, 0.02); });
}

const WIDTH = 5.2;
const HEIGHT = 8;
const RADIUS = 0.85;
const smooth = (a: number, b: number, x: number) => THREE.MathUtils.smoothstep(x, a, b);

/** A doorway in meadow world space. Its window samples the live destination in
 * screen space, so the last portal frame and the first footer frame coincide. */
export class MeadowPortal {
  readonly group = new THREE.Group();
  private readonly start = new THREE.Vector3();
  private readonly startRotation = new THREE.Quaternion();
  private readonly normal = new THREE.Vector3();
  private readonly right = new THREE.Vector3();
  private readonly end = new THREE.Vector3();
  private readonly targetRotation = new THREE.Quaternion();
  private readonly matrix = new THREE.Matrix4();
  private readonly point = new THREE.Vector3();
  private anchored = false;
  private readonly mouse = new THREE.Vector2();
  private progress = 0;
  private readonly plane = new THREE.PlaneGeometry(WIDTH + 2, HEIGHT + 2);
  private readonly outline = IVY ? portalOutline(WIDTH - 0.18, HEIGHT - 0.18, RADIUS - 0.09) : circleOutline(R - 0.1);
  private readonly garden: PortalGarden | null;
  private readonly ring: PortalRing | null;
  private readonly ground: PortalGround;
  private readonly window = new THREE.ShaderMaterial({
    uniforms: { tDestination: { value: null as THREE.Texture | null }, uOpacity: { value: 0 }, uTime: { value: 0 }, uProgress: { value: 0 },
      uCenter: { value: new THREE.Vector2(0.5, 0.5) }, uAspect: { value: 1 } },
    vertexShader: `varying vec4 vClip; varying vec2 vLocal;
      void main() { vLocal = position.xy;
        vClip = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = vClip; }`,
    fragmentShader: `uniform sampler2D tDestination; uniform float uOpacity; uniform float uTime; uniform float uProgress;
      uniform vec2 uCenter; uniform float uAspect;
      varying vec4 vClip; varying vec2 vLocal;
      void main() {
        ${IVY ? `vec2 q = abs(vLocal) - vec2(${WIDTH / 2 - RADIUS}, ${HEIGHT / 2 - RADIUS});
        float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - ${RADIUS};
        d += sin(vLocal.y * 12.0 + sin(vLocal.x * 9.0)) * 0.022
          + sin(vLocal.x * 17.0 + vLocal.y * 8.0 + uTime * 0.45) * 0.012;` : `float d = length(vLocal) - ${R.toFixed(3)};`}
        float aa = max(fwidth(d), 0.006);
        float inside = 1.0 - smoothstep(-aa, aa, d);
        float pulse = 0.7 + 0.3 * sin(vLocal.y * 4.0 - vLocal.x * 2.0 - uTime * 0.9);
        float rim = exp(-abs(d) * 20.0) * pulse;
        float halo = exp(-abs(d) * 5.0) * 0.22;
        vec3 light = ${IVY ? "mix(vec3(0.48, 1.1, 0.25), vec3(1.6, 1.3, 0.55), pulse)" : "mix(vec3(1.05, 0.95, 0.8), vec3(1.5, 1.25, 0.85), pulse)"};
        vec2 uv = vClip.xy / vClip.w * 0.5 + 0.5;
        float membrane = exp(-abs(d) * 6.0) * (1.0 - smoothstep(0.5, 0.8, uProgress));
        uv += vec2(sin(vLocal.y * 9.0 + uTime * 0.65), cos(vLocal.x * 8.0 - uTime * 0.4)) * 0.002 * membrane;
        ${IVY ? "" : `/* v121: у кромки картинку чуть затягивает внутрь и закручивает — воздух уходит в окно. К входу гаснет:
           последний кадр портала совпадает с подвалом */
        float pull = exp(min(d, 0.0) * 2.2) * (1.0 - smoothstep(0.55, 0.85, uProgress));
        vec2 o = (uv - uCenter) * vec2(uAspect, 1.0);
        float tw = pull * (0.07 + 0.02 * sin(uTime * 0.9));
        o = mat2(cos(tw), sin(tw), -sin(tw), cos(tw)) * o * (1.0 + pull * 0.05);
        uv = uCenter + o / vec2(uAspect, 1.0);`}
        vec3 destination = texture2D(tDestination, uv).rgb;
        vec3 col = mix(light * (rim + halo), destination + light * rim * 0.16, inside);
        ${IVY ? "" : `/* силовое поле: светлые кольца бегут к центру у кромки и гаснут, пока камера не вошла */
        float field = (0.5 + 0.5 * sin(d * 14.0 + uTime * 2.2)) * exp(d * 1.6) * (1.0 - smoothstep(0.55, 0.85, uProgress));
        col += light * field * inside * 0.08;`}
        gl_FragColor = vec4(col, max(inside, (rim * 0.65 + halo)) * uOpacity);
      }`,
    transparent: true, depthWrite: false, toneMapped: false,
  });

  constructor(scene: THREE.Scene) {
    this.group.name = "Meadow / footer doorway";
    const window = new THREE.Mesh(this.plane, this.window);
    window.position.z = 0.02;
    window.renderOrder = 1;
    this.group.add(window);
    this.garden = IVY ? new PortalGarden(this.group, WIDTH, HEIGHT, RADIUS) : null;
    this.ring = IVY ? null : new PortalRing(this.group, 0);
    this.ground = new PortalGround(this.group);
    this.group.visible = false;
    scene.add(this.group);
  }

  setDestination(texture: THREE.Texture) { this.window.uniforms.tDestination.value = texture; }
  /** v121: куда клонится трава — центр портала на земле (x, z) и сила тяги 0…1; null — портала нет */
  sink(): { x: number; z: number; k: number } | null {
    if (IVY || !this.anchored || !this.group.visible) return null;
    return { x: this.group.position.x, z: this.group.position.z, k: smooth(0.08, 0.35, this.progress) * (1 - smooth(0.85, 0.97, this.progress)) };
  }
  setSize(height: number, dpr: number) { this.garden?.setSize(height, dpr); this.ring?.setSize(height, dpr); }

  update(camera: THREE.PerspectiveCamera, progress: number, time: number, sea: number, windTime: number, pointer?: THREE.Vector2 | null) {
    this.progress = progress;
    if (progress <= 0) {
      this.anchored = false;
      this.group.visible = false;
      return;
    }
    if (!this.anchored) {
      this.anchored = true;
      this.start.copy(camera.position);
      this.startRotation.copy(camera.quaternion);
      camera.getWorldDirection(this.normal);
      this.normal.y = 0;
      this.normal.normalize().negate();
      this.right.set(this.normal.z, 0, -this.normal.x);
      this.group.position.copy(this.start).addScaledVector(this.normal, -26);
      // Discover the opening slightly off-axis, then line up with its threshold.
      this.group.position.addScaledVector(this.right, 1.8 * Math.min(1, camera.aspect));
      const { x, z } = this.group.position;
      this.group.position.y = Math.max(sea, terrainHeight(x, z, time)) + HEIGHT / 2 + 0.1;
      this.group.rotation.y = Math.atan2(this.normal.x, this.normal.z);
      this.end.copy(this.group.position).addScaledVector(this.normal, 0.45);
      this.ground.anchor(time, sea);
    }
    this.group.visible = progress < 1;
    const appear = smooth(0.055, 0.18, progress);
    this.garden?.update(windTime, appear, progress);
    this.ground.update(windTime, appear);
    this.window.uniforms.uTime.value = windTime;
    this.window.uniforms.uOpacity.value = appear;
    this.window.uniforms.uProgress.value = progress;
    // Ease both ends of the exponential dolly: a gentle start and a settled
    // arrival, rather than accelerating into the threshold on the last wheel tick.
    const travel = smooth(0.12, 1, progress);
    const amount = (1 - Math.exp(-4 * travel)) / (1 - Math.exp(-4));
    camera.position.lerpVectors(this.start, this.end, amount);
    camera.position.addScaledVector(this.right, -0.85 * Math.sin(Math.PI * amount) * (1 - amount));
    /* v115 (как у igloo): пока кольцо перед нами, камера чуть обходит его в сторону курсора — кольцо смещается навстречу.
       У самого входа отклик гаснет, чтобы пролёт был прямым */
    if (!IVY) {
      /* своё сглаживание: маршрут луга в портале стоит, и его сглаженный курсор не обновляется */
      this.mouse.lerp(pointer ?? ZERO, 0.06);
      const k = smooth(0.12, 0.3, progress) * (1 - smooth(0.78, 0.92, progress));
      camera.position.addScaledVector(this.right, this.mouse.x * 1.6 * k);
      camera.position.y += this.mouse.y * 0.9 * k;
    }
    camera.position.y = Math.max(camera.position.y, sea + 1.2,
      terrainHeight(camera.position.x, camera.position.z, time) + 1.2);
    this.matrix.lookAt(camera.position, this.group.position, camera.up);
    this.targetRotation.setFromRotationMatrix(this.matrix);
    camera.quaternion.slerpQuaternions(this.startRotation, this.targetRotation, smooth(0, 0.18, progress));
    camera.updateMatrixWorld();
    this.group.updateMatrixWorld(true);
    /* расстояние — после того как портал поставил камеру: луг каждый кадр сначала ставит её на свою дорожку, далеко */
    this.ring?.update(windTime, appear, camera.position.distanceTo(this.group.position));
    this.point.copy(this.group.position).project(camera);
    this.window.uniforms.uCenter.value.set(this.point.x * 0.5 + 0.5, this.point.y * 0.5 + 0.5);
    this.window.uniforms.uAspect.value = camera.aspect;
  }

  /** The real DOM footer follows the rounded opening, inset from its living edge. */
  clip(camera: THREE.PerspectiveCamera): string | null {
    if (!this.anchored || this.progress < 0.2) return null;
    if (this.progress >= 0.98) return "inset(0)";
    const points: string[] = [];
    const corners: [number, number][] = [];
    for (const p of this.outline) {
      this.point.copy(p).applyMatrix4(this.group.matrixWorld).project(camera);
      corners.push([this.point.x, this.point.y]);
      points.push(`${((this.point.x + 1) * 50).toFixed(3)}% ${((1 - this.point.y) * 50).toFixed(3)}%`);
    }
    // Enable contacts as soon as the opening covers the screen, including portrait
    // viewports, where this happens earlier. Clockwise polygon in NDC space.
    const entered = [[-1, 1], [1, 1], [1, -1], [-1, -1]].every(([x, y]) =>
      corners.every(([ax, ay], i) => {
        const [bx, by] = corners[(i + 1) % corners.length];
        return (bx - ax) * (y - ay) - (by - ay) * (x - ax) <= 0;
      }),
    );
    if (entered) return "inset(0)";
    return `polygon(${points.join(",")})`;
  }

  dispose() {
    this.group.removeFromParent();
    this.garden?.dispose(); this.ring?.dispose(); this.ground.dispose(); this.plane.dispose(); this.window.dispose();
  }
}
