import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { FullScreenQuad } from "three/examples/jsm/postprocessing/Pass.js";
import { TILE, FRONT, DRAPE, rand, seedDelay, meltDelay, GARDEN_DELAY_GLSL, topSurface, rimSurface, anchorAt, mossAt, mossFast, iceAt, fbm, type Anchor } from "./gardenSurface";

const smooth = (a: number, b: number, x: number) => THREE.MathUtils.smoothstep(x, a, b);

/** A thick slab of frosted glass seen in three-quarter view. It starts cold: ice along one edge, frost and leaf shadows
    on bare glass. As the portfolio loads the ice melts and leaves condensation, and from the warm corner moss takes the
    slab: cushions, a short pile, then flowers that stand taller than the edge.
    v60: at 100 % the whole solid is overgrown, walls included; the look of the reference is the middle of the run.
    No network assets: this scene must be cheaper to load than the scene it introduces. */
export class NatureScene {
  get isReady() { return this.ready; }
  readonly renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(23, 1, 1, 40);
  private world = new THREE.Group();
  private rt: THREE.WebGLRenderTarget;
  private pollen: THREE.ShaderMaterial | null = null;
  private env: THREE.WebGLRenderTarget | null = null;
  private quad: FullScreenQuad;
  private post: THREE.ShaderMaterial;
  private growth = { value: 0 };
  private clock = { value: 0 };
  private flowers: { group: THREE.Group; petals: THREE.Mesh[]; delay: number; seed: number }[] = [];
  private drops!: THREE.InstancedMesh;
  private dropSeeds: { p: THREE.Vector3; size: number; at: number; until: number; flat: number }[] = [];
  private dummy = new THREE.Object3D();
  private key: THREE.DirectionalLight;
  private ready = false;
  private disposed = false;
  private lastShadow = -1;
  private small: boolean;
  private pointer = new THREE.Vector2();
  private tilt = new THREE.Vector2();
  private lastTime = 0;
  /** plants the next portion of the pile within a time budget; returns true when all of it stands */
  private plantMore: ((budgetMs: number) => boolean) | null = null;
  /** how long each part of the start-up took, ms: the loader must stay cheaper than what it introduces */
  readonly timings: Record<string, number> = {};

  constructor(canvas: HTMLCanvasElement, private reduced: boolean) {
    this.small = matchMedia("(max-width: 700px)").matches;
    let mark = performance.now();
    const lap = (name: string) => { const now = performance.now(); this.timings[name] = Math.round(now - mark); mark = now; };
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
    lap("renderer");
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    const room = new RoomEnvironment();
    this.env = pmrem.fromScene(room, .05);
    this.scene.environment = this.env.texture;
    this.scene.environmentIntensity = .42;
    room.dispose(); pmrem.dispose();
    lap("env");
    /* Three-quarter view from the front left with a long lens: the left and the near wall show the thickness,
       the top stays almost square, and tall flowers rise past the far edge instead of reading as dots from above. */
    const azimuth = THREE.MathUtils.degToRad(23), elevation = THREE.MathUtils.degToRad(49), distance = this.small ? 14.4 : 12.9;
    this.camera.position.set(-Math.sin(azimuth) * Math.cos(elevation) * distance, Math.sin(elevation) * distance, Math.cos(azimuth) * Math.cos(elevation) * distance);
    this.camera.lookAt(.05, -.06, .1);
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
    lap("lights");
    this.buildTile(); lap("tile");
    this.buildIce(); lap("ice");
    this.buildMoss(); lap("moss");
    this.buildGrass(); lap("grass");
    this.buildFlowers(); lap("flowers");
    this.buildDrops(); lap("drops");
    this.buildLabels();
    this.buildPollen(); lap("extras");
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
    lap("compile");
  }

