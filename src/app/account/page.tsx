"use client";
import Link from "next/link";
import Image from "next/image";
import { GoogleAuthProvider, linkWithPopup, onAuthStateChanged, signInAnonymously, type User } from "firebase/auth";
import { useEffect, useMemo, useRef, useState } from "react";
import { auth } from "@/lib/firebase/client";
import BdMobileDock from "@/components/bd-mobile-dock";
import NotificationSettings from "@/components/NotificationSettings";
import { subscribeToCustomerServiceRequests, SERVICE_AREAS, type ServiceRequest } from "@/lib/bold-dimensions";

function dateText(value:string){const date=new Date(value);return Number.isFinite(date.getTime())?new Intl.DateTimeFormat("en-GB",{timeZone:"Africa/Gaborone",dateStyle:"medium",timeStyle:"short"}).format(date):value}
export default function AccountPage(){
 const [user,setUser]=useState<User|null>(null);
 const [requests,setRequests]=useState<ServiceRequest[]>([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 const [message,setMessage]=useState("");
 const [busy,setBusy]=useState(false);
 const [inviteToken,setInviteToken]=useState("");
 const claimStarted=useRef(false);
 useEffect(()=>onAuthStateChanged(auth,async next=>{
  if(next){setUser(next);return}
  try{const guest=(await signInAnonymously(auth)).user;setUser(guest)}
  catch{setError("We couldn’t open your private request history. Check your connection and refresh.");setLoading(false)}
 }),[]);
 useEffect(()=>{
  if(!user)return;
  setLoading(true);
  return subscribeToCustomerServiceRequests(user.uid,items=>{setRequests(items);setLoading(false);setError("")},()=>{setError("Your requests could not be loaded. Check your connection and try again.");setLoading(false)});
 },[user]);
 async function connectGoogle(){
  if(!user)return;
  setBusy(true);setError("");setMessage("");
  try{const provider=new GoogleAuthProvider();provider.setCustomParameters({prompt:"select_account"});if(user.isAnonymous){const linked=await linkWithPopup(user,provider);setUser(linked.user);setMessage("Google is now linked to this request history. Use the same account when you return.")}else setMessage("Your Google account is already connected.")}
  catch(cause){const code=typeof cause==="object"&&cause&&"code" in cause?String((cause as {code?:unknown}).code):"";setError(code==="auth/credential-already-in-use"?"That Google account is already linked to another account. Your current requests have not been moved.":code==="auth/popup-closed-by-user"?"Google connection was cancelled. Your request history is unchanged.":"Google could not be connected. Your current request history is unchanged.")}
  finally{setBusy(false)}
 }
 const active=useMemo(()=>requests.filter(item=>!["Completed","Cancelled"].includes(item.status)),[requests]);
 return <main className="bdUtility bdAccountPage">
  <header className="bdUtilityHeader"><Link href="/" className="bdBrand"><Image src="/brand/bold-dimensions-logo.jpg" alt="" width={42} height={42}/><span><strong>BOLD DIMENSIONS</strong><small>MY REQUESTS</small></span></Link><Link href="/order" className="bdHeaderCta">New request ↗</Link></header>
  <section className="bdAccountIntro"><div><span className="bdEyebrow">CUSTOMER WORKSPACE</span><h1>Your service<br/><em>requests.</em></h1><p>Review your requests, follow progress and place your next service order from one account.</p></div><div className="bdAccountCounts"><strong>{active.length}</strong><span>Active requests</span><i/><strong>{requests.length}</strong><span>Total requests</span></div></section>
  {(error||message)&&<p className={error?"bdFormError":"bdInlineSuccess"} role="status">{error||message}</p>}
  <section className="bdRequestHistory"><div className="bdSectionHead"><div><span className="bdEyebrow">YOUR HISTORY</span><h2>Recent requests</h2></div><span>{requests.length} total</span></div>
   {loading?<p className="bdLoading">Loading your private requests…</p>:requests.length===0?<div className="bdEmpty"><h3>No requests yet.</h3><p>When you send a service request, its status and updates will appear here.</p><Link className="bdPrimary" href="/order">Make your first request ↗</Link></div>:<div className="bdHistoryList">{requests.map(item=>{const area=SERVICE_AREAS.find(value=>value.id===item.areaId);return <article className="bdHistoryRow" key={item.id}><div className="bdHistoryTop"><span>#{item.id.slice(0,8).toUpperCase()}</span><b className={"bdStatus bdStatus-"+item.status.toLowerCase().replace(/[^a-z]+/g,"-")}>{item.status}</b></div><h3>{item.serviceType}</h3><p>{area?.name||"Service request"} · {item.location}</p><div className="bdHistoryMeta"><small>Submitted {dateText(item.createdAt)}</small><Link href={"/orders/"+item.id}>View request ↗</Link></div></article>})}</div>}
  </section>
  <NotificationSettings/>
  <section className="bdAccountIdentity"><div><span className="bdEyebrow">KEEP YOUR HISTORY</span><h2>Save access across devices.</h2><p>Your request history is currently linked to this device’s guest session. Connect Google if you want to return on another device.</p></div><button type="button" className="bdSecondary" disabled={busy||!user||!user.isAnonymous} onClick={()=>void connectGoogle()}>{busy?"Connecting…":user?.isAnonymous?"Connect Google ↗":"Google connected"}</button></section>
  <footer className="bdUtilityFooter"><Link href="/">← Bold Dimensions</Link><Link href="/order">Request another service ↗</Link></footer>
 <BdMobileDock/></main>;
}
