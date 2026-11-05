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
   <span className="bdEyebrow">OUR LEAD SERVICES</span>
   <h2>Solar water heating <em>& air conditioning.</em></h2>
   <p>Installation, maintenance, fault finding and repairs. Tell us what your system needs.</p>
   <Link href="/order?area=solar-water-heating" className="bdPrimary">Request technical support <span>↗</span></Link>
  </div>
  <div className="bdPromotionGrid">{visible.map((item,index)=><article className={index===0?"bdPromotionCard bdPromotionPrimary":"bdPromotionCard"} key={item.id}>
   <div className="bdPromotionImage"><Image src={item.imageUrl} alt={item.alt||item.title} fill sizes="(max-width: 760px) 100vw, 50vw" priority={index===0}/></div>
   <div className="bdPromotionCopy"><span>{index===0?"01 · SOLAR & CLIMATE":"02 · AGRICULTURAL SUPPORT"}</span><h3>{item.title}</h3><p>{item.description}</p><Link href={item.id==="agricultural-machinery"?"/order?area=agricultural-machinery":"/order?area=solar-water-heating"}>Make an enquiry ↗</Link></div>
  </article>)}</div>
 </section>;
}
