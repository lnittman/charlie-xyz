import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Charlie Command Center",
    short_name: "Charlie",
    description: "Monitor and control your Charlie AI assistants",
    start_url: "/",
    display: "standalone",
    background_color: "#010101",
    theme_color: "#ABF716",
    icons: [
      {
        src: "/favicon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  }
}