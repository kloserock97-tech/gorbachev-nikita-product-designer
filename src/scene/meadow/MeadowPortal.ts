import * as THREE from "three";
import { terrainHeight } from "./noise";
import { PortalGarden, portalOutline } from "./PortalGarden";
import { PortalGround } from "./PortalGround";

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
  private progress = 0;
  private readonly plane = new THREE.PlaneGeometry(WIDTH + 2, HEIGHT + 2);
  private readonly outline = portalOutline(WIDTH - 0.18, HEIGHT - 0.18, RADIUS - 0.09);
  private readonly garden: PortalGarden;
  private readonly ground: PortalGround;
  private readonly window = new THREE.ShaderMaterial({
    uniforms: { tDestination: { value: null as THREE.Texture | null }, uOpacity: { value: 0 }, uTime: { value: 0 }, uProgress: { value: 0 } },
    vertexShader: `varying vec4 vClip; varying vec2 vLocal;
      void main() { vLocal = position.xy;
        vClip = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = vClip; }`,
    fragmentShader: `uniform sampler2D tDestination; uniform float uOpacity; uniform float uTime; uniform float uProgress;
      varying vec4 vClip; varying vec2 vLocal;
      void main() {
        vec2 q = abs(vLocal) - vec2(${WIDTH / 2 - RADIUS}, ${HEIGHT / 2 - RADIUS});
        float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - ${RADIUS};
        d += sin(vLocal.y * 12.0 + sin(vLocal.x * 9.0)) * 0.022
          + sin(vLocal.x * 17.0 + vLocal.y * 8.0 + uTime * 0.45) * 0.012;
        float aa = max(fwidth(d), 0.006);
        float inside = 1.0 - smoothstep(-aa, aa, d);
        float pulse = 0.7 + 0.3 * sin(vLocal.y * 4.0 - vLocal.x * 2.0 - uTime * 0.9);
        float rim = exp(-abs(d) * 20.0) * pulse;
        float halo = exp(-abs(d) * 5.0) * 0.22;
        vec3 light = mix(vec3(0.48, 1.1, 0.25), vec3(1.6, 1.3, 0.55), pulse);
        vec2 uv = vClip.xy / vClip.w * 0.5 + 0.5;
        float membrane = exp(-abs(d) * 6.0) * (1.0 - smoothstep(0.5, 0.8, uProgress));
        uv += vec2(sin(vLocal.y * 9.0 + uTime * 0.65), cos(vLocal.x * 8.0 - uTime * 0.4)) * 0.002 * membrane;
        vec3 destination = texture2D(tDestination, uv).rgb;
        vec3 col = mix(light * (rim + halo), destination + light * rim * 0.16, inside);
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
    this.garden = new PortalGarden(this.group, WIDTH, HEIGHT, RADIUS);
    this.ground = new PortalGround(this.group);
    this.group.visible = false;
    scene.add(this.group);
  }

  setDestination(texture: THREE.Texture) { this.window.uniforms.tDestination.value = texture; }
  setSize(height: number, dpr: number) { this.garden.setSize(height, dpr); }

  update(camera: THREE.PerspectiveCamera, progress: number, time: number, sea: number, windTime: number) {
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
    this.garden.update(windTime, appear, progress);
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
    camera.position.y = Math.max(camera.position.y, sea + 1.2,
      terrainHeight(camera.position.x, camera.position.z, time) + 1.2);
    this.matrix.lookAt(camera.position, this.group.position, camera.up);
    this.targetRotation.setFromRotationMatrix(this.matrix);
    camera.quaternion.slerpQuaternions(this.startRotation, this.targetRotation, smooth(0, 0.18, progress));
    camera.updateMatrixWorld();
    this.group.updateMatrixWorld(true);
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
    this.garden.dispose(); this.ground.dispose(); this.plane.dispose(); this.window.dispose();
  }
}
