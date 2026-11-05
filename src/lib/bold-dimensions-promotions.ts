"use client";
import { collection, deleteDoc, doc, onSnapshot, orderBy, query, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

export type Promotion = { id:string; title:string; description:string; imageUrl:string; alt:string; order:number; active:boolean };
export const DEFAULT_PROMOTIONS:Promotion[] = [
 {id:"solar-air-conditioning",title:"Solar water heating & air conditioning",description:"Maintenance, repairs, installations and dependable technical support for your home or business systems.",imageUrl:"/images/bold.jpg",alt:"Bold Dimensions solar water heating and air conditioning services",order:1,active:true},
 {id:"agricultural-machinery",title:"Agricultural machinery & spares",description:"Massey Ferguson spare-parts enquiries and support for agricultural machinery.",imageUrl:"/images/bold1.jpg",alt:"Massey Ferguson tractor and genuine spares promotion",order:2,active:true}
];
const promotions=collection(db,"servicePromotions");
export function subscribeToPromotions(onChange:(items:Promotion[])=>void,onError:()=>void){
 return onSnapshot(query(promotions,orderBy("order","asc")),snapshot=>{
  const items=snapshot.docs.map(item=>({id:item.id,...item.data()} as Promotion));
  onChange(items.length?items:DEFAULT_PROMOTIONS);
 },onError);
}
export async function savePromotion(item:Promotion){await setDoc(doc(promotions,item.id),item)}
export async function removePromotion(id:string){await deleteDoc(doc(promotions,id))}
export async function seedPromotionsIfEmpty(){
 // Seed defaults once. Existing records are never overwritten.
 const {getDocs}=await import("firebase/firestore");
 const snapshot=await getDocs(promotions);
 if(snapshot.empty)await Promise.all(DEFAULT_PROMOTIONS.map(item=>setDoc(doc(promotions,item.id),item)));
}
