/** Exporta os recortes (PNG) para seed/crops-out — útil para revisar/editar as fotos fora do sistema. */
import sharp from "sharp";
import { CROPS } from "../seed/crops";
(async () => {
  for (const c of CROPS) await sharp(`seed/originals/${c.src}`).extract({ left: c.left, top: c.top, width: c.width, height: c.height }).png().toFile(`seed/crops-out/${c.out}.png`);
  console.log(CROPS.length, "recortes exportados");
})();
