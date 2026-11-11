// ESCRIBA — Motor "RELEVO" (2,5D): placas de argila em baixo-relevo, iluminadas por luzes móveis
// com sombra própria calculada no mapa de altura (sem geometria pesada).
import * as THREE from 'three';

// ---------- utilidades ----------
export const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const ease = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
export const easeInOut = (t) => { t = clamp(t, 0, 1); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
export function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
export const gray = (h) => { const v = Math.round(clamp(h, 0, 1) * 255); return `rgb(${v},${v},${v})`; };

// ---------- Camada de pintura de altura ----------
// Coordenadas em unidades de mundo, origem no canto inferior esquerdo, y para cima.
export class Layer {
  constructor(wWorld, hWorld, ppu) {
    this.w = wWorld; this.h = hWorld; this.ppu = ppu;
    this.W = Math.round(wWorld * ppu); this.H = Math.round(hWorld * ppu);
    this.c = document.createElement('canvas'); this.c.width = this.W; this.c.height = this.H;
    this.x = this.c.getContext('2d', { willReadFrequently: true });
    this.x.fillStyle = '#000'; this.x.fillRect(0, 0, this.W, this.H);
    this.t = document.createElement('canvas'); this.t.width = this.W; this.t.height = this.H;
    this.tx = this.t.getContext('2d');
  }
  world(ctx) { ctx.setTransform(this.ppu, 0, 0, -this.ppu, 0, this.H); }
  // forma em relevo: fill com cinza h, bordas arredondadas por desfoque (px)
  raise(draw, h, blurPx = 2, mode = 'lighten') {
    const t = this.tx; t.setTransform(1, 0, 0, 1, 0, 0); t.clearRect(0, 0, this.W, this.H);
    this.world(t); t.fillStyle = gray(h); t.strokeStyle = gray(h); draw(t);
    const x = this.x; x.save(); x.setTransform(1, 0, 0, 1, 0, 0);
    x.filter = blurPx > 0 ? `blur(${blurPx}px)` : 'none'; x.globalCompositeOperation = mode;
    x.drawImage(this.t, 0, 0); x.restore();
  }
  // forma que REBAIXA para um nível (ex.: aplainar fundo) — usa darken
  lower(draw, h, blurPx = 2) { this.raise(draw, h, blurPx, 'darken'); }
  // incisão: multiplica a altura local (depth 0..1 = quanto afunda)
  incise(draw, depth = 0.25, blurPx = 0.8) {
    const t = this.tx; t.setTransform(1, 0, 0, 1, 0, 0); t.fillStyle = '#fff'; t.fillRect(0, 0, this.W, this.H);
    this.world(t); t.fillStyle = gray(1 - depth); t.strokeStyle = gray(1 - depth); draw(t);
    const x = this.x; x.save(); x.setTransform(1, 0, 0, 1, 0, 0);
    x.filter = blurPx > 0 ? `blur(${blurPx}px)` : 'none'; x.globalCompositeOperation = 'multiply';
    x.drawImage(this.t, 0, 0); x.restore();
  }
  // somar altura (ex.: relevo sobre relevo)
  add(draw, h, blurPx = 2) { this.raise(draw, h, blurPx, 'lighter'); }
  // carimbar outra Layer (figura) nesta, em x,y de mundo (canto inferior esquerdo da figura)
  stamp(L, x, y, mode = 'lighten') {
    const X = this.x; X.save(); X.setTransform(1, 0, 0, 1, 0, 0); X.globalCompositeOperation = mode;
    X.drawImage(L.c, Math.round(x * this.ppu), Math.round(this.H - (y + L.h) * this.ppu)); X.restore();
  }
  data() { return this.x.getImageData(0, 0, this.W, this.H).data; }
}

// Máscara auxiliar (emissão, alpha, ordem de revelação) desenhada no mesmo sistema de coordenadas
export class Mask {
  constructor(L) { this.L = L; this.c = document.createElement('canvas'); this.c.width = L.W; this.c.height = L.H; this.x = this.c.getContext('2d', { willReadFrequently: true }); this.x.fillStyle = '#000'; this.x.fillRect(0, 0, L.W, L.H); }
  draw(fn, v = 1, blurPx = 0, mode = 'lighten') {
    const x = this.x; x.save(); x.filter = blurPx ? `blur(${blurPx}px)` : 'none'; x.globalCompositeOperation = mode;
    this.L.world(x); x.fillStyle = gray(v); x.strokeStyle = gray(v); fn(x); x.restore();
  }
  data() { return this.x.getImageData(0, 0, this.L.W, this.L.H).data; }
}

// ---------- ruído ----------
function hash2(x, y, s) { let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
function vnoise(x, y, s) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi, s), b = hash2(xi + 1, yi, s), c = hash2(xi, yi + 1, s), d = hash2(xi + 1, yi + 1, s);
  return lerp(lerp(a, b, u), lerp(c, d, u), v);
}
export function fbm(x, y, s = 1, oct = 4) { let a = 0.5, f = 1, t = 0; for (let i = 0; i < oct; i++) { t += a * vnoise(x * f, y * f, s + i * 17); a *= 0.5; f *= 2.03; } return t; }