  /** cursor position in the loader, −1…1 on both axes; the slab leans a little towards it */
  setPointer(x: number, y: number) { this.pointer.set(THREE.MathUtils.clamp(x, -1, 1), THREE.MathUtils.clamp(y, -1, 1)); }

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
      shader.fragmentShader = "varying vec3 vTile; varying vec3 vTileN; uniform float uGarden; uniform float uGardenTime; float gWet;\n" + shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace("#include <color_fragment>", `
        #include <color_fragment>
        float x=vTile.x,z=vTile.z;
        float delay=${GARDEN_DELAY_GLSL};
        float arrive=delay/.70*${FRONT.toFixed(3)};
        // where the moss already stands: frost and the glow of the glass give way there
        float moss=smoothstep(arrive,arrive+.16,uGarden);
        float top=smoothstep(.5,.95,abs(normalize(vTileN).y));
        // Cloudy density inside the glass.
        float cloud=.5+.5*sin(x*2.1+sin(z*2.9)*1.3)*cos(z*1.7-x*.9);
        diffuseColor.rgb*=mix(.93,1.03,cloud);
        // Walls: you look into the thickness, so they are deeper and cooler than the milky top.
        float wallTint=1.-smoothstep(.15,.85,abs(normalize(vTileN).y));
        diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.50,.64,.69),wallTint*.78);
        // A cool breath across the top towards the cold corner.
        diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.74,.86,.90),(1.-wallTint)*.34*smoothstep(1.4,-1.8,x+z));
        // Frost along the ice, fading as the slab warms up.
        float frost=(1.-smoothstep(.9,2.6,length(vec2((x+1.7)*1.25,(z+1.2)*.6))))*(1.-moss)*(1.-uGarden*.55);
        float crystal=.5+.5*sin(x*47.+sin(z*35.))*cos(z*53.);
        diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.60,.77,.83)*(1.+crystal*.2),frost*.62);
        // Matting: tiny crystals scattered over the top, denser inside the frost.
        float speck=fract(sin(dot(floor(vTile.xz*70.),vec2(12.9898,78.233)))*43758.5453);
        diffuseColor.rgb*=1.-step(.62,speck)*(.03+frost*.07)*top;
        // Foliage somewhere above, out of frame: soft leaf shadows lie across the bare glass and sway a little.
        float shade=0.;
        for(int i=0;i<9;i++){
          float fi=float(i);
          float sway=sin(uGardenTime*.45+fi*1.7)*.035;
          // two loose branches crossing the slab from the far side
          vec2 c=vec2(-.95+fi*.27+sin(fi*2.3)*.22, -.75+fi*.17+cos(fi*1.9)*.38)+vec2(sway,sway*.6);
          float a=.9+sin(fi*3.1)*.9+sway*2.;
          vec2 p=vec2(x,z)-c; p=vec2(cos(a)*p.x+sin(a)*p.y,-sin(a)*p.x+cos(a)*p.y);
          p/=vec2(.46+.12*sin(fi*5.),.17+.04*cos(fi*4.));
          // a leaf: an ellipse pinched towards both tips
          float d=length(vec2(p.x,p.y*(1.+.9*abs(p.x))));
          shade=max(shade,(1.-smoothstep(.45,1.15,d))*(.7+.3*sin(fi*7.)));
        }
        diffuseColor.rgb*=1.-shade*.26*top;
        // Where the ice has gone it leaves a film of water: darker, and much glossier than the matted glass.
        float iu=max(0.,(x+1.685)/1.7), iv=max(0.,(z+1.785)/3.0);
        float it=pow(iu,1.15)+pow(iv,1.6);
        float gone=.14+max(0.,1.-it)*.40;
        gWet=(1.-smoothstep(.95,1.2,it))*smoothstep(gone+.12,gone+.32,uGarden)*(1.-moss)*top;
        diffuseColor.rgb*=1.-gWet*.07;
        // The mound stands on the glass: a soft contact shadow runs just ahead of the moss.
        float ahead=uGarden-arrive;
        float contact=smoothstep(-.10,.0,ahead)*(1.-smoothstep(.0,.14,ahead));
        diffuseColor.rgb*=1.-contact*.2*top;
      `);
      /* cast glass is never optically flat: a slow wave in the normal makes the reflections of the room wander */
      shader.fragmentShader = shader.fragmentShader.replace("#include <roughnessmap_fragment>", `
        #include <roughnessmap_fragment>
        roughnessFactor*=mix(1.,.28,gWet);
      `);
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

