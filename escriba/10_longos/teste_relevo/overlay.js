// Gera PNGs transparentes por ESTADO único da camada gráfica + lista ffconcat com as durações
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
(async () => {
  const DUR = 35.4, FPS = 24, N = Math.round(DUR * FPS); const out = 'overlay'; fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  await p.goto('file://' + path.resolve(__dirname, 'overlay.html')); await p.waitForFunction('window.ready === true');
  await p.evaluate(() => Promise.all([document.fonts.load('900 52px Fraunces'), document.fonts.load('800 20px Archivo'), document.fonts.load('700 26px Archivo'), document.fonts.load('600 22px "IBM Plex Mono"'), document.fonts.load('64px "Noto Sans Phoenician"', '\u{10901}')]));
  let last = null, idx = -1; const lista = [];
  for (let f = 0; f < N; f++) {
    const key = await p.evaluate(t => window.setState(t), f / FPS);
    if (key !== last) { idx++; const fn = `o${String(idx).padStart(4, '0')}.png`; await p.screenshot({ path: path.join(out, fn), omitBackground: true }); lista.push([fn, 1]); last = key; } else lista[lista.length - 1][1]++;
  }
  let txt = 'ffconcat version 1.0\n'; for (const [fn, n] of lista) txt += `file ${out}/${fn}\nduration ${(n / FPS).toFixed(6)}\n`; txt += `file ${out}/${lista[lista.length - 1][0]}\n`;
  fs.writeFileSync('overlay.ffconcat', txt); console.log('estados', lista.length); await b.close();
})();
