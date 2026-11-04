"use client";
import { addDoc, collection, doc, onSnapshot, orderBy, query, updateDoc, where } from "firebase/firestore";
import type { Unsubscribe } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

export const SERVICE_AREAS = [
 { id:"agricultural-machinery", name:"Agricultural machinery", short:"Machinery", intro:"Support requests for tractors and agricultural equipment.", options:["Tractor servicing","Machinery repair","Diagnostics","Parts enquiry","Other machinery support"] },
 { id:"air-conditioning", name:"Air conditioning", short:"Air conditioning", intro:"Installation, servicing and fault support for air-conditioning systems.", options:["New installation","Routine servicing","Repair / fault finding","System assessment","Other air-conditioning support"] },
 { id:"solar-water-heating", name:"Solar water heating", short:"Solar water heating", intro:"Installation, maintenance and fault support for solar water-heating systems.", options:["New installation","Routine maintenance","Repair / fault finding","System assessment","Other solar water-heating support"] }
] as const;
export type ServiceAreaId = typeof SERVICE_AREAS[number]["id"];
export type ServiceRequestStatus = "New"|"Reviewing"|"Quote prepared"|"Awaiting customer"|"Scheduled"|"In progress"|"Completed"|"Cancelled";
export type ServiceRequest = { id:string; customerId:string; customerName:string; phone:string; email?:string; areaId:ServiceAreaId; serviceType:string; equipment?:string; makeModel?:string; location:string; description:string; urgency:"Standard"|"Urgent"; preferredContact:"WhatsApp"|"Phone"|"Email"; status:ServiceRequestStatus; createdAt:string; updatedAt:string; scheduledFor?:string; quoteAmount?:number; quoteNote?:string; internalNote?:string };
const requests=collection(db,"serviceRequests");
export async function createServiceRequest(input:Omit<ServiceRequest,"id"|"status"|"createdAt"|"updatedAt">){const now=new Date().toISOString();const ref=await addDoc(requests,{...input,status:"New",createdAt:now,updatedAt:now});return ref.id}
export function subscribeToCustomerServiceRequests(uid:string,onChange:(items:ServiceRequest[])=>void,onError:(error:Error)=>void):Unsubscribe{return onSnapshot(query(requests,where("customerId","==",uid)),snapshot=>onChange(snapshot.docs.map(item=>({id:item.id,...item.data()} as ServiceRequest)).sort((a,b)=>b.createdAt.localeCompare(a.createdAt))),error=>onError(error instanceof Error?error:new Error("Your service requests could not be loaded.")))}
export function subscribeToServiceRequests(onChange:(items:ServiceRequest[])=>void,onError:(error:Error)=>void):Unsubscribe{return onSnapshot(query(requests,orderBy("createdAt","desc")),snapshot=>onChange(snapshot.docs.map(item=>({id:item.id,...item.data()} as ServiceRequest))),error=>onError(error instanceof Error?error:new Error("The service request queue could not be loaded.")))}
export function subscribeToServiceRequest(id:string,onChange:(item:ServiceRequest|null)=>void,onError:(error:Error)=>void):Unsubscribe{return onSnapshot(doc(db,"serviceRequests",id),snapshot=>onChange(snapshot.exists()?({id:snapshot.id,...snapshot.data()} as ServiceRequest):null),error=>onError(error instanceof Error?error:new Error("Service request unavailable.")))}
export async function updateServiceRequest(id:string,patch:Partial<Pick<ServiceRequest,"status"|"scheduledFor"|"quoteAmount"|"quoteNote"|"internalNote">>){const clean=Object.fromEntries(Object.entries(patch).filter(([,value])=>value!==undefined));await updateDoc(doc(db,"serviceRequests",id),{...clean,updatedAt:new Date().toISOString()})}
export const requestStatusSteps:ServiceRequestStatus[]=["New","Reviewing","Quote prepared","Awaiting customer","Scheduled","In progress","Completed"];
