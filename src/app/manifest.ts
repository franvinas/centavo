import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Centavo",
    short_name: "Centavo",
    description: "Personal expense tracker",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#F5F4F1",
    theme_color: "#3D8A5A",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
