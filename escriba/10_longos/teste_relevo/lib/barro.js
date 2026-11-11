// ESCRIBA — Motor "BARRO" (3D de argila): materiais, deformação "feita à mão", personagens paramétricos e objetos
import * as THREE from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { rng, fbm } from './relevo.js';

// ---------- textura de mão (digitais + espátula) para bump ----------
let HAND = null;
export function handTex() {
  if (HAND) return HAND;
  const S = 1024, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d'); const r = rng(9);
  x.fillStyle = '#808080'; x.fillRect(0, 0, S, S);
  for (let i = 0; i < 9000; i++) { const v = 100 + r() * 56 | 0; x.fillStyle = `rgba(${v},${v},${v},0.5)`; x.beginPath(); x.arc(r() * S, r() * S, 1 + r() * 2.5, 0, 7); x.fill(); }
  x.lineWidth = 1.3;
  for (let i = 0; i < 90; i++) { const cx = r() * S, cy = r() * S, rot = r() * 3.14, k = 0.55 + r() * 0.3; for (let j = 3; j < 26; j += 2.2) { const v = r() < 0.5 ? 104 : 152; x.strokeStyle = `rgba(${v},${v},${v},0.5)`; x.beginPath(); x.ellipse(cx, cy, j, j * k, rot, 0.2 + r(), 5.6 + r() * 0.6); x.stroke(); } }
  for (let i = 0; i < 60; i++) { const cx = r() * S, cy = r() * S, a = r() * 3.14, l = 40 + r() * 120; const v = r() < 0.5 ? 100 : 160; x.strokeStyle = `rgba(${v},${v},${v},0.35)`; x.lineWidth = 6 + r() * 14; x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + Math.cos(a) * l, cy + Math.sin(a) * l); x.stroke(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 3); HAND = t; return t;
}

const MATS = new Map();
// argila fosca com brilho de cetim e marcas de dedo
export function clay(color, { bump = 0.6, rough = 0.78, sheen = 0.35 } = {}) {
  const k = `c${color}_${bump}_${rough}`; if (MATS.has(k)) return MATS.get(k);
  const col = new THREE.Color(color); const sh = col.clone().lerp(new THREE.Color(1, 1, 1), 0.35);
  const m = new THREE.MeshPhysicalMaterial({ color: col, roughness: rough, metalness: 0, sheen, sheenColor: sh, sheenRoughness: 0.6, bumpMap: handTex(), bumpScale: bump });
  MATS.set(k, m); return m;
}
export function glossy(color, { rough = 0.25, clearcoat = 0.8 } = {}) { return new THREE.MeshPhysicalMaterial({ color, roughness: rough, clearcoat, clearcoatRoughness: 0.2, bumpMap: handTex(), bumpScale: 0.2 }); }
export function metal(color, { rough = 0.38 } = {}) { return new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0.85, bumpMap: handTex(), bumpScale: 0.4 }); }

// ---------- deformação "feita à mão": une normais antes de deslocar (evita rachaduras) ----------
export function lumpify(g, amp = 0.004, freq = 9, seed = 1) {
  g.deleteAttribute('uv'); const geo = mergeVertices(g, 1e-4); geo.computeVertexNormals();
  const p = geo.attributes.position, n = geo.attributes.normal;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i); const d = (fbm(x * freq + 11, y * freq + z * freq * 0.7, seed, 3) - 0.5) * 2 * amp;
    p.setXYZ(i, x + n.getX(i) * d, y + n.getY(i) * d, z + n.getZ(i) * d);
  }
  geo.computeVertexNormals();
  // uv esférico simples para o bump
  const uv = new Float32Array(p.count * 2); for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); uv[i * 2] = Math.atan2(z, x) / (2 * Math.PI) + 0.5; uv[i * 2 + 1] = y * 1.3; }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); return geo;
}
const M = (geo, mat, cast = true) => { const m = new THREE.Mesh(geo, mat); m.castShadow = cast; m.receiveShadow = true; return m; };
export const blob = (r, mat, sx = 1, sy = 1, sz = 1, amp = 0.004, seg = 32) => { const g = new THREE.SphereGeometry(r, seg, Math.round(seg * 0.75)); g.scale(sx, sy, sz); return M(lumpify(g, amp * (r / 0.1 > 1 ? r / 0.1 : 1)), mat); };
export const capsula = (r, len, mat, amp = 0.003) => M(lumpify(new THREE.CapsuleGeometry(r, len, 8, 20), amp), mat);
export const caixa = (w, h, d, mat, amp = 0.006, seg = 6) => { const g = new THREE.BoxGeometry(w, h, d, seg, seg, seg); return M(lumpify(g, amp, 6), mat); };
export const cilindro = (r0, r1, h, mat, amp = 0.004, seg = 32) => M(lumpify(new THREE.CylinderGeometry(r0, r1, h, seg, 6), amp), mat);

