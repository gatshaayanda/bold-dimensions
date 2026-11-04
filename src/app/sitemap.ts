import type { MetadataRoute } from "next";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: baseUrl, changeFrequency: "weekly", priority: 1 },
    { url: baseUrl + "/services", changeFrequency: "weekly", priority: 0.9 },
    { url: baseUrl + "/order", changeFrequency: "weekly", priority: 0.8 }
  ];
}
