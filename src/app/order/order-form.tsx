"use client";
import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { signInAnonymously } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { createServiceRequest, SERVICE_AREAS, type ServiceAreaId } from "@/lib/bold-dimensions";
import BdMobileDock from "@/components/bd-mobile-dock";

export default function OrderForm(){
 const router=useRouter();
 const [areaId,setAreaId]=useState<ServiceAreaId>("agricultural-machinery");
 const [serviceType,setServiceType]=useState("");
 const [name,setName]=useState("");
 const [phone,setPhone]=useState("");
 const [email,setEmail]=useState("");
 const [equipment,setEquipment]=useState("");
 const [makeModel,setMakeModel]=useState("");
 const [location,setLocation]=useState("");
 const [description,setDescription]=useState("");
 const [urgency,setUrgency]=useState<"Standard"|"Urgent">("Standard");
 const [preferredContact,setPreferredContact]=useState<"WhatsApp"|"Phone"|"Email">("WhatsApp");
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [step,setStep]=useState(1);
 const area=useMemo(()=>SERVICE_AREAS.find(item=>item.id===areaId)!,[areaId]);
 useEffect(()=>{const requested=new URLSearchParams(window.location.search).get("area");if(SERVICE_AREAS.some(item=>item.id===requested)){setAreaId(requested as ServiceAreaId);setServiceType("")}},[]);
 function changeArea(value:string){setAreaId(value as ServiceAreaId);setServiceType("")}
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();setError("");
  const digits=phone.replace(/\D/g,"");
  if(!name.trim()||digits.length<7||digits.length>15||!location.trim()||description.trim().length<10||!serviceType){setError("Complete the required details and check your contact number.");return}
  if(preferredContact==="Email"&&!email.trim()){setError("Add an email address or choose WhatsApp or phone as your preferred contact.");return}
  setBusy(true);
  try{
   const user=auth.currentUser??(await signInAnonymously(auth)).user;
   const request={customerId:user.uid,customerName:name.trim(),phone:phone.trim(),...(email.trim()?{email:email.trim()}:{}),areaId,serviceType,equipment:equipment.trim(),makeModel:makeModel.trim(),location:location.trim(),description:description.trim(),urgency,preferredContact};
   const id=await createServiceRequest(request);
   try{window.localStorage.setItem("bd-service-request-"+id,JSON.stringify({id,...request,status:"New",createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}))}catch{}
   router.push("/orders/"+id);
  }catch(cause){
   console.error("[Bold Dimensions] service request submission failed",cause);
   setError("Your request could not be sent. Check your connection and try again. Your details are still in this form.");
  }finally{setBusy(false)}
 }
 return <main className="bdUtility bdRequestPage">
  <header className="bdUtilityHeader"><Link href="/" className="bdBrand"><img src="/brand/bold-dimensions-logo.jpg" alt="" /><span><strong>BOLD DIMENSIONS</strong><small>SERVICE REQUEST</small></span></Link><Link href="/account" className="bdHeaderTextLink">My requests ↗</Link></header>
  <div className="bdRequestLayout">
   <aside className="bdRequestAside"><span className="bdEyebrow">TELL US WHAT YOU NEED</span><h1>Start a<br/><em>service request.</em></h1><p>Share a few details about the equipment or installation. The team will review your request and contact you about the next step.</p><div className="bdRequestAsideNote"><b>01</b><span><strong>No online payment</strong><small>There are no prices or payment requests at this stage.</small></span></div><div className="bdRequestAsideNote"><b>02</b><span><strong>Request, not confirmation</strong><small>A submitted request is not a confirmed visit or service booking.</small></span></div></aside>
   <form className="bdRequestForm" onSubmit={submit}>
    <div className="bdFormProgress"><span className={step===1?"active":""}>01 · Service</span><i/><span className={step===2?"active":""}>02 · Details</span><i/><span className={step===3?"active":""}>03 · Contact</span></div>
    {step===1?<section className="bdFormStep"><div className="bdFormHeading"><span>STEP 01</span><h2>Which area needs support?</h2><p>Choose the closest match. You can explain the issue in the next step.</p></div>
      <label>Service area<select value={areaId} onChange={event=>changeArea(event.target.value)}>{SERVICE_AREAS.map(item=><option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
      <div className="bdOptionList">{area.options.map(option=><button type="button" key={option} className={serviceType===option?"selected":""} onClick={()=>setServiceType(option)}><span>{option}</span><b>{serviceType===option?"✓":"+"}</b></button>)}</div>
      <div className="bdFormActions"><span>Choose one service type to continue.</span><button type="button" className="bdPrimary" disabled={!serviceType} onClick={()=>setStep(2)}>Continue →</button></div>
    </section>:step===2?<section className="bdFormStep"><div className="bdFormHeading"><span>STEP 02</span><h2>Tell us about the job.</h2><p>Specific details help the team understand what to assess.</p></div>
      <div className="bdFormSummary"><b>{area.name}</b><span>{serviceType}</span><button type="button" onClick={()=>setStep(1)}>Change</button></div>
      <div className="bdFieldGrid"><label>Equipment / system<input value={equipment} onChange={event=>setEquipment(event.target.value)} maxLength={100} placeholder="e.g. tractor, split-unit AC, solar geyser"/></label><label>Make / model <span>(if known)</span><input value={makeModel} onChange={event=>setMakeModel(event.target.value)} maxLength={100} placeholder="Brand, model or capacity"/></label></div>
      <label>Where is the equipment located?<input value={location} onChange={event=>setLocation(event.target.value)} maxLength={180} required placeholder="Town, area or site location"/></label>
      <label>Describe what you need<textarea value={description} onChange={event=>setDescription(event.target.value)} maxLength={1500} minLength={10} rows={4} required placeholder="What is happening, what work is needed, and any useful context?"/></label>
      <label>How soon do you need help?<select value={urgency} onChange={event=>setUrgency(event.target.value as "Standard"|"Urgent")}><option>Standard</option><option>Urgent</option></select></label>
      <div className="bdFormActions"><button type="button" className="bdSecondary" onClick={()=>setStep(1)}>← Back</button><button type="button" className="bdPrimary" disabled={!location.trim()||description.trim().length<10} onClick={()=>setStep(3)}>Continue →</button></div>
    </section>:<section className="bdFormStep"><div className="bdFormHeading"><span>STEP 03</span><h2>How should we reach you?</h2><p>We’ll use these details to follow up about your request.</p></div>
      <div className="bdFormSummary"><b>{serviceType}</b><span>{area.name} · {location || "Location not entered"}</span><button type="button" onClick={()=>setStep(2)}>Edit details</button></div>
      <label>Your name<input value={name} onChange={event=>setName(event.target.value)} autoComplete="name" maxLength={100} required placeholder="Full name"/></label>
      <div className="bdFieldGrid"><label>Phone / WhatsApp<input type="tel" value={phone} onChange={event=>setPhone(event.target.value)} autoComplete="tel" maxLength={30} required placeholder="+267 …"/></label><label>Email <span>(optional)</span><input type="email" value={email} onChange={event=>setEmail(event.target.value)} autoComplete="email" maxLength={160} placeholder="you@example.com"/></label></div>
      <label>Preferred contact method<select value={preferredContact} onChange={event=>setPreferredContact(event.target.value as "WhatsApp"|"Phone"|"Email")}><option>WhatsApp</option><option>Phone</option><option>Email</option></select></label>
      {error&&<p className="bdFormError" role="alert">{error}</p>}
      <div className="bdFormActions"><button type="button" className="bdSecondary" onClick={()=>setStep(2)}>← Back</button><button type="submit" className="bdPrimary" disabled={busy}>{busy?"Sending request…":"Send service request ↗"}</button></div>
      <p className="bdFormFinePrint">By submitting, you’re asking Bold Dimensions to contact you. This does not confirm a service visit, quote or payment.</p>
    </section>}
   </form>
  </div>
  <BdMobileDock/>\n </main>;
}