// ---------- conversão para textura float ----------
function boxBlur(src, W, H, r) {
  const tmp = new Float32Array(W * H), out = new Float32Array(W * H), n = 2 * r + 1;
  for (let y = 0; y < H; y++) { let acc = 0; const o = y * W;
    for (let x = -r; x <= r; x++) acc += src[o + clamp(x, 0, W - 1)];
    for (let x = 0; x < W; x++) { tmp[o + x] = acc / n; acc += src[o + Math.min(W - 1, x + r + 1)] - src[o + Math.max(0, x - r)]; } }
  for (let x = 0; x < W; x++) { let acc = 0;
    for (let y = -r; y <= r; y++) acc += tmp[clamp(y, 0, H - 1) * W + x];
    for (let y = 0; y < H; y++) { out[y * W + x] = acc / n; acc += tmp[Math.min(H - 1, y + r + 1) * W + x] - tmp[Math.max(0, y - r) * W + x]; } }
  return out;
}

let FLOAT_LINEAR = true; let RENDERER = null;
export function setRenderer(r) { RENDERER = r; FLOAT_LINEAR = r.extensions.has('OES_texture_float_linear'); }

function makeTex(rgba, W, H) {
  let tex;
  if (FLOAT_LINEAR) tex = new THREE.DataTexture(rgba, W, H, THREE.RGBAFormat, THREE.FloatType);
  else { const hf = new Uint16Array(rgba.length); for (let i = 0; i < rgba.length; i++) hf[i] = THREE.DataUtils.toHalfFloat(rgba[i]); tex = new THREE.DataTexture(hf, W, H, THREE.RGBAFormat, THREE.HalfFloatType); }
  tex.flipY = false;
  tex.minFilter = THREE.LinearFilter; tex.magFilter = THREE.LinearFilter; tex.generateMipmaps = false;
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping; tex.needsUpdate = true; return tex;
}

// Gera a textura de altura (R=h suave, G=h desfocada p/ cavidade, B=máscara extra, A=alpha)
export function heightTexture(L, { noiseAmp = 0.03, noiseScale = 3, seed = 1, extra = null, extraBlur = 0, halo = 0.45, alpha = null, alphaFromH = 0, smooth = 2, cavR = 0 } = {}) {
  const W = L.W, H = L.H, d = L.data(); const N = W * H; const h = new Float32Array(N);
  for (let i = 0; i < N; i++) h[i] = d[i * 4] / 255;
  let hs = boxBlur(h, W, H, 1); if (smooth > 1) hs = boxBlur(hs, W, H, smooth - 1);
  // irregularidade de "feito à mão"
  if (noiseAmp > 0) { const sx = noiseScale / L.ppu; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = y * W + x; hs[i] += (fbm(x * sx, y * sx, seed, 4) - 0.5) * noiseAmp; } }
  const R = cavR || Math.max(4, Math.round(L.ppu * 0.06));
  const hb = boxBlur(boxBlur(hs, W, H, R), W, H, R);
  const ex = extra ? extra.data() : null; let exf = null;
  if (ex) { exf = new Float32Array(N); for (let i = 0; i < N; i++) exf[i] = ex[i * 4] / 255; if (extraBlur) { const bl = boxBlur(boxBlur(exf, W, H, extraBlur), W, H, extraBlur); for (let i = 0; i < N; i++) exf[i] = Math.max(exf[i], bl[i] * halo); } }
  const al = alpha ? alpha.data() : null;
  const out = new Float32Array(N * 4);
  for (let i = 0; i < N; i++) {
    const y = (i / W) | 0, x = i - y * W, o = ((H - 1 - y) * W + x) * 4; // vira as linhas: canvas (y p/ baixo) → uv (y p/ cima)
    out[o] = hs[i]; out[o + 1] = hb[i]; out[o + 2] = exf ? exf[i] : 0;
    let a = 1; if (al) a = al[i * 4] / 255; else if (alphaFromH > 0) a = clamp((h[i] - alphaFromH * 0.5) / (alphaFromH * 0.5), 0, 1);
    out[o + 3] = a;
  }
  return makeTex(out, W, H);
}

