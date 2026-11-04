"use client";
import Link from "next/link";
import Image from "next/image";
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, type User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase/client";

export default function AdminGate({children}:{children:React.ReactNode}){
 const [user,setUser]=useState<User|null>(null),[checking,setChecking]=useState(true),[authorized,setAuthorized]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState("");
 useEffect(()=>{
  let stopRole:(()=>void)|undefined;
  const stopAuth=onAuthStateChanged(auth,next=>{
   if(stopRole){stopRole();stopRole=undefined}
   setUser(next);setAuthorized(false);
   if(!next){setChecking(false);return}
   setChecking(true);
   stopRole=onSnapshot(doc(db,"admins",next.uid),snapshot=>{
    const role=String(snapshot.data()?.role??"").toLowerCase();
    setAuthorized(snapshot.exists()&&["owner","staff"].includes(role));setChecking(false);
    setError(snapshot.exists()&&["owner","staff"].includes(role)?"":"This account has not been assigned a Bold Dimensions admin role.");
   },()=>{setAuthorized(false);setChecking(false);setError("Admin access could not be verified. Check the Firebase connection and role rules.")});
  });
  return()=>{if(stopRole)stopRole();stopAuth()};
 },[]);
 async function google(){setBusy(true);setError("");try{const provider=new GoogleAuthProvider();provider.setCustomParameters({prompt:"select_account"});await signInWithPopup(auth,provider)}catch(cause){const code=typeof cause==="object"&&cause&&"code" in cause?String((cause as {code?:unknown}).code):"";setError(code==="auth/popup-closed-by-user"?"Sign-in was cancelled.":code==="auth/popup-blocked"?"Your browser blocked the sign-in window. Allow pop-ups and try again.":"Google sign-in could not be completed. Check your connection and try again.")}finally{setBusy(false)}}
 if(checking)return <main className="bdAdminShell"><section className="bdAdminAuth"><span className="bdEyebrow">BOLD DIMENSIONS · OPERATIONS</span><h1>Checking<br/><em>access…</em></h1><p>Verifying your admin role.</p></section></main>;
 if(user&&authorized)return <div className="bdAdminApp"><header className="bdAdminTop"><Link href="/" className="bdAdminWordmark">BOLD DIMENSIONS <small>OPERATIONS</small></Link><span>{user.displayName||user.email||"Authorized staff"}</span><button type="button" onClick={()=>void signOut(auth)}>Sign out</button></header>{children}</div>;
 return <main className="bdAdminShell"><section className="bdAdminAuth"><Image src="/brand/bold-dimensions-logo.jpg" alt="Bold Dimensions" width={84} height={84}/><span className="bdEyebrow">OWNER & STAFF ACCESS</span><h1>Operations<br/><em>workspace.</em></h1><p>Sign in with the Google account that has an owner or staff role in the Bold Dimensions Firebase project.</p>{error&&<p className="bdFormError" role="alert">{error}</p>}{user&&<div className="bdAdminIdentity"><small>Signed in as {user.email||"Google account"}</small><code>UID: {user.uid}</code><button type="button" onClick={()=>void signOut(auth)}>Switch account</button></div>}<button className="bdPrimary" type="button" disabled={busy} onClick={()=>void google()}>{busy?"Opening Google…":"Continue with Google ↗"}</button><small>To grant access, create Firestore document <code>admins/{user?.uid||"your-user-id"}</code> with field <code>role: &quot;owner&quot;</code> or <code>role: &quot;staff&quot;</code>.</small></section></main>;
}
