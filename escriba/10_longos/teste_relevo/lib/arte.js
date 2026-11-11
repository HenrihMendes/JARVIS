// ESCRIBA — Arte das placas de relevo (figuras, cenários, estela, mapa, placa do título)
import { Layer, Mask, rng, gray, clamp } from './relevo.js';

// ---------- primitivas de desenho (coordenadas de mundo, y para cima) ----------
export function poly(c, p) { c.beginPath(); c.moveTo(p[0][0], p[0][1]); for (let i = 1; i < p.length; i++) c.lineTo(p[i][0], p[i][1]); c.closePath(); c.fill(); }
export function smooth(c, p, fill = true) { const n = p.length; c.beginPath(); const m = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const s = m(p[n - 1], p[0]); c.moveTo(s[0], s[1]); for (let i = 0; i < n; i++) { const q = m(p[i], p[(i + 1) % n]); c.quadraticCurveTo(p[i][0], p[i][1], q[0], q[1]); } c.closePath(); fill ? c.fill() : c.stroke(); }
export function ell(c, x, y, rx, ry, rot = 0) { c.beginPath(); c.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); c.fill(); }
export function ring(c, x, y, r0, r1) { c.beginPath(); c.arc(x, y, r1, 0, Math.PI * 2); c.arc(x, y, r0, 0, Math.PI * 2, true); c.fill('evenodd'); }
export function line(c, a, b, w) { if (w) c.lineWidth = w; c.lineCap = 'round'; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); }
export function path(c, p, w) { if (w) c.lineWidth = w; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); c.moveTo(p[0][0], p[0][1]); for (let i = 1; i < p.length; i++) c.lineTo(p[i][0], p[i][1]); c.stroke(); }
export function curve(c, p, w) { if (w) c.lineWidth = w; c.lineCap = 'round'; c.beginPath(); c.moveTo(p[0][0], p[0][1]);
  for (let i = 1; i < p.length - 1; i++) { const q = [(p[i][0] + p[i + 1][0]) / 2, (p[i][1] + p[i + 1][1]) / 2]; c.quadraticCurveTo(p[i][0], p[i][1], q[0], q[1]); }
  const z = p[p.length - 1]; c.lineTo(z[0], z[1]); c.stroke(); }
// membro afinado (cápsula) de a até b
export function limb(c, a, b, w0, w1) { const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1e-6, nx = -dy / L, ny = dx / L;
  c.beginPath(); c.moveTo(a[0] + nx * w0, a[1] + ny * w0); c.lineTo(b[0] + nx * w1, b[1] + ny * w1);
  const ang = Math.atan2(dy, dx); c.arc(b[0], b[1], w1, ang + Math.PI / 2, ang - Math.PI / 2, true);
  c.lineTo(a[0] - nx * w0, a[1] - ny * w0); c.arc(a[0], a[1], w0, ang - Math.PI / 2, ang + Math.PI / 2, true); c.closePath(); c.fill(); }
const dots = (c, x0, x1, y0, y1, step, r, stag = true) => { for (let y = y0, k = 0; y < y1; y += step, k++) for (let x = x0 + (stag && k % 2 ? step / 2 : 0); x < x1; x += step) { c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); } };

