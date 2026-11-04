"use client";
import Link from "next/link";
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase/client";
import BdMobileDock from "@/components/bd-mobile-dock";
import { requestStatusSteps, SERVICE_AREAS, subscribeToServiceRequest, type ServiceRequest } from "@/lib/bold-dimensions";
function dateText(value:string){const date=new Date(value);return Number.isFinite(date.getTime())?new Intl.DateTimeFormat("en-GB",{timeZone:"Africa/Gaborone",dateStyle:"medium",timeStyle:"short"}).format(date):value}
function readLocal(id:string):ServiceRequest|null{try{const raw=window.localStorage.getItem("bd-service-request-"+id);return raw?JSON.parse(raw) as ServiceRequest:null}catch{return null}}
export default function RequestTrackingPage({params}:{params:Promise<{id:string}>}){
 const [request,setRequest]=useState<ServiceRequest|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState(""),[localOnly,setLocalOnly]=useState(false);
 useEffect(()=>{let active=true;let stop=()=>{};const unsubscribe=onAuthStateChanged(auth,async user=>{
  if(!user){try{await signInAnonymously(auth)}catch{setError("Reconnect on the device used to send this request, then try again.");setLoading(false)}return}
  const {id}=await params;if(!active)return;const local=readLocal(id);stop();
  stop=subscribeToServiceRequest(id,item=>{if(!active)return;if(!item){if(local){setRequest(local);setLocalOnly(true);setError("Showing the copy saved on this device. Live tracking is not available.")}else setError("This request is not available in the current customer session.")}else if(item.customerId!==user.uid){setError("This request belongs to a different customer session.")}else{setRequest(item);setLocalOnly(false);setError("");try{window.localStorage.setItem("bd-service-request-"+id,JSON.stringify(item))}catch{}}setLoading(false)},()=>{if(local){setRequest(local);setLocalOnly(true);setError("Could not refresh live status. Showing the copy saved on this device.")}else setError("Live request updates are unavailable. Check your connection and try again.");setLoading(false)});
 });return()=>{active=false;unsubscribe();stop()}},[params]);
 const area=request?SERVICE_AREAS.find(item=>item.id===request.areaId):null,currentIndex=request?requestStatusSteps.indexOf(request.status):0;
 return <main className="bdUtility bdTrackPage">
  <header className="bdUtilityHeader"><Link href="/" className="bdBrand"><img src="/brand/bold-dimensions-logo.jpg" alt=""/><span><strong>BOLD DIMENSIONS</strong><small>REQUEST TRACKING</small></span></Link><Link href="/account" className="bdHeaderTextLink">My requests ↗</Link></header>
  {loading?<section className="bdTrackLoading"><span className="bdEyebrow">PRIVATE REQUEST</span><h1>Opening your<br/><em>request…</em></h1><p>Checking the customer session and latest status.</p></section>:!request?<section className="bdTrackLoading"><span className="bdEyebrow">REQUEST UNAVAILABLE</span><h1>We can’t open<br/><em>this request.</em></h1><p>{error}</p><Link href="/account" className="bdPrimary">Open My requests ↗</Link></section>:<>
   <section className="bdTrackIntro"><span className="bdEyebrow">{localOnly?"SAVED ON THIS DEVICE":"SERVICE REQUEST"}</span><h1>Request<br/><em>progress.</em></h1><p>Follow the latest recorded update from Bold Dimensions.</p></section>
   {error&&<p className="bdInlineNotice" role="status">{error}</p>}
   <section className="bdTrackSummary"><div className="bdTrackSummaryTop"><span>REFERENCE #{request.id.slice(0,8).toUpperCase()}</span><b className="bdStatus">{request.status}</b></div><h2>{request.serviceType}</h2><p>{area?.name||"Service request"} · {request.location}</p><div className="bdTrackFacts"><span><small>SUBMITTED</small><strong>{dateText(request.createdAt)}</strong></span><span><small>PRIORITY</small><strong>{request.urgency}</strong></span><span><small>CONTACT</small><strong>{request.preferredContact}</strong></span></div></section>
   {request.scheduledFor&&<p className="bdScheduledNotice"><strong>Agreed service time</strong><span>{dateText(request.scheduledFor)}</span></p>}\n   <section className="bdTrackTimeline"><div className="bdSectionHead"><div><span className="bdEyebrow">STATUS UPDATES</span><h2>Where things stand</h2></div></div>{request.status==="Cancelled"?<p className="bdInlineNotice">This request has been cancelled. Contact the team if you need help with a new request.</p>:<ol>{requestStatusSteps.map((status,index)=><li key={status} className={index<currentIndex?"done":index===currentIndex?"current":""}><i>{index<currentIndex?"✓":index+1}</i><span><strong>{status}</strong><small>{index===currentIndex?"Current recorded status":index<currentIndex?"Previous step":"Next step"}</small></span></li>)}</ol>}<p className="bdTrackTruth">A request is not a confirmed service visit. The team will contact you to agree scope, quote and scheduling where applicable.</p></section>
   {(request.quoteAmount!==undefined||request.quoteNote)&&<section className="bdQuote"><span className="bdEyebrow">QUOTE UPDATE</span><h2>{request.quoteAmount!==undefined?"P"+request.quoteAmount.toLocaleString("en-BW"):"Quote details"}</h2>{request.quoteNote&&<p>{request.quoteNote}</p>}<small>A quote is not a payment receipt or a confirmed booking.</small></section>}
   <section className="bdTrackActions"><div><strong>Need to add information?</strong><p>Contact the team and quote your request reference.</p></div><a className="bdPrimary" href={"https://wa.me/26773207038?text="+encodeURIComponent("Hello Bold Dimensions, I’m following up on request #"+request.id.slice(0,8).toUpperCase()+".")}>Contact on WhatsApp ↗</a></section>
  </>}
  <footer className="bdUtilityFooter"><Link href="/">← Bold Dimensions</Link><Link href="/order">New request ↗</Link></footer>
 <BdMobileDock/></main>;
}
