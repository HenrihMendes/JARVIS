/** Gera ícones (favicon, apple-touch, PWA) e a imagem padrão de compartilhamento a partir da logo. */
import sharp from "sharp";
import { readFileSync, writeFileSync } from "node:fs";
import { LOGO_MONO } from "../src/components/brand/logo-paths";

const PAPER = "#f6f2eb";
const INK = "#121110";
const [vx, vy, vw, vh] = LOGO_MONO.viewBox.split(" ").map(Number);

function monoSvg(size: number, pad: number, bg: string, fg: string, radius = 0) {
  const inner = size - pad * 2;
  const scale = Math.min(inner / vw, inner / vh);
  const w = vw * scale, h = vh * scale;
  const tx = (size - w) / 2 - vx * scale, ty = (size - h) / 2 - vy * scale;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" rx="${radius}" fill="${bg}"/><path transform="translate(${tx} ${ty}) scale(${scale})" fill="${fg}" d="${LOGO_MONO.d}"/></svg>`;
}

async function main() {
  writeFileSync("src/app/icon.svg", monoSvg(64, 9, PAPER, INK, 12));
  await sharp(Buffer.from(monoSvg(180, 34, PAPER, INK))).png().toFile("src/app/apple-icon.png");
  await sharp(Buffer.from(monoSvg(192, 40, INK, PAPER))).png().toFile("public/icon-192.png");
  await sharp(Buffer.from(monoSvg(512, 110, INK, PAPER))).png().toFile("public/icon-512.png");

  // Open Graph padrão 1200×630: papel, logo completa, fio vertical.
  const logo = readFileSync("public/brand/logo-full.svg", "utf8").replace('fill="#121110"', `fill="${INK}"`);
  const logoPng = await sharp(Buffer.from(logo)).resize({ width: 760 }).png().toBuffer();
  const meta = await sharp(logoPng).metadata();
  const label = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><text x="600" y="540" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="20" letter-spacing="7" fill="${INK}" opacity="0.7">MODA FEMININA · SINOP, MT</text><line x1="560" y1="500" x2="640" y2="500" stroke="#a8835a" stroke-width="1.5"/></svg>`,
  );
  await sharp({ create: { width: 1200, height: 630, channels: 3, background: PAPER } })
    .composite([
      { input: logoPng, left: Math.round((1200 - meta.width!) / 2), top: Math.round((560 - meta.height!) / 2) - 20 },
      { input: label, left: 0, top: 0 },
    ])
    .jpeg({ quality: 88 })
    .toFile("public/og-default.jpg");
  console.log("ok");
}
main();
