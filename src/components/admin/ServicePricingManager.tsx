"use client";

import { useEffect, useState } from "react";
import { collection, deleteDoc, doc, onSnapshot, setDoc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { SERVICE_AREAS } from "@/lib/bold-dimensions-config";
import { SEEDED_SERVICE_PRICES, type ServicePrice } from "@/lib/bold-dimensions-pricing";

type Draft = Omit<ServicePrice,"id">;
const blank: Draft = {areaId:"solar-water-heating",serviceType:"",startingPrice:null,priceMode:"quote",unit:"per job",description:"",active:true,sortOrder:99,sourceNote:"Admin supplied"};

export default function ServicePricingManager(){
 const [items,setItems]=useState<ServicePrice[]>([]);
 const [loading,setLoading]=useState(true);
 const [draft,setDraft]=useState<Draft>(blank);
 const [editing,setEditing]=useState("");
 const [editorOpen,setEditorOpen]=useState(false);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 useEffect(()=>onSnapshot(collection(db,"servicePricing"),async snapshot=>{
  if(snapshot.empty){
   try{const batch=writeBatch(db);SEEDED_SERVICE_PRICES.forEach(item=>batch.set(doc(db,"servicePricing",item.id),item));await batch.commit();setNotice("Starter service prices have been added. Review provisional guides before publishing them.");}
   catch{setError("Starter prices could not be seeded. Check the published Firestore admin rules.");}
   setItems([]);setLoading(false);return;
  }
  setItems(snapshot.docs.map(item=>({id:item.id,...item.data()} as ServicePrice)).sort((a,b)=>a.sortOrder-b.sortOrder));setLoading(false);
 },cause=>{setError(cause.message||"Service prices could not be loaded.");setLoading(false)}),[]);
 function startEdit(item:ServicePrice){const {id,...rest}=item;setEditing(id);setDraft(rest);setEditorOpen(true);setError("");setNotice("");}
 async function save(){if(!draft.serviceType.trim()){setError("Enter a service name.");return}if(draft.priceMode==="from"&&(!Number.isFinite(draft.startingPrice)||Number(draft.startingPrice)<0)){setError("Enter a valid starting price.");return}setBusy(true);setError("");setNotice("");const id=editing||("custom-"+crypto.randomUUID());try{await setDoc(doc(db,"servicePricing",id),{...draft,serviceType:draft.serviceType.trim(),startingPrice:draft.priceMode==="quote"?null:Number(draft.startingPrice),updatedAt:new Date().toISOString()});setNotice("Service price saved.");setEditing("");setEditorOpen(false);setDraft(blank)}catch{setError("Price could not be saved. Check admin permissions and connection.")}finally{setBusy(false)}}
 async function remove(id:string){if(!window.confirm("Permanently delete this service price?"))return;try{await deleteDoc(doc(db,"servicePricing",id));setNotice("Service price deleted.");if(editing===id){setEditing("");setDraft(blank)}}catch{setError("Price could not be deleted.")}}
 return <section className="bdAdminSection bdPricingManager"><div className="bdAdminSectionHead"><div><span className="bdEyebrow">CATALOGUE & PRICING</span><h2>Service price list</h2></div><button type="button" className="bdSecondary" onClick={()=>{setEditing("");setDraft({...blank,sortOrder:items.length+1});setEditorOpen(true);}}>+ Add service</button></div>
  <p className="bdPricingIntro">Starting guides are editable. Parts, travel, site conditions and final scope may change the agreed quote. Prices marked provisional need business approval before publication.</p>
  {error&&<p className="bdFormError" role="alert">{error}</p>}{notice&&<p className="bdAdminNotice" role="status">{notice}</p>}
  {loading?<p className="bdAdminEmpty">Loading service prices…</p>:<div className="bdPricingList">{items.map(item=><article key={item.id}><div><small>{SERVICE_AREAS.find(area=>area.id===item.areaId)?.name}</small><strong>{item.serviceType}</strong><span>{item.priceMode==="from"?"From P"+Number(item.startingPrice).toLocaleString("en-BW"):"Quote after assessment"} · {item.unit}</span><p>{item.description}</p></div><div className="bdPricingActions"><button type="button" className="bdSecondary" onClick={()=>startEdit(item)}>Edit</button><button type="button" className="bdInviteRemove" onClick={()=>void remove(item.id)} aria-label={"Delete "+item.serviceType}>×</button></div></article>)}</div>}
  {editorOpen&&<div className="bdPricingEditor"><h3>{editing?"Edit service price":"Add a service price"}</h3><div className="bdPricingFields"><label>Service area<select value={draft.areaId} onChange={e=>setDraft(v=>({...v,areaId:e.target.value as Draft["areaId"]}))}>{SERVICE_AREAS.map(area=><option key={area.id} value={area.id}>{area.name}</option>)}</select></label><label>Service name<input value={draft.serviceType} onChange={e=>setDraft(v=>({...v,serviceType:e.target.value}))} placeholder="Service name"/></label><label>Price type<select value={draft.priceMode} onChange={e=>setDraft(v=>({...v,priceMode:e.target.value as Draft["priceMode"],startingPrice:e.target.value==="quote"?null:v.startingPrice}))}><option value="from">Starting price</option><option value="quote">Quote after assessment</option></select></label>{draft.priceMode==="from"&&<label>Starting price (BWP)<input type="number" min="0" step="0.01" value={draft.startingPrice??""} onChange={e=>setDraft(v=>({...v,startingPrice:e.target.value===""?null:Number(e.target.value)}))}/></label>}<label>Unit / basis<input value={draft.unit} onChange={e=>setDraft(v=>({...v,unit:e.target.value}))}/></label><label>Sort order<input type="number" min="1" value={draft.sortOrder} onChange={e=>setDraft(v=>({...v,sortOrder:Number(e.target.value)}))}/></label><label className="wide">Customer explanation<textarea rows={2} value={draft.description} onChange={e=>setDraft(v=>({...v,description:e.target.value}))}/></label><label className="wide">Price source / internal note<textarea rows={2} value={draft.sourceNote} onChange={e=>setDraft(v=>({...v,sourceNote:e.target.value}))}/></label><label className="bdPricingActive"><input type="checkbox" checked={draft.active} onChange={e=>setDraft(v=>({...v,active:e.target.checked}))}/> Show in customer service list</label></div><div className="bdPricingEditorActions"><button type="button" className="bdSecondary" onClick={()=>{setEditing("");setDraft(blank);setEditorOpen(false)}}>Close</button><button type="button" className="bdPrimary" disabled={busy} onClick={()=>void save()}>{busy?"Saving…":"Save service price"}</button></div></div>}
 </section>;
}