// textura de cor (albedo) de um canvas
export function colorTexture(canvas) { const t = new THREE.CanvasTexture(canvas); t.colorSpace = THREE.SRGBColorSpace; t.minFilter = THREE.LinearFilter; t.generateMipmaps = false; return t; }

// ---------- textura de detalhe (digitais, espátula, poros) ----------
let DETAIL = null;
export function detailTexture() {
  if (DETAIL) return DETAIL;
  const S = 1024, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d');
  x.fillStyle = 'rgb(128,128,128)'; x.fillRect(0, 0, S, S); const r = rng(7);
  for (let i = 0; i < 9000; i++) { const v = 100 + r() * 56; x.fillStyle = `rgba(${v},${v},${v},0.5)`; const s = 1 + r() * 3; x.beginPath(); x.arc(r() * S, r() * S, s, 0, 7); x.fill(); }
  x.lineWidth = 1.2;
  for (let i = 0; i < 90; i++) { // impressões digitais
    const cx = r() * S, cy = r() * S, rot = r() * 3.14, k = 0.55 + r() * 0.3;
    for (let j = 3; j < 26; j += 2.2) { const v = r() < 0.5 ? 108 : 150; x.strokeStyle = `rgba(${v},${v},${v},0.45)`; x.beginPath(); x.ellipse(cx, cy, j, j * k, rot, 0.2 + r(), 5.6 + r() * 0.6); x.stroke(); }
  }
  for (let i = 0; i < 60; i++) { // espátula
    const cx = r() * S, cy = r() * S, a = r() * 3.14, l = 40 + r() * 120; x.strokeStyle = `rgba(${r() < 0.5 ? 100 : 160},${120},${120},0.35)`; x.lineWidth = 6 + r() * 14;
    x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + Math.cos(a) * l, cy + Math.sin(a) * l); x.stroke();
  }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true;
  t.userData.keep = true; DETAIL = t; return t;
}

// ---------- shader da placa ----------
const VERT = /* glsl */`
varying vec2 vUv; varying vec3 vWorld;
void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position,1.0); vWorld = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;

const FRAG = /* glsl */`
precision highp float;
uniform sampler2D hTex; uniform sampler2D hTex2; uniform float press; uniform float useH2;
uniform sampler2D colTex; uniform float useCol; uniform sampler2D inkTex; uniform float useInk; uniform float reveal;
uniform sampler2D detTex; uniform float detRep; uniform float detAmp;
uniform vec2 texel; uniform vec2 size; uniform float hScale; uniform mat4 invModel; uniform mat3 rotN;
uniform vec3 colLow; uniform vec3 colHigh; uniform float colVar;
uniform vec3 L1p; uniform vec3 L1c; uniform float L1r;
uniform vec3 L2p; uniform vec3 L2c; uniform float L2r;
uniform vec3 Dd; uniform vec3 Dc; uniform vec3 ambTop; uniform vec3 ambBot;
uniform vec3 emisC; uniform float emisA;
uniform vec3 fogC; uniform float fogN; uniform float fogF;
uniform float shadowLen; uniform float spec; uniform float sheen;
uniform float alphaCut; uniform float opacity;
varying vec2 vUv; varying vec3 vWorld;

float Hs(vec2 uv){ vec4 a = texture2D(hTex, uv); float h = a.r; if(useH2 > 0.5) h = mix(h, texture2D(hTex2, uv).r, press); return h; }
vec3 toLocal(vec3 p){ return (invModel * vec4(p,1.0)).xyz; }
vec2 uvOf(vec3 local){ return local.xy / size + 0.5; }

