/* 26.10: подсветка за прототипом шейдером — как Ambilight у телевизора. Свет выходит из краёв экрана наружу и гаснет
   с расстоянием; цвет у каждой стороны свой (--am-l/r/t/b, их считает ambientLight в caseProto.ts по пикселям края
   экрана и плавно меняет через @property). По свету бегут мягкие лучи: шум по углу от центра экрана, сдвигается
   наружу со временем, поэтому свет «течёт», а не стоит пятном. Стороны дышат каждая в своём ритме.

   Холст маленький (четверть пикселей) и растягивается со своим размытием — свету резкость не нужна, а кадр дешёвый.
   Рисуем не чаще 30 раз в секунду и только пока блок на экране. Нет WebGL — остаются CSS-пятна (.pt-amb i). */

const VERT = `attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}`;
const FRAG = `precision mediump float;
uniform vec2 uRes;uniform vec4 uRect;uniform float uT;
uniform vec3 uL;uniform vec3 uR;uniform vec3 uTop;uniform vec3 uB;uniform vec3 uAcc;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float s=0.,a=.5;for(int i=0;i<4;i++){s+=a*n(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return s;}
void main(){
  vec2 p=gl_FragCoord.xy;
  vec2 c=uRect.xy+uRect.zw*.5;vec2 hs=uRect.zw*.5;
  vec2 q=clamp(p,uRect.xy,uRect.xy+uRect.zw);
  float d=length(p-q);
  vec2 v=(p-c)/hs;
  float a=atan(v.y,v.x);
  float span=min(uRes.x,uRes.y);
  /* лучи: шум по углу, уходит наружу со временем; вторая октава медленнее — свет не мигает, а переливается */
  /* 26.10: лучи мягче — низкая частота по углу и малый размах, свет переливается, а не полосит */
  float r=fbm(vec2(a*1.4,d/span*2.2-uT*.12));
  float r2=fbm(vec2(a*2.3+3.,d/span*1.1-uT*.05));
  float ray=.78+.36*(r+r2-1.);
  /* цвет стороны: плавное смешивание по направлению от центра (softmax по четырём осям) — без стыков на диагоналях */
  vec2 dir=normalize(v+1e-4);
  vec4 w=exp(2.2*vec4(-dir.x,dir.x,dir.y,-dir.y));
  w/=w.x+w.y+w.z+w.w;
  vec4 br=.82+.22*sin(uT*vec4(.31,.27,.23,.37)+vec4(0.,1.7,3.1,4.6));
  vec3 col=uL*w.x*br.x+uR*w.y*br.y+uTop*w.z*br.z+uB*w.w*br.w;
  /* серый край (тёмный интерфейс) светил бы грязно-серым: нейтральный цвет тянем к цвету кейса, тёмный — поднимаем */
  float lum=dot(col,vec3(.299,.587,.114));
  float chroma=max(col.r,max(col.g,col.b))-min(col.r,min(col.g,col.b));
  col=mix(col,uAcc*(.55+lum),smoothstep(.22,.02,chroma)*.75);
  col*=1.25+.6*smoothstep(.45,.1,lum);
  /* спад мягкий: широкое ядро плюс дальний ореол; у края экрана свет нарастает, а не начинается ступенькой */
  float fall=.65*exp(-d/(span*.16))+.35*exp(-d/(span*.42));
  float I=fall*ray*smoothstep(0.,span*.02,d);
  /* к краям холста — эллиптическое затухание: без прямоугольной границы */
  vec2 uv=gl_FragCoord.xy/uRes*2.-1.;
  I*=1.-smoothstep(.55,1.,length(uv*vec2(.92,.92)));
  I=clamp(I,0.,1.);
  gl_FragColor=vec4(col*I,I*.92);
}`;

type RGB = [number, number, number];
const toRGB = (s: string): RGB | null => {
  const m = s.match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const v = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
  return [v[0] / 255, v[1] / 255, v[2] / 255];
};

export function ambientShader(box: HTMLElement) {
  const host = box.querySelector<HTMLElement>(".pt-amb");
  const screen = box.querySelector<HTMLElement>(".pt-phone");
  if (!host || !screen) return null;
  const cv = document.createElement("canvas");
  cv.className = "pt-amb-gl";
  const gl = cv.getContext("webgl", { premultipliedAlpha: true, alpha: true, antialias: false, powerPreference: "low-power" });
  if (!gl) return null;
  const sh = (type: number, src: string) => { const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s); return s; };
  const prog = gl.createProgram()!;
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "a");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = (k: string) => gl.getUniformLocation(prog, k);
  const u = { res: U("uRes"), rect: U("uRect"), t: U("uT"), l: U("uL"), r: U("uR"), top: U("uTop"), b: U("uB"), acc: U("uAcc") };
  /* цвет кейса (--case, hex) — подмес для нейтральных краёв */
  const hex = getComputedStyle(box).getPropertyValue("--case").trim().match(/^#?([0-9a-f]{6})$/i)?.[1] ?? "5b8cff";
  const acc: RGB = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as RGB;
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  host.append(cv);
  host.classList.add("has-gl");

  const K = 0.25;
  let raf = 0, last = 0, colT = 0;
  const col: Record<string, RGB> = { l: [0.23, 0.26, 0.34], r: [0.23, 0.26, 0.34], t: [0.23, 0.26, 0.34], b: [0.23, 0.26, 0.34] };
  const t0 = performance.now();

  function frame(now: number) {
    raf = requestAnimationFrame(frame);
    if (now - last < 33) return;
    last = now;
    const hr = host!.getBoundingClientRect();
    if (!hr.width) return;
    const w = Math.max(2, Math.round(hr.width * K)), h = Math.max(2, Math.round(hr.height * K));
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; gl!.viewport(0, 0, w, h); }
    /* цвета краёв — из CSS (они плавно перетекают сами), читаем не каждый кадр */
    if (now - colT > 150) {
      colT = now;
      const cs = getComputedStyle(box);
      for (const k of ["l", "r", "t", "b"]) { const c = toRGB(cs.getPropertyValue(`--am-${k}`).trim()); if (c) col[k] = c; }
    }
    const sr = screen!.getBoundingClientRect();
    /* прямоугольник экрана в пикселях холста; ось Y у GL снизу вверх */
    const x = (sr.left - hr.left) * K, y = (hr.bottom - sr.bottom) * K;
    gl!.uniform2f(u.res, w, h);
    gl!.uniform4f(u.rect, x, y, sr.width * K, sr.height * K);
    gl!.uniform1f(u.t, (now - t0) / 1000);
    gl!.uniform3fv(u.acc, acc);
    gl!.uniform3fv(u.l, col.l); gl!.uniform3fv(u.r, col.r); gl!.uniform3fv(u.top, col.t); gl!.uniform3fv(u.b, col.b);
    gl!.clearColor(0, 0, 0, 0);
    gl!.clear(gl!.COLOR_BUFFER_BIT);
    gl!.drawArrays(gl!.TRIANGLES, 0, 3);
  }
  return {
    start() { if (!raf) raf = requestAnimationFrame(frame); },
    stop() { cancelAnimationFrame(raf); raf = 0; },
    destroy() { cancelAnimationFrame(raf); raf = 0; gl.getExtension("WEBGL_lose_context")?.loseContext(); cv.remove(); host.classList.remove("has-gl"); },
  };
}
