// Render de quadros: node render.js <saida_dir> <t_ini> <t_fim> [escala] [passo_quadros] [lista_de_tempos]
// Ex.: node render.js frames 0 35.4 1        (todos os quadros, 24 fps, pula os que já existem)
//      node render.js prev 0 0 0.33 0 "1,4,9"  (quadros soltos para revisão)
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
(async () => {
  const [out, t0s, t1s, sc = '1', , lista] = process.argv.slice(2); const SC = parseFloat(sc); fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--allow-file-access-from-files', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: Math.round(1920 * SC), height: Math.round(1080 * SC) } });
  p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') console.log('[page]', m.text().slice(0, 300)); }); p.on('pageerror', e => console.log('[pageerror]', e.message));
  await p.goto('file://' + path.resolve(__dirname, process.env.PAGE || 'teste.html') + '?s=' + SC + (process.env.QS ? '&' + process.env.QS : '')); await p.waitForFunction('window.ready === true', null, { timeout: 120000 });
  const FPS = 24; let tempos = [];
  if (lista) tempos = lista.split(',').map(Number); else { const f0 = Math.round(parseFloat(t0s) * FPS), f1 = Math.round(parseFloat(t1s) * FPS); for (let f = f0; f < f1; f++) tempos.push(f / FPS); }
  const ini = Date.now(); let n = 0;
  for (const T of tempos) {
    const nome = lista ? `t${T.toFixed(2)}.png` : `f${String(Math.round(T * FPS)).padStart(5, '0')}.png`; const fp = path.join(out, nome);
    if (!lista && fs.existsSync(fp)) continue;
    const t1 = Date.now(); const id = await p.evaluate(t => window.renderAt(t), T);
    const d = await p.evaluate(() => window.frame()); fs.writeFileSync(fp, Buffer.from(d.split(',')[1], 'base64')); n++;
    if (lista || n % 24 === 0) console.log(`${nome} ${id} ${(Date.now() - t1)}ms`);
  }
  console.log(`ok ${n} quadros em ${((Date.now() - ini) / 1000).toFixed(1)}s`); await b.close();
})();
