import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { FullScreenQuad } from "three/examples/jsm/postprocessing/Pass.js";
import { TILE, COVER, FRONT, rand, delayAt, seedDelay, GARDEN_DELAY_GLSL, topSurface, rimSurface, baseAt, mossHeight, mossField, mossKnob, iceAt, fbm } from "./gardenSurface";

const smooth = (a: number, b: number, x: number) => THREE.MathUtils.smoothstep(x, a, b);

/** v59. A thick slab of frosted glass seen in three-quarter view. It starts cold: a sheet of ice in one corner and
    frost around it. As the portfolio loads the ice melts back and leaves droplets, and from the warm corner moss
    grows in cushions, then thin blades, then flowers that stand taller than the edge. Part of the glass stays bare.
    No network assets: this scene must be cheaper to load than the scene it introduces. */
export class NatureScene {
  get isReady() { return this.ready; }
  readonly renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(23, 1, 1, 40);
  private world = new THREE.Group();
  private rt: THREE.WebGLRenderTarget;
  private env: THREE.WebGLRenderTarget | null = null;
  private quad: FullScreenQuad;
  private post: THREE.ShaderMaterial;
  private growth = { value: 0 };
  private clock = { value: 0 };
  private flowers: { group: THREE.Group; petals: THREE.Mesh[]; delay: number; seed: number }[] = [];
  private drops!: THREE.InstancedMesh;
  private dropSeeds: { p: THREE.Vector3; size: number; at: number; flat: number }[] = [];
  private dummy = new THREE.Object3D();
  private key: THREE.DirectionalLight;
  private ready = false;
  private disposed = false;
  private lastShadow = -1;
  private small: boolean;