// ---------- FIGURA HUMANA DE PERFIL (voltada para a direita) ----------
// spec: { s (escala), b (profundidade do plano 0..1), roupa:'saiote'|'longa', cabeca:'elmo'|'coroa'|'gorro', barba:'curta'|'longa',
//         arma:'lanca'|'arco'|'escudo'|'cetro'|'cinzel'|'estandarte'|'nada', passo (abertura das pernas), seed }
export function figura(ppu, sp) {
  const s = sp.s ?? 1, b = sp.b ?? 1, r = rng(sp.seed ?? 1);
  const W = 1.5 * s, H = 2.5 * s; const L = new Layer(W, H, ppu);
  const X = (x) => (0.55 + x) * s, Y = (y) => (0.05 + y) * s, P = (x, y) => [X(x), Y(y)], h = (v) => v * b, S = (v) => v * s;
  const bl = (px) => Math.max(1, px * s * ppu / 220);
  const passo = sp.passo ?? 1;
  const longa = sp.roupa === 'longa';
  // perna de trás
  if (!longa) {
    L.raise(c => limb(c, P(-0.02, 0.8), P(-0.15 * passo, 0.1), S(0.085), S(0.058)), h(0.36), bl(3));
    L.raise(c => ell(c, X(-0.15 * passo + 0.04), Y(0.055), S(0.11), S(0.036)), h(0.36), bl(2));
    L.raise(c => limb(c, P(0.05, 0.8), P(0.19 * passo, 0.1), S(0.095), S(0.064)), h(0.5), bl(3));
    L.raise(c => ell(c, X(0.19 * passo + 0.05), Y(0.055), S(0.115), S(0.037)), h(0.5), bl(2));
    L.incise(c => { c.lineWidth = S(0.011); for (let k = 0; k < 3; k++) line(c, P(0.12 * passo + 0.02, 0.18 + k * 0.06), P(0.19 * passo + 0.08, 0.2 + k * 0.06)); }, 0.25, bl(0.8));
  } else {
    L.raise(c => ell(c, X(0.12), Y(0.06), S(0.12), S(0.038)), h(0.42), bl(2));
    L.raise(c => ell(c, X(-0.06), Y(0.06), S(0.11), S(0.035)), h(0.34), bl(2));
  }
  // roupa
  if (longa) {
    L.raise(c => smooth(c, [P(-0.2, 1.03), P(0.17, 1.03), P(0.2, 0.6), P(0.26, 0.1), P(-0.28, 0.1), P(-0.24, 0.6)]), h(0.56), bl(3));
    L.incise(c => { c.lineWidth = S(0.009); for (let k = 0; k < 16; k++) { const x = -0.27 + k * 0.034; line(c, P(x, 0.2), P(x - 0.005, 0.11)); }
      line(c, P(-0.27, 0.21), P(0.25, 0.21)); line(c, P(-0.26, 0.26), P(0.24, 0.26));
      for (let k = 0; k < 6; k++) { const x = -0.21 + k * 0.08; c.beginPath(); c.arc(X(x), Y(0.235), S(0.016), 0, 7); c.stroke(); }
      // xale diagonal com franja
      line(c, P(-0.2, 0.98), P(0.18, 0.72)); line(c, P(-0.21, 0.9), P(0.19, 0.64));
      for (let k = 0; k < 12; k++) { const t = k / 11; const a = [X(-0.2 + 0.39 * t), Y(0.9 - 0.26 * t)]; line(c, a, [a[0] - S(0.006), a[1] - S(0.06)]); }
      for (let k = 0; k < 4; k++) { const y = 0.36 + k * 0.08; for (let x = -0.22; x < 0.2; x += 0.07) { c.beginPath(); c.arc(X(x + (k % 2) * 0.035), Y(y), S(0.012), 0, 7); c.stroke(); } } }, 0.3, bl(0.8));
  } else {
    L.raise(c => poly(c, [P(-0.2, 1.02), P(0.18, 1.02), P(0.26, 0.66), P(-0.24, 0.62)]), h(0.55), bl(3));
    L.incise(c => { c.lineWidth = S(0.01); for (let k = 0; k < 9; k++) { const x = -0.22 + k * 0.055; line(c, P(x + 0.02, 0.7), P(x, 0.64)); } line(c, P(-0.24, 0.71), P(0.25, 0.73)); }, 0.3, bl(0.8));
  }
  // tronco
  L.raise(c => smooth(c, [P(-0.17, 1.0), P(0.15, 1.0), P(0.19, 1.22), P(0.12, 1.35), P(-0.12, 1.35), P(-0.19, 1.2)]), h(0.6), bl(3));
  L.raise(c => poly(c, [P(-0.2, 0.97), P(0.19, 0.97), P(0.19, 1.05), P(-0.2, 1.05)]), h(0.64), bl(1.5));
  if (sp.armadura !== false && !longa) L.incise(c => { c.lineWidth = S(0.008); for (let yy = 1.08, k = 0; yy < 1.32; yy += 0.045, k++) for (let xx = -0.15; xx < 0.15; xx += 0.05) { c.beginPath(); c.arc(X(xx + (k % 2) * 0.025), Y(yy), S(0.022), Math.PI, 0, true); c.stroke(); } }, 0.2, bl(0.7));
  // cabelo atrás
  const longoCab = sp.cabeca === 'coroa';
  L.raise(c => smooth(c, longoCab ? [P(-0.11, 1.52), P(-0.02, 1.46), P(-0.06, 1.26), P(-0.12, 1.2), P(-0.18, 1.3)] : [P(-0.1, 1.5), P(-0.03, 1.45), P(-0.06, 1.33), P(-0.14, 1.35)]), h(0.62), bl(2));
  if (longoCab) L.incise(c => dots(c, X(-0.16), X(-0.04), Y(1.22), Y(1.46), S(0.03), S(0.009)), 0.3, bl(0.6));
  // cabeça, nariz, olho, orelha
  L.raise(c => ell(c, X(0.02), Y(1.46), S(0.1), S(0.115)), h(0.64), bl(3));
  L.raise(c => poly(c, [P(0.095, 1.51), P(0.152, 1.43), P(0.1, 1.415)]), h(0.67), bl(1.5));
  L.incise(c => ell(c, X(0.072), Y(1.48), S(0.026), S(0.011)), 0.4, bl(0.6));
  L.incise(c => { c.lineWidth = S(0.012); line(c, P(0.045, 1.5), P(0.1, 1.505)); }, 0.25, bl(0.6)); // sobrancelha
  L.incise(c => { c.lineWidth = S(0.01); c.beginPath(); c.arc(X(-0.02), Y(1.45), S(0.026), 0, 7); c.stroke(); }, 0.25, bl(0.6));
  // barba
  const bl2 = sp.barba === 'longa';
  L.raise(c => smooth(c, bl2 ? [P(0.03, 1.43), P(0.13, 1.4), P(0.13, 1.18), P(0.06, 1.08), P(-0.02, 1.2), P(-0.03, 1.34)] : [P(0.03, 1.42), P(0.13, 1.4), P(0.12, 1.3), P(0.05, 1.25), P(-0.03, 1.32)]), h(0.69), bl(2));
  L.incise(c => { if (bl2) { for (let yy = 1.12; yy < 1.4; yy += 0.045) { c.lineWidth = S(0.008); line(c, P(-0.02, yy), P(0.12, yy + 0.01)); dots(c, X(0.0), X(0.12), Y(yy + 0.015), Y(yy + 0.03), S(0.028), S(0.008), false); } }
    else dots(c, X(0.0), X(0.12), Y(1.27), Y(1.41), S(0.03), S(0.009)); }, 0.3, bl(0.6));
  // cobertura
  if (sp.cabeca === 'elmo') { L.raise(c => poly(c, [P(-0.11, 1.5), P(0.12, 1.52), P(0.03, 1.79)]), h(0.71), bl(2)); L.incise(c => line(c, P(-0.1, 1.545), P(0.11, 1.565), S(0.015)), 0.3, bl(0.6)); }
  if (sp.cabeca === 'gorro') { L.raise(c => smooth(c, [P(-0.11, 1.5), P(0.11, 1.52), P(0.06, 1.63), P(-0.07, 1.63)]), h(0.66), bl(2)); }
  if (sp.cabeca === 'diadema') {
    L.raise(c => smooth(c, [P(-0.12, 1.5), P(-0.02, 1.6), P(0.1, 1.56), P(0.12, 1.48), P(0.02, 1.52), P(-0.1, 1.42)]), h(0.62), bl(2));
    L.incise(c => dots(c, X(-0.11), X(0.1), Y(1.45), Y(1.6), S(0.028), S(0.01)), 0.3, bl(0.6));
    L.raise(c => poly(c, [P(-0.11, 1.55), P(0.11, 1.57), P(0.11, 1.61), P(-0.11, 1.59)]), h(0.74), bl(1.5));
    L.raise(c => { for (let k = 0; k < 5; k++) poly(c, [P(-0.1 + k * 0.05, 1.59), P(-0.085 + k * 0.05, 1.68), P(-0.07 + k * 0.05, 1.6)]); }, h(0.74), bl(1.2));
  }
  if (sp.cabeca === 'coroa') {
    L.raise(c => poly(c, [P(-0.105, 1.52), P(0.115, 1.535), P(0.085, 1.82), P(0.03, 1.9), P(-0.075, 1.8)]), h(0.73), bl(2));
    L.raise(c => poly(c, [P(-0.11, 1.52), P(0.12, 1.535), P(0.115, 1.6), P(-0.105, 1.585)]), h(0.78), bl(1.5)); // diadema
    L.incise(c => { for (let k = 0; k < 6; k++) { c.beginPath(); c.arc(X(-0.08 + k * 0.038), Y(1.56), S(0.011), 0, 7); c.fill(); } c.lineWidth = S(0.008); for (let k = 0; k < 5; k++) line(c, P(-0.06 + k * 0.03, 1.62), P(-0.04 + k * 0.025, 1.82)); }, 0.3, bl(0.6));
    L.raise(c => { c.lineWidth = S(0.03); curve(c, [P(-0.1, 1.56), P(-0.2, 1.45), P(-0.24, 1.1), P(-0.27, 0.85)]); curve(c, [P(-0.1, 1.55), P(-0.17, 1.4), P(-0.19, 1.05), P(-0.22, 0.86)]); }, h(0.58), bl(1.5)); // fitas
  }
  // braço de trás (segura arma longa)
  const arma = sp.arma || 'nada';
  if (arma === 'lanca' || arma === 'escudo') {
    L.raise(c => { const sh = P(0.02, 1.28), el = P(0.2, 1.12), ha = P(0.33, 1.2); limb(c, sh, el, S(0.05), S(0.042)); limb(c, el, ha, S(0.042), S(0.035)); }, h(0.48), bl(2.5));
    L.raise(c => { c.lineWidth = S(0.026); line(c, P(0.37, 0.25), P(0.3, 2.2)); }, h(0.72), bl(1.4));
    L.raise(c => poly(c, [P(0.3, 2.18), P(0.33, 2.42), P(0.27, 2.19)]), h(0.76), bl(1.2));
  }
  if (arma === 'lanca') {
    L.raise(c => ell(c, X(0.17), Y(1.06), S(0.215), S(0.215)), h(0.82), bl(3));
    L.raise(c => ring(c, X(0.17), Y(1.06), S(0.18), S(0.215)), h(0.88), bl(1.5));
    L.raise(c => ell(c, X(0.17), Y(1.06), S(0.05), S(0.05)), h(0.96), bl(2));
    const k = (r() * 3) | 0;
    L.incise(c => { c.lineWidth = S(0.008); c.beginPath(); c.arc(X(0.17), Y(1.06), S(0.12), 0, 7); c.stroke(); if (k > 0) for (let i = 0; i < 8 + k * 4; i++) { const a = i / (8 + k * 4) * Math.PI * 2; c.beginPath(); c.arc(X(0.17 + Math.cos(a) * 0.15), Y(1.06 + Math.sin(a) * 0.15), S(0.011), 0, 7); c.fill(); } }, 0.3, bl(0.6));
  }
  if (arma === 'escudo') {
    L.raise(c => smooth(c, [P(0.12, 0.25), P(0.46, 0.25), P(0.47, 1.4), P(0.29, 1.56), P(0.11, 1.4)]), h(0.84), bl(3));
    L.incise(c => { c.lineWidth = S(0.012); smooth(c, [P(0.15, 0.29), P(0.43, 0.29), P(0.44, 1.37), P(0.29, 1.51), P(0.14, 1.37)], false); for (let k = 1; k < 4; k++) line(c, P(0.15 + k * 0.07, 0.32), P(0.15 + k * 0.07, 1.4)); }, 0.3, bl(0.7));
  }
  if (arma === 'arco') {
    L.raise(c => { limb(c, P(0.02, 1.3), P(0.42, 1.3), S(0.05), S(0.036)); }, h(0.5), bl(2.5));
    L.raise(c => { c.lineWidth = S(0.03); c.beginPath(); c.arc(X(0.3), Y(1.3), S(0.42), -1.05, 1.05); c.stroke(); }, h(0.74), bl(1.5));
    L.raise(c => { c.lineWidth = S(0.008); line(c, [X(0.3 + Math.cos(1.05) * 0.42), Y(1.3 + Math.sin(1.05) * 0.42)], P(0.1, 1.3)); line(c, [X(0.3 + Math.cos(-1.05) * 0.42), Y(1.3 + Math.sin(-1.05) * 0.42)], P(0.1, 1.3)); line(c, P(0.08, 1.3), P(0.78, 1.32), S(0.012)); }, h(0.62), bl(1));
    L.raise(c => { c.save(); c.translate(X(-0.2), Y(1.2)); c.rotate(-0.35); c.fillRect(-S(0.05), -S(0.3), S(0.1), S(0.5)); c.restore(); }, h(0.52), bl(2)); // aljava
    L.incise(c => { for (let k = 0; k < 3; k++) { c.lineWidth = S(0.01); line(c, P(-0.15 + k * 0.03, 1.4), P(-0.12 + k * 0.03, 1.5)); } }, 0.3, bl(0.6));
  }
  if (arma === 'cetro') { // braço da frente erguido com maça
    L.raise(c => { const sh = P(0.05, 1.29), el = P(0.27, 1.38), ha = P(0.36, 1.62); limb(c, sh, el, S(0.055), S(0.045)); limb(c, el, ha, S(0.045), S(0.036)); }, h(0.78), bl(2.5));
    L.raise(c => { c.lineWidth = S(0.03); line(c, P(0.33, 1.4), P(0.42, 1.98)); }, h(0.82), bl(1.2));
    L.raise(c => ell(c, X(0.43), Y(2.03), S(0.065), S(0.075)), h(0.88), bl(2));
    L.incise(c => { for (let k = 0; k < 8; k++) { const a = k / 8 * 6.28; c.beginPath(); c.arc(X(0.43 + Math.cos(a) * 0.045), Y(2.03 + Math.sin(a) * 0.05), S(0.009), 0, 7); c.fill(); } }, 0.3, bl(0.6));
    L.raise(c => { c.lineWidth = S(0.018); for (let k = 0; k < 2; k++) line(c, P(0.3 - k * 0.02, 1.52 - k * 0.03), P(0.36 - k * 0.02, 1.53 - k * 0.03)); }, h(0.84), bl(1)); // bracelete
    // braço de trás no punho da espada
    L.raise(c => { limb(c, P(-0.02, 1.27), P(0.06, 1.08), S(0.05), S(0.042)); limb(c, P(0.06, 1.08), P(0.14, 1.0), S(0.042), S(0.035)); }, h(0.62), bl(2.5));
    L.raise(c => { c.lineWidth = S(0.032); line(c, P(0.13, 1.0), P(0.2, 0.52)); poly(c, [P(0.1, 1.04), P(0.19, 1.04), P(0.19, 0.99), P(0.1, 0.99)]); }, h(0.68), bl(1.2)); // espada pendente
  }
  if (arma === 'estandarte') {
    L.raise(c => { limb(c, P(0.04, 1.28), P(0.24, 1.25), S(0.05), S(0.04)); }, h(0.7), bl(2.5));
    L.raise(c => { c.lineWidth = S(0.028); line(c, P(0.28, 0.2), P(0.28, 2.15)); }, h(0.74), bl(1.2));
    L.raise(c => ell(c, X(0.28), Y(2.22), S(0.12), S(0.12)), h(0.82), bl(2));
    L.incise(c => { c.lineWidth = S(0.018); path(c, [P(0.28, 2.32), P(0.24, 2.24), P(0.31, 2.2), P(0.25, 2.12)]); path(c, [P(0.24, 2.24), P(0.2, 2.18)]); path(c, [P(0.31, 2.2), P(0.36, 2.16)]); }, 0.4, bl(0.6)); // raio (símbolo de Hadad)
  }
  if (arma === 'lira') { // lira apoiada no peito, braço da frente dedilhando
    L.raise(c => { c.lineWidth = S(0.035); path(c, [P(0.12, 0.98), P(0.3, 1.0), P(0.42, 1.42)]); path(c, [P(0.12, 0.98), P(0.16, 1.4)]); line(c, P(0.13, 1.42), P(0.45, 1.46)); }, h(0.8), bl(1.4));
    L.raise(c => smooth(c, [P(0.1, 0.92), P(0.32, 0.94), P(0.3, 1.06), P(0.13, 1.06)]), h(0.84), bl(2));
    L.raise(c => { c.lineWidth = S(0.008); for (let k = 0; k < 6; k++) line(c, P(0.16 + k * 0.045, 1.05), P(0.18 + k * 0.045, 1.43)); }, h(0.76), bl(0.8));
    L.raise(c => { limb(c, P(0.04, 1.28), P(0.18, 1.16), S(0.05), S(0.042)); limb(c, P(0.18, 1.16), P(0.3, 1.2), S(0.042), S(0.035)); }, h(0.88), bl(2.5));
  }
  if (arma === 'cinzel') { // braço da frente com cinzel (o do martelo é peça separada)
    L.raise(c => { limb(c, P(0.04, 1.28), P(0.22, 1.12), S(0.05), S(0.042)); limb(c, P(0.22, 1.12), P(0.4, 1.2), S(0.042), S(0.035)); }, h(0.7), bl(2.5));
    L.raise(c => { c.lineWidth = S(0.022); line(c, P(0.4, 1.2), P(0.56, 1.26)); }, h(0.76), bl(1));
  }
  return L;
}

