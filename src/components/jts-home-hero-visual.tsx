"use client";

import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase/client";

type HeroMedia = { url: string; type: "image" | "video"; alt?: string };
type MediaRecord = { url?: unknown; type?: unknown; alt?: unknown };
type ServiceRecord = { media?: unknown };

function isHeroMedia(value: unknown): value is HeroMedia {
  if (!value || typeof value !== "object") return false;
  const media = value as MediaRecord;
  return typeof media.url === "string" && media.url.length > 0
    && (media.type === "image" || media.type === "video");
}

export default function JtsHomeHeroVisual() {
  const [media, setMedia] = useState<HeroMedia | null>(null);

  useEffect(() => onSnapshot(doc(db, "businessSettings", "publicServices"), snapshot => {
    const data = snapshot.data();
    const savedCategoryMedia: unknown = data?.categoryMedia;
    const categoryItems = savedCategoryMedia && typeof savedCategoryMedia === "object"
      ? Object.values(savedCategoryMedia)
      : [];
    const savedServices: unknown = data?.services;
    const serviceItems = Array.isArray(savedServices)
      ? (savedServices as ServiceRecord[]).flatMap(service => Array.isArray(service.media) ? service.media : [])
      : [];
    const selected = [...categoryItems, ...serviceItems].find(isHeroMedia);

    setMedia(isHeroMedia(selected) ? {
      url: selected.url,
      type: selected.type,
      alt: typeof selected.alt === "string" ? selected.alt : undefined,
    } : null);
  }, () => setMedia(null)), []);

  if (!media) return <div className="jtsHomeHeroFallback"><span>JTS STYLES</span><strong>THE ART OF<br/><em>YOUR LOOK.</em></strong><small>JOHN THE STYLIST · GABORONE</small></div>;

  return <div className="jtsHomeHeroMedia">{media.type === "video"
    ? <video src={media.url} autoPlay muted loop playsInline preload="metadata" aria-label={media.alt || "JTS styling film"} />
    : <img src={media.url} alt={media.alt || "A style by John at JTS Styles"} /> }
    <span className="jtsHomeHeroMediaLabel">THE JTS STYLE EDIT</span>
  </div>;
}