float shadow(vec3 P, vec3 Lp){
  vec3 Ll = toLocal(Lp); vec3 Pl = toLocal(P);
  vec3 d = Ll - Pl; float dist = length(d); d /= dist;
  if(d.z <= 0.001) return 0.0;
  float topZ = hScale * 1.02; float tmax = min((topZ - Pl.z) / d.z, shadowLen); tmax = min(tmax, dist);
  float occ = 1.0; const int N = 26;
  for(int i = 1; i <= N; i++){
    float t = tmax * (float(i) / float(N)); vec3 q = Pl + d * t; vec2 u = uvOf(q);
    if(u.x < 0.0 || u.x > 1.0 || u.y < 0.0 || u.y > 1.0) break;
    float hq = Hs(u) * hScale; float diff = q.z - hq;
    occ = min(occ, clamp(10.0 * diff / (t + 0.02) + 0.5, 0.0, 1.0));
    if(occ <= 0.0) break;
  }
  return occ;
}

vec3 light(vec3 P, vec3 n, vec3 v, vec3 alb, vec3 Lp, vec3 Lc, float Lr, float cav){
  vec3 L = Lp - P; float d = length(L); L /= d;
  float att = 1.0 / (1.0 + (d * d) / (Lr * Lr));
  float nd = dot(n, L); float diff = max(nd * 0.9 + 0.1, 0.0);
  float sh = (nd > -0.1) ? shadow(P, Lp) : 0.0;
  vec3 hv = normalize(L + v); float sp = pow(max(dot(n, hv), 0.0), 28.0) * spec;
  float rim = pow(1.0 - max(dot(n, v), 0.0), 3.0) * sheen * max(nd, 0.0);
  return Lc * att * sh * (alb * diff * cav + sp + rim * alb);
}

void main(){
  vec4 ht = texture2D(hTex, vUv);
  float a = ht.a * opacity; if(a < alphaCut) discard;
  float h = Hs(vUv); float hb = ht.g; if(useH2 > 0.5) hb = mix(hb, texture2D(hTex2, vUv).g, press);
  vec2 e = texel * 1.5;
  float hx = (Hs(vUv + vec2(e.x,0.0)) - Hs(vUv - vec2(e.x,0.0))) / (2.0 * e.x * size.x) * hScale;
  float hy = (Hs(vUv + vec2(0.0,e.y)) - Hs(vUv - vec2(0.0,e.y))) / (2.0 * e.y * size.y) * hScale;
  vec2 du = vUv * size * detRep; float ed = 1.0 / 1024.0;
  float d0 = texture2D(detTex, du).r; float dX = texture2D(detTex, du + vec2(ed,0.0)).r; float dY = texture2D(detTex, du + vec2(0.0,ed)).r;
  hx += (dX - d0) * detAmp * 60.0; hy += (dY - d0) * detAmp * 60.0;
  vec3 nl = normalize(vec3(-hx, -hy, 1.0)); vec3 n = normalize(rotN * nl);
  vec3 P = vWorld + n * 0.0; P += (rotN * vec3(0.0,0.0,1.0)) * (h * hScale);
  vec3 v = normalize(cameraPosition - P);
  float cav = clamp((h - hb) * 5.0 + 0.85, 0.45, 1.25);
  float nz = d0 - 0.5;
  vec3 alb = mix(colLow, colHigh, smoothstep(0.0, 0.85, h)) * (1.0 + nz * colVar);
  if(useCol > 0.5){ alb = texture2D(colTex, vUv).rgb * (1.0 + nz * colVar); }
  if(useInk > 0.5){ vec4 ink = texture2D(inkTex, vUv); float rv = (ht.b <= 0.001) ? 1.0 : step(ht.b, reveal); alb = mix(alb, ink.rgb, ink.a * rv); }
  vec3 col = vec3(0.0);
  col += light(P, n, v, alb, L1p, L1c, L1r, cav);
  col += light(P, n, v, alb, L2p, L2c, L2r, cav);
  col += Dc * alb * max(dot(n, normalize(Dd)) * 0.8 + 0.2, 0.0) * cav;
  col += mix(ambBot, ambTop, n.y * 0.5 + 0.5) * alb * cav;
  if(useInk < 0.5) col += emisC * emisA * ht.b;
  float fd = length(cameraPosition - vWorld); col = mix(col, fogC, smoothstep(fogN, fogF, fd));
  gl_FragColor = vec4(col, a);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

// cria uma placa: mesh plano com o shader de relevo
export function plate(L, tex, o = {}) {
  const u = {
    hTex: { value: tex }, hTex2: { value: o.tex2 || tex }, press: { value: 0 }, useH2: { value: o.tex2 ? 1 : 0 },
    colTex: { value: o.colTex || null }, useCol: { value: o.colTex ? 1 : 0 },
    inkTex: { value: o.inkTex || null }, useInk: { value: o.inkTex ? 1 : 0 }, reveal: { value: 1 },
    detTex: { value: detailTexture() }, detRep: { value: o.detRep ?? 0.9 }, detAmp: { value: o.detAmp ?? 0.0025 },
    texel: { value: new THREE.Vector2(1 / L.W, 1 / L.H) }, size: { value: new THREE.Vector2(L.w, L.h) },
    hScale: { value: o.hScale ?? 0.1 }, invModel: { value: new THREE.Matrix4() }, rotN: { value: new THREE.Matrix3() },
    colLow: { value: new THREE.Color(o.colLow ?? 0x6e3a22) }, colHigh: { value: new THREE.Color(o.colHigh ?? 0xb5532c) }, colVar: { value: o.colVar ?? 0.35 },
    L1p: { value: new THREE.Vector3(0, 0, 5) }, L1c: { value: new THREE.Color(0, 0, 0) }, L1r: { value: 6 },
    L2p: { value: new THREE.Vector3(0, 0, 5) }, L2c: { value: new THREE.Color(0, 0, 0) }, L2r: { value: 6 },
    Dd: { value: new THREE.Vector3(0.3, 0.5, 1) }, Dc: { value: new THREE.Color(0, 0, 0) },
    ambTop: { value: new THREE.Color(0.03, 0.04, 0.08) }, ambBot: { value: new THREE.Color(0.02, 0.015, 0.012) },
    emisC: { value: new THREE.Color(1.0, 0.62, 0.22) }, emisA: { value: 0 },
    fogC: { value: new THREE.Color(0x0e1428) }, fogN: { value: 30 }, fogF: { value: 90 },
    shadowLen: { value: o.shadowLen ?? 2.5 }, spec: { value: o.spec ?? 0.06 }, sheen: { value: o.sheen ?? 0.35 },
    alphaCut: { value: o.alphaCut ?? 0.5 }, opacity: { value: 1 },
  };
  const mat = new THREE.ShaderMaterial({ uniforms: u, vertexShader: VERT, fragmentShader: FRAG, transparent: !!o.transparent });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(L.w, L.h), mat);
  mesh.userData.plate = true;
  mesh.onBeforeRender = () => { mesh.updateMatrixWorld(); u.invModel.value.copy(mesh.matrixWorld).invert(); u.rotN.value.setFromMatrix4(mesh.matrixWorld); };
  return mesh;
}