// braço com martelo (peça móvel do escultor) — pivô no ombro em (0,0)
export function bracoMartelo(ppu, s = 1) {
  const W = 0.9 * s, H = 0.9 * s; const L = new Layer(W, H, ppu); const X = (x) => (0.15 + x) * s, Y = (y) => (0.3 + y) * s, P = (x, y) => [X(x), Y(y)], S = (v) => v * s;
  L.raise(c => { limb(c, P(0, 0), P(0.16, 0.2), S(0.055), S(0.045)); limb(c, P(0.16, 0.2), P(0.34, 0.3), S(0.045), S(0.036)); }, 0.8, 2.5);
  L.raise(c => { c.lineWidth = S(0.028); line(c, P(0.3, 0.22), P(0.42, 0.46)); }, 0.84, 1.2);
  L.raise(c => { c.save(); c.translate(X(0.43), Y(0.48)); c.rotate(-0.45); c.fillRect(-S(0.1), -S(0.045), S(0.2), S(0.09)); c.restore(); }, 0.9, 2);
  return { L, pivot: [0.15 * s, 0.3 * s] };
}

// ---------- CAVALO + CARRO DE GUERRA (voltados para a direita) ----------
export function carro(ppu, sp = {}) {
  const s = sp.s ?? 1, b = sp.b ?? 1; const W = 3.4 * s, H = 2.4 * s; const L = new Layer(W, H, ppu);
  const X = (x) => x * s, Y = (y) => y * s, P = (x, y) => [X(x), Y(y)], h = (v) => v * b, S = (v) => v * s; const bl = (px) => Math.max(1, px * s * ppu / 220);
  const cavalo = (dx, dy, hh) => {
    const Q = (x, y) => P(x + dx, y + dy);
    // pernas de trás e dianteira apoiada (plano mais baixo)
    L.raise(c => { limb(c, Q(2.02, 1.0), Q(1.93, 0.56), S(0.075), S(0.045)); limb(c, Q(1.93, 0.56), Q(1.99, 0.1), S(0.04), S(0.028));
      limb(c, Q(2.16, 0.98), Q(2.12, 0.54), S(0.07), S(0.042)); limb(c, Q(2.12, 0.54), Q(2.05, 0.1), S(0.038), S(0.028));
      limb(c, Q(2.7, 0.98), Q(2.76, 0.55), S(0.065), S(0.04)); limb(c, Q(2.76, 0.55), Q(2.84, 0.1), S(0.036), S(0.028)); }, h(hh - 0.07), bl(2.5));
    // dianteira erguida (galope)
    L.raise(c => { limb(c, Q(2.8, 1.0), Q(3.02, 0.8), S(0.065), S(0.04)); limb(c, Q(3.02, 0.8), Q(3.1, 0.6), S(0.036), S(0.028)); }, h(hh - 0.03), bl(2.5));
    L.raise(c => { for (const [x, y] of [[1.99, 0.07], [2.05, 0.07], [2.84, 0.07], [3.11, 0.57]]) ell(c, X(x + dx), Y(y + dy), S(0.045), S(0.03)); }, h(hh - 0.05), bl(1.5));
    // corpo + pescoço + cabeça num contorno só
    L.raise(c => smooth(c, [Q(1.92, 1.16), Q(1.98, 1.32), Q(2.3, 1.36), Q(2.6, 1.42), Q(2.76, 1.68), Q(2.93, 1.96), Q(3.06, 1.93), Q(3.28, 1.62), Q(3.33, 1.52), Q(3.25, 1.47), Q(3.08, 1.6), Q(2.96, 1.6), Q(2.88, 1.3), Q(2.88, 1.06), Q(2.6, 0.92), Q(2.2, 0.9), Q(1.98, 0.98)]), h(hh), bl(4));
    L.raise(c => poly(c, [Q(2.92, 1.93), Q(2.95, 2.08), Q(3.0, 1.94)]), h(hh), bl(1.5)); // orelha
    L.raise(c => { smooth(c, [Q(2.9, 1.98), Q(2.84, 2.22), Q(2.95, 2.3), Q(2.97, 2.0)]); }, h(hh + 0.06), bl(1.5)); // penacho preso à cabeça
    L.raise(c => { c.lineWidth = S(0.04); curve(c, [Q(1.94, 1.28), Q(1.82, 1.18), Q(1.78, 0.95), Q(1.8, 0.7)]); }, h(hh - 0.02), bl(2)); // cauda
    L.incise(c => { c.lineWidth = S(0.012);
      for (let k = 0; k < 10; k++) { const t = k / 9; const a = [X(2.64 + dx + t * 0.3), Y(1.45 + dy + t * 0.5)]; line(c, a, [a[0] - S(0.05), a[1] + S(0.03)]); } // crina
      ell(c, X(3.08 + dx), Y(1.8 + dy), S(0.022), S(0.012)); // olho
      line(c, Q(3.04, 1.92), Q(3.2, 1.62)); line(c, Q(3.0, 1.64), Q(3.26, 1.6)); line(c, Q(3.22, 1.58), Q(2.5, 1.2)); // cabeçada e rédea
      for (let k = 0; k < 3; k++) line(c, Q(1.86 - k * 0.01, 1.0 - k * 0.12), Q(1.79 - k * 0.01, 0.97 - k * 0.12)); }, 0.3, bl(0.7));
    L.raise(c => { c.lineWidth = S(0.03); line(c, Q(2.36, 1.37), Q(2.4, 0.92)); line(c, Q(2.56, 1.4), Q(2.58, 0.93)); }, h(hh + 0.03), bl(1.5)); // cinta
  };
  cavalo(0.14, 0.06, 0.46 * 1); cavalo(0, 0, 0.62);
  // lança (timão)
  L.raise(c => { c.lineWidth = S(0.045); curve(c, [P(1.3, 0.72), P(1.8, 0.86), P(2.3, 1.2)]); }, h(0.52), bl(1.5));
  // caixa do carro
  L.raise(c => smooth(c, [P(0.42, 0.62), P(1.38, 0.62), P(1.4, 1.18), P(1.25, 1.24), P(0.48, 1.2)]), h(0.58), bl(3));
  L.incise(c => { c.lineWidth = S(0.012); for (let k = 0; k < 6; k++) { c.beginPath(); c.arc(X(0.62 + k * 0.14), Y(0.92), S(0.045), 0, 7); c.stroke(); } line(c, P(0.48, 1.12), P(1.32, 1.14)); line(c, P(0.48, 0.7), P(1.34, 0.7)); }, 0.28, bl(0.7));
  // roda
  L.raise(c => ring(c, X(0.88), Y(0.44), S(0.34), S(0.42)), h(0.72), bl(2));
  L.raise(c => { c.lineWidth = S(0.035); for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; line(c, P(0.88, 0.44), P(0.88 + Math.cos(a) * 0.36, 0.44 + Math.sin(a) * 0.36)); } }, h(0.66), bl(1.5));
  L.raise(c => ell(c, X(0.88), Y(0.44), S(0.07), S(0.07)), h(0.8), bl(2));
  L.incise(c => { c.lineWidth = S(0.01); c.beginPath(); c.arc(X(0.88), Y(0.44), S(0.38), 0, 7); c.stroke(); }, 0.25, bl(0.6));
  // condutor e arqueiro (meio corpo, acima da caixa)
  const busto = (bx, by, hh, comArco) => {
    const Q = (x, y) => P(bx + x, by + y);
    L.raise(c => smooth(c, [Q(-0.15, 0.0), Q(0.13, 0.0), Q(0.16, 0.25), Q(0.1, 0.36), Q(-0.12, 0.36), Q(-0.17, 0.2)]), h(hh), bl(3));
    L.raise(c => ell(c, X(bx + 0.02), Y(by + 0.48), S(0.095), S(0.11)), h(hh + 0.03), bl(3));
    L.raise(c => poly(c, [Q(0.09, 0.53), Q(0.145, 0.45), Q(0.095, 0.44)]), h(hh + 0.05), bl(1.5));
    L.raise(c => smooth(c, [Q(0.03, 0.44), Q(0.12, 0.42), Q(0.11, 0.32), Q(0.04, 0.28), Q(-0.03, 0.34)]), h(hh + 0.07), bl(2));
    L.raise(c => poly(c, [Q(-0.1, 0.52), Q(0.11, 0.54), Q(0.02, 0.8)]), h(hh + 0.09), bl(2));
    L.incise(c => { ell(c, X(bx + 0.07), Y(by + 0.5), S(0.024), S(0.01)); dots(c, X(bx), X(bx + 0.11), Y(by + 0.3), Y(by + 0.43), S(0.028), S(0.008)); }, 0.35, bl(0.6));
    if (comArco) { L.raise(c => limb(c, Q(0.02, 0.3), Q(0.42, 0.32), S(0.045), S(0.034)), h(hh + 0.1), bl(2.5));
      L.raise(c => { c.lineWidth = S(0.028); c.beginPath(); c.arc(X(bx + 0.3), Y(by + 0.32), S(0.38), -1.05, 1.05); c.stroke(); }, h(hh + 0.14), bl(1.5));
      L.raise(c => { c.lineWidth = S(0.008); line(c, [X(bx + 0.3 + Math.cos(1.05) * 0.38), Y(by + 0.32 + Math.sin(1.05) * 0.38)], Q(0.08, 0.32)); line(c, [X(bx + 0.3 + Math.cos(-1.05) * 0.38), Y(by + 0.32 + Math.sin(-1.05) * 0.38)], Q(0.08, 0.32)); line(c, Q(0.06, 0.32), Q(0.75, 0.34), S(0.012)); }, h(hh + 0.06), bl(1)); }
    else { L.raise(c => { limb(c, Q(0.04, 0.3), Q(0.3, 0.22), S(0.045), S(0.036)); }, h(hh + 0.08), bl(2.5));
      L.raise(c => { c.lineWidth = S(0.01); curve(c, [Q(0.3, 0.22), Q(1.0, 0.35), Q(1.9, 0.62)]); }, h(hh + 0.02), bl(0.8)); }
  };
  busto(0.75, 1.12, 0.6, false); busto(1.08, 1.14, 0.7, true);
  return L;
}

