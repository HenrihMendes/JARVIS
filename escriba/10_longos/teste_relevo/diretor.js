// DIRETOR — lê uma lista de planos (JSON) e gera o vídeo do capítulo, sem código novo por plano.
//   tipo "anim"   → quadros reais do motor, 24 fps (só para planos de herói: gancho, carimbo, coisas que se mexem)
//   tipo "quadro" → 1 quadro em alta resolução + câmera no ffmpeg (zoom, deslocamento, pausa). ~50x mais rápido
//   "entrada": {"tipo":"funde","dur":0.8} → fusão com o plano anterior, centrada no corte (o tempo da narração não muda)
// Uso:  node diretor.js planos/L01_cap0.json            (retomável: pula clipes e quadros que já existem)
//       node diretor.js planos/L01_cap0.json P04,P08    (refaz só estes planos)
//       node diretor.js planos/L01_cap0.json --quadros  (só os quadros-chave, para revisar antes de gerar os clipes)
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path'); const { execFileSync } = require('child_process');
const FPS = 24, W = 1920, H = 1080;
const arq = process.argv[2], extra = process.argv[3] || ''; const SO_QUADROS = extra === '--quadros'; const REFAZ = extra && !SO_QUADROS ? extra.split(',') : null;
const ROT = JSON.parse(fs.readFileSync(arq, 'utf8')); const OUT = path.resolve(__dirname, ROT.saida);
for (const d of ['clipes', 'quadros', 'tmp']) fs.mkdirSync(path.join(OUT, d), { recursive: true });
const ff = (args) => execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', ...args.map(String)], { stdio: 'inherit' });
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const P = ROT.planos;

// folgas para as fusões: metade antes do corte (no plano que entra), metade depois (no plano que sai)
P.forEach((p, i) => { p.dur = +(p.fim - p.ini).toFixed(3); p.head = p.entrada?.tipo === 'funde' ? p.entrada.dur / 2 : 0; const nx = P[i + 1]; p.tail = nx?.entrada?.tipo === 'funde' ? nx.entrada.dur / 2 : 0; p.n = Math.round((p.dur + p.head + p.tail) * FPS); });

let browser = null; const paginas = {};
async function pagina(escala) {
  if (paginas[escala]) return paginas[escala];
  browser = browser || await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--allow-file-access-from-files', '--ignore-gpu-blocklist'] });
  const pg = await browser.newPage({ viewport: { width: W, height: H } });
  pg.on('pageerror', e => console.log('[pageerror]', e.message)); pg.on('console', m => { if (m.type() === 'error') console.log('[page]', m.text().slice(0, 300)); });
  await pg.goto('file://' + path.resolve(__dirname, ROT.pagina) + '?s=' + escala + (ROT.qs ? '&' + ROT.qs : '')); await pg.waitForFunction('window.ready === true', null, { timeout: 180000 });
  return (paginas[escala] = pg);
}
const salva = async (pg, fp, fmt) => { const d = await pg.evaluate(f => window.frame(f), fmt); fs.writeFileSync(fp, Buffer.from(d.split(',')[1], 'base64')); };

async function anim(p, clip) {
  const pg = await pagina(1); const dir = path.join(OUT, 'tmp', p.id); fs.mkdirSync(dir, { recursive: true }); const ini = Date.now();
  const [u0, u1] = p.u_faixa || [0, 1];
  for (let f = 0; f < p.n; f++) {
    const fp = path.join(dir, `f${String(f).padStart(5, '0')}.jpg`); if (fs.existsSync(fp)) continue;
    const tl = f / FPS - p.head; const t = (p.t0 || 0) + Math.max(0, tl), u = u0 + (u1 - u0) * clamp(tl / p.dur, 0, 1);
    await pg.evaluate(([c, t, u]) => window.renderShot(c, t, u), [p.cena, t, u]); await salva(pg, fp, 'jpg');
  }
  ff(['-framerate', FPS, '-i', path.join(dir, 'f%05d.jpg'), '-frames:v', p.n, '-c:v', 'libx264', '-crf', 12, '-preset', 'fast', '-pix_fmt', 'yuv420p', clip]);
  fs.rmSync(dir, { recursive: true, force: true }); return (Date.now() - ini) / 1000;
}

async function quadro(p) {
  const fp = path.join(OUT, 'quadros', p.id + '.png'), fm = path.join(OUT, 'quadros', p.id + '.json');
  if (!fs.existsSync(fp) || (REFAZ && REFAZ.includes(p.id))) {
    const pg = await pagina(p.escala || 2); const meta = await pg.evaluate(([c, t, u]) => window.renderShot(c, t, u), [p.cena, p.t ?? 0, p.u ?? 0.5]);
    await salva(pg, fp, 'png'); fs.writeFileSync(fm, JSON.stringify(meta || {}));
  }
  return { fp, meta: JSON.parse(fs.readFileSync(fm, 'utf8')) };
}

