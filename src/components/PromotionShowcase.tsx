"use client";
import Image from "next/image";
import Link from "next/link";
import {useEffect,useState} from "react";
import {DEFAULT_PROMOTIONS,subscribeToPromotions,type Promotion} from "@/lib/bold-dimensions-promotions";

export default function PromotionShowcase(){
 const [items,setItems]=useState<Promotion[]>(DEFAULT_PROMOTIONS);
 useEffect(()=>subscribeToPromotions(setItems,()=>setItems(DEFAULT_PROMOTIONS)),[]);
 const visible=items.filter(item=>item.active).sort((a,b)=>a.order-b.order);
 return <section className="bdPromotionSection" aria-label="Featured Bold Dimensions services">
  <div className="bdPromotionLead">
   <div><span className="bdEyebrow">TECHNICAL SUPPORT · BOTSWANA</span><h1>Solar & air conditioning<br/><em>service support.</em></h1><p>Installation, maintenance, repairs and spare-parts support. Start with a service request and follow progress in your account.</p></div>
   <Link href="/order?area=solar-water-heating" className="bdPrimary">Request technical support <span>↗</span></Link>
  </div>
  <div className="bdPromotionGrid">{visible.map((item,index)=>{
   const agricultural=item.id==="agricultural-machinery";
   return <article className={index===0?"bdPromotionCard bdPromotionPrimary":"bdPromotionCard"} key={item.id}>
    <div className="bdPromotionImage"><Image src={item.imageUrl} alt={item.alt||item.title} fill sizes="(max-width: 760px) 100vw, 50vw" priority={index===0}/><span className="bdImageContactMask" aria-hidden="true"/></div>
    <div className="bdPromotionCopy"><span>{index===0?"01 · LEAD SERVICE":agricultural?"03 · AGRICULTURAL SUPPORT":"02 · SOLAR SPARES"}</span><h2>{item.title}</h2><p>{item.description}</p><Link href={agricultural?"/order?area=agricultural-machinery":"/order?area=solar-water-heating"}>Make an enquiry ↗</Link></div>
   </article>;
  })}</div>
 </section>;
}