// ---------- túnica em torno, com dobras verticais mais fortes perto da barra ----------
function tunica(alt, rBarra, mat, seed, curta = false) {
  const pts = []; const yb = curta ? alt * 0.42 : 0;
  const perfil = [[rBarra, yb], [rBarra * 0.92, yb + (alt - yb) * 0.25], [rBarra * 0.74, yb + (alt - yb) * 0.55], [rBarra * 0.8, yb + (alt - yb) * 0.78], [rBarra * 0.86, yb + (alt - yb) * 0.9], [rBarra * 0.55, alt * 1.0], [0.02, alt * 1.02]];
  for (let i = 0; i < perfil.length - 1; i++) for (let k = 0; k < 6; k++) { const t = k / 6, a = perfil[i], b = perfil[i + 1]; pts.push(new THREE.Vector2(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)); }
  pts.push(new THREE.Vector2(...perfil[perfil.length - 1]));
  const g = new THREE.LatheGeometry(pts, 64); const p = g.attributes.position; const r = rng(seed); const ph = r() * 6;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); const th = Math.atan2(z, x); const k = Math.pow(Math.min(1, Math.max(0, 1 - (y - yb) / (alt - yb + 1e-6))), 1.6);
    const f = 1 + 0.06 * k * Math.sin(th * 9 + ph + Math.sin(th * 3) * 0.8) + 0.02 * Math.sin(th * 17 + y * 4); p.setX(i, x * f); p.setZ(i, z * f); }
  return M(lumpify(g, 0.003, 7, seed), mat);
}

// ---------- mão: palma + 4 dedos + polegar ----------
function mao(pele) {
  const g = new THREE.Group(); const palma = blob(0.034, pele, 1.0, 0.55, 1.15, 0.002, 20); palma.position.set(0, 0, 0.018); g.add(palma);
  const dedos = [];
  for (let i = 0; i < 4; i++) { const piv = new THREE.Group(); piv.position.set(-0.024 + i * 0.016, 0, 0.05); const d = capsula(0.0075, 0.03 - Math.abs(i - 1.5) * 0.004, pele, 0.001); d.rotation.x = Math.PI / 2; d.position.z = 0.019; piv.add(d); g.add(piv); dedos.push(piv); }
  const pol = new THREE.Group(); pol.position.set(0.035, 0, 0.02); const pd = capsula(0.008, 0.025, pele, 0.001); pd.rotation.set(Math.PI / 2, 0, -0.7); pd.position.set(0.008, 0, 0.012); pol.add(pd); g.add(pol);
  g.userData.curl = (k) => { dedos.forEach(d => d.rotation.x = k * 1.3); pol.rotation.y = -k * 0.6; };
  return g;
}

