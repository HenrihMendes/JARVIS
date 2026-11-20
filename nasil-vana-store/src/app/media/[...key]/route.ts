import { getLocalObject } from "@/lib/storage";

/** Serve imagens processadas do armazenamento local (STORAGE_DRIVER=local). */
const TYPES: Record<string, string> = { avif: "image/avif", webp: "image/webp" };

export async function GET(_req: Request, ctx: RouteContext<"/media/[...key]">) {
  const { key } = await ctx.params;
  const path = key.join("/");
  const ext = path.split(".").pop() ?? "";
  if (!TYPES[ext] || !/^media\/[0-9a-f-]{36}\/\d{2,4}\.(avif|webp)$/.test(`media/${path.replace(/^media\//, "")}`)) {
    return new Response("Not found", { status: 404 });
  }
  const file = await getLocalObject(path.startsWith("media/") ? path : `media/${path}`);
  if (!file) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(file), {
    headers: {
      "content-type": TYPES[ext],
      "cache-control": "public, max-age=31536000, immutable",
      // Netlify: guarda na CDN para não executar a função a cada visualização
      "netlify-cdn-cache-control": "public, durable, max-age=31536000, immutable",
      "x-content-type-options": "nosniff",
    },
  });
}
