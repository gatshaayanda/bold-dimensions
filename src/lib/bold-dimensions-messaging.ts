"use client";
import { collection, doc, onSnapshot, query, updateDoc, writeBatch } from "firebase/firestore";
import type { Unsubscribe } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

export type ServiceConversationAttachment={url:string;name:string;type:"image"|"video";size:number};
export type ServiceConversation={id:string;customerId:string;customerName:string;serviceRequestId:string;title:string;status:"open"|"waiting"|"resolved";createdAt:string;updatedAt:string;lastMessageAt:string;lastMessagePreview:string;unreadForCustomer:boolean;unreadForAdmin:boolean;customerLastReadAt?:string;adminLastReadAt?:string};
export type ServiceConversationMessage={id:string;senderId:string;senderRole:"customer"|"admin";text:string;attachment?:ServiceConversationAttachment|null;createdAt:string};

export function subscribeToServiceConversation(id:string,onConversation:(conversation:ServiceConversation|null)=>void,onMessages:(messages:ServiceConversationMessage[])=>void,onError:(error:Error)=>void):Unsubscribe{
 const stopConversation=onSnapshot(doc(db,"conversations",id),snapshot=>onConversation(snapshot.exists()?({id:snapshot.id,...snapshot.data()} as ServiceConversation):null),error=>onError(error instanceof Error?error:new Error("Private conversation unavailable.")));
 const stopMessages=onSnapshot(query(collection(db,"conversations",id,"messages")),snapshot=>onMessages(snapshot.docs.map(item=>({id:item.id,...item.data()} as ServiceConversationMessage)).sort((a,b)=>a.createdAt.localeCompare(b.createdAt))),error=>onError(error instanceof Error?error:new Error("Messages unavailable.")));
 return()=>{stopConversation();stopMessages()};
}
export async function updateServiceConversationRead(id:string,role:"customer"|"admin"){
 const field=role==="customer"?"unreadForCustomer":"unreadForAdmin";
 const readField=role==="customer"?"customerLastReadAt":"adminLastReadAt";
 await updateDoc(doc(db,"conversations",id),{[field]:false,[readField]:new Date().toISOString()});
}
export async function sendServiceConversationMessage(id:string,senderId:string,role:"customer"|"admin",text:string,attachment?:ServiceConversationAttachment){
 const clean=text.trim();
 if(!clean&&!attachment)throw new Error("Write a message or attach a photo/video.");
 if(clean.length>2000)throw new Error("Messages must be 2,000 characters or fewer.");
 const now=new Date().toISOString();
 const batch=writeBatch(db);
 const messageRef=doc(collection(db,"conversations",id,"messages"));
 batch.set(messageRef,{senderId,senderRole:role,text:clean,...(attachment?{attachment}:{}),createdAt:now});
 batch.update(doc(db,"conversations",id),{updatedAt:now,lastMessageAt:now,lastMessagePreview:(clean||(attachment?"Shared "+attachment.type:"")).slice(0,160),...(role==="customer"?{unreadForAdmin:true,unreadForCustomer:false,status:"open"}:{unreadForCustomer:true,unreadForAdmin:false,status:"waiting"})});
 await batch.commit();
}
export async function resolveServiceConversation(id:string){await updateDoc(doc(db,"conversations",id),{status:"resolved",updatedAt:new Date().toISOString()})}