// ---------- PERSONAGEM PARAMÉTRICO ----------
// spec: { seed, pele, tunica, faixa, barba:'cheia'|'curta'|'nenhuma'|'trancada', corBarba, cabelo:'turbante'|'cacheado'|'elmo'|'nenhum', corCabelo, corTurbante,
//         tinta (dedos manchados), altura, curta (túnica até o joelho), armadura, feminino }
export function personagem(sp) {
  const r = rng(sp.seed || 1); const H = sp.altura || 1; const root = new THREE.Group(); root.scale.setScalar(H);
  const pele = clay(sp.pele || 0x9a6440, { bump: 0.35 }); const roupa = clay(sp.tunica || 0xcdb48c, { bump: 0.8 }); const faixa = clay(sp.faixa || 0xb5532c, { bump: 0.7 });
  const corpo = new THREE.Group(); root.add(corpo);
  const altT = 1.08; corpo.add(tunica(altT, sp.curta ? 0.22 : 0.27, roupa, sp.seed || 1, sp.curta));
  if (sp.curta) { for (const sx of [-1, 1]) { const perna = capsula(0.042, 0.36, pele); perna.position.set(sx * 0.07, 0.24, 0); corpo.add(perna); const pe = blob(0.045, clay(0x5a3a22), 1.0, 0.45, 1.7, 0.002, 18); pe.position.set(sx * 0.07, 0.025, 0.035); corpo.add(pe); } }
  if (sp.armadura) { const arm = tunica(altT * 0.98, 0.25, clay(sp.armadura, { bump: 1.6 }), 77, true); arm.scale.set(1.04, 1, 1.04); corpo.add(arm); }
  const cinto = M(lumpify(new THREE.TorusGeometry(0.205, 0.022, 10, 48), 0.003), faixa); cinto.rotation.x = Math.PI / 2; cinto.position.y = altT * 0.62; corpo.add(cinto);
  // pescoço e cabeça
  const pesc = cilindro(0.045, 0.05, 0.1, pele); pesc.position.y = altT + 0.02; corpo.add(pesc);
  const cab = new THREE.Group(); cab.position.y = altT + 0.17; corpo.add(cab);
  cab.add(blob(0.118, pele, 0.94, 1.06, 1.0, 0.003, 40));
  const nariz = blob(0.024, pele, 0.8, 1.15, 1.0, 0.0015, 20); nariz.position.set(0, -0.01, 0.112); cab.add(nariz);
  for (const sx of [-1, 1]) { const asa = blob(0.012, pele, 1, 0.8, 1, 0.001, 12); asa.position.set(sx * 0.016, -0.03, 0.106); cab.add(asa); const orelha = blob(0.026, pele, 0.45, 1, 0.8, 0.001, 14); orelha.position.set(sx * 0.112, 0.0, -0.005); cab.add(orelha); }
  const semBarba = sp.barba === 'nenhuma';
  for (const sx of [-1, 1]) { const boch = blob(semBarba ? 0.026 : 0.032, pele, 1, 0.8, 0.7, 0.001, 14); boch.position.set(sx * 0.055, -0.03, 0.085); cab.add(boch); }
  // olhos
  const olhos = [], palps = [], sobr = [];
  const esc = 0.86;
  for (const sx of [-1, 1]) {
    const o = new THREE.Group(); o.position.set(sx * 0.043, 0.018, 0.088); cab.add(o);
    const branco = new THREE.Mesh(new THREE.SphereGeometry(0.022 * esc, 20, 16), new THREE.MeshPhysicalMaterial({ color: 0xe9e2d6, roughness: 0.35, clearcoat: 1 })); o.add(branco);
    const iris = new THREE.Mesh(new THREE.SphereGeometry(0.012 * esc, 16, 12), new THREE.MeshPhysicalMaterial({ color: sp.olhos || 0x2a1a10, roughness: 0.2, clearcoat: 1 })); iris.position.z = 0.014 * esc; o.add(iris);
    const pup = new THREE.Mesh(new THREE.SphereGeometry(0.006 * esc, 12, 8), new THREE.MeshBasicMaterial({ color: 0x050302 })); pup.position.z = 0.0205 * esc; o.add(pup);
    olhos.push(o);
    const pal = new THREE.Mesh(new THREE.SphereGeometry(0.0245 * esc, 20, 10, 0, Math.PI * 2, 0, Math.PI * 0.5), pele); pal.position.copy(o.position); pal.castShadow = false; cab.add(pal); palps.push(pal);
    const s = capsula(0.008, 0.032, clay(sp.corBarba || 0x4a403a, { bump: 1.2 }), 0.001); s.rotation.z = Math.PI / 2; s.position.set(sx * 0.045, 0.05, 0.1); cab.add(s); sobr.push(s);
  }
  // boca
  const boca = new THREE.Mesh(new THREE.TorusGeometry(0.018, 0.004, 6, 16, Math.PI), clay(0x6a3020)); boca.rotation.z = Math.PI; boca.position.set(0, -0.058, 0.103); cab.add(boca);
  // barba
  const corB = clay(sp.corBarba || 0x4a403a, { bump: 2.2 });
  if (sp.barba === 'cheia' || sp.barba === 'trancada' || sp.barba === 'curta') {
    const longa = sp.barba !== 'curta';
    const b = blob(0.1, corB, 1.0, longa ? 1.15 : 0.7, 0.75, 0.008, 30); b.position.set(0, longa ? -0.1 : -0.075, 0.055); cab.add(b);
    const big = blob(0.024, corB, 2.6, 0.7, 1, 0.002, 16); big.position.set(0, -0.042, 0.102); cab.add(big); // bigode
    if (sp.barba === 'cheia') for (let i = 0; i < 34; i++) { const a = r() * Math.PI * 0.9 + Math.PI * 0.05, yy = -0.04 - r() * 0.15; const c = blob(0.017 + r() * 0.008, corB, 1, 1, 1, 0.002, 10); c.position.set(Math.cos(a) * 0.085, yy, 0.03 + Math.sin(a) * 0.075); cab.add(c); }
    if (sp.barba === 'trancada') for (let i = 0; i < 18; i++) { const c = blob(0.016, corB, 1, 1, 1, 0.002, 10); c.position.set((i % 6 - 2.5) * 0.026, -0.12 - Math.floor(i / 6) * 0.03, 0.1); cab.add(c); }
    boca.visible = !longa ? true : false;
  }
  // cabelo / cobertura
  const corC = clay(sp.corCabelo || 0x1e1410, { bump: 2.2 });
  if (sp.cabelo === 'turbante') { const tc = clay(sp.corTurbante || 0xe6dac2, { bump: 1.0 }); for (let i = 0; i < 4; i++) { const t = M(lumpify(new THREE.TorusGeometry(0.105 - i * 0.012, 0.032, 12, 40), 0.004), tc); t.rotation.x = Math.PI / 2 + (i % 2 ? 0.12 : -0.08); t.position.y = 0.06 + i * 0.026; cab.add(t); } const topo = blob(0.085, tc, 1, 0.6, 1, 0.004); topo.position.y = 0.12; cab.add(topo); }
  if (sp.cabelo === 'cacheado' || sp.cabelo === 'nenhum' && false) { for (let i = 0; i < 46; i++) { const a = r() * Math.PI * 2, e = r() * 1.2 - 0.1; const c = blob(0.03, corC, 1, 1, 1, 0.003, 12); c.position.set(Math.cos(a) * 0.11 * Math.cos(e), 0.04 + Math.sin(e) * 0.09, Math.sin(a) * 0.11 * Math.cos(e) - 0.015); if (c.position.z > 0.06 && c.position.y < 0.1) continue; cab.add(c); } }
  if (sp.cabelo === 'elmo') { const el = M(lumpify(new THREE.SphereGeometry(0.13, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.55), 0.003), metal(0x8a6a3a)); el.position.y = 0.01; cab.add(el); const cr = cilindro(0.012, 0.03, 0.12, metal(0x8a6a3a)); cr.position.y = 0.16; cab.add(cr); const ab = M(new THREE.TorusGeometry(0.128, 0.012, 8, 40), metal(0x6a4a24)); ab.rotation.x = Math.PI / 2; ab.position.y = 0.03; cab.add(ab); }
  // braços (ombro → cotovelo → pulso)
  const bracos = {};
  for (const [lado, sx] of [['E', 1], ['D', -1]]) {
    const ombro = new THREE.Group(); ombro.position.set(sx * 0.2, altT - 0.07, 0); corpo.add(ombro);
    const sup = capsula(0.048, 0.2, roupa, 0.004); sup.position.y = -0.12; ombro.add(sup);
    const cot = new THREE.Group(); cot.position.y = -0.25; ombro.add(cot);
    const ant = capsula(0.04, 0.18, roupa, 0.004); ant.position.y = -0.1; cot.add(ant);
    const punho = new THREE.Group(); punho.position.y = -0.22; cot.add(punho);
    const pul = cilindro(0.03, 0.032, 0.05, pele); pul.position.y = 0.01; punho.add(pul);
    const m = mao(pele); m.rotation.x = Math.PI / 2; m.position.y = -0.02; punho.add(m);
    if (sp.tinta) { for (let i = 0; i < 3; i++) { const t = blob(0.0085, clay(0x14161c), 1, 1, 1, 0.001, 8); t.position.set(-0.024 + i * 0.016, -0.075, 0.0); punho.add(t); } }
    bracos[lado] = { ombro, cot, punho, mao: m };
  }
  // pose
  const pose = (q = {}) => {
    corpo.rotation.x = q.inclina || 0; corpo.rotation.y = q.giro || 0;
    cab.rotation.set(q.cabX || 0, q.cabY || 0, q.cabZ || 0);
    for (const L of ['E', 'D']) { const b = bracos[L], a = q[L] || {}; b.ombro.rotation.set(a.x || 0, a.y || 0, (a.z ?? 0.12) * (L === 'E' ? 1 : -1)); b.cot.rotation.set(a.cot || 0, 0, 0); b.punho.rotation.set(a.px || 0, a.py || 0, a.pz || 0); b.mao.userData.curl(a.dedos ?? 0.3); }
    const [ox, oy] = q.olhar || [0, 0]; olhos.forEach(o => o.rotation.set(-oy * 0.35, ox * 0.45, 0));
    const pa = q.palpebra ?? 0.45; palps.forEach(p => { p.rotation.x = -Math.PI / 2 + 0.5 - pa * 1.1; });
    const sb = q.sobrancelha || 0; sobr.forEach((s, i) => { s.position.y = 0.05 - sb * 0.008; s.rotation.z = Math.PI / 2 + (i === 0 ? 1 : -1) * sb * 0.25; });
  };
  pose({});
  return { root, corpo, cab, bracos, pose };
}