// ---------- FUNDOS ----------
// faixa decorativa de rosetas (borda de friso)
export function faixaRosetas(L, y0, y1, h = 0.35, passo = 0.5) {
  L.raise(c => c.fillRect(0, y0, L.w, y1 - y0), h, 2);
  L.incise(c => { c.lineWidth = (y1 - y0) * 0.06; line(c, [0, y0 + (y1 - y0) * 0.12], [L.w, y0 + (y1 - y0) * 0.12]); line(c, [0, y1 - (y1 - y0) * 0.12], [L.w, y1 - (y1 - y0) * 0.12]); }, 0.25, 1);
  const r = (y1 - y0) * 0.3, cy = (y0 + y1) / 2;
  for (let x = passo / 2; x < L.w; x += passo) { L.raise(c => ell(c, x, cy, r, r), h + 0.12, 2);
    L.incise(c => { c.lineWidth = r * 0.12; for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; line(c, [x + Math.cos(a) * r * 0.25, cy + Math.sin(a) * r * 0.25], [x + Math.cos(a) * r * 0.9, cy + Math.sin(a) * r * 0.9]); } ell(c, x, cy, r * 0.2, r * 0.2); }, 0.25, 1); }
}

// paisagem distante: montanhas (Hermon com neve), colinas, cidade murada, sol baixo
export function paisagem(ppu, w, hgt, seed = 5) {
  const L = new Layer(w, hgt, ppu); const r = rng(seed);
  L.raise(c => c.fillRect(0, 0, w, hgt * 0.3), 0.3, 0);
  const serra = (base, amp, n, hh, sd, pico) => { const rr = rng(sd); const pts = [[0, 0]]; for (let i = 0; i <= n; i++) { const x = i / n * w; const sh = Math.pow(Math.abs(Math.sin(i * 0.7 + sd)), pico); pts.push([x, base + amp * (0.25 + 0.75 * sh) * (0.7 + rr() * 0.5)]); } pts.push([w, 0]); L.raise(c => poly(c, pts), hh, 5); };
  serra(hgt * 0.56, hgt * 0.2, 26, 0.24, 3, 0.6); serra(hgt * 0.48, hgt * 0.1, 34, 0.36, 7, 1); serra(hgt * 0.4, hgt * 0.06, 44, 0.48, 11, 1.2);
  // cidade murada no alto da colina (torres e ameias)
  const cxm = w * 0.47, cym = hgt * 0.5;
  L.raise(c => { c.fillRect(cxm - 1.7, cym - 0.6, 3.4, 0.95); for (let k = 0; k < 8; k++) c.fillRect(cxm - 1.7 + k * 0.48, cym + 0.3, 0.26, 0.24); for (const tx of [-1.75, -0.25, 1.3]) { c.fillRect(cxm + tx, cym - 0.6, 0.42, 1.4); for (let k = 0; k < 3; k++) c.fillRect(cxm + tx + k * 0.15, cym + 0.78, 0.09, 0.14); } }, 0.52, 3);
  L.incise(c => { c.lineWidth = 0.012; for (let y = cym - 0.5; y < cym + 0.3; y += 0.12) line(c, [cxm - 1.7, y], [cxm + 1.7, y]); }, 0.2, 1);
  return L;
}

