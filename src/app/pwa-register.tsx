"use client";

import {useEffect,useRef,useState} from "react";
import {getIdToken,onAuthStateChanged} from "firebase/auth";
import {auth} from "@/lib/firebase/client";

type InstallPromptEvent=Event&{prompt:()=>void|Promise<void>;userChoice:Promise<{outcome:"accepted"|"dismissed";platform:string}>};

declare global {
 interface Window {
  __jtsEarlyInstallPrompt?:Event|null;
  __jtsPwaListenerReady?:boolean;
 }
}

export default function PwaRegister(){
 const[offline,setOffline]=useState(false),[reconnecting,setReconnecting]=useState(false);
 const[installed,setInstalled]=useState(false),[installOpen,setInstallOpen]=useState(false),[installHelp,setInstallHelp]=useState(false),[isIOS,setIsIOS]=useState(false),[isAndroid,setIsAndroid]=useState(false);
 const reloadForUpdate=useRef(false),installPromptRef=useRef<InstallPromptEvent|null>(null);

 useEffect(()=>{
  setOffline(!navigator.onLine);
  const standalone=window.matchMedia("(display-mode: standalone)").matches||("standalone" in navigator&&Boolean((navigator as Navigator&{standalone?:boolean}).standalone));
  const ua=navigator.userAgent||"";
  setInstalled(standalone);setIsIOS(/iPad|iPhone|iPod/i.test(ua)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1));setIsAndroid(/Android/i.test(ua));
  // Every install entry dispatches one event; this controller owns the native prompt and fallback.
  const openInstall=()=>{void startInstall()};
  window.addEventListener("jts-open-install",openInstall);

  const retryPendingBookingNotifications=async()=>{
   const user=auth.currentUser;if(!user)return;
   const idToken=await getIdToken(user).catch(()=>null);if(!idToken)return;
   const pendingKeys=Object.keys(localStorage).filter(key=>key.startsWith("jts-pending-booking-notification-"));
   for(const key of pendingKeys){
    const bookingId=key.replace("jts-pending-booking-notification-","");
    try{
     const response=await fetch("/api/notifications/order-created",{method:"POST",headers:{Authorization:"Bearer "+idToken,"Content-Type":"application/json"},body:JSON.stringify({bookingId})});
     if(response.ok)localStorage.removeItem(key);
    }catch{}
   }
  };

  const online=()=>{setOffline(false);setReconnecting(true);window.setTimeout(()=>{setReconnecting(false);void retryPendingBookingNotifications()},1200)};
  const off=()=>{setReconnecting(false);setOffline(true)};

  const appinstalled=()=>{
   installPromptRef.current=null;setInstalled(true);setInstallOpen(false);setInstallHelp(false);
   window.dispatchEvent(new Event("jts-install-complete"));
  };

   const onBeforeInstallPrompt=(event:Event)=>{
   const currentStandalone=window.matchMedia("(display-mode: standalone)").matches||("standalone" in navigator&&Boolean((navigator as Navigator&{standalone?:boolean}).standalone));
   if(currentStandalone)return;
   event.preventDefault();
   installPromptRef.current=event as InstallPromptEvent;
  };
  // Attach the live listener BEFORE marking the controller ready. Otherwise a
  // beforeinstallprompt event landing between the ready flag and addEventListener
  // is ignored by the early-capture script and lost before the Install click.
  window.addEventListener("beforeinstallprompt",onBeforeInstallPrompt);
  window.__jtsPwaListenerReady=true;
  const earlyPrompt=window.__jtsEarlyInstallPrompt;
  if(earlyPrompt){
   delete window.__jtsEarlyInstallPrompt;
   // The live listener may already have received this same event in the tiny
   // handoff window; never overwrite it by adopting the event twice.
   if(installPromptRef.current!==earlyPrompt)onBeforeInstallPrompt(earlyPrompt);
  }

  window.addEventListener("online",online);
  window.addEventListener("offline",off);
  window.addEventListener("appinstalled",appinstalled);

  let registration:ServiceWorkerRegistration|null=null;
  const inspect=()=>{if(registration?.waiting&&navigator.serviceWorker.controller){reloadForUpdate.current=true;registration.waiting.postMessage({type:"SKIP_WAITING"})}};
  const register=async()=>{
   if(!("serviceWorker" in navigator))return;
   try{
    registration=await navigator.serviceWorker.register("/sw-jts.js",{scope:"/"});
    inspect();
    registration.addEventListener("updatefound",()=>{
     const worker=registration?.installing;if(!worker)return;
     worker.addEventListener("statechange",inspect);
    });
    await registration.update();inspect();
   }catch{}
  };
  void register();void retryPendingBookingNotifications();
  const stopPendingAuth=onAuthStateChanged(auth,()=>{void retryPendingBookingNotifications()});
  const controllerChange=()=>{if(reloadForUpdate.current)window.location.reload()};
  navigator.serviceWorker?.addEventListener("controllerchange",controllerChange);

  return()=>{
   window.removeEventListener("online",online);
   window.removeEventListener("offline",off);
   window.removeEventListener("appinstalled",appinstalled);
   window.removeEventListener("beforeinstallprompt",onBeforeInstallPrompt);
   window.removeEventListener("jts-open-install",openInstall);
   window.__jtsPwaListenerReady=false;
   installPromptRef.current=null;
   navigator.serviceWorker?.removeEventListener("controllerchange",controllerChange);
   stopPendingAuth();
  };
 },[]);

 async function startInstall(){
  if(window.matchMedia("(display-mode: standalone)").matches||("standalone" in navigator&&Boolean((navigator as Navigator&{standalone?:boolean}).standalone))){setInstalled(true);return}
  const promptEvent=installPromptRef.current;
  if(!promptEvent){setInstallHelp(true);setInstallOpen(true);return}
  try{
   // Invoke prompt() synchronously from the user's click, before the first await.
   const promptResult=promptEvent.prompt();
   installPromptRef.current=null;
   await promptResult;
   const choice=await promptEvent.userChoice;
   if(choice.outcome==="accepted"){setInstalled(true);setInstallOpen(false);setInstallHelp(false)}
   else {setInstallOpen(false);setInstallHelp(false)}
  }catch{
   // Browser eligibility and prompt availability are browser-controlled.
   setInstallHelp(true);setInstallOpen(true);
  }finally{
   installPromptRef.current=null;
  }
 }

 return <>
   {!installed&&<button type="button" className="jtsPersistentInstall" onClick={()=>window.dispatchEvent(new Event("jts-open-install"))} aria-label={isIOS ? "Add John The Stylist Bw to Home Screen" : "Install John The Stylist Bw"}><img src="/jts-logo.svg" alt="" aria-hidden="true"/>{isIOS ? "Add to Home Screen" : "Install John The Stylist Bw"} <span aria-hidden="true">↓</span></button>}
   {installOpen&&!installed&&<div className="jtsInstallPanel" role="presentation"><section className="jtsInstallPanelCard" role="dialog" aria-modal="false" aria-labelledby="jts-install-panel-title" aria-describedby="jts-install-panel-message"><div className="jtsInstallPanelTop"><img src="/jts-logo.svg" alt="" aria-hidden="true"/><span>JOHN THE STYLIST BW · GABORONE</span><button type="button" aria-label="Close install panel" onClick={()=>{setInstallOpen(false);setInstallHelp(false)}}>×</button></div><span className="jtsInstallPanelKicker">YOUR STYLING APP</span><h2 id="jts-install-panel-title">{isIOS ? <>Add John The Stylist Bw.<br/><em>To your Home Screen.</em></> : <>Your next look.<br/><em>One tap away.</em></>}</h2><p id="jts-install-panel-message">{isIOS ? "iPhone needs one final step in the browser’s Share menu. Follow the steps below to add John The Stylist Bw to your Home Screen." : "Add John The Stylist Bw to your home screen for a direct shortcut to appointments, booking history and John’s updates."}</p>{installHelp?<div className="jtsInstallPanelHelp" role="status" aria-live="polite">{isIOS?<><strong>Finish adding John The Stylist Bw to your iPhone</strong><p><b>1.</b> Tap your browser’s <b>Share</b> button.<br/><b>2.</b> Choose <b>Add to Home Screen</b>. If it is missing, scroll through the actions or choose <b>Edit Actions</b>.<br/><b>3.</b> If iOS shows <b>Open as Web App</b>, leave it enabled, then tap <b>Add</b>.</p><p>iPhone browsers do not let websites open this system action automatically. If your browser does not offer <b>Add to Home Screen</b>, open this same page in <b>Safari</b> and repeat the steps.</p></>:isAndroid?<><strong>Add John The Stylist Bw from Chrome</strong><p>In <b>Chrome</b>, tap the <b>⋮ menu</b> and choose <b>Install app</b> or <b>Add to Home screen</b>. The wording depends on your browser version.</p></>:<><strong>Install John The Stylist Bw from your browser</strong><p>In <b>Chrome or Edge</b>, open the browser menu and choose <b>Install John The Stylist Bw</b> or <b>Install page as app</b>, if offered.</p></>}<button type="button" className="jtsInstallPanelPrimary" onClick={()=>{setInstallOpen(false);setInstallHelp(false)}}>Got it</button></div>:<><div className="jtsInstallPanelBenefits"><span><b>01</b><strong>Quick access</strong><small>Open JTS from your home screen.</small></span><span><b>02</b><strong>Your appointments</strong><small>Return to booking and appointment history.</small></span><span><b>03</b><strong>Useful updates</strong><small>Keep up with your appointment details.</small></span></div><button type="button" className="jtsInstallPanelPrimary" onClick={()=>void startInstall()}>Install John The Stylist Bw <span aria-hidden="true">→</span></button><button type="button" className="jtsInstallPanelSecondary" onClick={()=>setInstallOpen(false)}>Not now</button></>}<p className="jtsInstallPanelFootnote">Your browser handles the installation securely.</p></section></div>}
  {offline&&<div className="offlineBanner" role="status" aria-live="polite"><span aria-hidden="true">⚡</span> Offline · John The Stylist Bw is still available. Booking requests can be saved on this device and sync when you reconnect.</div>}
  {!offline&&reconnecting&&<div className="offlineBanner reconnectingBanner" role="status" aria-live="polite"><span aria-hidden="true">↻</span> Reconnected · John The Stylist Bw is syncing your saved booking data.</div>}
 </>;
}
