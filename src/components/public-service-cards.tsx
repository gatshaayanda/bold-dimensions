"use client";

import Link from "next/link";
import {doc,onSnapshot} from "firebase/firestore";
import {useEffect,useMemo,useState} from "react";
import {db} from "@/lib/firebase/client";
import {DEFAULT_PUBLIC_SERVICES,normalizePublicServices,type PublicService} from "@/lib/jts/public-services";

function Media({service,title}:{service?:PublicService;title:string}){
 const media=service?.media?.[0];
 if(!media)return <div className="jtsCategoryMediaFallback"><span>JTS STYLES</span><strong>{title}</strong><small>JOHN THE STYLIST · G WEST</small></div>;
 return <div className="jtsCategoryMedia">{media.type==="video"
  ? <video src={media.url} controls playsInline preload="metadata" aria-label={title+" category video"} />
  : <img src={media.url} alt={media.alt || title+" hairstyle by John"} loading="lazy" />}</div>;
}

export default function PublicServiceCards(){
 const [services,setServices]=useState<PublicService[]>(DEFAULT_PUBLIC_SERVICES);
 const [showPriceList,setShowPriceList]=useState(false);
 useEffect(()=>{
  const stop=onSnapshot(doc(db,"businessSettings","publicServices"),snapshot=>{
   if(snapshot.exists())setServices(normalizePublicServices(snapshot.data().services));
  },()=>{});
  return()=>stop();
 },[]);
 useEffect(()=>{
  if(!showPriceList)return;
  const close=(event:KeyboardEvent)=>{if(event.key==="Escape")setShowPriceList(false)};
  window.addEventListener("keydown",close);
  return()=>window.removeEventListener("keydown",close);
 },[showPriceList]);
 const catalogue=useMemo(()=>{
  const saved=new Map(services.map(service=>[service.id,service]));
  const canonical=DEFAULT_PUBLIC_SERVICES.map(base=>({...base,...(saved.get(base.id)||{}),media:saved.get(base.id)?.media||base.media}));
  return [...canonical,...services.filter(service=>!DEFAULT_PUBLIC_SERVICES.some(base=>base.id===service.id))];
 },[services]);
 const groups=useMemo(()=>Array.from(new Set(DEFAULT_PUBLIC_SERVICES.map(service=>service.tag))).map(tag=>({
  tag,
  services:catalogue.filter(service=>service.tag===tag),
  cover:catalogue.find(service=>service.tag===tag&&service.media?.length)?.media?.[0]
 })),[catalogue]);
 return <>
  <div className="jtsCategoryGrid">
   {groups.map((group,index)=>{
    const coverService=group.cover?group.services.find(service=>service.media?.some(media=>media.url===group.cover?.url)):undefined;
    return <article className="jtsCategoryCard" key={group.tag}>
     <div className="jtsCategoryVisual"><Media service={coverService} title={group.tag}/><span className="jtsCategoryIndex">{String(index+1).padStart(2,"0")} / 04</span></div>
     <div className="jtsCategoryBody">
      <div className="jtsCategoryHeading"><span className="jtsEditEyebrow">SERVICE CATEGORY</span><h3>{group.tag}</h3><p>{group.services.length} services · Prices in BWP</p></div>
      <ul className="jtsCategoryServiceList">{group.services.map(service=><li key={service.id}>
       <span>{service.name}</span><strong>{service.display}</strong><Link href={"/order?service="+encodeURIComponent(service.id)} aria-label={"Choose "+service.name}>Choose ↗</Link>
      </li>)}</ul>
      <Link className="jtsCategoryBookLink" href={"/order?category="+encodeURIComponent(group.tag)}>Explore booking <span>↗</span></Link>
     </div>
    </article>;
   })}
  </div>
  <div className="jtsFullPriceListLink"><button type="button" onClick={()=>setShowPriceList(true)}>View full price list <span>↗</span></button></div>
  {showPriceList&&<div className="jtsPriceModalBackdrop" role="presentation" onMouseDown={event=>{if(event.target===event.currentTarget)setShowPriceList(false)}}>
   <section className="jtsPriceModal" role="dialog" aria-modal="true" aria-labelledby="jts-price-modal-title" aria-describedby="jts-price-modal-description">
    <div className="jtsPriceModalHead"><div><span className="jtsEditEyebrow">JTS STYLES · SERVICE MENU</span><h2 id="jts-price-modal-title">The full price list.</h2><p id="jts-price-modal-description">All listed services and prices in Botswana pula.</p></div><button type="button" className="jtsPriceModalClose" onClick={()=>setShowPriceList(false)} aria-label="Close full price list">×</button></div>
    <div className="jtsPriceModalContent">{groups.map(group=><section className="jtsPriceGroup" key={group.tag}><h3>{group.tag}</h3><ul>{group.services.map(service=><li key={service.id}><Link href={"/order?service="+encodeURIComponent(service.id)} aria-label={"Book "+service.name+" for "+service.display}><span>{service.name}</span><strong>{service.display}</strong><span className="jtsPriceChoose">Choose ↗</span></Link></li>)}</ul></section>)}</div>
    <div className="jtsPriceModalFoot"><span>Have a reference image? Share it with John when you request your look.</span><Link href="/order">Request an appointment ↗</Link></div>
   </section>
  </div>}
 </>;
}
