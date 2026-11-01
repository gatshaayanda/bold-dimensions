"use client";

import {useEffect,useState} from "react";

function isStandalone(){
 return window.matchMedia("(display-mode: standalone)").matches
  || ("standalone" in navigator && Boolean((navigator as Navigator&{standalone?:boolean}).standalone));
}

export default function JtsInstallButton() {
 const [installed,setInstalled]=useState(false);

 useEffect(()=>{
  const syncInstalledState=()=>setInstalled(isStandalone());
  syncInstalledState();
  window.addEventListener("appinstalled",syncInstalledState);
  window.addEventListener("jts-install-complete",syncInstalledState);
  return ()=>{
   window.removeEventListener("appinstalled",syncInstalledState);
   window.removeEventListener("jts-install-complete",syncInstalledState);
  };
 },[]);

 if(installed)return null;

 return <button
  type="button"
  className="jtsInstallButton"
  onClick={() => window.dispatchEvent(new Event("jts-open-install"))}
  aria-label="Install John The Stylist Bw"
 >
  <img src="/jts-logo.svg" alt="" aria-hidden="true" /> Install John The Stylist Bw <span aria-hidden="true">→</span>
 </button>;
}
