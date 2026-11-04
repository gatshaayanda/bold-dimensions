"use client";
import Link from "next/link";
import Image from "next/image";
import { onAuthStateChanged, signInWithCustomToken, signOut, type User } from "firebase/auth";
import { useEffect, useState, type FormEvent } from "react";
import { auth } from "@/lib/firebase/client";

export default function AdminGate({children}:{children:React.ReactNode}){
 const [user,setUser]=useState<User|null>(null),[checking,setChecking]=useState(true),[authorized,setAuthorized]=useState(false),[busy,setBusy]=useState(false),[password,setPassword]=useState(""),[error,setError]=useState("");
 useEffect(()=>{
  const stop=onAuthStateChanged(auth,async next=>{
   setUser(next);setAuthorized(false);
   if(!next){setChecking(false);return}
   setChecking(true);
   try{const token=await next.getIdTokenResult(true);const allowed=token.claims.admin===true;setAuthorized(allowed);setError(allowed?"":"This Firebase session does not have the Bold Dimensions admin claim. Sign in with the admin password.");}
   catch{setAuthorized(false);setError("Admin access could not be verified. Please sign in again.")}
   finally{setChecking(false)}
  });
  return stop;
 },[]);
 async function login(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(!password.trim())return;
  setBusy(true);setError("");
  try{
   const response=await fetch("/api/admin/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({password})});
   const result=await response.json() as {customToken?:string;error?:string};
   if(!response.ok||!result.customToken)throw new Error(result.error||"Admin sign-in failed.");
   await signInWithCustomToken(auth,result.customToken);setPassword("");
  }catch(cause){setError(cause instanceof Error?cause.message:"Admin sign-in failed. Check your password and server configuration.")}
  finally{setBusy(false)}
 }
 async function logout(){await signOut(auth);setAuthorized(false);setUser(null)}
 if(checking)return <main className="bdAdminShell"><section className="bdAdminAuth"><span className="bdEyebrow">BOLD DIMENSIONS · OPERATIONS</span><h1>Checking<br/><em>access…</em></h1><p>Verifying your admin session.</p></section></main>;
 if(user&&authorized)return <div className="bdAdminApp"><header className="bdAdminTop"><Link href="/" className="bdAdminWordmark">BOLD DIMENSIONS <small>OPERATIONS</small></Link><span>Admin access</span><button type="button" onClick={()=>void logout()}>Sign out</button></header>{children}</div>;
 return <main className="bdAdminShell"><section className="bdAdminAuth"><Image src="/brand/bold-dimensions-logo.jpg" alt="Bold Dimensions" width={84} height={84}/><span className="bdEyebrow">SECURE ADMIN ACCESS</span><h1>Operations<br/><em>workspace.</em></h1><p>Enter the admin password to open the Bold Dimensions service desk.</p>{error&&<p className="bdFormError" role="alert">{error}</p>}{user&&<div className="bdAdminIdentity"><small>A previous Firebase session is active but is not an admin session.</small><button type="button" onClick={()=>void logout()}>Sign out of this session</button></div>}<form onSubmit={login}><label htmlFor="bd-admin-password">Admin password</label><input id="bd-admin-password" type="password" autoComplete="current-password" value={password} onChange={event=>setPassword(event.target.value)} required/><button className="bdPrimary" type="submit" disabled={busy||!password.trim()}>{busy?"Verifying…":"Open admin ↗"}</button></form><small>Access is verified on the server. The password is never stored in Firestore or sent to the browser as configuration.</small></section></main>;
}
