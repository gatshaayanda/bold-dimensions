"use client";
import { collection, deleteDoc, doc, onSnapshot, orderBy, query, setDoc, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

export type Promotion = { id:string; title:string; description:string; imageUrl:string; alt:string; order:number; active:boolean };
export const DEFAULT_PROMOTIONS:Promotion[] = [
 {id:"solar-air-conditioning",title:"Solar water heating & air conditioning",description:"Installation, maintenance, fault finding and repairs for home and business systems.",imageUrl:"/images/bold.jpg",alt:"Bold Dimensions solar water-heater maintenance and air-conditioning services",order:1,active:true},
 {id:"solar-water-heater-spares",title:"Solar water-heater spare parts",description:"Solar Edwards spare-parts information for customers who need help identifying the right component.",imageUrl:"/images/bold1.jpg",alt:"Solar Edwards solar water-heater spare parts",order:2,active:true}
];
const promotions=collection(db,"servicePromotions");
export function subscribeToPromotions(onChange:(items:Promotion[])=>void,onError:()=>void){
 return onSnapshot(query(promotions,orderBy("order","asc")),snapshot=>{
  const hasCorrectedParts=snapshot.docs.some(item=>item.id==="solar-water-heater-spares");
  const items=snapshot.docs
   .filter(item=>!(hasCorrectedParts&&item.id==="agricultural-machinery"))
   .map(item=>{
    const data=item.data();
    if(item.id==="agricultural-machinery"&&data.imageUrl==="/images/bold1.jpg"){
     return {...DEFAULT_PROMOTIONS[1],order:typeof data.order==="number"?data.order:2,active:data.active!==false};
    }
    return {id:item.id,...data} as Promotion;
   });
  onChange(items.length?items:DEFAULT_PROMOTIONS);
 },onError);
}
export async function savePromotion(item:Promotion){await setDoc(doc(promotions,item.id),item)}
export async function removePromotion(id:string){await deleteDoc(doc(promotions,id))}
export async function seedPromotionsIfEmpty(){
 const snapshot=await getDocs(promotions);
 if(snapshot.empty){
  await Promise.all(DEFAULT_PROMOTIONS.map(item=>setDoc(doc(promotions,item.id),item)));
  return;
 }
 // Correct the earlier default that incorrectly presented the Solar Edwards
 // spare-parts artwork as agricultural machinery. Preserve visibility and order.
 const legacy=snapshot.docs.find(item=>item.id==="agricultural-machinery"&&item.data().imageUrl==="/images/bold1.jpg");
 if(legacy){
  const hasCorrected=snapshot.docs.some(item=>item.id==="solar-water-heater-spares");
  if(!hasCorrected){
   const data=legacy.data();
   await setDoc(doc(promotions,"solar-water-heater-spares"),{...DEFAULT_PROMOTIONS[1],order:typeof data.order==="number"?data.order:2,active:data.active!==false});
  }
  await deleteDoc(legacy.ref);
 }
}