  constructor(canvas: HTMLCanvasElement, private reduced: boolean) {
    this.small = matchMedia("(max-width: 700px)").matches;
    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, premultipliedAlpha: true, antialias: false, powerPreference: "low-power" });
    /* The canvas is transparent: the page background shows around the slab, and the floor is only a shadow catcher.
       A rendered backdrop never matched the CSS one exactly and showed as a pale disc. */
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, this.small ? 1.5 : 1.75));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.shadowMap.autoUpdate = false;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    /* Glass and ice are read through what they reflect. A tiny procedural room, prefiltered once, gives them
       soft boxes to mirror; nothing is downloaded. */
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    const room = new RoomEnvironment();
    this.env = pmrem.fromScene(room, .05);
    this.scene.environment = this.env.texture;
    this.scene.environmentIntensity = .42;
    room.dispose(); pmrem.dispose();
    /* Three-quarter view from the front left with a long lens: the left and the near wall show the thickness,
       the top stays almost square, and tall flowers rise past the far edge instead of reading as dots from above. */
    const azimuth = THREE.MathUtils.degToRad(23), elevation = THREE.MathUtils.degToRad(49), distance = 12.4;
    this.camera.position.set(-Math.sin(azimuth) * Math.cos(elevation) * distance, Math.sin(elevation) * distance, Math.cos(azimuth) * Math.cos(elevation) * distance);
    this.camera.lookAt(.05, -.1, .1);
    this.world.rotation.y = -.17;
    this.scene.add(this.world);
    this.scene.add(new THREE.HemisphereLight("#f3f7ee", "#5c6349", .42));
    this.key = new THREE.DirectionalLight("#fff1de", 2.35);
    this.key.position.set(-2.3, 7, -1.7);
    this.key.castShadow = true;
    this.key.shadow.mapSize.setScalar(this.small ? 1024 : 2048);
    Object.assign(this.key.shadow.camera, { left: -3.8, right: 3.8, top: 3.8, bottom: -3.8, near: .5, far: 16 });
    this.key.shadow.bias = -.00025;
    this.key.shadow.normalBias = .016;
    this.key.shadow.radius = 9;
    this.scene.add(this.key);
    const fill = new THREE.DirectionalLight("#d6e4ff", .7);
    fill.position.set(3, 2, 4); this.scene.add(fill);
    this.buildTile();
    this.buildIce();
    this.buildMoss();
    this.buildGrass();
    this.buildFlowers();
    this.buildDrops();
    this.rt = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, format: THREE.RGBAFormat, samples: this.small ? 2 : 4 });
    this.post = new THREE.ShaderMaterial({
      uniforms: { tScene: { value: this.rt.texture }, uPixel: { value: new THREE.Vector2() } },
      vertexShader: "varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }",
      fragmentShader: `
        uniform sampler2D tScene; uniform vec2 uPixel; varying vec2 vUv;
        void main(){
          vec4 texel=texture2D(tScene,vUv);
          vec3 c=texel.rgb;
          // Highlight-only halation, not a screen-wide blur over the moss.
          vec3 halo=vec3(0.);
          for(int i=0;i<8;i++){
            float a=float(i)*.785398;
            vec3 s=texture2D(tScene,vUv+vec2(cos(a),sin(a))*uPixel*3.).rgb;
            halo+=max(s-vec3(1.5),vec3(0.));
          }
          c+=halo*.012;
          c*=1.-.075*dot((vUv-.5)*1.4,(vUv-.5)*1.4);
          /* The target is premultiplied (edge pixels of the slab are colour × coverage). Tone mapping is not linear,
             so it has to see the straight colour; otherwise every silhouette gets a pale fringe. */
          float coverage=texel.a;
          gl_FragColor=vec4(coverage>.001?c/coverage:vec3(0.),1.);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
          float grain=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453)-.5;
          gl_FragColor.rgb+=grain*.003;
          gl_FragColor=vec4(gl_FragColor.rgb*coverage,coverage);
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
    const floorMat = new THREE.ShadowMaterial({ color: "#2f3427", opacity: .2 });
    /* the catcher fades out before the edge of the square canvas, so a long shadow is never cut by it */
    floorMat.onBeforeCompile = shader => {
      shader.vertexShader = `varying vec3 vCatch;
${shader.vertexShader.replace("#include <begin_vertex>", `#include <begin_vertex>
vCatch=(modelMatrix*vec4(position,1.)).xyz;`)}`;
      shader.fragmentShader = `varying vec3 vCatch;
${shader.fragmentShader.replace("#include <tonemapping_fragment>", `gl_FragColor.a*=1.-smoothstep(2.0,3.0,length(vCatch.xz-vec2(.45,.4)));
#include <tonemapping_fragment>`)}`;
    };
    /* The slab hovers: the gap detaches its shadow and lets the thickness read against the backdrop. */
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), floorMat);
    floor.rotation.x = -Math.PI / 2; floor.position.y = -TILE.thickness - .42; floor.receiveShadow = true;
    this.scene.add(floor);
    /* Frosted glass, faked: an opaque body with a wet clear coat, a cool glow in the walls where light would pass
       through the thickness, and cloudy density inside. Real transmission would render the scene twice. */
    const material = new THREE.MeshPhysicalMaterial({
      color: "#d6e4e3", roughness: .34, metalness: 0, clearcoat: .8, clearcoatRoughness: .18, ior: 1.45, envMapIntensity: 1.1,
    });
    // Fine frosted grain, generated locally rather than fetched as a texture.
    const data = new Uint8Array(128 * 128);
    for (let i = 0; i < data.length; i++) data[i] = Math.round(112 + rand(i) * 30);
    const bump = new THREE.DataTexture(data, 128, 128, THREE.RedFormat);
    bump.wrapS = bump.wrapT = THREE.RepeatWrapping; bump.repeat.set(4, 4); bump.magFilter = THREE.LinearFilter; bump.needsUpdate = true;
    material.bumpMap = bump; material.bumpScale = .012;
    material.onBeforeCompile = shader => {
      shader.uniforms.uGarden = this.growth;
      shader.uniforms.uGardenTime = this.clock;
      shader.vertexShader = "varying vec3 vTile; varying vec3 vTileN;\n" + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\nvTile=position; vTileN=normal;");
      shader.fragmentShader = "varying vec3 vTile; varying vec3 vTileN; uniform float uGarden; uniform float uGardenTime;\n" + shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace("#include <color_fragment>", `
        #include <color_fragment>
        float x=vTile.x,z=vTile.z;
        float delay=${GARDEN_DELAY_GLSL};
        // Moss stains the glass only where it will grow; the rest of the slab stays bare.
        float cover=1.-smoothstep(${(COVER - .03).toFixed(3)},${(COVER + .05).toFixed(3)},delay);
        float arrive=min(1.,delay/${COVER.toFixed(3)})*${FRONT.toFixed(3)};
        // only the top face: on the wall the stain read as green stripes
        float moss=smoothstep(arrive,arrive+.16,uGarden)*cover*smoothstep(.45,.9,abs(normalize(vTileN).y));
        // Cloudy density inside the glass.
        float cloud=.5+.5*sin(x*2.1+sin(z*2.9)*1.3)*cos(z*1.7-x*.9);
        diffuseColor.rgb*=mix(.93,1.03,cloud);
        // Walls: you look into the thickness, so they are deeper and cooler than the milky top.
        float wallTint=1.-smoothstep(.15,.85,abs(normalize(vTileN).y));
        diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.50,.64,.69),wallTint*.78);
        // A cool breath across the top towards the cold corner.
        diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.74,.86,.90),(1.-wallTint)*.34*smoothstep(1.4,-1.8,x+z));
        // Frost around the ice, fading as the corner warms up.
        float frost=(1.-smoothstep(1.1,3.1,length(vec2(x+1.5,(z+1.6)*.85))))*(1.-moss)*(1.-uGarden*.4);
        float crystal=.5+.5*sin(x*47.+sin(z*35.))*cos(z*53.);
        diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.60,.77,.83)*(1.+crystal*.2),frost*.62);
        // Matting: tiny crystals scattered over the top, denser inside the frost.
        float speck=fract(sin(dot(floor(vTile.xz*70.),vec2(12.9898,78.233)))*43758.5453);
        diffuseColor.rgb*=1.-step(.62,speck)*(.03+frost*.07)*smoothstep(.6,.95,abs(normalize(vTileN).y));
        // No green stain under the moss: the cushions do not fill the covered area, and a stain showed past them.
        float canopy=sin(x*2.7+sin(z*1.6)+uGardenTime*.05)*cos(z*3.2-x*.7);
        diffuseColor.rgb*=1.-smoothstep(.1,.8,canopy)*.2;
      `);
      /* cast glass is never optically flat: a slow wave in the normal makes the reflections of the room wander */
      shader.fragmentShader = shader.fragmentShader.replace("#include <normal_fragment_maps>", `
        #include <normal_fragment_maps>
        normal=normalize(normal+vec3(sin(vTile.x*3.1+vTile.z*1.7),0.,cos(vTile.z*3.6-vTile.x*1.3))*.035);
      `);
      shader.fragmentShader = shader.fragmentShader.replace("#include <emissivemap_fragment>", `
        #include <emissivemap_fragment>
        // Light that would travel through the thickness: strongest in the walls, a breath of it on the top face.
        float wall=1.-smoothstep(.12,.8,abs(normalize(vTileN).y));
        float depthFade=smoothstep(-${TILE.thickness.toFixed(3)},0.,vTile.y);
        totalEmissiveRadiance+=vec3(.50,.74,.78)*(wall*.10*depthFade+.012)*(1.-moss);
      `);
    };
    // Round in 3D first, then compress: corner radius is independent of visual thickness.
    const geometry = new RoundedBoxGeometry(TILE.width, TILE.modelHeight, TILE.depth, 10, TILE.radius);
    geometry.scale(1, TILE.thickness / TILE.modelHeight, 1);
    geometry.translate(0, -TILE.thickness / 2, 0);
    const tile = new THREE.Mesh(geometry, material);
    tile.castShadow = tile.receiveShadow = true;
    this.world.add(tile);
  }

  /** A sheet that lies on the slab and drapes over its edge. Every vertex knows its hidden rest point just under
      the surface and the growth value at which it moves: moss rises from rest, ice sinks back into it. */
  private buildSheet(opts: {
    x0: number; x1: number; z0: number; z1: number; res: number; mode: "grow" | "melt";
    sample: (x: number, z: number) => { h: number; delay: number; shade: number };
    material: THREE.Material; tint: (shade: number, out: THREE.Color) => void;
  }) {
    const { x0, x1, z0, z1, res } = opts, n = res + 1;
    const position = new Float32Array(n * n * 3), rest = new Float32Array(n * n * 3);
    const delay = new Float32Array(n * n), colors = new Float32Array(n * n * 3), alive = new Uint8Array(n * n);
    const color = new THREE.Color();
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const k = j * n + i, x = x0 + (x1 - x0) * i / res, z = z0 + (z1 - z0) * j / res;
      const s = opts.sample(x, z), base = baseAt(x, z);
      rest.set(base.rest, k * 3);
      /* a vertex just outside the layer sits a little under the glass, on the continuation of the slope:
         the visible edge is then cut by the glass itself, smoothly */
      position.set([base.rest[0], (s.h > 0 ? base.y : base.rest[1] + .008) + s.h, base.rest[2]], k * 3);
      if (s.h > 0) { position.set([x, base.y + s.h, z], k * 3); alive[k] = 1; }
      delay[k] = s.delay;
      opts.tint(s.shade, color); colors.set([color.r, color.g, color.b], k * 3);
    }
    const index: number[] = [];
    for (let j = 0; j < res; j++) for (let i = 0; i < res; i++) {
      const a = j * n + i, b = a + 1, c = a + n, d = c + 1;
      if (alive[a] || alive[b] || alive[c] || alive[d]) index.push(a, c, b, b, c, d);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(position, 3));
    geometry.setAttribute("aRest", new THREE.BufferAttribute(rest, 3));
    geometry.setAttribute("aDelay", new THREE.BufferAttribute(delay, 1));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.setIndex(index);
    geometry.computeVertexNormals();
    const amount = opts.mode === "grow" ? "smoothstep(aDelay+.05,aDelay+.30,uGarden)" : "1.-smoothstep(aDelay,aDelay+.30,uGarden)";
    const inject = (shader: THREE.WebGLProgramParametersWithUniforms) => {
      shader.uniforms.uGarden = this.growth;
      shader.vertexShader = "uniform float uGarden; attribute vec3 aRest; attribute float aDelay;\n" + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace("#include <begin_vertex>", `vec3 transformed=mix(aRest,position,${amount});`);
    };
    const depth = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking });
    opts.material.onBeforeCompile = inject; depth.onBeforeCompile = inject;
    const mesh = new THREE.Mesh(geometry, opts.material);
    mesh.customDepthMaterial = depth;
    mesh.castShadow = mesh.receiveShadow = true; mesh.frustumCulled = false;
    this.world.add(mesh);
  }

  private buildIce() {
    /* Flat shading turns the ridged height field into crystal facets; the normals come from screen derivatives,
       so they stay right while the sheet melts. */
    const material = new THREE.MeshPhysicalMaterial({
      color: "#d3ebf0", roughness: .2, metalness: 0, clearcoat: 1, clearcoatRoughness: .1, ior: 1.31,
      flatShading: true, vertexColors: true, emissive: "#8fc6d6", emissiveIntensity: .13, envMapIntensity: 1.5,
    });
    this.buildSheet({
      x0: -TILE.width / 2 - .1, x1: -TILE.width / 2 + 1.85, z0: -TILE.depth / 2 - .1, z1: -TILE.depth / 2 + 2.3,
      res: this.small ? 44 : 60, mode: "melt", material,
      /* thin edges melt first; the core of the corner (t below about .45) outlives the whole load */
      sample: (x, z) => { const ice = iceAt(x, z); return { h: ice.h, delay: .06 + Math.max(0, 1 - ice.t) * 1.7, shade: ice.h }; },
      tint: (shade, out) => out.setRGB(.60 + shade * 2.0, .80 + shade * 1.0, .92 + shade * .4),
    });
  }

  private buildMoss() {
    const material = new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 1, vertexColors: true, envMapIntensity: .25 });
    this.buildSheet({
      x0: -TILE.width / 2 - .25, x1: TILE.width / 2 + .25, z0: -TILE.depth / 2 - .25, z1: TILE.depth / 2 + .25,
      res: this.small ? 64 : 88, mode: "grow", material,
      sample: (x, z) => ({ h: mossField(x, z), delay: seedDelay(x, z), shade: mossHeight(x, z) + fbm(x * 6, z * 6) * .08 }),
      /* dark in the creases between cushions, greener on their crowns */
      tint: (shade, out) => out.setRGB(.014 + shade * .07, .030 + shade * .14, .006 + shade * .02),
    });
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
    const topCount = this.small ? 18000 : 30000, rimCount = this.small ? 900 : 1700;
    const count = topCount + rimCount;
    const seeds = new Float32Array(count * 2), lifts = new Float32Array(count * 3);
    const mat = new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: .9, side: THREE.DoubleSide, envMapIntensity: .3 });
    const depth = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, side: THREE.DoubleSide });
    const inject = (shader: THREE.WebGLProgramParametersWithUniforms) => {
      shader.uniforms.uGarden = this.growth; shader.uniforms.uGardenTime = this.clock;
      shader.vertexShader = "uniform float uGarden; uniform float uGardenTime; attribute vec2 aGarden; attribute vec3 aLift;\n" + shader.vertexShader;
      /* moss reads as velvet, not as thousands of mirrors: shade a blade mostly by the cushion under it */
      shader.vertexShader = shader.vertexShader.replace("#include <beginnormal_vertex>", "vec3 objectNormal=normalize(mix(normal,vec3(0.,1.,.25),.72));");
      shader.vertexShader = shader.vertexShader.replace("#include <color_vertex>", `
        #include <color_vertex>
        #ifdef USE_INSTANCING_COLOR
          vColor.rgb*=mix(.5,1.5,position.y);
        #endif
      `);
      shader.vertexShader = shader.vertexShader.replace("#include <begin_vertex>", `
        #include <begin_vertex>
        float grow=smoothstep(aGarden.x,aGarden.x+.17,uGarden);
        float tip=position.y*position.y;
        transformed.y*=grow;
        transformed.x*=max(.01,grow);
        transformed.z*=grow;
        transformed.x+=sin(uGardenTime*1.4+aGarden.y*6.28)*tip*.16*grow;
        transformed.z+=sin(uGardenTime*.87+aGarden.y*9.1)*tip*.09*grow;
      `);
      /* a blade stands on a cushion that is itself still rising: ride it up from the rest point */
      shader.vertexShader = shader.vertexShader.replace("#include <project_vertex>", `
        vec4 mvPosition=instanceMatrix*vec4(transformed,1.);
        mvPosition.xyz+=aLift*(1.-smoothstep(aGarden.x+.05,aGarden.x+.30,uGarden));
        mvPosition=modelViewMatrix*mvPosition;
        gl_Position=projectionMatrix*mvPosition;
      `);
    };
    mat.onBeforeCompile = inject; depth.onBeforeCompile = inject;
    const grass = new THREE.InstancedMesh(geo, mat, count);
    grass.customDepthMaterial = depth;
    grass.castShadow = grass.receiveShadow = true;
    grass.frustumCulled = false;
    const dummy = new THREE.Object3D(), color = new THREE.Color();
    const normal = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0), spin = new THREE.Quaternion();
    const e = .02;
    for (let i = 0, n = 0; i < count && n < count * 40; n++) {
      const rim = i >= topCount;
      let x: number, y: number, z: number, lift = 0;
      if (rim) {
        const s = rimSurface(rand(n * 7 + 1), rand(n * 7 + 2) * .3);
        /* only where a cushion really reaches the rim */
        if (delayAt(s.x, s.z) > COVER - .03 || mossHeight(s.x * .9, s.z * .9) < .03) continue;
        x = s.x; y = s.y; z = s.z;
        normal.set(s.nx, Math.max(.3, s.ny + .5), s.nz).normalize();
      } else {
        x = (rand(n * 7 + 1) - .5) * (TILE.width + .4); z = (rand(n * 7 + 2) - .5) * (TILE.depth + .4);
        const h = mossHeight(x, z), inside = topSurface(x, z);
        /* only on the cushions: a fringe of single blades on bare glass read as stubble */
        if (h < .006) continue;
        const base = baseAt(x, z);
        y = base.y + h; lift = base.rest[1] - y;
        lifts.set([base.rest[0] - x, lift, base.rest[2] - z], i * 3);
        const hx = mossHeight(x + e, z) - mossHeight(x - e, z), hz = mossHeight(x, z + e) - mossHeight(x, z - e);
        normal.set(-hx / (2 * e) + (inside?.nx ?? 0), 1, -hz / (2 * e) + (inside?.nz ?? 0)).normalize();
      }
      const r = rand(n * 7 + 3), tuft = rand(n * 7 + 9) > .975, knob = rim ? .5 : mossKnob(x, z);
      /* short velvet almost everywhere, with a few longer bright blades standing out of it */
      const height = tuft ? .08 + r * .1 : rim ? .03 + r * .04 : .016 + r * r * .034;
      dummy.position.set(x + normal.x * .002, y + normal.y * .002, z + normal.z * .002);
      dummy.quaternion.setFromUnitVectors(up, normal);
      spin.setFromAxisAngle(up, rand(n * 7 + 4) * Math.PI * 2); dummy.quaternion.multiply(spin);
      dummy.scale.set(.008 + rand(n * 7 + 5) * .011, height, height);
      dummy.updateMatrix(); grass.setMatrixAt(i, dummy.matrix);
      /* dark in the creases, fresh on the crowns of the knobs */
      color.setHSL(.225 + rand(n * 7 + 6) * .05 - knob * .03 - (tuft ? .03 : 0), .5 + knob * .22, (tuft ? .16 : .035 + knob * .115) + r * .05);
      grass.setColorAt(i, color);
      seeds[i * 2] = seedDelay(x, z) + rand(n + 19) * .04 + (rim ? .02 : 0);
      seeds[i * 2 + 1] = rand(n + 70);
      i++;
      grass.count = i;
    }
    geo.setAttribute("aGarden", new THREE.InstancedBufferAttribute(seeds, 2));
    geo.setAttribute("aLift", new THREE.InstancedBufferAttribute(lifts, 3));
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
    const ivory = new THREE.MeshStandardMaterial({ color: "#fff4d8", roughness: .67, side: THREE.DoubleSide, envMapIntensity: .4 });
    const orange = new THREE.MeshStandardMaterial({ color: "#ef7a1f", roughness: .58, side: THREE.DoubleSide, envMapIntensity: .4 });
    const stemMat = new THREE.MeshStandardMaterial({ color: "#426b27", roughness: .9, envMapIntensity: .3 });
    const coreMat = new THREE.MeshStandardMaterial({ color: "#d6a52c", roughness: .94, envMapIntensity: .3 });
    const coreGeo = new THREE.SphereGeometry(.043, 12, 8);
    const leafGeo = new THREE.SphereGeometry(1, 8, 6);
    /* three tall orange flowers stand at the far right edge and rise past it; small daisies dot the moss */
    const spots: { x: number; z: number; accent: number }[] = [
      { x: 1.30, z: -.12, accent: 0 }, { x: 1.40, z: .38, accent: 1 }, { x: 1.20, z: .86, accent: 2 },
    ];
    for (let n = 0; spots.length < 15 && n < 600; n++) {
      const x = (rand(n * 9 + 211) - .5) * 2.7, z = (rand(n * 9 + 212) - .5) * 2.9;
      if (delayAt(x, z) > COVER - .06 || mossHeight(x, z) < .02) continue;
      if (spots.some(s => Math.hypot(s.x - x, s.z - z) < .24)) continue;
      spots.push({ x, z, accent: -1 });
    }
    spots.forEach(({ x, z, accent: slot }, i) => {
      const accent = slot >= 0;
      const height = accent ? [.66, .84, .52][slot] : .13 + rand(i + 80) * .15;
      const group = new THREE.Group(); group.position.set(x, baseAt(x, z).y + mossHeight(x, z) * .8, z);
      const bend = accent ? .10 + slot * .05 : (rand(i + 31) - .5) * .14;
      const path = new THREE.QuadraticBezierCurve3(new THREE.Vector3(), new THREE.Vector3(-bend, height * .55, .015), new THREE.Vector3(bend, height, 0));
      const stem = new THREE.Mesh(new THREE.TubeGeometry(path, 9, accent ? .012 : .006, 5, false), stemMat);
      stem.castShadow = true; group.add(stem);
      for (let j = 0; j < 2; j++) {
        const leaf = new THREE.Mesh(leafGeo, stemMat);
        leaf.position.set(j ? -.025 : .03, height * (.3 + j * .2), 0);
        leaf.scale.set(accent ? .085 : .05, .009, accent ? .03 : .02); leaf.rotation.z = j ? -.6 : .6;
        leaf.castShadow = true; group.add(leaf);
      }
      const head = new THREE.Group(); head.position.set(bend, height, 0);
      /* heads tip towards the camera a little, so the corolla reads in three-quarter view */
      head.rotation.set(accent ? .55 : .3, i * 1.17, accent ? -.35 : -.17); group.add(head);
      const core = new THREE.Mesh(coreGeo, coreMat); core.scale.y = .55; core.castShadow = true; head.add(core);
      const petals: THREE.Mesh[] = [];
      const layers = accent ? 3 : 1, amount = accent ? 9 : 10;
      for (let layer = 0; layer < layers; layer++) for (let j = 0; j < amount; j++) {
        const pivot = new THREE.Group(); pivot.rotation.y = j / amount * Math.PI * 2 + layer * .35;
        head.add(pivot);
        const petal = new THREE.Mesh(petalGeo, accent ? orange : ivory);
        petal.scale.setScalar(accent ? 1.12 - layer * .24 : .29 + rand(i + 1) * .14);
        petal.position.y = layer * .012; petal.castShadow = petal.receiveShadow = true;
        petal.userData.open = accent ? [.05, -.38, -.78][layer] : .1;
        pivot.add(petal); petals.push(petal);
      }
      this.flowers.push({ group, petals, delay: seedDelay(x, z) + .1, seed: i });
      this.world.add(group);
    });
  }

  /** Meltwater on the bare glass, thickest along the retreating edge of the ice, plus a little dew on the moss. */
  private buildDrops() {
    const total = this.small ? 110 : 190;
    /* A drop on white glass is a lens: clear in the middle, a dark rim where it bends the view, one hard highlight.
       Faked with view-dependent alpha and colour; real transmission would render the whole scene a second time. */
    const water = new THREE.MeshPhysicalMaterial({ color: "#ffffff", metalness: 0, roughness: .02, clearcoat: 1, clearcoatRoughness: .02, ior: 1.33,
      transparent: true, opacity: 1, envMapIntensity: 2.6, depthWrite: false });
    water.onBeforeCompile = shader => {
      shader.fragmentShader = shader.fragmentShader.replace("#include <color_fragment>", `
        #include <color_fragment>
        float rim=pow(1.-clamp(dot(normalize(vNormal),normalize(vViewPosition)),0.,1.),1.6);
        diffuseColor.rgb=mix(vec3(.90,.95,.96),vec3(.22,.32,.36),rim);
        diffuseColor.a=mix(.20,.92,rim);
      `);
    };
    this.drops = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 16, 12), water, total);
    this.drops.frustumCulled = false; this.drops.castShadow = true;
    for (let n = 0; this.dropSeeds.length < total && n < total * 60; n++) {
      const x = (rand(n * 3 + 711) - .5) * TILE.width, z = (rand(n * 3 + 712) - .5) * TILE.depth;
      const surface = topSurface(x, z); if (!surface || surface.ny < .8) continue;
      const moss = mossHeight(x, z), ice = iceAt(x, z), d = delayAt(x, z);
      const onMoss = moss > .03;
      if (onMoss ? rand(n + 5) > .1 : d < COVER + .02) continue;
      /* the core of the ice never melts: no drops under it; most drops sit in the band the ice gives up */
      if (ice.t < .5) continue;
      if (!onMoss && ice.t > 1.25 && rand(n + 9) > .38) continue;
      const big = rand(n + 13);
      const size = onMoss ? .008 + big * .01 : .013 + big * big * big * .06;
      const at = onMoss ? seedDelay(x, z) + .2 : THREE.MathUtils.clamp(.06 + Math.max(0, 1 - ice.t) * 1.7 + .1, .1, .7) * (ice.t < 1 ? 1 : .6 + rand(n + 4) * .5);
      this.dropSeeds.push({ p: new THREE.Vector3(x, surface.y + (onMoss ? moss + .045 : 0), z), size, at, flat: onMoss ? .8 : .42 });
    }
    this.drops.count = this.dropSeeds.length;
    this.world.add(this.drops);
  }

  resize(width: number, height: number) {
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    const dpr = this.renderer.getPixelRatio();
    this.rt.setSize(Math.round(width * dpr), Math.round(height * dpr));
    this.post.uniforms.uPixel.value.set(1 / (width * dpr), 1 / (height * dpr));
  }

  render(progress: number, time: number) {
    if (!this.ready || this.disposed) return;
    this.growth.value = progress;
    this.clock.value = this.reduced ? 0 : time;
    // The slab stays composed; only living elements move.
    for (const flower of this.flowers) {
      const stem = smooth(flower.delay, flower.delay + .14, progress);
      const bloom = smooth(flower.delay + .09, flower.delay + .26, progress);
      flower.group.scale.setScalar(Math.max(.0001, stem));
      flower.group.rotation.z = this.reduced ? 0 : Math.sin(time * 1.25 + flower.seed) * .022 * stem;
      for (const petal of flower.petals) petal.rotation.x = -1.32 * (1 - bloom) + (petal.userData.open as number) * bloom;
    }
    const dummy = this.dummy;
    this.dropSeeds.forEach((drop, i) => {
      const g = smooth(drop.at, drop.at + .2, progress);
      dummy.position.copy(drop.p);
      dummy.scale.setScalar(Math.max(.00001, drop.size * g));
      dummy.scale.y *= drop.flat; dummy.updateMatrix(); this.drops.setMatrixAt(i, dummy.matrix);
    });
    this.drops.instanceMatrix.needsUpdate = true;
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
    this.scene.environment = null; this.env?.dispose(); this.env = null;
    this.key.shadow.map?.dispose(); this.rt.dispose(); this.quad.dispose(); this.post.dispose();
    this.renderer.dispose(); this.renderer.forceContextLoss();
  }
}
