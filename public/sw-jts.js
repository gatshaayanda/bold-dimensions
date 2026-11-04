importScripts("https://www.gstatic.com/firebasejs/11.9.0/firebase-app-compat.js","https://www.gstatic.com/firebasejs/11.9.0/firebase-messaging-compat.js");

firebase.initializeApp({apiKey:"AIzaSyCCpiTA4h_SuFQ02LKxtnUPL8aeUM22aMM",authDomain:"the-wall-ab746.firebaseapp.com",projectId:"the-wall-ab746",storageBucket:"the-wall-ab746.firebasestorage.app",messagingSenderId:"591554003595",appId:"1:591554003595:web:e0bcf57ec06ab196638a8e",measurementId:"G-RHX7RR8CWF"});

const CACHE_VERSION="bold-dimensions-shell-v2";
const SHELL=["/offline","/manifest.webmanifest","/icon-192.png","/icon-512.png","/brand/bold-dimensions-logo.jpg","/bold-dimensions-icon.svg"];

firebase.messaging().onBackgroundMessage((payload)=>{
 const title=payload.notification?.title||payload.data?.title||"Bold Dimensions";
 const body=payload.notification?.body||payload.data?.body||"You have a service request update.";
 const link=payload.fcmOptions?.link||payload.data?.link||"/account";
 self.registration.showNotification(title,{body,icon:"/icon-192.png",badge:"/icon-192.png",tag:payload.data?.appointmentId?"bd-service-request-"+payload.data.appointmentId:"bd-notification",data:{link}});
});

self.addEventListener("notificationclick",(event)=>{
 event.notification.close();
 const link=event.notification.data?.link||"/account";
 event.waitUntil(clients.matchAll({type:"window",includeUncontrolled:true}).then(list=>{
  for(const client of list){if("focus" in client){if("navigate" in client)client.navigate(link);return client.focus();}}
  return clients.openWindow(link);
 }));
});

async function precache(){
 const cache=await caches.open(CACHE_VERSION);
 for(const path of SHELL){try{const response=await fetch(new Request(path,{cache:"reload"}));if(response.ok)await cache.put(path,response.clone())}catch{}}
 const discovered=new Set();
 for(const path of ["/offline"]){
  const response=await cache.match(path);if(!response)continue;
  const html=await response.text();
  for(const match of html.matchAll(/(?:src|href)=["'](\/\_next\/static\/[^"']+)["']/g))discovered.add(match[1]);
 }
 await Promise.all([...discovered].map(async path=>{try{const response=await fetch(new Request(path,{cache:"reload"}));if(response.ok)await cache.put(path,response.clone())}catch{}}));
}
self.addEventListener("install",event=>event.waitUntil(precache().then(()=>self.skipWaiting())));
self.addEventListener("activate",event=>event.waitUntil((async()=>{
 const keys=await caches.keys();
 await Promise.all(keys.filter(key=>(key.startsWith("jts-shell-")||key.startsWith("bold-dimensions-shell-"))&&key!==CACHE_VERSION).map(key=>caches.delete(key)));
 await self.clients.claim();
})()));
self.addEventListener("message",event=>{if(event.data?.type==="SKIP_WAITING")self.skipWaiting()});
self.addEventListener("fetch",event=>{
 const request=event.request;
 if(request.method!=="GET"||new URL(request.url).origin!==self.location.origin)return;
 const url=new URL(request.url);
 if(url.pathname.startsWith("/api/"))return;
 const isNavigation=request.mode==="navigate"||request.headers.get("accept")?.includes("text/html");
 const isStatic=url.pathname.startsWith("/_next/static/")||url.pathname==="/manifest.webmanifest"||/^\/.*\.(?:css|js|woff2?|ttf|otf|png|jpe?g|webp|svg|ico|avif)$/i.test(url.pathname);
 if(isStatic){
  event.respondWith((async()=>{const cached=await caches.match(request);if(cached)return cached;try{const response=await fetch(request);if(response.ok)void caches.open(CACHE_VERSION).then(cache=>cache.put(request,response.clone()));return response}catch{return Response.error()}})());
  return;
 }
 if(isNavigation){
  // HTML varies by request context (including the embedded-browser gate) and may
  // contain route-specific state. Never reuse cached homepage/booking HTML here.
  // Keep navigation network-first and fall back only to the dedicated offline route.
  event.respondWith(fetch(request).catch(async()=>await caches.match("/offline")||Response.error()));
 }
});