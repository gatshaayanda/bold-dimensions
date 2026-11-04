"use client";

import {useEffect,useRef,useState,type MouseEvent} from "react";

type HandoffContext="whatsapp"|"instagram"|"facebook"|"messenger"|"linkedin"|"embedded"|"browser";
type Props={initialContext:HandoffContext;initialAndroid:boolean;initialIos:boolean};
function detectContext(ua:string):HandoffContext{
 const value=ua.toLowerCase();
 if(value.includes("whatsapp"))return "whatsapp";
 if(value.includes("instagram"))return "instagram";
 if(value.includes("fban")||value.includes("fbav"))return "facebook";
 if(value.includes("messenger"))return "messenger";
 if(value.includes("linkedinapp"))return "linkedin";
 if(/line\/|twitter|tiktok|snapchat|; wv\)|\bwv\b|\bwebview\b/.test(value))return "embedded";
 return "browser";
}
function isStandalone(){
 return typeof window!=="undefined"&&(window.matchMedia("(display-mode: standalone)").matches||("standalone" in navigator&&Boolean((navigator as Navigator&{standalone?:boolean}).standalone)));
}
function chromeIntentUrl(fullUrl:string){
 const target=new URL(fullUrl);
 const intentTarget=target.host+target.pathname+target.search;
 return "intent://"+intentTarget+"#Intent;scheme="+target.protocol.replace(":","")+";package=com.android.chrome;S.browser_fallback_url="+encodeURIComponent(fullUrl)+";end";
}
export default function JtsBrowserGate({initialContext,initialAndroid,initialIos}:Props){
 const[context,setContext]=useState<HandoffContext>(initialContext);
 const[ready,setReady]=useState(true);
 const[showFallback,setShowFallback]=useState(false);
 const[currentUrl,setCurrentUrl]=useState("");
 const primaryRef=useRef<HTMLAnchorElement|null>(null);
 useEffect(()=>{
  const detected=detectContext(navigator.userAgent);
  const effectiveContext=initialContext==="browser"?detected:initialContext;
  setContext(effectiveContext);
  setCurrentUrl(window.location.href);
  setReady(true);
  if(isStandalone()||effectiveContext==="browser"){document.documentElement.classList.remove("jts-embedded-pending");return;}
  const previousOverflow=document.body.style.overflow;
  document.body.style.overflow="hidden";
  primaryRef.current?.focus();
  const keepGateOpen=(event:KeyboardEvent)=>{
   if(event.key==="Escape"){event.preventDefault();event.stopPropagation();}
   if(event.key==="Tab"){event.preventDefault();primaryRef.current?.focus();}
  };
  window.addEventListener("keydown",keepGateOpen,true);
  return()=>{
   document.body.style.overflow=previousOverflow;
   window.removeEventListener("keydown",keepGateOpen,true);
  };
 },[initialContext]);
 if(!ready||context==="browser"||isStandalone())return null;
 const isAndroid=initialAndroid||/android/i.test(typeof navigator!=="undefined"?navigator.userAgent:"");
 const isIos=initialIos||/iphone|ipad|ipod/i.test(typeof navigator!=="undefined"?navigator.userAgent:"")||(typeof navigator!=="undefined"&&/MacIntel/.test(navigator.platform)&&navigator.maxTouchPoints>1);
 const names:Record<HandoffContext,string>={whatsapp:"WhatsApp",instagram:"Instagram",facebook:"Facebook",messenger:"Messenger",linkedin:"LinkedIn",embedded:"this in-app browser",browser:"your browser"};
 function openBrowser(event:MouseEvent<HTMLAnchorElement>){
  const destination=window.location.href;
  if(isAndroid){
   event.preventDefault();
   // Keep the requested path and query in the Chrome intent. The encoded fallback
   // retains the complete original URL, including its fragment, if Chrome cannot open.
   window.location.href=chromeIntentUrl(destination);
   return;
  }
  // The normal link opens the same current URL in a new tab on iOS/other platforms.
  // If the host blocks new tabs, expose the in-app-menu and copy-link recovery.
  event.preventDefault();
  const opened=window.open(destination,"_blank");
  if(opened)opened.opener=null;
  else setShowFallback(true);
 }
 return <div className="jtsBrowserGate" role="dialog" aria-modal="true" aria-labelledby="jtsBrowserGateTitle">
  <section className="jtsBrowserGateCard">
   <div className="jtsBrowserGateBrand"><img src="/brand/bold-dimensions-logo.jpg" alt="Bold Dimensions logo"/><div><b>BOLD DIMENSIONS</b><small>SERVICE & EQUIPMENT HUB</small></div></div>
   <span className="jtsBrowserGateEyebrow">ONE QUICK STEP</span>
   <h1 id="jtsBrowserGateTitle">Open Bold Dimensions in your browser.</h1>
   <p>You opened this page inside {names[context]}. Continue in your normal browser to keep using this page and request service support. We’ll keep the page you wanted to open.</p>
   <a ref={primaryRef} className="jtsBrowserGatePrimary" href={currentUrl||""} target={isAndroid?"_self":"_blank"} rel="noopener noreferrer" onClick={openBrowser}>{isAndroid?"OPEN IN CHROME":"OPEN IN BROWSER"} <span aria-hidden="true">↗</span></a>
   <p className="jtsBrowserGateHint">{isIos?"If this does not open Safari, use the menu in this app and choose Open in Browser.":"If Chrome does not open, use the ⋮ menu and choose Open in browser."}</p>
   <button type="button" className="jtsBrowserGateFallbackToggle" onClick={()=>setShowFallback(value=>!value)} aria-expanded={showFallback} aria-controls="jtsBrowserGateFallback">{showFallback?"Hide help":"Browser did not open?"}</button>
   {showFallback&&<div id="jtsBrowserGateFallback" className="jtsBrowserGateFallback"><p>Open the {context==="whatsapp"?"WhatsApp":"app"} menu and choose <b>Open in browser</b>. If that option is unavailable, copy this page’s link and paste it into Chrome or Safari.</p><button type="button" onClick={()=>void navigator.clipboard?.writeText(window.location.href).then(()=>setShowFallback(false)).catch(()=>setShowFallback(true))}>Copy this page link</button></div>}
  </section>
 </div>;
}