// ---------- objetos ----------
export function lamparina() {
  const g = new THREE.Group(); const c = clay(0xa0522d); const corpo = blob(0.07, c, 1.4, 0.45, 1, 0.003); corpo.position.y = 0.03; g.add(corpo);
  const bico = blob(0.03, c, 1.6, 0.6, 0.8, 0.002); bico.position.set(0.09, 0.04, 0); g.add(bico); return g;
}
// objeto que se desfaz: pedaços pequenos (InstancedMesh) preenchendo a forma dentro(x,y,z)
export function quebradico(dentro, bbox, mat, n = 600, seed = 3, smin = 0.004, smax = 0.01) {
  const r = rng(seed); const pts = []; let tries = 0;
  while (pts.length < n && tries < n * 60) { tries++; const x = bbox[0] + r() * (bbox[3] - bbox[0]), y = bbox[1] + r() * (bbox[4] - bbox[1]), z = bbox[2] + r() * (bbox[5] - bbox[2]); if (!dentro(x, y, z)) continue;
    pts.push({ p: new THREE.Vector3(x, y, z), s: smin + r() * (smax - smin), rot: new THREE.Euler(r() * 6, r() * 6, r() * 6), v: new THREE.Vector3((r() - 0.5) * 0.45, r() * 0.5, (r() - 0.5) * 0.45), w: new THREE.Vector3(r() * 8, r() * 8, r() * 8), d: ((y - bbox[1]) / (bbox[4] - bbox[1] + 1e-6)) * 0.3 * (0.4 + r()) }); }
  const im = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), mat, pts.length); im.castShadow = true; im.receiveShadow = true;
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sv = new THREE.Vector3(), pp = new THREE.Vector3(), e = new THREE.Euler();
  im.userData.quebra = (t, chao = 0) => { pts.forEach((o, i) => { const tt = Math.max(0, t - (0.3 - o.d));
      let y = o.p.y + o.v.y * tt - 4.9 * tt * tt; if (y < chao + o.s * 0.5) y = chao + o.s * 0.5;
      pp.set(o.p.x + o.v.x * tt, y, o.p.z + o.v.z * tt); e.set(o.rot.x + o.w.x * tt, o.rot.y + o.w.y * tt, o.rot.z); q.setFromEuler(e);
      const sc = o.s * Math.max(0.2, 1 - tt * 0.7); sv.set(sc, sc, sc); m4.compose(pp, q, sv); im.setMatrixAt(i, m4); }); im.instanceMatrix.needsUpdate = true; };
  im.userData.quebra(0); return im;
}

// céu em cúpula com gradiente e sol
export function ceuDomo({ top = 0x3a5a9a, hor = 0xf0a868, sol = 0xffc07a, solDir = new THREE.Vector3(-0.6, 0.12, -1), r = 60 } = {}) {
  const mat = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, uniforms: { top: { value: new THREE.Color(top) }, hor: { value: new THREE.Color(hor) }, sol: { value: new THREE.Color(sol) }, sd: { value: solDir.clone().normalize() } },
    vertexShader: `varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `varying vec3 vD; uniform vec3 top, hor, sol, sd; void main(){ float y = max(vD.y, 0.0); vec3 c = mix(hor, top, pow(smoothstep(0.0, 0.6, y), 0.7)); float s = max(dot(normalize(vD), sd), 0.0); c += sol * (pow(s, 600.0) * 3.0 + pow(s, 12.0) * 0.45); gl_FragColor = vec4(c, 1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }` });
  return new THREE.Mesh(new THREE.SphereGeometry(r, 48, 24), mat);
}