// parede de palácio com rosetas, ameias e colunas
export function paredePalacio(ppu, w, hgt) {
  const L = new Layer(w, hgt, ppu);
  L.raise(c => c.fillRect(0, 0, w, hgt), 0.12, 0);
  L.incise(c => { c.lineWidth = 0.015; for (let y = 0.35; y < hgt; y += 0.35) { line(c, [0, y], [w, y]); for (let x = ((y / 0.35) % 2) * 0.35; x < w; x += 0.7) line(c, [x, y], [x, y - 0.35]); } }, 0.2, 1.2);
  faixaRosetas(L, hgt * 0.78, hgt * 0.86, 0.32, 0.42);
  for (let x = 0.2; x < w; x += 0.5) L.raise(c => poly(c, [[x, hgt * 0.92], [x + 0.3, hgt * 0.92], [x + 0.3, hgt], [x, hgt]]), 0.3, 2); // ameias
  for (const x of [w * 0.12, w * 0.88]) { L.raise(c => c.fillRect(x - 0.22, 0, 0.44, hgt * 0.76), 0.45, 4); L.incise(c => { c.lineWidth = 0.02; for (let k = -2; k <= 2; k++) line(c, [x + k * 0.07, 0.1], [x + k * 0.07, hgt * 0.72]); }, 0.25, 1); L.raise(c => poly(c, [[x - 0.32, hgt * 0.72], [x + 0.32, hgt * 0.72], [x + 0.26, hgt * 0.77], [x - 0.26, hgt * 0.77]]), 0.55, 2); }
  return L;
}

// parede da oficina (blocos de pedra) com nicho de lamparina
export function paredeOficina(ppu, w, hgt, seed = 2, nicho = null) {
  const L = new Layer(w, hgt, ppu); const r = rng(seed);
  L.raise(c => c.fillRect(0, 0, w, hgt), 0.1, 0);
  for (let y = 0, k = 0; y < hgt; y += 0.42, k++) for (let x = -(k % 2) * 0.35; x < w; x += 0.7) { const jx = r() * 0.04, jy = r() * 0.04; L.raise(c => smooth(c, [[x + 0.03 + jx, y + 0.03], [x + 0.67, y + 0.03 + jy], [x + 0.66, y + 0.39], [x + 0.04, y + 0.39 - jy]]), 0.28 + r() * 0.1, 5); }
  if (nicho) { const [nx, ny] = nicho; L.lower(c => { c.beginPath(); c.roundRect(nx - 0.45, ny - 0.55, 0.9, 1.3, [0.45, 0.45, 0.05, 0.05]); c.fill(); }, 0.04, 6); L.raise(c => { c.beginPath(); c.ellipse(nx, ny - 0.42, 0.32, 0.12, 0, 0, Math.PI * 2); c.fill(); }, 0.55, 3); }
  return L;
}

// ---------- ESTELA DE BASALTO com inscrição em aramaico antigo ----------
// Letras (bloco fenício do Unicode, usado para o aramaico antigo). Ordem: da direita para a esquerda.
const AL = { "'": '\u{10900}', b: '\u{10901}', g: '\u{10902}', d: '\u{10903}', h: '\u{10904}', w: '\u{10905}', z: '\u{10906}', H: '\u{10907}', T: '\u{10908}', y: '\u{10909}', k: '\u{1090A}', l: '\u{1090B}', m: '\u{1090C}', n: '\u{1090D}', s: '\u{1090E}', '`': '\u{1090F}', p: '\u{10910}', S: '\u{10911}', q: '\u{10912}', r: '\u{10913}', x: '\u{10914}', t: '\u{10915}' };
// Trechos da leitura publicada da estela de Tel Dan (Biran & Naveh), com lacunas onde a pedra está quebrada.
// "." = divisor de palavras (ponto). Reconstrução artística da estela inteira: só as linhas abaixo seguem o texto publicado.
export const LINHAS = [
  "wyhk.hdd.qdmy",            // "e Hadad foi à minha frente" (l. 5)
  "wqtlt.ywrm.br.'H'b",       // "e matei Jorão, filho de Acabe" (l. 7-8, nomes reconstruídos)
  "mlk.yxr'l.wqtlt.'Hzyhw",   // "rei de Israel, e matei Acazias" (l. 8)
  "br.yhwrm.mlk.bytdwd",      // "filho de Jorão, rei da Casa de Davi" (l. 8-9)
];
export const PALAVRA_DAVI = { linha: 3, palavra: 3 }; // "bytdwd"

export function estelaLayout(w = 3.0, hgt = 4.6) {
  const aw = w - 0.8; let maxN = 0;
  for (const s of LINHAS) { let n = 0, d = 0; for (const ch of s) ch === '.' ? d++ : n++; maxN = Math.max(maxN, n * 0.78 + d * 0.3); }
  const letraH = Math.min(0.27, aw / maxN), lh = letraH * 1.5, x0 = w - 0.4, y0 = hgt * 0.8;
  const glyphs = []; let caixa = null;
  LINHAS.forEach((s, li0) => { const li = li0 + 4; let x = x0; const y = y0 - li * lh; let wi = 0;
    for (const ch of s) { if (ch === '.') { glyphs.push({ dot: true, x: x - letraH * 0.12, y: y + letraH * 0.35 }); x -= letraH * 0.3; wi++; continue; }
      glyphs.push({ ch, x, y, glow: li0 === PALAVRA_DAVI.linha && wi === PALAVRA_DAVI.palavra });
      if (li0 === PALAVRA_DAVI.linha && wi === PALAVRA_DAVI.palavra) { const bx0 = x - letraH * 0.78, bx1 = x; caixa = caixa ? [Math.min(caixa[0], bx0), caixa[1], Math.max(caixa[2], bx1), caixa[3]] : [bx0, y - letraH * 0.1, bx1, y + letraH * 0.95]; }
      x -= letraH * 0.78; } });
  const apagadas = [0, 1, 2, 3, 8, 9, 10, 11, 12, 13].map(li => y0 - li * lh).filter(y => y > 0.55);
  return { letraH, lh, glyphs, caixa, apagadas, w, hgt };
}

