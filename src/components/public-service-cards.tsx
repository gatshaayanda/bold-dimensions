"use client";

import Link from "next/link";
import { track } from "@vercel/analytics";
import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { db } from "@/lib/firebase/client";
import { mergePublicServices, PUBLIC_SERVICE_CATEGORIES, type PublicService, type PublicServiceMedia } from "@/lib/jts/public-services";

type CategoryMedia = Record<string, PublicServiceMedia>;

function CategoryVisual({ title, media }: { title: string; media?: PublicServiceMedia }) {
  if (!media) return <div className="jtsCategoryMediaFallback"><span>JOHN THE STYLIST BW</span><strong>{title}</strong><small>G WEST · GABORONE</small></div>;
  return <div className="jtsCategoryMedia">{media.type === "video"
    ? <video src={media.url} controls playsInline preload="metadata" aria-label={title + " category video"} />
    : <img src={media.url} alt={media.alt || title + " by John at John The Stylist Bw"} loading="lazy" />}</div>;
}

export default function PublicServiceCards() {
  const [services, setServices] = useState<PublicService[]>(() => mergePublicServices(undefined));
  const [categoryMedia, setCategoryMedia] = useState<CategoryMedia>({});
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => onSnapshot(doc(db, "businessSettings", "publicServices"), snapshot => {
    const data = snapshot.data();
    setServices(mergePublicServices(data?.services));
    const savedMedia = data?.categoryMedia;
    setCategoryMedia(savedMedia && typeof savedMedia === "object" ? savedMedia as CategoryMedia : {});
  }, () => setServices(current => current.length ? current : mergePublicServices(undefined))), []);

  useEffect(() => {
    if (!activeCategory) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setActiveCategory(null); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [activeCategory]);

  const groups = useMemo(() => PUBLIC_SERVICE_CATEGORIES.map(tag => ({
    tag,
    services: services.filter(service => service.tag === tag),
    media: categoryMedia[tag] || services.find(service => service.tag === tag && service.media?.length)?.media?.[0],
  })), [services, categoryMedia]);
  const active = groups.find(group => group.tag === activeCategory);

  return <>
    <div className="jtsCategoryGrid jtsCategoryGridCompact">
      {groups.map((group, index) => <article className="jtsCategoryCard jtsCategoryCardCompact" key={group.tag}>
        <div className="jtsCategoryVisual"><CategoryVisual title={group.tag} media={group.media} /><span className="jtsCategoryIndex">{String(index + 1).padStart(2, "0")} / 04</span></div>
        <div className="jtsCategoryCompactBody"><div><span className="jtsEditEyebrow">SERVICE CATEGORY</span><h3>{group.tag}</h3><p>{group.services.length} services · BWP</p></div>
          <button type="button" onClick={() => { setActiveCategory(group.tag); track("jts_service_viewed", { category: group.tag }); }}>Explore styles <span>↗</span></button>
        </div>
      </article>)}
    </div>
    {active && <div className="jtsPriceModalBackdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setActiveCategory(null); }}>
      <section className="jtsPriceModal" role="dialog" aria-modal="true" aria-labelledby="jts-category-title">
        <div className="jtsPriceModalHead"><div><span className="jtsEditEyebrow">THE JTS STYLE EDIT · {active.services.length} OPTIONS</span><h2 id="jts-category-title">{active.tag}</h2><p>Choose a service to see its booking details and published price.</p></div><button type="button" className="jtsPriceModalClose" onClick={() => setActiveCategory(null)} aria-label="Close category">×</button></div>
        <div className="jtsPriceModalContent"><ul className="jtsCategoryModalList">{active.services.map(service => <li key={service.id}><Link href={"/order?service=" + encodeURIComponent(service.id)}><span>{service.name}</span><strong>{service.display}</strong><b>Choose ↗</b></Link></li>)}</ul></div>
        <div className="jtsPriceModalFoot"><span>Not sure which option suits your idea?</span><Link href="/order">Ask John when booking ↗</Link></div>
      </section>
    </div>}
  </>;
}
