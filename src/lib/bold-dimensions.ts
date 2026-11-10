"use client";
import { collection, doc, getDocFromServer, onSnapshot, orderBy, query, updateDoc, waitForPendingWrites, where, writeBatch } from "firebase/firestore";
import type { Unsubscribe } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { ServiceRequest } from "@/lib/bold-dimensions-config";
export { SERVICE_AREAS, requestStatusSteps } from "@/lib/bold-dimensions-config";
export type { ServiceAreaId, ServiceRequest, ServiceRequestStatus } from "@/lib/bold-dimensions-config";

const requests=collection(db,"serviceRequests");
const SERVER_CONFIRMATION_TIMEOUT=20000;
function withServerTimeout<T>(promise:Promise<T>,message:string):Promise<T>{
 return new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>reject(new Error(message)),SERVER_CONFIRMATION_TIMEOUT);
  promise.then(value=>{clearTimeout(timer);resolve(value)},error=>{clearTimeout(timer);reject(error)});
 });
}
export function createServiceRequestId(){return doc(requests).id}
export async function createServiceRequest(input:Omit<ServiceRequest,"id"|"status"|"createdAt"|"updatedAt"|"scheduledFor"|"quoteAmount"|"quoteNote"|"internalNote">,requestId=createServiceRequestId()){
 const requestRef=doc(requests,requestId);
 const conversationRef=doc(db,"conversations",requestId);
 const timeoutMessage="Firebase has not confirmed the request yet. Check the connection and retry; the same request reference will be reused.";
 // Let any earlier attempt for this reference settle before checking or retrying it.
 await withServerTimeout(waitForPendingWrites(db),timeoutMessage);
 const existing=await withServerTimeout(getDocFromServer(requestRef),timeoutMessage);
 if(existing.exists()){
  if(existing.data().customerId!==input.customerId)throw new Error("This request reference is already in use. Refresh the form before submitting again.");
  const existingConversation=await withServerTimeout(getDocFromServer(conversationRef),timeoutMessage);
  if(!existingConversation.exists()||existingConversation.data().customerId!==input.customerId)throw new Error("The request reached Firebase but its private conversation could not be verified. Please contact Bold Dimensions with the request reference.");
  return requestId;
 }
 const now=new Date().toISOString();
 const batch=writeBatch(db);
 batch.set(requestRef,{...input,status:"New",createdAt:now,updatedAt:now});
 batch.set(conversationRef,{customerId:input.customerId,customerName:input.customerName,serviceRequestId:requestId,title:input.serviceType,status:"open",createdAt:now,updatedAt:now,lastMessageAt:now,lastMessagePreview:"",unreadForCustomer:false,unreadForAdmin:false});
 await withServerTimeout(batch.commit(),timeoutMessage);
 await withServerTimeout(waitForPendingWrites(db),timeoutMessage);
 const [savedRequest,savedConversation]=await Promise.all([
  withServerTimeout(getDocFromServer(requestRef),timeoutMessage),
  withServerTimeout(getDocFromServer(conversationRef),timeoutMessage)
 ]);
 if(!savedRequest.exists()||savedRequest.data().customerId!==input.customerId||!savedConversation.exists()||savedConversation.data().customerId!==input.customerId||savedConversation.data().serviceRequestId!==requestId){
  throw new Error("Firebase did not confirm both the service request and its private conversation. Your details remain in the form; retry after checking the connection.");
 }
 return requestId;
}
export function subscribeToCustomerServiceRequests(uid:string,onChange:(items:ServiceRequest[])=>void,onError:(error:Error)=>void):Unsubscribe{return onSnapshot(query(requests,where("customerId","==",uid)),snapshot=>onChange(snapshot.docs.map(item=>({id:item.id,...item.data()} as ServiceRequest)).sort((a,b)=>b.createdAt.localeCompare(a.createdAt))),error=>onError(error instanceof Error?error:new Error("Your service requests could not be loaded.")))}
export function subscribeToServiceRequests(onChange:(items:ServiceRequest[],fromCache:boolean)=>void,onError:(error:Error)=>void):Unsubscribe{return onSnapshot(query(requests,orderBy("createdAt","desc")),{includeMetadataChanges:true},snapshot=>onChange(snapshot.docs.map(item=>({id:item.id,...item.data()} as ServiceRequest)),snapshot.metadata.fromCache),error=>onError(error instanceof Error?error:new Error("The service request queue could not be loaded.")))}
export function subscribeToServiceRequest(id:string,onChange:(item:ServiceRequest|null)=>void,onError:(error:Error)=>void):Unsubscribe{return onSnapshot(doc(db,"serviceRequests",id),snapshot=>onChange(snapshot.exists()?({id:snapshot.id,...snapshot.data()} as ServiceRequest):null),error=>onError(error instanceof Error?error:new Error("Service request unavailable.")))}
export async function updateServiceRequest(id:string,patch:Partial<Pick<ServiceRequest,"status"|"scheduledFor"|"quoteAmount"|"quoteNote"|"internalNote"|"agreedAmount"|"amountPaid"|"paymentStatus"|"paymentMethod"|"paymentReference"|"receiptNumber"|"receiptIssuedAt">>){const clean=Object.fromEntries(Object.entries(patch).filter(([,value])=>value!==undefined));await updateDoc(doc(db,"serviceRequests",id),{...clean,updatedAt:new Date().toISOString()})}
