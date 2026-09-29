import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/** Clockwise rounded opening, shared by the vegetation and the DOM clip. */
export function portalOutline(width: number, height: number, radius: number, steps = 10) {
  const points: THREE.Vector3[] = [];
  for (const [x, y, angle] of [
    [-width / 2 + radius, height / 2 - radius, Math.PI],
    [width / 2 - radius, height / 2 - radius, Math.PI / 2],
    [width / 2 - radius, -height / 2 + radius, 0],
    [-width / 2 + radius, -height / 2 + radius, -Math.PI / 2],
  ]) {
    for (let i = 0; i <= steps; i++) {
      const a = angle - i / steps * Math.PI / 2;
      points.push(new THREE.Vector3(x + Math.cos(a) * radius, y + Math.sin(a) * radius, 0.02));
    }
  }
  return points;
}

/** Moss, braided roots, hanging ivy and drifting spores. No bitmap assets; the
 * dense vegetation is instanced and the spores animate entirely on the GPU. */
export class PortalGarden {
  private readonly geometries: THREE.BufferGeometry[] = [];
  private readonly meshes: THREE.InstancedMesh[] = [];
  private readonly time = { value: 0 };
  private readonly opacity = { value: 0 };
  private readonly passage = { value: 0 };
  private readonly pixelScale = { value: 1200 };
  private readonly bark = new THREE.MeshStandardMaterial({
    color: "#494632", roughness: 1, emissive: "#514c2c", emissiveIntensity: 0.16, transparent: true,
  });
  private readonly moss = new THREE.MeshStandardMaterial({
    color: "#a9bb72", roughness: 1, emissive: "#78964b", emissiveIntensity: 0.48, transparent: true,
  });
  private readonly leaves = new THREE.MeshStandardMaterial({
    color: "#a4b974", roughness: 0.82, side: THREE.DoubleSide,
    emissive: "#638c43", emissiveIntensity: 0.38, transparent: true,
  });
  private readonly spores = new THREE.ShaderMaterial({
    uniforms: { uTime: this.time, uOpacity: this.opacity, uPixelScale: this.pixelScale, uPassage: this.passage },
    vertexShader: `attribute float aSeed; attribute float aSize; attribute float aDepth;
      uniform float uTime; uniform float uPixelScale; uniform float uPassage;
      varying float vLife; varying float vSeed;
      void main() {
        float t = uTime * (0.075 + aSeed * 0.035) + aSeed * 19.0;
        float life = fract(t);
        vec3 p = position;
        p.x += sin(t * 3.7 + aSeed * 42.0) * 0.19;
        p.y += (life - 0.5) * 1.35;
        p.z += sin(t * 2.8 + aSeed * 21.0) * 0.28;
        vLife = sin(life * 3.141593); vSeed = aSeed;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        vLife *= smoothstep(0.4, 1.8, -mv.z) * (1.0 - aDepth * smoothstep(0.45, 0.8, uPassage));
        gl_Position = projectionMatrix * mv;
        gl_PointSize = clamp(aSize * uPixelScale / max(0.3, -mv.z), 1.0, 42.0);
      }`,
    fragmentShader: `uniform float uOpacity; varying float vLife; varying float vSeed;
      void main() {
        float r = length(gl_PointCoord - 0.5) * 2.0;
        float glow = exp(-r * r * 5.5) * (1.0 - smoothstep(0.65, 1.0, r));
        vec3 col = mix(vec3(0.62, 1.1, 0.32), vec3(2.2, 1.65, 0.68), vSeed);
        gl_FragColor = vec4(col, glow * vLife * uOpacity * 0.8);
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
  });

  constructor(group: THREE.Group, width: number, height: number, radius: number) {
    let seed = 72193;
    const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
    const ring = new THREE.CatmullRomCurve3(portalOutline(width + 0.28, height + 0.28, radius + 0.14), true, "centripetal");
    const roots: THREE.BufferGeometry[] = [];
    const leafPos: { p: THREE.Vector3; scale: number; angle: number }[] = [];
    // Irregular organic structure, with breaks in the moss revealing twisted roots.
    for (let strand = 0; strand < 4; strand++) {
      const path: THREE.Vector3[] = [];
      for (let i = 0; i < 160; i++) {
        const u = i / 160;
        const p = ring.getPointAt(u);
        const phase = u * Math.PI * 16 + strand * 1.7;
        p.x += Math.cos(phase) * (0.08 + strand * 0.02);
        p.y += Math.sin(phase * 0.83) * 0.08;
        p.z = 0.12 + Math.sin(phase) * 0.13;
        path.push(p);
      }
      roots.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(path, true), 240, strand === 0 ? 0.11 : 0.047, 5, true));
    }
    // Vines cascade from the upper arch and wrap around both shoulders.
    for (let i = 0; i < 15; i++) {
      const side = i % 2 ? 1 : -1;
      const x = i < 9 ? (random() - 0.5) * width * 0.9 : side * (width / 2 + 0.2);
      const top = i < 9 ? height / 2 + 0.08 : height / 2 - 0.8 - random() * 2.7;
      const length = i < 9 ? 0.5 + random() ** 2 * 2.1 : 1.0 + random() * 2.6;
      const phase = random() * 6.28;
      const path = Array.from({ length: 13 }, (_, k) => {
        const u = k / 12;
        return new THREE.Vector3(x + Math.sin(u * 5 + phase) * 0.14 * u, top - length * u, 0.28 + Math.sin(u * 4 + phase) * 0.11);
      });
      const vine = new THREE.CatmullRomCurve3(path);
      roots.push(new THREE.TubeGeometry(vine, 24, 0.018 + random() * 0.014, 4, false));
      const count = Math.ceil(length * 9);
      for (let j = 0; j < count; j++) {
        const p = vine.getPoint(j / count);
        leafPos.push({ p, scale: 0.17 + random() * 0.22, angle: (j % 2 ? -1 : 1) * (0.55 + random() * 0.9) + Math.PI });
      }
    }
    const rootGeo = mergeGeometries(roots)!;
    roots.forEach((g) => g.dispose());
    this.geometries.push(rootGeo);
    const rootMesh = new THREE.Mesh(rootGeo, this.bark);
    rootMesh.renderOrder = 2;
    group.add(rootMesh);

    const mossGeo = new THREE.IcosahedronGeometry(1, 1);
    const mossVertices = mossGeo.getAttribute("position");
    for (let i = 0; i < mossVertices.count; i++) {
      const x = mossVertices.getX(i), y = mossVertices.getY(i), z = mossVertices.getZ(i);
      const r = 1 + 0.14 * Math.sin(x * 21 + y * 13) * Math.cos(z * 19 - x * 9);
      mossVertices.setXYZ(i, x * r, y * r, z * r);
    }
    mossGeo.computeVertexNormals();
    this.moss.onBeforeCompile = (shader) => {
      shader.vertexShader = `varying vec3 vMossP;\n${shader.vertexShader}`.replace("#include <begin_vertex>",
        `#include <begin_vertex>\nvMossP = position + instanceMatrix[3].xyz;`);
      shader.fragmentShader = `varying vec3 vMossP;\n${shader.fragmentShader}`.replace("#include <color_fragment>",
        `#include <color_fragment>
         float mossGrain = sin(vMossP.x * 92.0 + sin(vMossP.z * 73.0)) * sin(vMossP.y * 85.0);
         diffuseColor.rgb *= 0.82 + mossGrain * 0.18;`).replace("#include <emissivemap_fragment>",
        `#include <emissivemap_fragment>
         float mossLight = 0.25 + 0.75 * max(dot(normal, normalize(vec3(-0.4, 0.7, 1.0))), 0.0);
         totalEmissiveRadiance *= mossLight * (0.8 + mossGrain * 0.2);`);
    };
    this.moss.customProgramCacheKey = () => "portal-moss-grain";
    this.geometries.push(mossGeo);
    const moss = new THREE.InstancedMesh(mossGeo, this.moss, 640);
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    for (let i = 0; i < moss.count; i++) {
      const u = random();
      const p = ring.getPointAt(u);
      const patch = 0.55 + 0.45 * Math.sin(u * 49 + 1.8);
      const size = (0.035 + random() * 0.085) * (0.55 + patch);
      dummy.position.copy(p).add(new THREE.Vector3((random() - 0.5) * 0.35, (random() - 0.5) * 0.25, 0.16 + random() * 0.22));
      dummy.rotation.set(random() * 3, random() * 3, random() * 3);
      dummy.scale.set(size * 1.45, size, size * 0.9);
      dummy.updateMatrix(); moss.setMatrixAt(i, dummy.matrix);
      moss.setColorAt(i, color.setHSL(0.20 + random() * 0.055, 0.42 + random() * 0.24, 0.22 + random() * 0.22));
      if (i % 4 === 0) leafPos.push({ p: dummy.position.clone(), scale: 0.16 + random() * 0.26, angle: random() * 6.28 });
    }
    moss.renderOrder = 2;
    this.meshes.push(moss); group.add(moss);

    // Folded, tapered leaves with a central ridge, rather than flat green discs.
    const vertices: number[] = [], indices: number[] = [];
    for (let i = 0; i <= 8; i++) {
      const t = i / 8, spread = Math.pow(Math.sin(Math.PI * t), 0.8) * 0.38;
      for (const side of [-1, 0, 1]) vertices.push(side * spread, t, Math.sin(t * Math.PI) * (side === 0 ? 0.13 : 0.025) + t * t * 0.13);
      if (i < 8) for (let j = 0; j < 2; j++) {
        const a = i * 3 + j; indices.push(a, a + 1, a + 3, a + 1, a + 4, a + 3);
      }
    }
    const leafGeo = new THREE.BufferGeometry();
    leafGeo.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    leafGeo.setIndex(indices); leafGeo.computeVertexNormals();
    this.geometries.push(leafGeo);
    this.leaves.onBeforeCompile = (shader) => {
      shader.uniforms.uPortalTime = this.time;
      shader.vertexShader = `uniform float uPortalTime; varying vec2 vPortalLeaf;\n${shader.vertexShader}`.replace("#include <begin_vertex>",
        `#include <begin_vertex>
         vPortalLeaf = position.xy;
         transformed.x += sin(uPortalTime * 1.4 + instanceMatrix[3].y * 2.0 + instanceMatrix[3].x) * position.y * position.y * 0.085;
         transformed.z += cos(uPortalTime * 1.1 + instanceMatrix[3].x * 3.0) * position.y * 0.055;`);
      shader.fragmentShader = `varying vec2 vPortalLeaf;\n${shader.fragmentShader}`.replace("#include <emissivemap_fragment>",
        `#include <emissivemap_fragment>
         float leafLight = 0.22 + 0.78 * max(dot(normal, normalize(vec3(-0.4, 0.7, 1.0))), 0.0);
         float vein = exp(-abs(vPortalLeaf.x) * 90.0);
         totalEmissiveRadiance *= leafLight * (0.65 + vPortalLeaf.y * 0.4 + vein * 0.24);`);
    };
    this.leaves.customProgramCacheKey = () => "portal-ivy-wind";
    const leaves = new THREE.InstancedMesh(leafGeo, this.leaves, leafPos.length);
    leafPos.forEach(({ p, scale, angle }, i) => {
      dummy.position.copy(p); dummy.rotation.set((random() - 0.5) * 1.2, (random() - 0.5) * 1.2, angle);
      dummy.scale.setScalar(scale); dummy.updateMatrix(); leaves.setMatrixAt(i, dummy.matrix);
      leaves.setColorAt(i, color.setHSL(0.22 + random() * 0.075, 0.4 + random() * 0.28, 0.27 + random() * 0.23));
    });
    leaves.renderOrder = 2;
    this.meshes.push(leaves); group.add(leaves);

    const count = 616, pos = new Float32Array(count * 3), seeds = new Float32Array(count), sizes = new Float32Array(count), depths = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const p = ring.getPointAt(random());
      const spread = random() ** 2 * 0.85;
      pos.set([p.x + (random() - 0.5) * spread, p.y + (random() - 0.5) * spread, 0.3 + random() * 0.5], i * 3);
      seeds[i] = random(); sizes[i] = 0.035 + random() ** 3 * 0.12;
      if (i >= 520) {
        // Sparse foreground layers pass beside the camera and give the approach depth.
        const side = i % 2 ? -1 : 1;
        pos.set([side * (1.2 + random() * 3.5), -height / 2 + 0.7 + random() * 5.5, 1.2 + random() * 12], i * 3);
        sizes[i] = 0.018 + random() * 0.04;
        depths[i] = 1;
      }
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    particleGeo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    particleGeo.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    particleGeo.setAttribute("aDepth", new THREE.BufferAttribute(depths, 1));
    this.geometries.push(particleGeo);
    const particles = new THREE.Points(particleGeo, this.spores);
    particles.frustumCulled = false; particles.renderOrder = 3;
    group.add(particles);
  }

  setSize(height: number, dpr: number) { this.pixelScale.value = height * dpr / (2 * Math.tan(THREE.MathUtils.degToRad(20))); }
  update(time: number, opacity: number, progress: number) {
    this.time.value = time;
    this.opacity.value = opacity;
    this.passage.value = progress;
    this.bark.opacity = this.moss.opacity = this.leaves.opacity = opacity;
  }
  dispose() {
    this.meshes.forEach((mesh) => mesh.dispose());
    this.geometries.forEach((geo) => geo.dispose());
    this.bark.dispose(); this.moss.dispose(); this.leaves.dispose(); this.spores.dispose();
  }
}
