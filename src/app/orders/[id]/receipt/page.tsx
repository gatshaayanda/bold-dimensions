"use client";

import Link from "next/link";
import Image from "next/image";
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase/client";
import { subscribeToServiceRequest, SERVICE_AREAS, type ServiceRequest } from "@/lib/bold-dimensions";

function dateText(value?:string){if(!value)return "—";const date=new Date(value);return Number.isFinite(date.getTime())?new Intl.DateTimeFormat("en-GB",{timeZone:"Africa/Gaborone",dateStyle:"medium",timeStyle:"short"}).format(date):value}
function money(value:number){return "P"+value.toLocaleString("en-BW",{minimumFractionDigits:2,maximumFractionDigits:2})}

export default function CustomerReceiptPage({params}:{params:Promise<{id:string}>}){
 const [request,setRequest]=useState<ServiceRequest|null>(null);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 const [authorized,setAuthorized]=useState(false);
 useEffect(()=>{
  let active=true;let stop=()=>{};
  const unsubscribe=onAuthStateChanged(auth,async current=>{
   try{
    const user=current??(await signInAnonymously(auth)).user;
    const token=await user.getIdTokenResult();
    const isAdmin=token.claims.admin===true;
    const {id}=await params;
    if(!active)return;
    stop();
    stop=subscribeToServiceRequest(id,item=>{
     if(!active)return;
     if(!item||item.customerId!==user.uid&&!isAdmin){setError("This receipt is not available to the current customer account.");setRequest(null);setAuthorized(false)}
     else{setRequest(item);setAuthorized(true);setError("")}
     setLoading(false);
    },()=>{if(active){setError("The secure receipt could not be loaded. Check your connection and account.");setLoading(false)}});
   }catch{if(active){setError("Sign in to the customer account connected to this service request.");setLoading(false)}}
  });
  return()=>{active=false;unsubscribe();stop()};
 },[params]);
 const area=request?SERVICE_AREAS.find(item=>item.id===request.areaId):undefined;
 const paid=request?.amountPaid??0,total=request?.agreedAmount??0,balance=Math.max(0,total-paid);
 return <main className="bdUtility bdReceiptPage">
  <header className="bdUtilityHeader"><Link href="/account" className="bdBrand"><Image src="/brand/bold-dimensions-logo.jpg" alt="" width={42} height={42}/><span><strong>BOLD DIMENSIONS</strong><small>CUSTOMER ACCOUNT</small></span></Link><Link href="/account" className="bdHeaderTextLink">My account ↗</Link></header>
  {loading?<section className="bdReceiptLoading">Checking your secure customer record…</section>:!authorized||!request?<section className="bdReceiptLoading"><h1>Receipt unavailable</h1><p>{error}</p><Link href="/account" className="bdPrimary">Open customer account</Link></section>:paid<=0||!request.receiptNumber?<section className="bdReceiptLoading"><h1>No payment receipt yet</h1><p>This request does not have a verified payment recorded. Once the team records a payment, your branded receipt will appear here.</p><Link href={"/orders/"+request.id} className="bdPrimary">Back to request</Link></section>:<article className="bdReceiptSheet">
   <div className="bdReceiptTop"><div className="bdReceiptBrand"><Image src="/brand/bold-dimensions-logo.jpg" alt="Bold Dimensions" width={68} height={68}/><div><strong>BOLD DIMENSIONS</strong><small>INSTALLATION · MAINTENANCE · REPAIRS</small></div></div><span className="bdReceiptLabel">PAYMENT RECEIPT</span></div>
   <div className="bdReceiptMeta"><div><small>RECEIPT NUMBER</small><strong>{request.receiptNumber}</strong></div><div><small>ISSUED</small><strong>{dateText(request.receiptIssuedAt)}</strong></div><div><small>REQUEST REFERENCE</small><strong>#{request.id.slice(0,8).toUpperCase()}</strong></div></div>
   <div className="bdReceiptParties"><div><small>RECEIVED FROM</small><strong>{request.customerName}</strong><span>{request.phone}</span>{request.email&&<span>{request.email}</span>}</div><div><small>SERVICE</small><strong>{request.serviceType}</strong><span>{area?.name||"Service request"}</span><span>{request.location}</span></div></div>
   <div className="bdReceiptTable"><div><span>Agreed service total</span><strong>{money(total)}</strong></div><div><span>Payment received to date</span><strong>{money(paid)}</strong></div><div><span>Outstanding balance</span><strong>{money(balance)}</strong></div></div>
   <div className="bdReceiptPayment"><div><small>PAYMENT STATUS</small><strong>{request.paymentStatus==="paid"?"Paid in full":request.paymentStatus==="part-paid"?"Part payment received":"Payment recorded"}</strong></div><div><small>PAYMENT METHOD</small><strong>{request.paymentMethod||"Not recorded"}</strong></div>{request.paymentReference&&<div><small>PAYMENT REFERENCE</small><strong>{request.paymentReference}</strong></div>}</div>
   <p className="bdReceiptFootnote">This receipt records payment entered and verified by Bold Dimensions staff. It is not proof of bank settlement beyond the recorded verification. Keep this reference for service follow-up.</p>
   <div className="bdReceiptActions"><button type="button" className="bdPrimary" onClick={()=>window.print()}>Print / Save PDF ↗</button><Link href={"/orders/"+request.id}>Return to request</Link></div>
  </article>}
  <footer className="bdUtilityFooter"><Link href="/">← Bold Dimensions</Link><Link href="/account">Customer account</Link></footer>
 </main>;
}
