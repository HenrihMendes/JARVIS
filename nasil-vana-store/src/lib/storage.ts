import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { AwsClient } from "aws4fetch";
import { getStore } from "@netlify/blobs";
import { env } from "./env";

/**
 * Armazenamento de arquivos públicos (imagens já processadas).
 * - local: disco do servidor (VPS/Docker com volume persistente)
 * - s3: qualquer serviço compatível com S3 (Cloudflare R2, AWS S3, Supabase Storage, Backblaze B2)
 */
const SAFE_KEY = /^[a-z0-9][a-z0-9/_.-]{0,200}$/;

function assertKey(key: string) {
  if (!SAFE_KEY.test(key) || key.includes("..")) throw new Error("Chave de arquivo inválida");
}

function localPath(key: string) {
  assertKey(key);
  const root = path.resolve(env.STORAGE_LOCAL_DIR);
  const full = path.resolve(root, key);
  if (!full.startsWith(root + path.sep)) throw new Error("Caminho inválido");
  return full;
}

let s3: AwsClient | null = null;
function s3Client() {
  if (!env.S3_ENDPOINT || !env.S3_BUCKET || !env.S3_ACCESS_KEY_ID || !env.S3_SECRET_ACCESS_KEY) {
    throw new Error("STORAGE_DRIVER=s3 exige S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY_ID e S3_SECRET_ACCESS_KEY");
  }
  s3 ??= new AwsClient({
    accessKeyId: env.S3_ACCESS_KEY_ID,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY,
    region: env.S3_REGION,
    service: "s3",
  });
  return s3;
}
const s3Url = (key: string) => `${env.S3_ENDPOINT!.replace(/\/$/, "")}/${env.S3_BUCKET}/${key}`;

const blobs = () => getStore({ name: "media", consistency: "strong" });

export async function putObject(key: string, body: Buffer, contentType: string) {
  assertKey(key);
  if (env.STORAGE_DRIVER === "netlify-blobs") {
    const ab = body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength) as ArrayBuffer;
    await blobs().set(key, ab, { metadata: { contentType } });
    return;
  }
  if (env.STORAGE_DRIVER === "local") {
    const p = localPath(key);
    await mkdir(path.dirname(p), { recursive: true });
    await writeFile(p, body);
    return;
  }
  const res = await s3Client().fetch(s3Url(key), {
    method: "PUT",
    body: new Uint8Array(body),
    headers: {
      "content-type": contentType,
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
  if (!res.ok) throw new Error(`Falha ao enviar arquivo (${res.status})`);
}

export async function getLocalObject(key: string): Promise<Buffer | null> {
  if (env.STORAGE_DRIVER === "netlify-blobs") {
    assertKey(key);
    const ab = await blobs().get(key, { type: "arrayBuffer" });
    return ab ? Buffer.from(ab) : null;
  }
  try {
    return await readFile(localPath(key));
  } catch {
    return null;
  }
}

export async function deletePrefix(prefix: string, files: string[]) {
  for (const f of files) {
    const key = `${prefix}/${f}`;
    assertKey(key);
    if (env.STORAGE_DRIVER === "netlify-blobs") await blobs().delete(key);
    else if (env.STORAGE_DRIVER === "local") await rm(localPath(key), { force: true });
    else await s3Client().fetch(s3Url(key), { method: "DELETE" });
  }
}