export function estela(ppu, { w = 3.0, hgt = 4.6, regiao = null, fonte = 'Noto Sans Phoenician', seed = 11 } = {}) {
  // regiao: [x0,y0,x1,y1] para gerar só um recorte em alta resolução (mesmo desenho)
  const R = regiao || [0, 0, w, hgt]; const L = new Layer(R[2] - R[0], R[3] - R[1], ppu);
  const em = new Mask(L); const al = new Mask(L); const lay = estelaLayout(w, hgt);
  const T = (c) => c.translate(-R[0], -R[1]);
  const inR = (x, y, m = 0.4) => x > R[0] - m && x < R[2] + m && y > R[1] - m && y < R[3] + m;
  const forma = (c) => { c.beginPath(); c.moveTo(0.12, 0.0); c.lineTo(w - 0.12, 0.0); c.lineTo(w - 0.05, hgt * 0.78); c.quadraticCurveTo(w - 0.12, hgt, w / 2, hgt - 0.02); c.quadraticCurveTo(0.12, hgt, 0.05, hgt * 0.78); c.closePath(); c.fill(); };
  L.raise(c => { T(c); forma(c); }, 0.78, Math.max(2, ppu * 0.02));
  al.draw(c => { T(c); forma(c); }, 1, 1.5);
  L.lower(c => { T(c); c.beginPath(); c.rect(0.25, 0.4, w - 0.5, hgt * 0.83); c.fill(); }, 0.7, Math.max(2, ppu * 0.012));
  const r = rng(seed); const lH = lay.letraH;
  for (const g of lay.glyphs) {
    if (!inR(g.x, g.y)) { r(); r(); r(); continue; }
    if (g.dot) { L.incise(c => { T(c); ell(c, g.x, g.y, lH * 0.07, lH * 0.07); }, 0.45, 1); continue; }
    const jx = (r() - 0.5) * lH * 0.04, jy = (r() - 0.5) * lH * 0.07, rot = (r() - 0.5) * 0.06;
    const draw = (c) => { T(c); c.save(); c.translate(g.x + jx, g.y + jy); c.scale(1, -1); c.rotate(rot); c.font = `${lH}px "${fonte}"`; c.textAlign = 'right'; c.textBaseline = 'alphabetic'; c.fillText(AL[g.ch] || '?', 0, 0); c.restore(); };
    L.incise(draw, 0.45, Math.max(1, ppu * 0.0025));
    if (g.glow) em.draw(draw, 1, 0);
  }
  // linhas não preservadas: marcas de desgaste, não letras (não inventamos texto)
  for (const y of lay.apagadas) { if (!inR(w / 2, y, 1)) continue; L.incise(c => { T(c); for (let x = 0.45; x < w - 0.45; x += lH * (0.4 + r() * 0.5)) { c.save(); c.translate(x, y + lH * 0.3 + (r() - 0.5) * lH * 0.2); c.rotate(r() * 3); c.fillRect(-lH * 0.1, -lH * 0.25, lH * (0.1 + r() * 0.15), lH * (0.3 + r() * 0.3)); c.restore(); } }, 0.18 + r() * 0.12, Math.max(1, ppu * 0.004)); }
  // poros do basalto
  L.incise(c => { T(c); for (let i = 0; i < 5000; i++) { const px = r() * w, py = r() * hgt; c.beginPath(); c.arc(px, py, 0.0012 + r() * r() * 0.006, 0, 7); c.fill(); } }, 0.16, 1);
  return { L, em, al, lay };
}

// ---------- MAPA em papiro (camada Documento) ----------
// devolve: L (altura das fibras), cor (canvas albedo papiro), tinta (canvas RGBA), ordem (Mask: ordem de revelação)
export const LUGARES = { damasco: [6.35, 3.55], dan: [4.55, 3.15], samaria: [3.35, 1.95], jerusalem: [3.05, 1.05] };
export function mapa(ppu, w = 8, hgt = 4.5) {
  const L = new Layer(w, hgt, ppu); const r = rng(21);
  L.raise(c => c.fillRect(0, 0, w, hgt), 0.25, 0);
  L.incise(c => { for (let i = 0; i < 2600; i++) { c.lineWidth = 0.003 + r() * 0.006; const y = r() * hgt, x = r() * w; line(c, [x, y], [x + 0.2 + r() * 0.6, y + (r() - 0.5) * 0.01]); } }, 0.08, 1);
  L.incise(c => { for (let i = 0; i < 900; i++) { c.lineWidth = 0.003 + r() * 0.005; const y = r() * hgt, x = r() * w; line(c, [x, y], [x + (r() - 0.5) * 0.01, y + 0.2 + r() * 0.5]); } }, 0.06, 1);
  // bordas gastas
  const cor = document.createElement('canvas'); cor.width = L.W; cor.height = L.H; const cx = cor.getContext('2d'); L.world(cx);
  const g = cx.createRadialGradient(w / 2, hgt / 2, 0.5, w / 2, hgt / 2, w * 0.7); g.addColorStop(0, '#f1e6d2'); g.addColorStop(1, '#c9b48e'); cx.fillStyle = g; cx.fillRect(0, 0, w, hgt);
  for (let i = 0; i < 160; i++) { cx.fillStyle = `rgba(${120 + r() * 40},${90 + r() * 30},${50},${0.03 + r() * 0.04})`; ell(cx, r() * w, r() * hgt, 0.04 + r() * 0.18, 0.03 + r() * 0.12); }
  const tinta = document.createElement('canvas'); tinta.width = L.W; tinta.height = L.H; const tx = tinta.getContext('2d'); L.world(tx);
  const ordem = new Mask(L);
  // litoral e Jordão (sempre visíveis)
  tx.strokeStyle = 'rgba(40,30,22,0.85)'; tx.lineWidth = 0.025;
  curve(tx, [[1.2, 0.0], [1.5, 0.8], [1.75, 1.6], [2.1, 2.5], [2.6, 3.4], [2.9, 4.5]]);
  tx.strokeStyle = 'rgba(40,60,110,0.8)'; tx.lineWidth = 0.02; curve(tx, [[4.4, 3.0], [4.2, 2.6], [4.1, 2.1], [4.0, 1.5], [4.05, 1.0], [4.1, 0.5]]);
  tx.fillStyle = 'rgba(50,85,150,0.5)'; ell(tx, 4.15, 2.45, 0.09, 0.16); ell(tx, 4.15, 0.45, 0.14, 0.45);
  tx.fillStyle = 'rgba(40,60,110,0.12)'; tx.fillRect(0, 0, 1.3, hgt); // mar
  // montanhas (pequenos triângulos)
  tx.strokeStyle = 'rgba(60,45,30,0.55)'; tx.lineWidth = 0.012;
  for (let i = 0; i < 26; i++) { const x = 4.8 + r() * 1.6, y = 3.6 + r() * 0.7; path(tx, [[x - 0.08, y], [x, y + 0.1], [x + 0.08, y]]); }
  // cidades
  const cidade = (p, nome, sub) => { tx.fillStyle = 'rgba(40,30,22,0.95)'; ell(tx, p[0], p[1], 0.055, 0.055); tx.save(); tx.translate(p[0] + 0.1, p[1] + 0.05); tx.scale(1, -1); tx.font = '700 0.17px "Fraunces"'; tx.fillText(nome, 0, 0); if (sub) { tx.font = '600 0.09px "IBM Plex Mono"'; tx.fillText(sub, 0, 0.13); } tx.restore(); };
  cidade(LUGARES.damasco, 'Damasco', 'ARAM'); cidade(LUGARES.dan, 'Dã', 'ISRAEL'); cidade(LUGARES.samaria, 'Samaria', 'ISRAEL'); cidade(LUGARES.jerusalem, 'Jerusalém', 'JUDÁ');
  tx.save(); tx.translate(0.35, 2.4); tx.rotate(Math.PI / 2); tx.scale(1, -1); tx.font = 'italic 400 0.2px "Fraunces"'; tx.fillStyle = 'rgba(40,60,110,0.6)'; tx.fillText('Mar Grande', 0, 0); tx.restore();
  // rota de tinta vermelha: Damasco → Dã → Samaria → (Jerusalém); ordem 0.05..0.75
  const rota = [LUGARES.damasco, [5.6, 3.5], LUGARES.dan, [4.0, 2.6], LUGARES.samaria, [3.3, 1.65], [3.22, 1.42]];
  const pts = []; for (let i = 0; i < rota.length - 1; i++) for (let k = 0; k < 20; k++) { const t = k / 20; pts.push([rota[i][0] + (rota[i + 1][0] - rota[i][0]) * t, rota[i][1] + (rota[i + 1][1] - rota[i][1]) * t]); }
  tx.strokeStyle = 'rgba(150,30,20,0.92)'; tx.lineWidth = 0.05;
  for (let i = 0; i < pts.length - 1; i++) { const v = 0.05 + 0.7 * i / pts.length; if (i % 6 < 4) { line(tx, pts[i], pts[i + 1]); ordem.draw(c => line(c, pts[i], pts[i + 1], 0.07), v, 0, 'source-over'); } }
  // ponta da seta
  const pa = pts[pts.length - 1]; tx.fillStyle = 'rgba(150,30,20,0.92)'; poly(tx, [[pa[0] - 0.12, pa[1] + 0.08], [pa[0] + 0.06, pa[1] - 0.05], [pa[0] + 0.1, pa[1] + 0.12]]);
  ordem.draw(c => ell(c, pa[0], pa[1], 0.16, 0.16), 0.78, 0, 'source-over');
  // "X" sobre cidades de Israel (revelam em 0.82) e moedas em Jerusalém (0.9)
  tx.strokeStyle = 'rgba(150,30,20,0.95)'; tx.lineWidth = 0.04;
  for (const p of [[4.75, 2.85], [3.75, 2.3], [3.55, 1.7]]) { line(tx, [p[0] - 0.09, p[1] - 0.09], [p[0] + 0.09, p[1] + 0.09]); line(tx, [p[0] - 0.09, p[1] + 0.09], [p[0] + 0.09, p[1] - 0.09]); ordem.draw(c => ell(c, p[0], p[1], 0.15, 0.15), 0.82, 0, 'source-over'); }
  tx.fillStyle = 'rgba(170,120,30,0.95)'; for (let k = 0; k < 3; k++) { ell(tx, 2.7 + k * 0.11, 0.78, 0.05, 0.05); } ordem.draw(c => c.fillRect(2.55, 0.65, 0.5, 0.25), 0.9, 0, 'source-over');
  return { L, cor, tinta, ordem };
}

