"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AdminGate from "@/app/admin/admin-gate";
import { subscribeToServiceRequests, updateServiceRequest, SERVICE_AREAS, type ServiceRequest, type ServiceRequestStatus } from "@/lib/bold-dimensions";

const STATUSES:ServiceRequestStatus[]=["New","Reviewing","Quote prepared","Awaiting customer","Scheduled","In progress","Completed","Cancelled"];
function dateText(value:string){const date=new Date(value);return Number.isFinite(date.getTime())?new Intl.DateTimeFormat("en-GB",{timeZone:"Africa/Gaborone",dateStyle:"medium",timeStyle:"short"}).format(date):value}

function Dashboard(){
 const [requests,setRequests]=useState<ServiceRequest[]>([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 const [filter,setFilter]=useState<"Open"|"All"|"Completed">("Open");
 const [expanded,setExpanded]=useState<string>("");
 const [revealed,setRevealed]=useState<Record<string,boolean>>({});
 const [drafts,setDrafts]=useState<Record<string,{quoteAmount:string;quoteNote:string;internalNote:string}>>({});
 const [saving,setSaving]=useState("");
 useEffect(()=>subscribeToServiceRequests(items=>{setRequests(items);setLoading(false);setError("")},()=>{setError("The service request queue could not be loaded. Check the new Firebase project rules and connection.");setLoading(false)}),[]);
 const openCount=useMemo(()=>requests.filter(item=>!["Completed","Cancelled"].includes(item.status)).length,[requests]);
 const newCount=useMemo(()=>requests.filter(item=>item.status==="New").length,[requests]);
 const filtered=useMemo(()=>requests.filter(item=>filter==="All"?true:filter==="Completed"?["Completed","Cancelled"].includes(item.status):!["Completed","Cancelled"].includes(item.status)),[requests,filter]);
 function draftFor(item:ServiceRequest){return drafts[item.id]??{quoteAmount:item.quoteAmount===undefined?"":String(item.quoteAmount),quoteNote:item.quoteNote||"",internalNote:item.internalNote||""}}
 async function changeStatus(item:ServiceRequest,status:ServiceRequestStatus){setSaving(item.id);setNotice("");try{await updateServiceRequest(item.id,{status});setNotice("Request status updated.")}catch{setError("Status could not be updated. Check admin permissions and try again.")}finally{setSaving("")}}
 async function saveNotes(item:ServiceRequest){const draft=draftFor(item);setSaving(item.id);setError("");setNotice("");try{const amount=draft.quoteAmount.trim()===""?undefined:Number(draft.quoteAmount);if(amount!==undefined&&(!Number.isFinite(amount)||amount<0))throw new Error("Enter a valid quote amount.");await updateServiceRequest(item.id,{quoteAmount:amount,quoteNote:draft.quoteNote.trim(),internalNote:draft.internalNote.trim()});setNotice("Quote and work notes saved.")}catch(cause){setError(cause instanceof Error?cause.message:"Changes could not be saved. Check admin permissions.")}finally{setSaving("")}}
 return <main className="bdAdminMain">
  <section className="bdAdminWelcome"><div><span className="bdEyebrow">OPERATIONS OVERVIEW</span><h1>Service<br/><em>desk.</em></h1><p>Review incoming work, agree the next step and keep each customer request moving.</p></div><Link className="bdAdminPublicLink" href="/">View customer app ↗</Link></section>
  <section className="bdAdminStats"><article><small>OPEN REQUESTS</small><strong>{openCount}</strong><span>Needs follow-up</span></article><article><small>NEW TODAY / INBOX</small><strong>{newCount}</strong><span>Awaiting first review</span></article><article><small>COMPLETED</small><strong>{requests.filter(item=>item.status==="Completed").length}</strong><span>Marked complete</span></article><article><small>TOTAL RECORDS</small><strong>{requests.length}</strong><span>All submitted requests</span></article></section>
  <section className="bdAdminSection"><div className="bdAdminSectionHead"><div><span className="bdEyebrow">CUSTOMER WORK</span><h2>Service requests</h2></div><div className="bdAdminFilters">{(["Open","All","Completed"] as const).map(value=><button key={value} type="button" className={filter===value?"active":""} onClick={()=>setFilter(value)}>{value}</button>)}</div></div>
   {notice&&<p className="bdAdminNotice" role="status">{notice}</p>}{error&&<p className="bdFormError" role="alert">{error}</p>}
   {loading?<p className="bdAdminEmpty">Loading service requests…</p>:filtered.length===0?<div className="bdAdminEmpty"><strong>{filter==="Open"?"No open requests.":"No requests in this view."}</strong><p>New customer submissions will appear here when Firebase access is configured.</p></div>:<div className="bdAdminQueue">{filtered.map(item=>{
    const area=SERVICE_AREAS.find(value=>value.id===item.areaId),show=revealed[item.id]===true,draft=draftFor(item);
    return <article className="bdAdminRequest" key={item.id}>
     <div className="bdAdminRequestHead"><span>#{item.id.slice(0,8).toUpperCase()} · {dateText(item.createdAt)}</span><b className={"bdStatus bdStatus-"+item.status.toLowerCase().replace(/[^a-z]+/g,"-")}>{item.status}</b></div>
     <div className="bdAdminRequestMain"><div><h3>{item.serviceType}</h3><p>{area?.name||"Service request"} · {item.location}</p></div><span className={item.urgency==="Urgent"?"bdUrgency urgent":"bdUrgency"}>{item.urgency}</span></div>
     <div className="bdAdminRequestControls"><label>Status<select value={item.status} disabled={saving===item.id} onChange={event=>void changeStatus(item,event.target.value as ServiceRequestStatus)}>{STATUSES.map(status=><option key={status}>{status}</option>)}</select></label><button type="button" className="bdAdminReveal" onClick={()=>setRevealed(current=>({...current,[item.id]:!current[item.id]}))}>{show?"Hide customer details":"Reveal customer details"}</button><button type="button" className="bdAdminExpand" onClick={()=>setExpanded(current=>current===item.id?"":item.id)}>{expanded===item.id?"Close work panel":"Open work panel"} {expanded===item.id?"−":"+"}</button></div>
     {show&&<div className="bdAdminPrivate"><div><small>CUSTOMER</small><strong>{item.customerName}</strong></div><div><small>PHONE / WHATSAPP</small><a href={"https://wa.me/"+item.phone.replace(/\D/g,"")}>{item.phone}</a></div>{item.email&&<div><small>EMAIL</small><a href={"mailto:"+item.email}>{item.email}</a></div>}<div><small>PREFERRED CONTACT</small><strong>{item.preferredContact}</strong></div><div><small>EQUIPMENT</small><strong>{[item.equipment,item.makeModel].filter(Boolean).join(" · ")||"Not provided"}</strong></div><div className="wide"><small>REQUEST DETAILS</small><p>{item.description}</p></div></div>}
     {expanded===item.id&&<div className="bdAdminWorkPanel"><div className="bdAdminWorkHeading"><div><span className="bdEyebrow">WORKING NOTES</span><h4>Quote & follow-up</h4></div><span>Private to staff</span></div><label>Quote amount (BWP)<input type="number" min="0" step="0.01" value={draft.quoteAmount} onChange={event=>setDrafts(current=>({...current,[item.id]:{...draft,...{quoteAmount:event.target.value}}}))} placeholder="Leave blank until assessed"/></label><label>Quote / customer update<textarea rows={3} value={draft.quoteNote} onChange={event=>setDrafts(current=>({...current,[item.id]:{...draft,quoteNote:event.target.value}}))} maxLength={1200} placeholder="What should the customer know about scope, parts or next steps?"/></label><label>Internal work note<textarea rows={2} value={draft.internalNote} onChange={event=>setDrafts(current=>({...current,[item.id]:{...draft,internalNote:event.target.value}}))} maxLength={1200} placeholder="Private notes for the team"/></label><div className="bdAdminWorkActions"><span>Updated {dateText(item.updatedAt)}</span><button type="button" className="bdPrimary" disabled={saving===item.id} onClick={()=>void saveNotes(item)}>{saving===item.id?"Saving…":"Save work notes"}</button></div></div>}
    </article>;
   })}</div>}
  </section>
  <section className="bdAdminSection bdAdminServiceScope"><div className="bdAdminSectionHead"><div><span className="bdEyebrow">SERVICE SCOPE</span><h2>What we handle</h2></div><Link href="/services">Public service view ↗</Link></div><div className="bdAdminScopeGrid">{SERVICE_AREAS.map((area,index)=><article key={area.id}><span>0{index+1}</span><strong>{area.name}</strong><small>{area.options.join(" · ")}</small></article>)}</div><p>Keep customer promises within confirmed company capability. Pricing, stock and appointment availability are not published in this workspace until the business supplies those details.</p></section>
 </main>;
}
export default function AdminPage(){return <AdminGate><Dashboard/></AdminGate>}
