import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Nasil Vana Store",
    short_name: "Nasil Vana",
    description: "Moda feminina em Sinop, MT.",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f2eb",
    theme_color: "#121110",
    lang: "pt-BR",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
