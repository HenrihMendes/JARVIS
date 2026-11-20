/**
 * Reduz a foto no navegador antes do envio (máx. 2400 px, JPEG 90%).
 * Necessário em hospedagens serverless (Netlify/AWS Lambda) que recusam requisições > 6 MB.
 * Se o navegador não conseguir ler o formato (ex.: HEIC no Chrome), envia o original.
 */
export async function compressForUpload(file: File, maxSide = 2400, maxBytes = 4.5 * 1024 * 1024): Promise<File> {
  if (file.size <= maxBytes && !/heic|heif/i.test(file.type)) {
    try {
      const bmp = await createImageBitmap(file);
      const fits = Math.max(bmp.width, bmp.height) <= maxSide;
      bmp.close();
      if (fits) return file;
    } catch {
      return file;
    }
  }
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    bmp.close();
    for (const q of [0.9, 0.82, 0.72]) {
      const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", q));
      if (blob && blob.size <= maxBytes) return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
    }
  } catch {
    /* formato não suportado pelo navegador */
  }
  return file;
}