// ---------- PLACA DO TÍTULO (carimbo) ----------
export function placaTitulo(ppu, w = 6, hgt = 2.6, texto = 'O CASO DAVI', marcado = true) {
  const L = new Layer(w, hgt, ppu);
  L.raise(c => { c.beginPath(); c.roundRect(0.1, 0.1, w - 0.2, hgt - 0.2, 0.28); c.fill(); }, 0.6, 8);
  L.incise(c => { c.lineWidth = 0.03; c.beginPath(); c.roundRect(0.3, 0.3, w - 0.6, hgt - 0.6, 0.16); c.stroke(); }, 0.12, 2);
  if (marcado) {
    L.incise(c => { c.save(); c.translate(w / 2, hgt * 0.4); c.scale(1, -1); c.font = `900 0.82px "Fraunces"`; c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.fillText(texto, 0, 0); c.restore(); }, 0.5, 2);
    L.incise(c => { c.save(); c.translate(w / 2, hgt * 0.21); c.scale(1, -1); c.font = `600 0.17px "IBM Plex Mono"`; c.textAlign = 'center'; c.fillText('DEBAIXO DA TERRA  ·  LONGO Nº 01', 0, 0); c.restore(); }, 0.35, 1);
  }
  return L;
}

// ---------- cidade no alto do morro (Jerusalém, relevo) ----------
export function cidadeMorro(ppu, w = 12, hgt = 6.5) {
  const L = new Layer(w, hgt, ppu); const r = rng(14);
  L.raise(c => { const pts = [[0, 0]]; for (let i = 0; i <= 30; i++) { const x = i / 30 * w; pts.push([x, 1.2 + 1.9 * Math.exp(-Math.pow((x - w * 0.5) / (w * 0.28), 2)) + Math.sin(i * 1.7) * 0.06]); } pts.push([w, 0]); poly(c, pts); }, 0.35, 5);
  L.incise(c => { c.lineWidth = 0.02; for (let k = 0; k < 7; k++) { const y = 0.4 + k * 0.32; const pts = []; for (let x = 0; x <= w; x += 0.3) pts.push([x, y + Math.sin(x * 0.9 + k) * 0.05]); curve(c, pts); } }, 0.18, 1.2);
  const cx = w * 0.5, base = 2.9;
  L.raise(c => { c.fillRect(cx - 2.6, base - 0.2, 5.2, 1.0); for (let k = 0; k < 11; k++) c.fillRect(cx - 2.6 + k * 0.49, base + 0.8, 0.27, 0.22); for (const tx of [-2.75, -1.1, 0.6, 2.25]) { c.fillRect(cx + tx, base - 0.2, 0.55, 1.5); for (let k = 0; k < 3; k++) c.fillRect(cx + tx + k * 0.2, base + 1.3, 0.13, 0.18); } }, 0.62, 3);
  L.raise(c => { for (let k = 0; k < 9; k++) { const x = cx - 2.0 + k * 0.48 + (r() - 0.5) * 0.1, hh = 0.35 + r() * 0.4; c.fillRect(x, base + 1.0, 0.36, hh); } }, 0.5, 3);
  L.raise(c => { c.fillRect(cx - 0.5, base + 1.0, 1.0, 0.9); poly(c, [[cx - 0.6, base + 1.9], [cx + 0.6, base + 1.9], [cx, base + 2.25]]); }, 0.7, 3); // edifício alto
  L.incise(c => { c.lineWidth = 0.012; for (let y = base - 0.1; y < base + 0.8; y += 0.13) line(c, [cx - 2.6, y], [cx + 2.6, y]); c.beginPath(); c.arc(cx, base - 0.2, 0.3, 0, Math.PI); c.fill(); }, 0.3, 1);
  return L;
}

