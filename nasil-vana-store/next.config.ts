import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";
const mediaOrigin = (() => {
  try {
    return process.env.NEXT_PUBLIC_MEDIA_BASE_URL?.startsWith("http") ? new URL(process.env.NEXT_PUBLIC_MEDIA_BASE_URL).origin : "";
  } catch {
    return "";
  }
})();

/**
 * Content-Security-Policy.
 * Nonces são incompatíveis com o pré-render parcial (PPR) do Next 16, então usamos uma política
 * restritiva por origem. 'unsafe-inline' em script-src é necessário para o runtime do Next;
 * a mitigação de XSS vem do React (escapa tudo) + nenhum HTML bruto vindo de usuários.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://www.googletagmanager.com`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${mediaOrigin} https://www.googletagmanager.com https://*.google-analytics.com`.trim(),
  "font-src 'self'",
  `connect-src 'self' ${mediaOrigin} https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com`.trim(),
  "frame-src 'none'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://www.mercadopago.com.br https://*.mercadopago.com.br https://*.mercadopago.com",
  "manifest-src 'self'",
  "worker-src 'self' blob:",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Docker/VPS usa o servidor "standalone"; na Netlify o adaptador oficial cuida do empacotamento.
  output: process.env.NETLIFY ? undefined : "standalone",
  poweredByHeader: false,
  reactStrictMode: true,
  serverExternalPackages: ["@node-rs/argon2", "sharp"],
  experimental: {
    serverActions: { bodySizeLimit: process.env.NETLIFY ? "6mb" : "16mb" },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/admin/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }, { key: "Cache-Control", value: "no-store" }] },
      { source: "/brand/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=2592000" }] },
    ];
  },
};

export default nextConfig;
