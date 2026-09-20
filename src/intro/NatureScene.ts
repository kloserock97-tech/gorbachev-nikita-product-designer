import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { FullScreenQuad } from "three/examples/jsm/postprocessing/Pass.js";

const clamp = THREE.MathUtils.clamp;
const smooth = (a: number, b: number, x: number) => THREE.MathUtils.smoothstep(x, a, b);
const rand = (n: number) => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
const delayAt = (x: number, z: number) => clamp(Math.hypot((x - 1.15) * .8, z - 1.1) / 3.5 + Math.sin(x * 5 + z * 3) * .035, .035, .77);
const inGarden = (x: number, z: number) => {
  const edge = Math.sin(x * 7 + z * 3) * .045 + Math.cos(z * 9 - x * 2) * .045;
  return Math.hypot((x - .45) / 1.03, (z - .5) / 1.35) < 1 + edge ||
    Math.hypot((x + .62) / .64, (z - .91) / .45) < 1 + edge;
};

/** No network assets: this scene must be cheaper to load than the scene it introduces. */
export class NatureScene {
  get isReady() { return this.ready; }
  readonly renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(32, 1, .1, 30);
  private world = new THREE.Group();
  private rt: THREE.WebGLRenderTarget;
  private quad: FullScreenQuad;
  private post: THREE.ShaderMaterial;
  private growth = { value: 0 };
  private clock = { value: 0 };
  private flowers: { group: THREE.Group; petals: THREE.Mesh[]; delay: number; seed: number; scale: number }[] = [];
  private dew!: THREE.InstancedMesh;
  private dewSeeds: THREE.Vector3[] = [];
  private key: THREE.DirectionalLight;
  private ready = false;
  private disposed = false;
  private lastShadow = -1;
  private small: boolean;