  /** A sheet that lies on the slab and wraps down its walls. Every vertex stands on its anchor (a point of the solid
      and the normal there) at the height of the layer, knows the hidden rest point just under the surface and the
      growth value at which it moves: moss rises from rest, ice sinks back into it. */
  private buildSheet(opts: {
    x0: number; x1: number; z0: number; z1: number; res: number; mode: "grow" | "melt";
    sample: (x: number, z: number, anchor: Anchor) => { h: number; delay: number; shade: number };
    material: THREE.Material; tint: (shade: number, out: THREE.Color) => void;
  }) {
    const { x0, x1, z0, z1, res } = opts, n = res + 1;
    const position = new Float32Array(n * n * 3), rest = new Float32Array(n * n * 3);
    const delay = new Float32Array(n * n), colors = new Float32Array(n * n * 3), alive = new Uint8Array(n * n);
    const color = new THREE.Color();
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const k = j * n + i, x = x0 + (x1 - x0) * i / res, z = z0 + (z1 - z0) * j / res;
      const anchor = anchorAt(x, z), s = opts.sample(x, z, anchor), [px, py, pz] = anchor.p, [nx, ny, nz] = anchor.n;
      /* a vertex just outside the layer sits a little under the surface, on the continuation of the slope:
         the visible edge is then cut by the glass itself, smoothly, and not along the cells of the grid */
      const h = Math.max(-.05, s.h);
      position.set([px + nx * h, py + ny * h, pz + nz * h], k * 3);
      rest.set([px - nx * .012, py - ny * .012, pz - nz * .012], k * 3);
      if (s.h > 0) alive[k] = 1;
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
    const amount = opts.mode === "grow" ? "smoothstep(aDelay+.07,aDelay+.34,uGarden)" : "1.-smoothstep(aDelay,aDelay+.30,uGarden)";
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
      x0: -TILE.width / 2 - DRAPE, x1: -TILE.width / 2 + 1.85, z0: -TILE.depth / 2 - DRAPE, z1: -TILE.depth / 2 + 3.05,
      res: this.small ? 60 : 88, mode: "melt", material,
      /* thin edges melt first, the core of the corner last; the ice hangs over the edge and part of the way down the
         wall, thinner the lower it gets */
      sample: (_x, _z, anchor) => {
        const ice = iceAt(anchor.bx, anchor.bz), hang = 1 - smooth(.35, .8, Math.min(1, anchor.wall));
        return { h: ice.h > 0 ? ice.h * hang - (1 - hang) * .05 : ice.h, delay: meltDelay(ice.t) - Math.min(1, anchor.wall) * .05, shade: ice.h };
      },
      /* deep blue where the sheet is thin and you look into it, white crust on the ridges */
      tint: (shade, out) => out.setRGB(.50 + shade * 2.1, .74 + shade * 1.1, .90 + shade * .45),
    });
  }

  private buildMoss() {
    const material = new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 1, vertexColors: true, envMapIntensity: .25 });
    this.buildSheet({
      x0: -TILE.width / 2 - DRAPE - .1, x1: TILE.width / 2 + DRAPE + .1, z0: -TILE.depth / 2 - DRAPE - .1, z1: TILE.depth / 2 + DRAPE + .1,
      res: this.small ? 76 : 106, mode: "grow", material,
      /* the front runs over the top first and then creeps down each wall */
      sample: (x, z, anchor) => {
        const h = mossAt(x, z, anchor);
        return { h, delay: seedDelay(anchor.bx, anchor.bz) + Math.min(1, anchor.wall) * .07, shade: Math.max(0, h) + fbm(x * 6, z * 6) * .08 };
      },
      /* dark in the creases between cushions, greener on their crowns */
      tint: (shade, out) => out.setRGB(.014 + shade * .07, .030 + shade * .14, .006 + shade * .02),
    });
  }

  private buildGrass() {
    /* a short pile: three rows of vertices are enough, and that pays for covering the whole solid */
    const geo = new THREE.PlaneGeometry(1, 1, 1, 2);
    geo.translate(0, .5, 0);
    const positions = geo.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const y = positions.getY(i);
      positions.setX(i, positions.getX(i) * (1 - y * .97));
      positions.setZ(i, y * y * .42);
    }
    geo.computeVertexNormals();
    const topCount = this.small ? 30000 : 56000, rimCount = this.small ? 9000 : 18000;
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
        float grow=smoothstep(aGarden.x,aGarden.x+.13,uGarden);
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
        mvPosition.xyz+=aLift*(1.-smoothstep(aGarden.x+.07,aGarden.x+.34,uGarden));
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
    geo.setAttribute("aGarden", new THREE.InstancedBufferAttribute(seeds, 2));
    geo.setAttribute("aLift", new THREE.InstancedBufferAttribute(lifts, 3));
    /* Planting 74 000 blades is about a microsecond each whatever you do, 80 ms in one go. The slab starts bare, so
       only the first portion is planted now; render() plants the rest a few milliseconds a frame, and each portion
       is uploaded as a range, not as the whole buffer again. */
    let i = 0, n = 0;
    const plant = (budgetMs: number) => {
      const started = performance.now(), from = i;
      for (; i < count && n < count * 6; n++) {
      if (i > from && (i & 511) === 0 && performance.now() - started > budgetMs) break;
      const rim = i >= topCount;
      let x: number, y: number, z: number, delay: number, knob = .5;
      if (rim) {
        /* the walls: from the upper shoulder to the lower lip, standing out of the carpet that covers them */
        const s = rimSurface(rand(n * 7 + 1), rand(n * 7 + 2) * .92);
        /* a cheap random here: fractal noise for every wall blade cost 25 ms at start-up */
        const thick = .05 + rand(n * 7 + 11) * .03;
        x = s.x + s.nx * thick; y = s.y + s.ny * thick; z = s.z + s.nz * thick;
        lifts.set([-s.nx * (thick + .012), -s.ny * (thick + .012), -s.nz * (thick + .012)], i * 3);
        /* wall shoots curl outward and up, rather than sticking out like a comb */
        normal.set(s.nx, Math.max(.25, s.ny + .45), s.nz).normalize();
        delay = seedDelay(s.x, s.z) + .05 + Math.max(0, -s.y) * .2;
        knob = .25 + rand(n * 7 + 10) * .7;
      } else {
        x = (rand(n * 7 + 1) - .5) * TILE.width; z = (rand(n * 7 + 2) - .5) * TILE.depth;
        const surface = topSurface(x, z);
        if (!surface) continue;
        /* height, slope and knob come from a table built once: see mossFast */
        const moss = mossFast(x, z), h = moss.h, px = x, pz = z;
        const nx = surface.nx, ny = surface.ny, nz = surface.nz;
        x = px + nx * h; y = surface.y + ny * h; z = pz + nz * h;
        lifts.set([-nx * (h + .012), -ny * (h + .012), -nz * (h + .012)], i * 3);
        normal.set(-moss.hx + nx, ny, -moss.hz + nz).normalize();
        delay = seedDelay(px, pz);
        knob = moss.knob;
      }
      const r = rand(n * 7 + 3), tuft = rand(n * 7 + 9) > .978;
      /* short velvet almost everywhere, with a few longer bright blades standing out of it */
      const height = tuft ? .08 + r * .1 : rim ? .035 + r * .055 : .018 + r * r * .036;
      dummy.position.set(x + normal.x * .002, y + normal.y * .002, z + normal.z * .002);
      dummy.quaternion.setFromUnitVectors(up, normal);
      spin.setFromAxisAngle(up, rand(n * 7 + 4) * Math.PI * 2); dummy.quaternion.multiply(spin);
      dummy.scale.set(.009 + rand(n * 7 + 5) * .012, height, height);
      dummy.updateMatrix(); grass.setMatrixAt(i, dummy.matrix);
      /* dark in the creases, fresh on the crowns of the knobs */
      color.setHSL(.225 + rand(n * 7 + 6) * .05 - knob * .03 - (tuft ? .03 : 0), .5 + knob * .22, (tuft ? .16 : .032 + knob * .125) + r * .05);
      grass.setColorAt(i, color);
      seeds[i * 2] = delay + rand(n + 19) * .025;
      seeds[i * 2 + 1] = rand(n + 70);
      i++;
      }
      grass.count = i;
      const added = i - from;
      for (const attribute of [grass.instanceMatrix, grass.instanceColor, geo.getAttribute("aGarden"), geo.getAttribute("aLift")] as (THREE.BufferAttribute | null)[]) {
        if (!attribute || !added) continue;
        attribute.addUpdateRange(from * attribute.itemSize, added * attribute.itemSize);
        attribute.needsUpdate = true;
      }
      return i >= count || n >= count * 6;
    };
    if (!plant(10)) this.plantMore = plant;
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
    const petalMat = (hex: string) => new THREE.MeshStandardMaterial({ color: hex, roughness: .6, side: THREE.DoubleSide, envMapIntensity: .4 });
    const ivory = petalMat("#fff4d8");
    /* a ranunculus deepens towards its heart: pale outer petals, red-orange inside */
    const orange = [petalMat("#f6a03c"), petalMat("#ee7a22"), petalMat("#dc5518"), petalMat("#c9440f")];
    const stemMat = new THREE.MeshStandardMaterial({ color: "#35581f", roughness: .9, envMapIntensity: .3 });
    const coreMat = new THREE.MeshStandardMaterial({ color: "#d6a52c", roughness: .94, envMapIntensity: .3 });
    const budMat = new THREE.MeshStandardMaterial({ color: "#e0641c", roughness: .7, envMapIntensity: .3 });
    const coreGeo = new THREE.SphereGeometry(.043, 12, 8);
    const leafGeo = new THREE.SphereGeometry(1, 8, 6);
    /* orange flowers and a bud stand at the warm edge and lean out past it, as in the reference; daisies dot the moss */
    const spots: { x: number; z: number; accent: number }[] = [
      { x: 1.34, z: -.18, accent: 0 }, { x: 1.43, z: .30, accent: 1 }, { x: 1.26, z: .78, accent: 2 }, { x: 1.40, z: .02, accent: 3 },
    ];
    for (let n = 0; spots.length < 20 && n < 1500; n++) {
      const x = (rand(n * 9 + 211) - .5) * 2.75, z = (rand(n * 9 + 212) - .5) * 2.95;
      /* daisies grow in loose drifts, not as an even polka dot */
      if (fbm(x * 1.3 + 20, z * 1.3 + 4) < .52 || spots.some(s => Math.hypot(s.x - x, s.z - z) < .2)) continue;
      spots.push({ x, z, accent: -1 });
    }
    spots.forEach(({ x, z, accent: slot }, i) => {
      const accent = slot >= 0, bud = slot === 3;
      const height = accent ? [.62, .80, .50, .46][slot] : .11 + rand(i + 80) * .13;
      const anchor = anchorAt(x, z), h = mossAt(x, z, anchor) * .8;
      const group = new THREE.Group(); group.position.set(anchor.p[0] + anchor.n[0] * h, anchor.p[1] + anchor.n[1] * h, anchor.p[2] + anchor.n[2] * h);
      /* accents lean outwards over the edge */
      const bend = accent ? .16 + slot * .04 : (rand(i + 31) - .5) * .12;
      const path = new THREE.QuadraticBezierCurve3(new THREE.Vector3(), new THREE.Vector3(-bend * .4, height * .6, .015), new THREE.Vector3(bend, height, 0));
      const stem = new THREE.Mesh(new THREE.TubeGeometry(path, 9, accent ? .009 : .005, 5, false), stemMat);
      stem.castShadow = true; group.add(stem);
      for (let j = 0; j < 2; j++) {
        const leaf = new THREE.Mesh(leafGeo, stemMat);
        leaf.position.set(j ? -.02 : .035, height * (.3 + j * .2), 0);
        leaf.scale.set(accent ? .075 : .045, .008, accent ? .026 : .018); leaf.rotation.z = j ? -.6 : .6;
        leaf.castShadow = true; group.add(leaf);
      }
      const head = new THREE.Group(); head.position.set(bend, height, 0);
      /* heads tip towards the camera a little, so the corolla reads in three-quarter view */
      head.rotation.set(accent ? .55 : .3, i * 1.17, accent ? -.35 : -.17); group.add(head);
      const petals: THREE.Mesh[] = [];
      if (bud) {
        const closed = new THREE.Mesh(coreGeo, budMat); closed.scale.set(.9, 1.5, .9); closed.position.y = .03; closed.castShadow = true; head.add(closed);
        const calyx = new THREE.Mesh(coreGeo, stemMat); calyx.scale.set(.75, .6, .75); calyx.castShadow = true; head.add(calyx);
      } else {
        const core = new THREE.Mesh(coreGeo, coreMat); core.scale.set(accent ? .7 : 1, .55, accent ? .7 : 1); core.castShadow = true; head.add(core);
        const layers = accent ? 4 : 1, amount = accent ? 8 : 10;
        for (let layer = 0; layer < layers; layer++) for (let j = 0; j < amount; j++) {
          const pivot = new THREE.Group(); pivot.rotation.y = j / amount * Math.PI * 2 + layer * .42;
          head.add(pivot);
          const petal = new THREE.Mesh(petalGeo, accent ? orange[layer] : ivory);
          petal.scale.setScalar(accent ? .82 - layer * .16 : .27 + rand(i + 1) * .12);
          petal.position.y = layer * .01; petal.castShadow = petal.receiveShadow = true;
          /* inner rings stay cupped: that is what makes a ranunculus and not a daisy */
          petal.userData.open = accent ? [.02, -.34, -.66, -.95][layer] : .1;
          pivot.add(petal); petals.push(petal);
        }
      }
      this.flowers.push({ group, petals, delay: seedDelay(x, z) + .1, seed: i });
      this.world.add(group);
    });
  }

  /** Condensation on the bare glass, thickest along the retreating ice; it goes when the moss arrives.
      A little dew stays on the moss itself. */
  /** Small engraved captions along the four edges, as on the reference, with our own words: the run goes from cold to
      warm and from quiet to alive. They lie on the glass, so the ice hides some of them at first and the moss takes
      them all in the end. */
  private buildLabels() {
    const canvas = document.createElement("canvas");
    canvas.width = 1024; canvas.height = Math.round(1024 * TILE.depth / TILE.width);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 4;
    const draw = () => {
      const ctx = canvas.getContext("2d")!;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.font = '700 27px Manrope, "Segoe UI", sans-serif';
      (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = "7px";
      ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = "#1f3138";
      const put = (text: string, u: number, v: number, turn: number) => {
        ctx.save(); ctx.translate(u * canvas.width, v * canvas.height); ctx.rotate(turn); ctx.fillText(text, 0, 0); ctx.restore();
      };
      put("COLD", .60, .085, 0); put("WARM", .40, .918, 0);
      put("QUIET", .082, .56, -Math.PI / 2); put("ALIVE", .920, .44, Math.PI / 2);
      texture.needsUpdate = true;
    };
    draw();
    /* the page font may arrive after the scene: draw again with it */
    void document.fonts?.ready.then(() => { if (!this.disposed) draw(); });
    const labels = new THREE.Mesh(new THREE.PlaneGeometry(TILE.width, TILE.depth),
      new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity: .78, depthWrite: false }));
    labels.rotation.x = -Math.PI / 2; labels.position.y = .003;
    this.world.add(labels);
  }

  /** Pollen in the light above the warm corner, once it blooms: a few dozen soft specks that rise and drift. */
  private buildPollen() {
    if (this.reduced) return;
    const count = this.small ? 28 : 52;
    const base = new Float32Array(count * 3), seed = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      base.set([-.5 + rand(i * 3 + 3101) * 2.1, .12, -1.0 + rand(i * 3 + 3102) * 2.4], i * 3);
      seed[i] = rand(i * 3 + 3103);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(base, 3));
    geometry.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    this.pollen = new THREE.ShaderMaterial({
      uniforms: { uGarden: this.growth, uGardenTime: this.clock, uSize: { value: 6 } },
      vertexShader: `
        uniform float uGarden, uGardenTime, uSize; attribute float aSeed; varying float vAlpha;
        void main(){
          float life=fract(uGardenTime*(.035+aSeed*.03)+aSeed*7.);
          vec3 p=position+vec3(sin(uGardenTime*.31+aSeed*40.)*.16, life*1.25, cos(uGardenTime*.27+aSeed*23.)*.16);
          vec4 mv=modelViewMatrix*vec4(p,1.);
          gl_Position=projectionMatrix*mv;
          gl_PointSize=uSize*(.55+aSeed*.7)*(12.9/-mv.z);
          // born softly, gone softly, and only once the corner is in bloom
          vAlpha=smoothstep(0.,.18,life)*(1.-smoothstep(.7,1.,life))*smoothstep(.42,.7,uGarden);
        }`,
      fragmentShader: `
        varying float vAlpha;
        void main(){
          float d=length(gl_PointCoord-.5);
          float a=(1.-smoothstep(.12,.5,d))*vAlpha*.7;
          gl_FragColor=vec4(vec3(1.,.93,.70)*2.4,a);
        }`,
      transparent: true, depthWrite: false,
    });
    const points = new THREE.Points(geometry, this.pollen);
    points.frustumCulled = false;
    this.world.add(points);
  }

  private buildDrops() {
    const glass = this.small ? 260 : 480, dew = this.small ? 40 : 80, total = glass + dew;
    /* A drop on white glass is a lens: clear in the middle, a dark rim where it bends the view, one hard highlight.
       Faked with view-dependent alpha and colour; real transmission would render the whole scene a second time. */
    const water = new THREE.MeshPhysicalMaterial({ color: "#ffffff", metalness: 0, roughness: .02, clearcoat: 1, clearcoatRoughness: .02, ior: 1.33,
      transparent: true, opacity: 1, envMapIntensity: 2.6, depthWrite: false });
    water.onBeforeCompile = shader => {
      shader.fragmentShader = shader.fragmentShader.replace("#include <color_fragment>", `
        #include <color_fragment>
        float rim=pow(1.-clamp(dot(normalize(vNormal),normalize(vViewPosition)),0.,1.),1.6);
        diffuseColor.rgb=mix(vec3(.88,.94,.95),vec3(.16,.25,.29),rim);
        diffuseColor.a=mix(.24,.95,rim);
      `);
    };
    this.drops = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 12, 8), water, total);
    this.drops.frustumCulled = false; this.drops.castShadow = true;
    for (let n = 0; this.dropSeeds.length < glass && n < glass * 40; n++) {
      const x = (rand(n * 3 + 711) - .5) * TILE.width, z = (rand(n * 3 + 712) - .5) * TILE.depth;
      const surface = topSurface(x, z); if (!surface || surface.ny < .8) continue;
      const ice = iceAt(x, z), arrive = seedDelay(x, z);
      /* most drops sit in the band the ice gives up; far from it the glass is only lightly fogged */
      if (ice.t > 1.35 && rand(n + 9) > .4) continue;
      /* under the ice a drop is born when the ice above it goes, elsewhere soon after the start */
      const at = ice.t < 1 ? meltDelay(ice.t) + .16 : .04 + rand(n + 4) * .22;
      if (arrive < at + .1) continue;
      const big = rand(n + 13);
      /* condensation: a haze of tiny beads and a few fat drops that have run together */
      this.dropSeeds.push({ p: new THREE.Vector3(x, surface.y, z), size: .009 + Math.pow(big, 5) * .075, at, until: arrive, flat: .42 });
    }
    for (let n = 0; this.dropSeeds.length < total && n < dew * 40; n++) {
      const x = (rand(n * 3 + 1711) - .5) * TILE.width, z = (rand(n * 3 + 1712) - .5) * TILE.depth;
      const surface = topSurface(x, z); if (!surface || surface.ny < .8) continue;
      const h = mossAt(x, z);
      this.dropSeeds.push({ p: new THREE.Vector3(x, surface.y + h + .03, z), size: .008 + rand(n + 13) * .011, at: seedDelay(x, z) + .28, until: 9, flat: .8 });
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
    /* specks keep their size relative to the slab, whatever the canvas is */
    if (this.pollen) this.pollen.uniforms.uSize.value = Math.max(2.5, height * dpr / 150);
  }

  render(progress: number, time: number) {
    if (!this.ready || this.disposed) return;
    if (this.plantMore?.(6)) this.plantMore = null;
    this.growth.value = progress;
    this.clock.value = this.reduced ? 0 : time;
    /* The slab hovers, so it may breathe: a slow float, and a lean towards the cursor. Both are tiny, the composition
       holds. With reduced motion it stays still. */
    if (!this.reduced) {
      const dt = Math.min(.05, Math.max(0, time - this.lastTime)); this.lastTime = time;
      this.tilt.lerp(this.pointer, 1 - Math.exp(-dt * 3.2));
      this.world.position.y = Math.sin(time * .9) * .022;
      this.world.rotation.x = Math.sin(time * .7 + 1.3) * .008 + this.tilt.y * .05;
      this.world.rotation.z = Math.cos(time * .6) * .008 - this.tilt.x * .05;
    }
    for (const flower of this.flowers) {
      const stem = smooth(flower.delay, flower.delay + .14, progress);
      const bloom = smooth(flower.delay + .09, flower.delay + .26, progress);
      flower.group.scale.setScalar(Math.max(.0001, stem));
      flower.group.rotation.z = this.reduced ? 0 : Math.sin(time * 1.25 + flower.seed) * .022 * stem;
      for (const petal of flower.petals) petal.rotation.x = -1.32 * (1 - bloom) + (petal.userData.open as number) * bloom;
    }
    const dummy = this.dummy;
    this.dropSeeds.forEach((drop, i) => {
      const g = smooth(drop.at, drop.at + .2, progress) * (1 - smooth(drop.until - .03, drop.until + .05, progress));
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
