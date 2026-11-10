"use client";
import Link from "next/link";
import Image from "next/image";
import { GoogleAuthProvider, linkWithPopup, onAuthStateChanged, signInAnonymously, type User } from "firebase/auth";
import { useEffect, useMemo, useRef, useState } from "react";
import { auth } from "@/lib/firebase/client";
import BdMobileDock from "@/components/bd-mobile-dock";
import NotificationSettings from "@/components/NotificationSettings";
import CustomerWeather from "@/components/CustomerWeather";
import { subscribeToCustomerServiceRequests, SERVICE_AREAS, type ServiceRequest } from "@/lib/bold-dimensions";

type AccountTab = "overview" | "services" | "receipts" | "messages";
function dateText(value:string){const date=new Date(value);return Number.isFinite(date.getTime())?new Intl.DateTimeFormat("en-GB",{timeZone:"Africa/Gaborone",dateStyle:"medium",timeStyle:"short"}).format(date):value}
function money(value:number){return "P"+value.toLocaleString("en-BW",{minimumFractionDigits:2,maximumFractionDigits:2})}
function nextStep(item:ServiceRequest){
 if(item.status==="New")return "The team will review your request";
 if(item.status==="Reviewing")return "The team is checking the service details";
 if(item.status==="Quote prepared")return "Review the quote and reply to the team";
 if(item.status==="Awaiting customer")return "The team needs your response";
 if(item.status==="Scheduled")return "Your service time has been agreed";
 if(item.status==="In progress")return "The service work is in progress";
 if(item.status==="Completed")return "This service request is complete";
 return "This request is closed";
}
export default function AccountPage(){
 const [user,setUser]=useState<User|null>(null);
 const [requests,setRequests]=useState<ServiceRequest[]>([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 const [message,setMessage]=useState("");
 const [busy,setBusy]=useState(false);
 const [inviteToken,setInviteToken]=useState("");
 const [tab,setTab]=useState<AccountTab>("overview");
 const claimStarted=useRef(false);
 useEffect(()=>{
  const token=new URLSearchParams(window.location.search).get("invite");
  if(token)setInviteToken(token);
  return onAuthStateChanged(auth,async next=>{
   if(next){setUser(next);return}
   try{const guest=(await signInAnonymously(auth)).user;setUser(guest)}
   catch{setError("We couldn’t open your private request history. Check your connection and refresh.");setLoading(false)}
  });
 },[]);
 useEffect(()=>{
  if(!user||!inviteToken||claimStarted.current)return;
  claimStarted.current=true;
  let active=true;
  void (async()=>{
   setBusy(true);setError("");setMessage("Connecting this invitation to your customer account…");
   try{
    const token=await user.getIdToken();
    const response=await fetch("/api/customer-invites/claim",{method:"POST",headers:{Authorization:"Bearer "+token,"Content-Type":"application/json"},body:JSON.stringify({token:inviteToken})});
    const result=await response.json() as {success?:boolean;linkedRequests?:number;error?:string};
    if(!response.ok)throw new Error(result.error||"The invitation could not be connected.");
    if(!active)return;
    setMessage(result.linkedRequests?result.linkedRequests+" previous service request(s) are now connected to this customer account.":"Your customer account is ready. You can now place and track service requests here.");
    setInviteToken("");
    window.history.replaceState({}, "", "/account");
   }catch(cause){
    if(!active)return;
    setError(cause instanceof Error?cause.message:"The invitation could not be connected.");
    claimStarted.current=false;
   }finally{if(active)setBusy(false)}
  })();
  return()=>{active=false};
 },[user,inviteToken]);
 useEffect(()=>{
  if(!user)return;
  setLoading(true);
  return subscribeToCustomerServiceRequests(user.uid,items=>{setRequests(items);setLoading(false);setError("")},()=>{setError("Your requests could not be loaded. Check your connection and try again.");setLoading(false)});
 },[user]);
 async function connectGoogle(){
  if(!user)return;
  setBusy(true);setError("");setMessage("");
  try{
   const provider=new GoogleAuthProvider();provider.setCustomParameters({prompt:"select_account"});
   if(user.isAnonymous){const linked=await linkWithPopup(user,provider);setUser(linked.user);setMessage("Google is now linked to this request history. Use the same account when you return.")}
   else setMessage("Your Google account is already connected.");
  }catch(cause){
   const code=typeof cause==="object"&&cause&&"code" in cause?String((cause as {code?:unknown}).code):"";
   setError(code==="auth/credential-already-in-use"?"That Google account is already linked to another account. Your current requests have not been moved.":code==="auth/popup-closed-by-user"?"Google connection was cancelled. Your request history is unchanged.":"Google could not be connected. Your current request history is unchanged.");
  }finally{setBusy(false)}
 }
 const active=useMemo(()=>requests.filter(item=>!["Completed","Cancelled"].includes(item.status)),[requests]);
 const receipts=useMemo(()=>requests.filter(item=>Boolean(item.receiptNumber)&&Number(item.amountPaid||0)>0),[requests]);
 const needingCustomer=useMemo(()=>requests.filter(item=>["Quote prepared","Awaiting customer"].includes(item.status)),[requests]);
 const latest=active[0]||requests[0];
 const customerName=(latest?.customerName||user?.displayName||"").trim().split(/\s+/)[0];
 const hour=Number(new Intl.DateTimeFormat("en-GB",{timeZone:"Africa/Gaborone",hour:"2-digit",hourCycle:"h23"}).format(new Date()));
 const greeting=hour<12?"Good morning":hour<17?"Good afternoon":"Good evening";
 const today=new Intl.DateTimeFormat("en-GB",{timeZone:"Africa/Gaborone",weekday:"long",day:"numeric",month:"long"}).format(new Date());
 const tabs:{id:AccountTab;label:string;count?:number}[]=[
  {id:"overview",label:"Overview"},
  {id:"services",label:"My services",count:requests.length},
  {id:"receipts",label:"Receipts",count:receipts.length},
  {id:"messages",label:"Messages",count:requests.length}
 ];
 function requestRow(item:ServiceRequest){
  const area=SERVICE_AREAS.find(value=>value.id===item.areaId);
  return <article className="bdWorkspaceRequest" key={item.id}>
   <div className="bdWorkspaceRequestTop"><span>#{item.id.slice(0,8).toUpperCase()}</span><b className={"bdStatus bdStatus-"+item.status.toLowerCase().replace(/[^a-z]+/g,"-")}>{item.status}</b></div>
   <div className="bdWorkspaceRequestMain"><div><h3>{item.serviceType}</h3><p>{area?.name||"Service request"} · {item.location}</p><small>Submitted {dateText(item.createdAt)}</small></div><Link href={"/orders/"+item.id}>Open ↗</Link></div>
   <p className="bdWorkspaceNext">{nextStep(item)}</p>
   <div className="bdWorkspaceRequestActions"><Link href={"/orders/"+item.id+"#conversation"}>View messages</Link>{item.receiptNumber&&Number(item.amountPaid||0)>0&&<Link href={"/orders/"+item.id+"/receipt"}>Receipt ↗</Link>}</div>
  </article>;
 }
 return <main className="bdUtility bdAccountPage">
  <header className="bdUtilityHeader"><Link href="/" className="bdBrand"><Image src="/brand/bold-dimensions-logo.jpg" alt="" width={42} height={42}/><span><strong>BOLD DIMENSIONS</strong><small>MY ACCOUNT</small></span></Link><Link href="/order" className="bdHeaderCta">New service request ↗</Link></header>
  <section className="bdWorkspaceHeading"><div><span className="bdEyebrow">YOUR BOLD DIMENSIONS SPACE · {today.toUpperCase()}</span><h1>{greeting}{customerName?", "+customerName:""}.</h1><p>Your service requests, updates and payment records — all together.</p></div><span className="bdWorkspaceAccountState">{user?.isAnonymous?"Guest session":"Account connected"}</span></section>
  {(error||message)&&<p className={error?"bdFormError":"bdInlineSuccess"} role="status">{error||message}</p>}
  <nav className="bdWorkspaceTabs" aria-label="Customer account sections">{tabs.map(item=><button key={item.id} type="button" className={tab===item.id?"active":""} aria-current={tab===item.id?"page":undefined} onClick={()=>setTab(item.id)}>{item.label}{item.count!==undefined&&<span>{item.count}</span>}</button>)}</nav>
  {loading?<section className="bdWorkspacePanel"><p className="bdLoading">Loading your private service records…</p></section>:<>
   {tab==="overview"&&<div className="bdWorkspaceContent">
    <div className="bdWorkspaceMetrics"><div><strong>{active.length}</strong><span>Active services</span></div><div><strong>{needingCustomer.length}</strong><span>Need your response</span></div><div><strong>{receipts.length}</strong><span>Receipts ready</span></div></div><CustomerWeather/><div className="bdWorkspaceQuickActions"><Link href="/order"><span>＋</span><strong>Request a service</strong><small>Solar · Air conditioning · Machinery</small></Link><button type="button" onClick={()=>setTab("services")}><span>↗</span><strong>Track your work</strong><small>See progress and team updates</small></button><button type="button" onClick={()=>setTab("receipts")}><span>▤</span><strong>Payment receipts</strong><small>View verified payment records</small></button></div>
    {latest?<section className="bdWorkspacePanel"><div className="bdWorkspaceSectionHead"><div><span className="bdEyebrow">{active.includes(latest)?"CURRENT SERVICE":"MOST RECENT SERVICE"}</span><h2>{latest.serviceType}</h2></div><b className="bdStatus">{latest.status}</b></div><p className="bdWorkspaceContext">{nextStep(latest)}</p><div className="bdWorkspacePanelActions"><Link className="bdPrimary" href={"/orders/"+latest.id}>View service progress ↗</Link><Link href={"/orders/"+latest.id+"#conversation"}>Message the team</Link></div></section>:<section className="bdWorkspacePanel bdWorkspaceEmpty"><h2>Start with your first service</h2><p>Choose solar water heating, air conditioning or machinery support and send the team your requirements.</p><Link className="bdPrimary" href="/order">Create a service request ↗</Link></section>}
    <section className="bdWorkspacePanel"><div className="bdWorkspaceSectionHead"><div><span className="bdEyebrow">RECENT ACTIVITY</span><h2>Latest requests</h2></div><button type="button" onClick={()=>setTab("services")}>View all ↗</button></div>{requests.slice(0,3).length?requests.slice(0,3).map(requestRow):<p className="bdWorkspaceContext">Your submitted requests will appear here.</p>}</section>
    <section className="bdWorkspacePanel bdWorkspaceAccount"><div><span className="bdEyebrow">ACCOUNT ACCESS</span><strong>{user?.isAnonymous?"Save your service history":"Your account is connected"}</strong><p>{user?.isAnonymous?"Connect Google to return to these same service records on another device.":"Your request history is linked to this Google account."}</p></div><button type="button" className="bdSecondary" disabled={busy||!user||!user.isAnonymous} onClick={()=>void connectGoogle()}>{busy?"Connecting…":user?.isAnonymous?"Connect Google ↗":"Google connected"}</button></section>
    <NotificationSettings/>
   </div>}
   {tab==="services"&&<section className="bdWorkspacePanel"><div className="bdWorkspaceSectionHead"><div><span className="bdEyebrow">YOUR HISTORY</span><h2>All service requests</h2></div><span>{requests.length} records</span></div>{requests.length?requests.map(requestRow):<div className="bdWorkspaceEmpty"><p>No service requests yet.</p><Link className="bdPrimary" href="/order">Create your first request ↗</Link></div>}</section>}
   {tab==="receipts"&&<section className="bdWorkspacePanel"><div className="bdWorkspaceSectionHead"><div><span className="bdEyebrow">PAYMENT RECORDS</span><h2>Your receipts</h2></div><span>{receipts.length} available</span></div>{receipts.length?receipts.map(item=><article className="bdWorkspaceReceipt" key={item.id}><div><strong>{item.serviceType}</strong><small>Receipt {item.receiptNumber} · {item.receiptIssuedAt?dateText(item.receiptIssuedAt):"Issued"}</small><span>{money(item.amountPaid||0)} received</span></div><Link href={"/orders/"+item.id+"/receipt"}>View receipt ↗</Link></article>):<div className="bdWorkspaceEmpty"><p>No payment receipts are available yet. A receipt appears here after the team records a verified payment.</p><Link href="/order">Request a service ↗</Link></div>}</section>}
   {tab==="messages"&&<section className="bdWorkspacePanel"><div className="bdWorkspaceSectionHead"><div><span className="bdEyebrow">PRIVATE CONVERSATIONS</span><h2>Messages with the team</h2></div></div>{requests.length?requests.map(item=><article className="bdWorkspaceReceipt" key={item.id}><div><strong>{item.serviceType}</strong><small>Request #{item.id.slice(0,8).toUpperCase()} · {item.status}</small><span>Open the private conversation for this service</span></div><Link href={"/orders/"+item.id+"#conversation"}>Open messages ↗</Link></article>):<div className="bdWorkspaceEmpty"><p>Messages about your services will appear here.</p></div>}</section>}
  </>}
  <footer className="bdUtilityFooter"><Link href="/">← Bold Dimensions</Link><Link href="/order">Request another service ↗</Link></footer>
  <BdMobileDock/></main>;
}