// ---------- documento: papiro com tinta (colTex + inkTex + ordem de revelação) ----------
function papiroBase(ppu, w, hgt, seed) {
  const L = new Layer(w, hgt, ppu); const r = rng(seed);
  L.raise(c => c.fillRect(0, 0, w, hgt), 0.25, 0);
  L.incise(c => { for (let i = 0; i < 2400; i++) { c.lineWidth = 0.003 + r() * 0.006; const y = r() * hgt, x = r() * w; line(c, [x, y], [x + 0.2 + r() * 0.6, y + (r() - 0.5) * 0.01]); } }, 0.08, 1);
  L.incise(c => { for (let i = 0; i < 800; i++) { c.lineWidth = 0.003 + r() * 0.005; const y = r() * hgt, x = r() * w; line(c, [x, y], [x + (r() - 0.5) * 0.01, y + 0.2 + r() * 0.5]); } }, 0.06, 1);
  const cor = document.createElement('canvas'); cor.width = L.W; cor.height = L.H; const cx = cor.getContext('2d'); L.world(cx);
  const g = cx.createRadialGradient(w / 2, hgt / 2, 0.5, w / 2, hgt / 2, w * 0.7); g.addColorStop(0, '#f1e6d2'); g.addColorStop(1, '#c4ad86'); cx.fillStyle = g; cx.fillRect(0, 0, w, hgt);
  for (let i = 0; i < 140; i++) { cx.fillStyle = `rgba(${120 + r() * 40},${90 + r() * 30},50,${0.03 + r() * 0.04})`; ell(cx, r() * w, r() * hgt, 0.04 + r() * 0.18, 0.03 + r() * 0.12); }
  const tinta = document.createElement('canvas'); tinta.width = L.W; tinta.height = L.H; const tx = tinta.getContext('2d'); L.world(tx);
  return { L, cor, tinta, tx, ordem: new Mask(L) };
}
const txt = (tx, s, x, y, font, color, align = 'left') => { tx.save(); tx.translate(x, y); tx.scale(1, -1); tx.font = font; tx.fillStyle = color; tx.textAlign = align; tx.fillText(s, 0, 0); tx.restore(); };
// linha do tempo: "c. 1000 a.C. — Davi"  ...vazio...  "1990"; a linha se desenha (ordem 0..0.8)
export function linhaTempo(ppu, w = 8, hgt = 4.5) {
  const P = papiroBase(ppu, w, hgt, 31); const { tx, ordem } = P; const y = 2.1, x0 = 0.9, x1 = 7.1;
  tx.strokeStyle = 'rgba(40,30,22,0.9)'; tx.lineWidth = 0.035; line(tx, [x0, y], [x1, y]); ordem.draw(c => line(c, [x0, y], [x1, y], 0.08), 0.05, 0, 'source-over');
  for (let k = 0; k < 40; k++) { const x = x0 + (x1 - x0) * k / 39; ordem.draw(c => c.fillRect(x - 0.08, y - 0.1, (x1 - x0) / 39 + 0.16, 0.2), 0.05 + 0.6 * k / 39, 0, 'source-over'); }
  tx.fillStyle = 'rgba(40,30,22,0.95)'; ell(tx, x0, y, 0.07, 0.07); ell(tx, x1, y, 0.07, 0.07);
  txt(tx, 'c. 1000 a.C.', x0, y - 0.42, '600 0.2px "IBM Plex Mono"', 'rgba(40,30,22,0.95)', 'center'); txt(tx, 'DAVI', x0, y + 0.3, '900 0.34px "Fraunces"', 'rgba(150,30,20,0.95)', 'center');
  txt(tx, '1990', x1, y - 0.42, '600 0.2px "IBM Plex Mono"', 'rgba(40,30,22,0.95)', 'center');
  // marcas de "nada" ao longo da linha: pequenos traços vazios
  for (let k = 1; k < 9; k++) { const x = x0 + (x1 - x0) * k / 9; tx.lineWidth = 0.02; line(tx, [x, y - 0.1], [x, y + 0.1]); }
  txt(tx, 'nenhuma prova fora da Bíblia', (x0 + x1) / 2, y + 0.5, 'italic 400 0.26px "Fraunces"', 'rgba(40,30,22,0.85)', 'center'); ordem.draw(c => c.fillRect((x0 + x1) / 2 - 2.2, y + 0.35, 4.4, 0.45), 0.72, 0, 'source-over');
  return P;
}
// "DAVI: LENDA?" escrito a tinta
export function papiroLenda(ppu, w = 8, hgt = 4.5) {
  const P = papiroBase(ppu, w, hgt, 41); const { tx, ordem } = P;
  txt(tx, 'DAVI', w / 2, 2.45, '900 1.1px "Fraunces"', 'rgba(40,30,22,0.95)', 'center');
  txt(tx, 'lenda?', w / 2 + 0.2, 1.45, 'italic 400 0.9px "Fraunces"', 'rgba(150,30,20,0.95)', 'center'); ordem.draw(c => c.fillRect(w / 2 - 1.6, 1.15, 3.6, 0.95), 0.5, 0, 'source-over');
  tx.strokeStyle = 'rgba(150,30,20,0.9)'; tx.lineWidth = 0.05; curve(tx, [[w / 2 - 1.6, 1.12], [w / 2, 1.02], [w / 2 + 1.8, 1.1]]); ordem.draw(c => c.fillRect(w / 2 - 1.7, 0.95, 3.6, 0.22), 0.7, 0, 'source-over');
  return P;
}

// ---------- corte de estratos em relevo (cor por camada) + fragmento de basalto no fundo ----------
export function estratosRelevo(ppu, w = 6, hgt = 10, fragmento = null) {
  const L = new Layer(w, hgt, ppu); const r = rng(77);
  const cor = document.createElement('canvas'); cor.width = L.W; cor.height = L.H; const cx = cor.getContext('2d'); L.world(cx);
  const cores = ['#8a6a44', '#4e3c2e', '#b0a286', '#6e5440', '#3a2c24', '#9a7448', '#c4b38e', '#7a4e30', '#5a4a3a', '#a08458', '#65503c'];
  let y = hgt; let k = 0; const faixas = [];
  while (y > 0) { const h = 0.25 + r() * 0.5; const y0 = Math.max(0, y - h); faixas.push([y0, y, k]);
    const base = 0.3 + (k % 3) * 0.08 + r() * 0.06; const tipo = (r() * 4) | 0;
    // borda ondulada da camada
    const borda = []; for (let x = 0; x <= w + 0.2; x += 0.2) borda.push([x, y0 + Math.sin(x * 1.7 + k) * 0.04 + (r() - 0.5) * 0.03]);
    const forma = (c) => { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); for (let i = borda.length - 1; i >= 0; i--) c.lineTo(borda[i][0], borda[i][1]); c.closePath(); c.fill(); };
    L.raise(forma, base, 3, 'source-over');
    cx.fillStyle = cores[k % cores.length]; forma(cx);
    if (tipo === 0) L.raise(c => { for (let i = 0; i < 260; i++) { const px = r() * w, py = y0 + r() * (y - y0); ell(c, px, py, 0.01 + r() * 0.025, 0.008 + r() * 0.02); } }, base + 0.12, 1.5); // cascalho
    if (tipo === 1) L.incise(c => { c.lineWidth = 0.008; for (let i = 0; i < 18; i++) { const px = r() * w, py = y0 + r() * (y - y0); line(c, [px, py], [px + (r() - 0.5) * 0.4, py + (r() - 0.5) * 0.1]); } }, 0.3, 1); // rachaduras
    if (tipo === 2) L.raise(c => { for (let i = 0; i < 9; i++) { const px = r() * w, py = y0 + 0.08 + r() * (y - y0 - 0.16); ell(c, px, py, 0.06 + r() * 0.1, 0.04 + r() * 0.06, r() * 3); } }, base + 0.22, 3); // pedras
    // achados: cacos curvos, ossos e moedas
    for (let i = 0; i < 3; i++) { const px = 0.3 + r() * (w - 0.6), py = y0 + 0.08 + r() * Math.max(0.01, y - y0 - 0.16), q = r();
      if (q < 0.5) { L.raise(c => { c.lineWidth = 0.035; c.beginPath(); c.arc(px, py, 0.14 + r() * 0.08, 0.3 + r(), 1.6 + r()); c.stroke(); }, base + 0.28, 1.5); cx.strokeStyle = '#b5532c'; cx.lineWidth = 0.04; cx.beginPath(); cx.arc(px, py, 0.16, 0.5, 1.9); cx.stroke(); }
      else if (q < 0.8) { L.raise(c => { c.lineWidth = 0.03; line(c, [px - 0.12, py], [px + 0.12, py + 0.03]); ell(c, px - 0.13, py, 0.03, 0.03); ell(c, px + 0.13, py + 0.03, 0.03, 0.03); }, base + 0.25, 1.2); cx.fillStyle = '#e2d6bc'; ell(cx, px, py + 0.015, 0.14, 0.03); }
      else { L.raise(c => ell(c, px, py, 0.04, 0.04), base + 0.3, 1.2); cx.fillStyle = '#b08a3a'; ell(cx, px, py, 0.045, 0.045); } }
    y = y0; k++; }
  // ruído de cor por camada
  for (let i = 0; i < 1500; i++) { cx.fillStyle = `rgba(${r() < 0.5 ? 20 : 230},${r() < 0.5 ? 15 : 210},10,${0.03 + r() * 0.05})`; ell(cx, r() * w, r() * hgt, 0.01 + r() * 0.05, 0.01 + r() * 0.04); }
  if (fragmento) { const { L: F, x, y: fy } = fragmento; L.stamp(F, x, fy, 'source-over'); cx.save(); cx.setTransform(1, 0, 0, 1, 0, 0); cx.globalAlpha = 1; const tmp = document.createElement('canvas'); tmp.width = F.W; tmp.height = F.H; const tc = tmp.getContext('2d'); const d = F.x.getImageData(0, 0, F.W, F.H); const id = tc.createImageData(F.W, F.H);
    for (let i = 0; i < d.data.length; i += 4) { const v = d.data[i]; const on = v > 20; id.data[i] = 30 + v * 0.12; id.data[i + 1] = 30 + v * 0.12; id.data[i + 2] = 36 + v * 0.14; id.data[i + 3] = on ? 255 : 0; }
    tc.putImageData(id, 0, 0); cx.drawImage(tmp, Math.round(x * L.ppu), Math.round(L.H - (fy + F.h) * L.ppu)); cx.restore(); }
  return { L, cor };
}
