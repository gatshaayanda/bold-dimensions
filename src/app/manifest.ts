import type { MetadataRoute } from "next";
import { brand } from "@/config/brand";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: brand.name,
    short_name: brand.shortName,
    description: brand.description,
    start_url: "/",
    scope: "/",
    display_override: ["standalone", "minimal-ui"],
    display: "standalone",
    background_color: brand.backgroundColor,
    theme_color: brand.themeColor,
    orientation: "portrait-primary",
    lang: "en",
    categories: ["business", "productivity", "utilities"],
    prefer_related_applications: false,
    icons: [
      { src: brand.iconSvg, sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: brand.icon192, sizes: "192x192", type: "image/png", purpose: "any" },
      { src: brand.icon512, sizes: "512x512", type: "image/png", purpose: "any" },
      { src: brand.icon512, sizes: "512x512", type: "image/png", purpose: "maskable" }
    ],
    shortcuts: [
      { name: "Request a service", short_name: "Request", description: "Send a service or installation request.", url: "/order", icons: [{ src: brand.icon192, sizes: "192x192", type: "image/png" }] },
      { name: "My requests", short_name: "My requests", description: "Track your service requests and messages.", url: "/account", icons: [{ src: brand.icon192, sizes: "192x192", type: "image/png" }] }
    ]
  };
}