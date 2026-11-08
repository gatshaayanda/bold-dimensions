"use client";
import { useEffect, useMemo, useState } from "react";

type Contact={id:number;name:string;phone:string};
let nextContactId=1;

export default function CustomerShare(){
 const [contacts,setContacts]=useState<Contact[]>([{id:nextContactId++,name:"",phone:""}]);
 const [copied,setCopied]=useState(false);
 const [notice,setNotice]=useState("");
 const [appUrl,setAppUrl]=useState("");
 useEffect(()=>setAppUrl(window.location.origin),[]);
 const message=useMemo(()=>`Hello! You’re invited to explore Bold Dimensions — solar water heating, air conditioning and agricultural machinery support. Open the link below in Google Chrome to review the services and send a request when convenient. After submitting, you can use “My requests” to follow updates.

${appUrl}

Bold Dimensions · Service & Equipment Hub`,[appUrl]);
 const shareUrl=(phone:string)=>{const digits=phone.replace(/\D/g,"");return digits.length>=7&&digits.length<=15?"https://wa.me/"+digits+"?text="+encodeURIComponent(message):""};
 function update(id:number,key:"name"|"phone",value:string){setContacts(current=>current.map(contact=>contact.id===id?{...contact,[key]:value}:contact));setNotice("")}
 function add(){setContacts(current=>[...current,{id:nextContactId++,name:"",phone:""}])}
 function share(phone:string){const url=shareUrl(phone);if(!url){setNotice("Enter a valid WhatsApp number with country code, e.g. +267…");return}window.open(url,"_blank","noopener,noreferrer");setNotice("WhatsApp opened for this contact. Review the message and send it when ready.")}
 async function copy(){if(!appUrl)return;try{await navigator.clipboard.writeText(appUrl);setCopied(true);setNotice("Customer app link copied.");window.setTimeout(()=>setCopied(false),2200)}catch{setNotice("Could not copy automatically. Use the customer app link shown below.")}}
 return <section className="bdAdminSection bdCustomerShare" aria-labelledby="bd-customer-share-title">
  <div className="bdAdminSectionHead"><div><span className="bdEyebrow">CUSTOMER ONBOARDING</span><h2 id="bd-customer-share-title">Share with a customer</h2></div><span className="bdCustomerShareTag">WhatsApp</span></div>
  <p className="bdCustomerShareIntro">Add one or more contacts, then open a ready-to-send WhatsApp invitation. Customers land on the live app to review services and place their own requests.</p>
  <div className="bdCustomerShareRows">{contacts.map((contact,index)=><div className="bdCustomerShareRow" key={contact.id}>
   <span className="bdCustomerShareIndex">{String(index+1).padStart(2,"0")}</span>
   <label>Contact name <input value={contact.name} onChange={event=>update(contact.id,"name",event.target.value)} placeholder="Optional name" maxLength={80}/></label>
   <label>WhatsApp number <input type="tel" value={contact.phone} onChange={event=>update(contact.id,"phone",event.target.value)} placeholder="+267…" autoComplete="tel" maxLength={30}/></label>
   <button type="button" className="bdCustomerShareSend" onClick={()=>share(contact.phone)} disabled={!shareUrl(contact.phone)}>{contact.name.trim()?"Share with "+contact.name.trim():"Share on WhatsApp"} ↗</button>
   {contacts.length>1&&<button type="button" className="bdCustomerShareRemove" aria-label="Remove contact" onClick={()=>setContacts(current=>current.filter(item=>item.id!==contact.id))}>×</button>}
  </div>)}</div>
  <div className="bdCustomerShareActions"><button type="button" className="bdSecondary" onClick={add}>+ Add another contact</button><button type="button" className="bdPrimary" onClick={()=>void copy()}>{copied?"Link copied ✓":"Copy app link ↗"}</button></div>
  {notice&&<p className="bdCustomerShareNotice" role="status" aria-live="polite">{notice}</p>}
  <div className="bdCustomerShareFoot"><strong>Customer app</strong><a href={appUrl||"/"} target="_blank" rel="noreferrer">{appUrl||"Open the live app"} ↗</a><small>WhatsApp opens the message for your review; you send it yourself. Ask customers to choose Google Chrome if Android offers a browser choice. A web link cannot force Chrome or create an account on their behalf.</small></div>
 </section>;
}
