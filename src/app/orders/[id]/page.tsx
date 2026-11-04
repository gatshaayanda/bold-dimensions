"use client";
import Link from "next/link";
import {GoogleAuthProvider,linkWithPopup,onAuthStateChanged,signInWithPopup,type User} from "firebase/auth";
import {useEffect,useState} from "react";
import {auth} from "@/lib/firebase/client";
import {getFoodOrder,subscribeToFoodOrder,type FoodOrder} from "@/lib/firebase/data";
import {downloadReceiptPdf} from "@/lib/jts/receipt";

const APPOINTMENT_STEPS=[{key:"New",title:"Request received",detail:"Your request is safely recorded."},{key:"Reviewing",title:"John is reviewing",detail:"Your requested time and details are being checked."},{key:"Confirmed",title:"Appointment confirmed",detail:"Your slot and deposit have been verified."},{key:"In service",title:"In the chair",detail:"Your appointment is underway."},{key:"Completed",title:"All done",detail:"Your visit is complete. Thank you."}] as const;
function appointmentProgress(status:FoodOrder["status"]){
 if(status==="Cancelled")return -1;
 if(status==="New")return 0;
 if(status==="Reviewing")return 1;
 if(status==="Accepted"||status==="Confirmed")return 2;
 if(["In service","Preparing","Ready"].includes(status))return 3;
 if(["Completed","Collected","Delivered"].includes(status))return 4;
 return 0;
}
function statusText(status:FoodOrder["status"]){
 if(status==="New")return "Request received";
 if(status==="Reviewing")return "Being reviewed";
 if(status==="Accepted"||status==="Confirmed")return "Confirmed";
 if(["Preparing","Ready","In service"].includes(status))return "In service";
 if(["Collected","Delivered","Completed"].includes(status))return "Completed";
 if(status==="Cancelled")return "Cancelled";
 return status;
}
function dateParts(value:string){
 const date=new Date(value);
 if(!Number.isFinite(date.getTime()))return {day:"—",month:"",weekday:"Date to be confirmed",time:value};
 return {day:new Intl.DateTimeFormat("en-GB",{timeZone:"Africa/Gaborone",day:"2-digit"}).format(date),month:new Intl.DateTimeFormat("en-GB",{timeZone:"Africa/Gaborone",month:"short"}).format(date).toUpperCase(),weekday:new Intl.DateTimeFormat("en-GB",{timeZone:"Africa/Gaborone",weekday:"long"}).format(date),time:new Intl.DateTimeFormat("en-GB",{timeZone:"Africa/Gaborone",hour:"2-digit",minute:"2-digit"}).format(date)};
}
function authMessage(error:unknown){const code=typeof error==="object"&&error&&"code" in error?String((error as {code?:unknown}).code):"";if(code==="auth/popup-closed-by-user")return "Google sign-in was cancelled.";if(code==="auth/popup-blocked")return "Your browser blocked the Google sign-in window. Allow pop-ups for John The Stylist Bw and try again.";if(code==="auth/account-exists-with-different-credential")return "That Google email already has a John The Stylist Bw account with another sign-in method. Use the original sign-in method, then connect Google from My Account.";if(code==="auth/credential-already-in-use")return "That Google account is already connected to another John The Stylist Bw account.";if(code==="auth/provider-already-linked")return "Google is already connected to this John The Stylist Bw account.";return "Google sign-in could not be completed."}
function bookingAccessMessage(error:unknown){const code=typeof error==="object"&&error&&"code" in error?String((error as {code?:unknown}).code):"";if(code==="permission-denied"||code==="firestore/permission-denied")return "This booking is protected by the customer session that placed it. We can still show the copy saved on this device; live tracking needs that guest session or the connected Google account.";return "We could not load live appointment updates right now."}
function readLocalBooking(id:string):FoodOrder|null{if(typeof window==="undefined")return null;try{const raw=window.localStorage.getItem(`jts-booking-${id}`);return raw?JSON.parse(raw) as FoodOrder:null}catch{return null}}
export default function BookingTrackingPage({params}:{params:Promise<{id:string}>}){
 const[booking,setBooking]=useState<FoodOrder|null>(null),[user,setUser]=useState<User|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState(""),[localOnly,setLocalOnly]=useState(false);
 useEffect(()=>{let active=true;let stop=()=>{};const unsubscribe=onAuthStateChanged(auth,next=>{setUser(next);void params.then(async({id})=>{if(!active)return;stop();stop=()=>{};const local=readLocalBooking(id);try{if(!next){if(local){setBooking(local);setLocalOnly(true);setError("This is the private copy saved on this device. Reconnect using the original booking session to check live updates.");}else setError("Open this link on the device/browser used to place the request, or sign in with the Google account linked to that booking.");return}const found=await getFoodOrder(id);if(!active)return;if(!found){if(local){setBooking(local);setLocalOnly(true);setError("The live appointment record is unavailable. Showing the copy saved on this device.");}else setError("That appointment could not be found in this booking session. Open My Account to check your bookings.");return}setBooking(found);setLocalOnly(false);setError("");stop=subscribeToFoodOrder(id,nextBooking=>{if(nextBooking){setBooking(nextBooking);try{window.localStorage.setItem(`jts-booking-${id}`,JSON.stringify(nextBooking))}catch{}}},err=>{if(local){setBooking(local);setLocalOnly(true);setError(bookingAccessMessage(err))}else setError(bookingAccessMessage(err))})}catch(err){if(local){setBooking(local);setLocalOnly(true);setError(bookingAccessMessage(err))}else setError(bookingAccessMessage(err))}finally{if(active)setLoading(false)}})});return()=>{active=false;unsubscribe();stop()}},[params]);
 async function google(){try{const provider=new GoogleAuthProvider();provider.setCustomParameters({prompt:"select_account"});if(user?.isAnonymous)await linkWithPopup(user,provider);else await signInWithPopup(auth,provider);setError("")}catch(err){setError(authMessage(err))}}
 const owns=Boolean(booking?.customerId&&user?.uid===booking.customerId);
 const progress=booking?appointmentProgress(booking.status):0;
 const date=booking?dateParts(booking.scheduledFor):null;
 return <main className="jtsTrackPage"><div className="jtsTrackWrap">
  <header className="jtsTrackHeader"><Link href="/" className="jtsTrackBrand"><span className="jtsTrackBrandMark">J</span><span>JOHN THE STYLIST <small>BW</small></span></Link><Link href="/account" className="jtsTrackAccount">My JTS <span>↗</span></Link></header>
  {loading?<section className="jtsTrackLoading"><span className="jtsTrackPulse"/><strong>Finding your appointment</strong><p>Checking your private booking record…</p></section>:error&&!booking?<section className="jtsTrackError"><span className="jtsEyebrow">PRIVATE APPOINTMENT</span><h1>We can’t open this booking yet.</h1><p>{error}</p><Link className="jtsTrackPrimary" href="/account">Open My JTS ↗</Link></section>:booking&&date?<>
   <div className="jtsTrackIntro"><span className="jtsEyebrow">{localOnly?"SAVED BOOKING":"YOUR APPOINTMENT"}</span><h1>Your next look,<br/><em>in progress.</em></h1><p>Keep an eye on your appointment as John reviews your request.</p></div>
   {error&&<p className="jtsTrackNotice" role="status">{error}</p>}
   <section className="jtsTrackHero">
    <div className="jtsTrackHeroTop"><span className="jtsEyebrow">BOOKING REFERENCE</span><span className={booking.status==="Cancelled"?"jtsTrackBadge isCancelled":"jtsTrackBadge"}>{statusText(booking.status)}</span></div>
    <div className="jtsTrackReference">#{booking.id.slice(0,8).toUpperCase()}</div>
    <div className="jtsTrackSummary">
     <div className="jtsTrackDate"><strong>{date.day}</strong><span>{date.month}</span></div>
     <div className="jtsTrackDateCopy"><strong>{date.weekday}</strong><span>{date.time} · Gaborone time</span></div>
     <div className="jtsTrackTotal"><small>BOOKING TOTAL</small><strong>P{booking.total.toFixed(2)}</strong></div>
    </div>
   </section>
   <section className="jtsTrackProgress">
    <div className="jtsTrackSectionHead"><div><span className="jtsEyebrow">THE JOURNEY</span><h2>Appointment progress</h2></div><span>{booking.status==="Cancelled"?"Closed":`Step ${progress+1} of 5`}</span></div>
    {booking.status==="Cancelled"?<div className="jtsTrackCancelled"><strong>This request was cancelled.</strong><p>Contact John if you would like help arranging another visit.</p></div>:<div className="jtsTrackSteps">{APPOINTMENT_STEPS.map((step,index)=><div className={index<progress?"isDone":index===progress?"isCurrent":""} key={step.key}><span className="jtsTrackStepMark">{index<progress?"✓":index+1}</span><div><strong>{step.title}</strong><small>{index===progress?step.detail:index<progress?"Completed":"Up next"}</small></div><span className="jtsTrackStepState">{index===progress?"NOW":index<progress?"DONE":"LATER"}</span></div>)}</div>}
    <p className="jtsTrackTruth">A request is not yet a confirmed appointment. John must confirm your requested slot and verify the 50% deposit before your booking is confirmed.</p>
   </section>
   <section className="jtsTrackService"><div className="jtsTrackSectionHead"><div><span className="jtsEyebrow">YOUR LOOK</span><h2>Booked service</h2></div></div>{booking.items.map(item=><div className="jtsTrackServiceRow" key={item.name}><div><strong>{item.name}</strong><small>{item.quantity} × P{item.price.toFixed(2)}</small></div><strong>P{(item.price*item.quantity).toFixed(2)}</strong></div>)}<div className="jtsTrackServiceTotal"><span>Total</span><strong>P{booking.total.toFixed(2)}</strong></div></section>
   <div className="jtsTrackActions"><button className="jtsTrackPrimary" type="button" onClick={()=>downloadReceiptPdf(booking)}>Download booking summary ↓</button><button className="jtsTrackSecondary" type="button" onClick={()=>window.print()}>Print summary</button></div>
   {!owns&&!localOnly&&<section className="jtsTrackConnect"><div><strong>Keep your bookings together.</strong><p>Connect Google to this same guest session so your JTS history stays with you.</p></div><button className="jtsTrackSecondary" type="button" onClick={()=>void google()}>Continue with Google</button></section>}
   {localOnly&&<section className="jtsTrackConnect"><div><strong>Saved on this phone.</strong><p>This is your private local copy. Live status returns when the original booking session is available.</p></div><Link className="jtsTrackSecondary" href="/account">Open My Account</Link></section>}
   <footer className="jtsTrackFooter"><span>JOHN THE STYLIST BW · GABORONE</span><a href="https://wa.me/26778053564">Need help? Message John ↗</a></footer>
  </>:null}
 </div></main>;
}