// aplica um "rig" de luz a todas as placas de uma cena
export function lightAll(scene, rig) {
  scene.traverse((m) => { if (!m.userData.plate) return; const u = m.material.uniforms;
    if (rig.L1) { u.L1p.value.copy(rig.L1.p); u.L1c.value.copy(rig.L1.c); u.L1r.value = rig.L1.r; }
    if (rig.L2) { u.L2p.value.copy(rig.L2.p); u.L2c.value.copy(rig.L2.c); u.L2r.value = rig.L2.r; } else u.L2c.value.setRGB(0, 0, 0);
    if (rig.D) { u.Dd.value.copy(rig.D.d); u.Dc.value.copy(rig.D.c); }
    if (rig.ambTop) u.ambTop.value.copy(rig.ambTop); if (rig.ambBot) u.ambBot.value.copy(rig.ambBot);
    if (rig.fog) { u.fogC.value.copy(rig.fog.c); u.fogN.value = rig.fog.n; u.fogF.value = rig.fog.f; }
  });
}

// ---------- partículas: poeira e brasas ----------
function dotSprite() { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,255,255,0.5)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); }
let DOT = null;
export function particles({ n = 400, box = [10, 5, 4], center = [0, 0, 0], color = 0xffc890, size = 0.03, seed = 3, rise = 0.05, drift = 0.08, flicker = 0.5, opacity = 0.6 }) {
  DOT = DOT || dotSprite(); const r = rng(seed);
  const base = new Float32Array(n * 3), ph = new Float32Array(n), pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { base[i * 3] = center[0] + (r() - 0.5) * box[0]; base[i * 3 + 1] = center[1] + (r() - 0.5) * box[1]; base[i * 3 + 2] = center[2] + (r() - 0.5) * box[2]; ph[i] = r() * 100; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const m = new THREE.PointsMaterial({ map: DOT, color, size, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true });
  const p = new THREE.Points(g, m);
  p.userData.update = (t) => { for (let i = 0; i < n; i++) { const k = ph[i];
      let y = base[i * 3 + 1] + ((t * rise + k * 0.37) % box[1]); if (y > center[1] + box[1] / 2) y -= box[1];
      pos[i * 3] = base[i * 3] + Math.sin(t * 0.3 + k) * drift; pos[i * 3 + 1] = rise > 0 ? y : base[i * 3 + 1] + Math.sin(t * 0.21 + k * 1.3) * drift; pos[i * 3 + 2] = base[i * 3 + 2] + Math.cos(t * 0.25 + k) * drift * 0.5; }
    g.attributes.position.needsUpdate = true; m.opacity = opacity * (1 - flicker * 0.3 + flicker * 0.3 * Math.sin(t * 7.0)); };
  return p;
}

// ---------- chama procedural (placa aditiva) ----------
export function flame({ w = 0.35, h = 0.8, seed = 1 } = {}) {
  const mat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { t: { value: 0 }, s: { value: seed } },
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `varying vec2 vUv; uniform float t; uniform float s;
      float hs(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7))+s)*43758.5453); }
      float n(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(hs(i),hs(i+vec2(1,0)),f.x),mix(hs(i+vec2(0,1)),hs(i+vec2(1,1)),f.x),f.y); }
      void main(){ vec2 p = vUv; float q = n(vec2(p.x*4., p.y*3. - t*4.)) * 0.6 + n(vec2(p.x*9., p.y*7. - t*7.)) * 0.4;
        float x = (p.x - 0.5) * 2.0; float wdt = (1.0 - p.y) * 0.85 + 0.05; float body = 1.0 - smoothstep(wdt*0.6, wdt, abs(x + (q-0.5)*0.5*p.y));
        body *= smoothstep(0.0, 0.12, p.y) * (1.0 - smoothstep(0.45, 1.0, p.y + (q - 0.5) * 0.4));
        vec3 c = mix(vec3(1.0,0.35,0.05), vec3(1.0,0.85,0.45), body * (1.0 - p.y));
        gl_FragColor = vec4(c * body * 2.2, body); }` });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); m.userData.update = (t) => { mat.uniforms.t.value = t; }; return m;
}

