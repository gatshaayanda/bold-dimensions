"use client";
import Image from "next/image";
import Link from "next/link";
import {useEffect,useState} from "react";
import {DEFAULT_PROMOTIONS,subscribeToPromotions,type Promotion} from "@/lib/bold-dimensions-promotions";

export default function PromotionShowcase(){
 const [items,setItems]=useState<Promotion[]>(DEFAULT_PROMOTIONS);
 useEffect(()=>subscribeToPromotions(setItems,()=>setItems(DEFAULT_PROMOTIONS)),[]);
 const visible=items.filter(item=>item.active).sort((a,b)=>a.order-b.order);
 return <section className="bdPromotionSection bdPromotionCompact" aria-label="Featured Bold Dimensions services">
  <div className="bdPromotionLead">
   <div><span className="bdEyebrow">TECHNICAL SUPPORT · BOTSWANA</span><h1>Solar & air conditioning</h1><p>Installation · maintenance · repairs · spare parts</p></div>
   <Link href="/order?area=solar-water-heating" className="bdPrimary">Request support <span>↗</span></Link>
  </div>
  <div className="bdPromotionGrid">{visible.map((item,index)=>{
   const agricultural=item.id==="agricultural-machinery";
   return <article className={index===0?"bdPromotionCard bdPromotionPrimary":"bdPromotionCard"} key={item.id}>
    <Link href={agricultural?"/order?area=agricultural-machinery":"/order?area=solar-water-heating"} className="bdPromotionImage" aria-label={"Enquire about "+item.title}>
     <Image src={item.imageUrl} alt={item.alt||item.title} fill sizes={index===0?"(max-width: 680px) 100vw, 62vw":"(max-width: 680px) 44vw, 30vw"} priority={index===0} loading={index===0?"eager":"lazy"} quality={58} />
     <span className="bdImageContactMask" aria-hidden="true"/>
    </Link>
    <div className="bdPromotionCopy"><span>{index===0?"01 · LEAD SERVICE":agricultural?"03 · AGRICULTURAL SUPPORT":"02 · SOLAR SPARES"}</span><h2>{item.title}</h2><Link href={agricultural?"/order?area=agricultural-machinery":"/order?area=solar-water-heating"}>Enquire ↗</Link></div>
   </article>;
  })}</div>
 </section>;
}