// câmera do ffmpeg: chaves {t, z, x, y} (x,y = centro do enquadramento, 0..1) ou {t, z, foco: i} (centro de um objeto do quadro)
function expr(chaves, campo, T) {
  const k = chaves; let e = `${k[k.length - 1][campo]}`;
  for (let i = k.length - 2; i >= 0; i--) {
    const a = k[i], b = k[i + 1], d = Math.max(b.t - a.t, 1e-3); const s = `clip((${T}-${a.t})/${d},0,1)`;
    e = `if(lt(${T},${b.t}),${a[campo]}+(${b[campo] - a[campo]})*${s}*${s}*(3-2*${s}),${e})`;
  }
  return `if(lt(${T},${k[0].t}),${k[0][campo]},${e})`;
}
async function clipeQuadro(p, clip) {
  const ini = Date.now(); const { fp, meta } = await quadro(p); if (SO_QUADROS) return 0;
  const chaves = (p.cam || [{ t: 0, z: 1, x: 0.5, y: 0.5 }, { t: p.dur, z: 1.08, x: 0.5, y: 0.5 }]).map(c => { const f = c.foco !== undefined ? meta.focos[c.foco] : [c.x ?? 0.5, c.y ?? 0.5]; return { t: c.t, z: c.z ?? 1, x: f[0], y: f[1] }; });
  // fonte com >= 7680 px de largura: o erro de arredondamento do zoompan fica abaixo de 1/4 de pixel na saída (sem tremido)
  const larg = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v', '-show_entries', 'stream=width', '-of', 'json', fp]).toString()).streams[0].width;
  let src = fp; if (larg < 7680) { src = path.join(OUT, 'tmp', p.id + '_8k.png'); if (!fs.existsSync(src)) ff(['-i', fp, '-vf', 'scale=7680:-1:flags=lanczos', src]); }
  const T = `(on/${FPS}-${p.head})`;
  const Z = expr(chaves, 'z', T), X = expr(chaves, 'x', T), Y = expr(chaves, 'y', T);
  const zp = `zoompan=z='${Z}':x='clip((${X})*iw-iw/zoom/2,0,iw-iw/zoom)':y='clip((${Y})*ih-ih/zoom/2,0,ih-ih/zoom)':d=${p.n}:s=${W}x${H}:fps=${FPS}`;
  const luz = p.luz === 'lamparina' ? `,eq=brightness='0.012*sin(2*PI*t*1.7)+0.008*sin(2*PI*t*4.3+1)':eval=frame` : '';
  ff(['-loop', 1, '-framerate', FPS, '-i', src, '-vf', zp + luz + ',format=yuv420p', '-frames:v', p.n, '-c:v', 'libx264', '-crf', 12, '-preset', 'fast', clip]);
  return (Date.now() - ini) / 1000;
}

(async () => {
  const log = [];
  for (const p of P) {
    const clip = path.join(OUT, 'clipes', p.id + '.mp4'); if (REFAZ && !REFAZ.includes(p.id) && fs.existsSync(clip)) continue;
    if (!REFAZ && !SO_QUADROS && fs.existsSync(clip)) continue;
    if (SO_QUADROS && p.tipo !== 'quadro') continue;
    let s; try { s = p.tipo === 'anim' ? await anim(p, clip) : await clipeQuadro(p, clip); } catch (e) { const m = `${p.id} FALHOU: ${String(e.message || e).split('\n')[0]}`; console.log(m); log.push(m); continue; }
    const msg = `${p.id} ${p.tipo.padEnd(6)} ${p.cena.padEnd(5)} ${p.dur.toFixed(1).padStart(4)} s → ${s.toFixed(0)} s de render`; console.log(msg); log.push(msg);
  }
  if (browser) await browser.close(); if (SO_QUADROS) return;
  const faltam = P.filter(p => !fs.existsSync(path.join(OUT, 'clipes', p.id + '.mp4'))).map(p => p.id); if (faltam.length) { console.log('montagem adiada; faltam os clipes', faltam.join(', ')); return; }
  // montagem dos clipes: corte seco (concat) ou fusão (xfade) centrada no corte
  const ins = P.flatMap(p => ['-i', path.join(OUT, 'clipes', p.id + '.mp4')]); let fc = P.map((p, i) => `[${i}:v]settb=AVTB,fps=${FPS},format=yuv420p,setsar=1[s${i}]`).join(';');
  let cur = '[s0]', len = P[0].n / FPS;
  for (let i = 1; i < P.length; i++) { const p = P[i], o = `[v${i}]`;
    if (p.entrada?.tipo === 'funde') { fc += `;${cur}[s${i}]xfade=transition=fade:duration=${p.entrada.dur}:offset=${(len - p.entrada.dur).toFixed(4)}${o}`; len += p.n / FPS - p.entrada.dur; }
    else { fc += `;${cur}[s${i}]concat=n=2:v=1:a=0${o}`; len += p.n / FPS; }
    cur = o; }
  const video = path.join(OUT, 'video.mp4');
  ff([...ins, '-filter_complex', fc, '-map', cur, '-c:v', 'libx264', '-crf', 14, '-preset', 'medium', '-pix_fmt', 'yuv420p', video]);
  console.log(`vídeo: ${video} · ${len.toFixed(2)} s (esperado ${ROT.dur} s)`);
})();