// cintilação de chama (2 senoides, como na Video Bible 3.6)
export const flick = (t, s = 0) => 0.86 + 0.08 * Math.sin(t * 13 + s) + 0.06 * Math.sin(t * 29 + s * 2.1);

// ---------- céu (gradiente + brilho de fogo no horizonte) ----------
export function ceu({ w = 80, h = 30, top = 0x070b1c, mid = 0x1d2a4d, hor = 0x5a3040, glow = 0xff7a30, glowAmt = 0.6, horY = 0.3 } = {}) {
  const mat = new THREE.ShaderMaterial({ depthWrite: false, uniforms: { top: { value: new THREE.Color(top) }, mid: { value: new THREE.Color(mid) }, hor: { value: new THREE.Color(hor) }, glow: { value: new THREE.Color(glow) }, ga: { value: glowAmt }, hy: { value: horY }, t: { value: 0 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `varying vec2 vUv; uniform vec3 top, mid, hor, glow; uniform float ga, hy, t;
      float hs(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
      float n(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(hs(i),hs(i+vec2(1,0)),f.x),mix(hs(i+vec2(0,1)),hs(i+vec2(1,1)),f.x),f.y); }
      void main(){ float y = vUv.y; vec3 c = mix(hor, mid, smoothstep(hy, hy + 0.12, y)); c = mix(c, top, smoothstep(hy + 0.12, hy + 0.4, y));
        float g = exp(-pow(max(y - hy, 0.0) * 13.0, 2.0)) * (y < hy ? 1.0 : 1.0) * (0.5 + 0.5 * n(vec2(vUv.x * 18.0, t * 0.3))) * ga; c += glow * g;
        float smoke = n(vec2(vUv.x * 6.0 + t * 0.02, y * 10.0)) * smoothstep(hy, hy + 0.3, y) * (1.0 - smoothstep(hy + 0.3, 0.9, y)); c *= 1.0 - smoke * 0.25;
        gl_FragColor = vec4(c, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }` });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); m.userData.update = (tt) => { mat.uniforms.t.value = tt; }; return m;
}
