"use client";

import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase/client";

type HeroMedia = { url: string; type: "image" | "video"; alt?: string };

export default function JtsHomeHeroVisual() {
  const [media, setMedia] = useState<HeroMedia | null>(null);
  useEffect(() => onSnapshot(doc(db, "businessSettings", "publicServices"), snapshot => {
    const services = snapshot.data()?.services;
    if (!Array.isArray(services)) return;
    const first = services.find((service: any) => Array.isArray(service?.media) && service.media.some((item: any) => item?.url && (item.type === "image" || item.type === "video")));
    const item = first?.media?.find((entry: any) => entry?.url && (entry.type === "image" || entry.type === "video"));
    setMedia(item ? { url: item.url, type: item.type, alt: item.alt } : null);
  }, () => setMedia(null)), []);
  if (!media) return <div className="jtsHomeHeroFallback"><span>JTS STYLES</span><strong>THE ART OF<br/><em>YOUR LOOK.</em></strong><small>JOHN THE STYLIST · GABORONE</small></div>;
  return <div className="jtsHomeHeroMedia">{media.type === "video"
    ? <video src={media.url} autoPlay muted loop playsInline preload="metadata" aria-label={media.alt || "JTS styling film"} />
    : <img src={media.url} alt={media.alt || "A style by John at JTS Styles"} /> }
    <span className="jtsHomeHeroMediaLabel">THE JTS STYLE EDIT</span>
  </div>;
}
