import * as THREE from "three";
import { terrainHeight } from "./noise";

/** Light spilling out of the opening, fitted to the same terrain height field.
 * A single transparent mesh keeps the meadow lighting/shadow budget unchanged. */
export class PortalGround {
  private readonly geometry = new THREE.PlaneGeometry(11, 12, 20, 24).rotateX(-Math.PI / 2).translate(0, 0, 4.6);
  private readonly material = new THREE.ShaderMaterial({
    uniforms: { uOpacity: { value: 0 }, uTime: { value: 0 } },
    vertexShader: `varying vec2 vGround;
      void main() { vGround = position.xz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform float uOpacity; uniform float uTime; varying vec2 vGround;
      void main() {
        float z = max(0.0, vGround.y);
        float width = 2.4 + z * 0.24;
        float spread = exp(-pow(abs(vGround.x) / width, 4.0)) * exp(-z * 0.33);
        spread *= smoothstep(-1.2, 0.0, vGround.y) * (1.0 - smoothstep(8.5, 10.5, z));
        float rays = 0.82 + 0.18 * sin(vGround.x * 4.0 + sin(z * 0.7 - uTime * 0.18));
        vec3 light = mix(vec3(1.15, 0.82, 0.32), vec3(0.45, 0.61, 0.20), z / 11.0);
        gl_FragColor = vec4(light, spread * rays * uOpacity * 0.24);
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
    polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1,
  });
  private readonly mesh = new THREE.Mesh(this.geometry, this.material);

  constructor(private readonly group: THREE.Group) {
    this.mesh.renderOrder = 0;
    group.add(this.mesh);
  }

  anchor(time: number, sea: number) {
    this.group.updateMatrixWorld(true);
    const vertices = this.geometry.getAttribute("position");
    const world = new THREE.Vector3();
    for (let i = 0; i < vertices.count; i++) {
      world.set(vertices.getX(i), 0, vertices.getZ(i)).applyMatrix4(this.group.matrixWorld);
      vertices.setY(i, Math.max(sea, terrainHeight(world.x, world.z, time)) - this.group.position.y + 0.045);
    }
    vertices.needsUpdate = true;
    this.geometry.computeBoundingSphere();
  }

  update(time: number, opacity: number) {
    this.material.uniforms.uTime.value = time;
    this.material.uniforms.uOpacity.value = opacity;
  }

  dispose() { this.geometry.dispose(); this.material.dispose(); }
}
