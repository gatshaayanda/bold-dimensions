"use client";
import { addDoc, collection, doc, onSnapshot, orderBy, query, updateDoc, where } from "firebase/firestore";
import type { Unsubscribe } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { ServiceRequest } from "@/lib/bold-dimensions-config";
export { SERVICE_AREAS, requestStatusSteps } from "@/lib/bold-dimensions-config";
export type { ServiceAreaId, ServiceRequest, ServiceRequestStatus } from "@/lib/bold-dimensions-config";

const requests=collection(db,"serviceRequests");
export async function createServiceRequest(input:Omit<ServiceRequest,"id"|"status"|"createdAt"|"updatedAt"|"scheduledFor"|"quoteAmount"|"quoteNote"|"internalNote">){const now=new Date().toISOString();const ref=await addDoc(requests,{...input,status:"New",createdAt:now,updatedAt:now});return ref.id}
export function subscribeToCustomerServiceRequests(uid:string,onChange:(items:ServiceRequest[])=>void,onError:(error:Error)=>void):Unsubscribe{return onSnapshot(query(requests,where("customerId","==",uid)),snapshot=>onChange(snapshot.docs.map(item=>({id:item.id,...item.data()} as ServiceRequest)).sort((a,b)=>b.createdAt.localeCompare(a.createdAt))),error=>onError(error instanceof Error?error:new Error("Your service requests could not be loaded.")))}
export function subscribeToServiceRequests(onChange:(items:ServiceRequest[])=>void,onError:(error:Error)=>void):Unsubscribe{return onSnapshot(query(requests,orderBy("createdAt","desc")),snapshot=>onChange(snapshot.docs.map(item=>({id:item.id,...item.data()} as ServiceRequest))),error=>onError(error instanceof Error?error:new Error("The service request queue could not be loaded.")))}
export function subscribeToServiceRequest(id:string,onChange:(item:ServiceRequest|null)=>void,onError:(error:Error)=>void):Unsubscribe{return onSnapshot(doc(db,"serviceRequests",id),snapshot=>onChange(snapshot.exists()?({id:snapshot.id,...snapshot.data()} as ServiceRequest):null),error=>onError(error instanceof Error?error:new Error("Service request unavailable.")))}
export async function updateServiceRequest(id:string,patch:Partial<Pick<ServiceRequest,"status"|"scheduledFor"|"quoteAmount"|"quoteNote"|"internalNote">>){const clean=Object.fromEntries(Object.entries(patch).filter(([,value])=>value!==undefined));await updateDoc(doc(db,"serviceRequests",id),{...clean,updatedAt:new Date().toISOString()})}
