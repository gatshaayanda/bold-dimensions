"use client";
import Image from "next/image";
import Link from "next/link";
import {useEffect,useState} from "react";
import {DEFAULT_PROMOTIONS,subscribeToPromotions,type Promotion} from "@/lib/bold-dimensions-promotions";

export default function PromotionShowcase(){
 const [items,setItems]=useState<Promotion[]>(DEFAULT_PROMOTIONS);
 useEffect(()=>subscribeToPromotions(setItems,()=>setItems(DEFAULT_PROMOTIONS)),[]);
 const visible=(items.length?items:DEFAULT_PROMOTIONS).filter(item=>item.active).sort((a,b)=>a.order-b.order);
 const lead=visible[0]??DEFAULT_PROMOTIONS[0];
 const secondary=visible.slice(1,3);
 return <section className="bdHomeFeature" aria-label="Featured technical support">
  <div className="bdHomeFeatureImage">
   <Image src={lead.imageUrl} alt={lead.alt||lead.title} fill priority sizes="(max-width: 760px) 100vw, 1100px" quality={68}/>
   <span className="bdImageContactMask" aria-hidden="true"/>
   <div className="bdHomeFeatureCopy">
    <span className="bdEyebrow">TECHNICAL SUPPORT · BOTSWANA</span>
    <h1>Solar & air conditioning <em>support.</em></h1>
    <p>Installation · maintenance · repairs · spare parts</p>
    <Link href="/order?area=solar-water-heating" className="bdHomePrimary">Start a service request <ArrowIcon/></Link>
    <small>No online payment · Request review before any work is agreed</small>
   </div>
  </div>
  {secondary.length>0&&<div className="bdHomeSecondaryPromos">{secondary.map((item,index)=><article className="bdHomeSecondaryPromo" key={item.id}>
   <div className="bdHomeSecondaryImage"><Image src={item.imageUrl} alt={item.alt||item.title} fill sizes="(max-width: 680px) 42vw, 250px" loading="lazy" quality={62}/><span className="bdImageContactMask" aria-hidden="true"/></div>
   <div><span>{item.id==="agricultural-machinery"?"SECONDARY SERVICE":"SOLAR SPARES"}</span><strong>{item.title}</strong></div>
  </article>)}</div>}
 </section>;
}
function ArrowIcon(){return <span aria-hidden="true">↗</span>}
