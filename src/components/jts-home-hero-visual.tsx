"use client";

import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase/client";

type HeroMedia = { url: string; type: "image" | "video"; alt?: string };
type ServiceMediaRecord = { url?: unknown; type?: unknown; alt?: unknown };
type PublicServiceRecord = { media?: unknown };

function isHeroMedia(value: unknown): value is HeroMedia {
  if (!value || typeof value !== "object") return false;
  const media = value as ServiceMediaRecord;
  return typeof media.url === "string"
    && media.url.length > 0
    && (media.type === "image" || media.type === "video");
}

export default function JtsHomeHeroVisual() {
  const [media, setMedia] = useState<HeroMedia | null>(null);

  useEffect(() => onSnapshot(doc(db, "businessSettings", "publicServices"), snapshot => {
    const services: unknown = snapshot.data()?.services;
    if (!Array.isArray(services)) {
      setMedia(null);
      return;
    }

    const firstService = (services as PublicServiceRecord[]).find(service =>
      Array.isArray(service.media) && service.media.some(isHeroMedia)
    );
    const selectedMedia = Array.isArray(firstService?.media)
      ? firstService.media.find(isHeroMedia)
      : undefined;

    if (isHeroMedia(selectedMedia)) {
      setMedia({
        url: selectedMedia.url,
        type: selectedMedia.type,
        alt: typeof selectedMedia.alt === "string" ? selectedMedia.alt : undefined,
      });
    } else {
      setMedia(null);
    }
  }, () => setMedia(null)), []);

  if (!media) return <div className="jtsHomeHeroFallback"><span>JTS STYLES</span><strong>THE ART OF<br/><em>YOUR LOOK.</em></strong><small>JOHN THE STYLIST · GABORONE</small></div>;

  return <div className="jtsHomeHeroMedia">{media.type === "video"
    ? <video src={media.url} autoPlay muted loop playsInline preload="metadata" aria-label={media.alt || "JTS styling film"} />
    : <img src={media.url} alt={media.alt || "A style by John at JTS Styles"} /> }
    <span className="jtsHomeHeroMediaLabel">THE JTS STYLE EDIT</span>
  </div>;
}