  constructor(canvas: HTMLCanvasElement, private reduced: boolean) {
    this.small = matchMedia("(max-width: 700px)").matches;
    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: false, antialias: false, powerPreference: "low-power" });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, this.small ? 1.5 : 1.75));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.shadowMap.autoUpdate = false;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.02;
    this.scene.background = new THREE.Color("#d6d6cb");
    this.camera.position.set(.1, 7.3, 4.7);
    this.camera.lookAt(0, .05, 0);
    this.world.rotation.y = -.12;
    this.scene.add(this.world);
    this.scene.add(new THREE.HemisphereLight("#f1f6e9", "#535b3d", 1.05));
    this.key = new THREE.DirectionalLight("#fff0dc", 3.1);
    this.key.position.set(-3, 6, -2);
    this.key.castShadow = true;
    this.key.shadow.mapSize.setScalar(this.small ? 1024 : 2048);
    Object.assign(this.key.shadow.camera, { left: -3.6, right: 3.6, top: 3.6, bottom: -3.6, near: .5, far: 15 });
    this.key.shadow.bias = -.00025;
    this.key.shadow.normalBias = .016;
    this.key.shadow.radius = 6;
    this.scene.add(this.key);
    const fill = new THREE.DirectionalLight("#d6e4ff", .65);
    fill.position.set(3, 2, 3); this.scene.add(fill);
    this.buildTile();
    this.buildGrass();
    this.buildFlowers();
    this.buildDew();
    this.rt = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: this.small ? 2 : 4 });
    this.post = new THREE.ShaderMaterial({
      uniforms: { tScene: { value: this.rt.texture }, uPixel: { value: new THREE.Vector2() } },
      vertexShader: "varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }",
      fragmentShader: `
        uniform sampler2D tScene; uniform vec2 uPixel; varying vec2 vUv;
        void main(){
          vec3 c=texture2D(tScene,vUv).rgb;
          // Highlight-only halation, not a screen-wide blur over the grass.
          vec3 halo=vec3(0.);
          for(int i=0;i<8;i++){
            float a=float(i)*.785398;
            vec3 s=texture2D(tScene,vUv+vec2(cos(a),sin(a))*uPixel*3.).rgb;
            halo+=max(s-vec3(1.5),vec3(0.));
          }
          c+=halo*.008;
          c*=1.-.075*dot((vUv-.5)*1.4,(vUv-.5)*1.4);
          gl_FragColor=vec4(c,1.);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
          float grain=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453)-.5;
          gl_FragColor.rgb+=grain*.003;
        }`,
      depthTest: false, depthWrite: false,
    });
    this.quad = new FullScreenQuad(this.post);
    this.renderer.setRenderTarget(this.rt);
    void this.renderer.compileAsync(this.scene, this.camera).then(() => {
      if (!this.disposed) this.ready = true;
    }).catch(() => { if (!this.disposed) this.ready = true; });
    this.renderer.setRenderTarget(null);
  }

  private buildTile() {
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshStandardMaterial({ color: "#d6d6cb", roughness: .96 }));
    floor.rotation.x = -Math.PI / 2; floor.position.y = -.36; floor.receiveShadow = true;
    this.scene.add(floor);
    const material = new THREE.MeshPhysicalMaterial({ color: "#edf1e9", roughness: .46, metalness: .02, clearcoat: .18, clearcoatRoughness: .55 });
    // Fine ceramic grain, generated locally rather than fetched as a texture.
    const data = new Uint8Array(128 * 128);
    for (let i = 0; i < data.length; i++) data[i] = Math.round(115 + rand(i) * 24);
    const bump = new THREE.DataTexture(data, 128, 128, THREE.RedFormat);
    bump.wrapS = bump.wrapT = THREE.RepeatWrapping; bump.repeat.set(5, 5); bump.needsUpdate = true;
    material.bumpMap = bump; material.bumpScale = .017;
    material.onBeforeCompile = shader => {
      shader.uniforms.uGarden = this.growth;
      shader.vertexShader = "varying vec3 vTile;\n" + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\nvTile=position;");
      shader.fragmentShader = "varying vec3 vTile; uniform float uGarden;\n" + shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace("#include <color_fragment>", `
        #include <color_fragment>
        float x=vTile.x,z=vTile.z;
        float edge=sin(x*7.+z*3.)*.045+cos(z*9.-x*2.)*.045;
        float d=min(length(vec2((x-.45)/1.03,(z-.5)/1.35)),length(vec2((x+.62)/.64,(z-.91)/.45)));
        float gardenMask=1.-smoothstep(.98+edge,1.02+edge,d);
        float delay=clamp(length(vec2((x-1.15)*.8,z-1.1))/3.5+sin(x*5.+z*3.)*.035,.035,.77);
        float moss=smoothstep(delay+.01,delay+.18,uGarden)*gardenMask*smoothstep(.07,.115,vTile.y);
        vec3 mossColor=mix(vec3(.035,.065,.008),vec3(.095,.13,.024),.5+.5*sin(x*41.)*cos(z*33.));
        diffuseColor.rgb=mix(diffuseColor.rgb,mossColor,moss);
      `);
    };
    const tile = new THREE.Mesh(new RoundedBoxGeometry(3.05, .25, 3.25, 5, .18), material);
    tile.position.y = -.125; tile.castShadow = tile.receiveShadow = true;
    this.world.add(tile);
    // Broad, soft foliage shadows: camera doesn't see the canopy, light does.
    const canopy = new THREE.Group();
    const leafGeo = new THREE.SphereGeometry(1, 8, 6);
    const leafMat = new THREE.MeshStandardMaterial({ color: "#576445", colorWrite: false, depthWrite: false });
    for (let i = 0; i < 22; i++) {
      const leaf = new THREE.Mesh(leafGeo, leafMat);
      leaf.scale.set(.14 + rand(i + 1) * .14, .015, .36);
      leaf.position.set(-2.2 + rand(i * 3) * 4.3, 2.8 + rand(i * 4) * .5, -2 + rand(i * 5) * 3);
      leaf.rotation.y = rand(i * 11) * 6.28;
      leaf.castShadow = true; canopy.add(leaf);
    }
    this.scene.add(canopy);
  }

  private buildGrass() {
    const geo = new THREE.PlaneGeometry(1, 1, 1, 4);
    geo.translate(0, .5, 0);
    const positions = geo.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const y = positions.getY(i);
      positions.setX(i, positions.getX(i) * (1 - y * .97));
      positions.setZ(i, y * y * .42);
    }
    geo.computeVertexNormals();
    const count = this.small ? 10000 : 19000;
    const seeds = new Float32Array(count * 2);
    const mat = new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: .86, side: THREE.DoubleSide });
    const depth = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, side: THREE.DoubleSide });
    const inject = (shader: THREE.WebGLProgramParametersWithUniforms) => {
      shader.uniforms.uGarden = this.growth; shader.uniforms.uGardenTime = this.clock;
      shader.vertexShader = "uniform float uGarden; uniform float uGardenTime; attribute vec2 aGarden;\n" + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace("#include <begin_vertex>", `
        #include <begin_vertex>
        float grow=smoothstep(aGarden.x,aGarden.x+.18,uGarden);
        float tip=position.y*position.y;
        transformed.y*=grow;
        transformed.x*=max(.01,grow);
        transformed.z*=grow;
        transformed.x+=sin(uGardenTime*1.4+aGarden.y*6.28)*tip*.16*grow;
        transformed.z+=sin(uGardenTime*.87+aGarden.y*9.1)*tip*.09*grow;
      `);
    };
    mat.onBeforeCompile = inject; depth.onBeforeCompile = inject;
    const grass = new THREE.InstancedMesh(geo, mat, count);
    grass.customDepthMaterial = depth;
    grass.castShadow = grass.receiveShadow = true;
    grass.frustumCulled = false;
    const dummy = new THREE.Object3D(), color = new THREE.Color();
    for (let i = 0, n = 0; i < count; n++) {
      const x = (rand(n * 7 + 1) - .5) * 2.76, z = (rand(n * 7 + 2) - .5) * 2.96;
      if (!inGarden(x, z)) continue;
      const r = rand(n * 7 + 3), height = .085 + r * r * .24;
      dummy.position.set(x, .006, z);
      dummy.rotation.y = rand(n * 7 + 4) * Math.PI * 2;
      dummy.scale.set(.009 + rand(n * 7 + 5) * .014, height, height);
      dummy.updateMatrix(); grass.setMatrixAt(i, dummy.matrix);
      color.setHSL(.205 + rand(n * 7 + 6) * .07, .5 + r * .2, .065 + r * .14);
      grass.setColorAt(i, color);
      seeds[i * 2] = delayAt(x, z) + rand(n + 19) * .05;
      seeds[i * 2 + 1] = rand(n + 70);
      i++;
    }
    geo.setAttribute("aGarden", new THREE.InstancedBufferAttribute(seeds, 2));
    grass.instanceMatrix.needsUpdate = true;
    if (grass.instanceColor) grass.instanceColor.needsUpdate = true;
    this.world.add(grass);
  }

  private petalGeometry() {
    const geo = new THREE.PlaneGeometry(1, 1, 5, 9);
    const p = geo.attributes.position, uv = geo.attributes.uv;
    for (let i = 0; i < p.count; i++) {
      const t = uv.getY(i), across = (uv.getX(i) - .5) * 2;
      p.setXYZ(i, across * Math.pow(Math.sin(Math.PI * t), .65) * .055, Math.sin(t * Math.PI) * .035 + across * across * .012, t * .19);
    }
    geo.computeVertexNormals(); return geo;
  }

  private buildFlowers() {
    const petalGeo = this.petalGeometry();
    const ivory = new THREE.MeshStandardMaterial({ color: "#fff4d8", roughness: .67, side: THREE.DoubleSide });
    const orange = new THREE.MeshStandardMaterial({ color: "#ef8425", roughness: .6, side: THREE.DoubleSide });
    const stemMat = new THREE.MeshStandardMaterial({ color: "#426b27", roughness: .9 });
    const coreMat = new THREE.MeshStandardMaterial({ color: "#d6a52c", roughness: .94 });
    const coreGeo = new THREE.SphereGeometry(.043, 12, 8);
    const leafGeo = new THREE.SphereGeometry(1, 8, 6);
    for (let i = 0; i < 23; i++) {
      const accent = i < 3;
      let x = accent ? 1.03 + i * .09 : (rand(i * 9 + 211) - .3) * 2;
      let z = accent ? -.45 + i * .43 : (rand(i * 9 + 212) - .1) * 1.65;
      if (!inGarden(x, z)) { x = .3 + rand(i + 131) * .6; z = rand(i + 145); }
      const height = accent ? .48 + i * .13 : .18 + rand(i + 80) * .22;
      const group = new THREE.Group(); group.position.set(x, .012, z);
      const bend = (rand(i + 31) - .5) * .16;
      const path = new THREE.QuadraticBezierCurve3(new THREE.Vector3(), new THREE.Vector3(-bend, height * .55, .015), new THREE.Vector3(bend, height, 0));
      const stem = new THREE.Mesh(new THREE.TubeGeometry(path, 9, accent ? .011 : .006, 5, false), stemMat);
      stem.castShadow = true; group.add(stem);
      for (let j = 0; j < 2; j++) {
        const leaf = new THREE.Mesh(leafGeo, stemMat);
        leaf.position.set(j ? -.025 : .03, height * (.3 + j * .2), 0);
        leaf.scale.set(.06, .009, .024); leaf.rotation.z = j ? -.6 : .6;
        leaf.castShadow = true; group.add(leaf);
      }
      const head = new THREE.Group(); head.position.set(bend, height, 0);
      head.rotation.set(.12, i * 1.17, -.17); group.add(head);
      const core = new THREE.Mesh(coreGeo, coreMat); core.scale.y = .55; core.castShadow = true; head.add(core);
      const petals: THREE.Mesh[] = [];
      const layers = accent ? 2 : 1, amount = accent ? 9 : 10;
      for (let layer = 0; layer < layers; layer++) for (let j = 0; j < amount; j++) {
        const pivot = new THREE.Group(); pivot.rotation.y = j / amount * Math.PI * 2 + layer * .35;
        head.add(pivot);
        const petal = new THREE.Mesh(petalGeo, accent ? orange : ivory);
        petal.scale.setScalar(accent ? .92 - layer * .2 : .34 + rand(i + 1) * .17);
        petal.position.y = layer * .012; petal.castShadow = petal.receiveShadow = true;
        pivot.add(petal); petals.push(petal);
      }
      this.flowers.push({ group, petals, delay: delayAt(x, z) + .16, seed: i, scale: 1 });
      this.world.add(group);
    }
  }

  private buildDew() {
    this.dew = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 8, 6),
      new THREE.MeshPhysicalMaterial({ color: "#d9f0ed", metalness: .35, roughness: .08, clearcoat: 1 }), 38);
    this.dew.frustumCulled = false;
    for (let i = 0; i < 38; i++) this.dewSeeds.push(new THREE.Vector3((rand(i * 3 + 711) - .5) * 2.4, .016, (rand(i * 3 + 712) - .5) * 2.6));
    this.world.add(this.dew);
  }

  resize(width: number, height: number) {
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height; this.camera.updateProjectionMatrix();
    const dpr = this.renderer.getPixelRatio();
    this.rt.setSize(Math.round(width * dpr), Math.round(height * dpr));
    this.post.uniforms.uPixel.value.set(1 / (width * dpr), 1 / (height * dpr));
  }

  render(progress: number, time: number) {
    if (!this.ready || this.disposed) return;
    this.growth.value = progress;
    this.clock.value = this.reduced ? 0 : time;
    this.world.rotation.z = this.reduced ? 0 : Math.sin(time * .28) * .006;
    for (const flower of this.flowers) {
      const stem = smooth(flower.delay, flower.delay + .12, progress);
      const bloom = smooth(flower.delay + .075, flower.delay + .24, progress);
      flower.group.scale.setScalar(Math.max(.0001, stem));
      flower.group.rotation.z = this.reduced ? 0 : Math.sin(time * 1.25 + flower.seed) * .018 * stem;
      for (const petal of flower.petals) petal.rotation.x = -1.32 * (1 - bloom) + .1 * bloom;
    }
    const dummy = new THREE.Object3D();
    this.dewSeeds.forEach((p, i) => {
      const g = smooth(.1 + i * .009, .38 + i * .009, progress);
      dummy.position.copy(p); dummy.scale.setScalar((.008 + rand(i + 40) * .013) * g);
      dummy.scale.y *= .66; dummy.updateMatrix(); this.dew.setMatrixAt(i, dummy.matrix);
    });
    this.dew.instanceMatrix.needsUpdate = true;
    // Growth casts matching shadows. Once grown, refresh only at 12 Hz for the breeze.
    if (progress < .99 || time - this.lastShadow > .083) {
      this.renderer.shadowMap.needsUpdate = true; this.lastShadow = time;
    }
    this.renderer.setRenderTarget(this.rt);
    this.renderer.render(this.scene, this.camera);
    this.renderer.setRenderTarget(null); this.quad.render(this.renderer);
  }

  dispose() {
    if (this.disposed) return; this.disposed = true;
    const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>(), textures = new Set<THREE.Texture>();
    this.scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.geometry) geometries.add(mesh.geometry);
      if (mesh.material) (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach(m => materials.add(m));
      if (mesh.customDepthMaterial) materials.add(mesh.customDepthMaterial);
      if (o instanceof THREE.InstancedMesh) o.dispose();
    });
    materials.forEach(m => { Object.values(m).forEach(v => { if (v instanceof THREE.Texture) textures.add(v); }); m.dispose(); });
    textures.forEach(t => t.dispose()); geometries.forEach(g => g.dispose());
    this.key.shadow.map?.dispose(); this.rt.dispose(); this.quad.dispose(); this.post.dispose();
    this.renderer.dispose(); this.renderer.forceContextLoss();
  }
}
