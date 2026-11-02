"use client";

import { useEffect, useState, type FormEvent } from "react";
import { auth } from "@/lib/firebase/client";
import { sendConversationMessage, subscribeToConversation, updateConversationRead, type Conversation, type ConversationAttachment, type ConversationMessage } from "@/lib/firebase/data";
import { uploadFiles } from "@/lib/uploadthing";

type Props={conversationId:string;role:"customer"|"admin";userId:string;title?:string;purpose?:"deposit-proof"};

export default function ConversationThread({conversationId,role,userId,title="Private appointment conversation",purpose}:Props){
 const [conversation,setConversation]=useState<Conversation|null>(null);
 const [messages,setMessages]=useState<ConversationMessage[]>([]);
 const [draft,setDraft]=useState("");
 const [attachment,setAttachment]=useState<ConversationAttachment|null>(null);
 const [uploading,setUploading]=useState(false);
 const [progress,setProgress]=useState(0);
 const [sending,setSending]=useState(false);
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");

 useEffect(()=>{
  return subscribeToConversation(conversationId,next=>setConversation(next),next=>setMessages(next),()=>setError("This private conversation could not be loaded. Check your connection and try again."));
 },[conversationId]);
 useEffect(()=>{
  if(conversation&&userId)void updateConversationRead(conversationId,role).catch(()=>setError("Messages loaded, but read status could not be updated."));
 },[conversationId,conversation?.lastMessageAt,userId,role]);

 async function attach(file?:File){
  if(!file)return;
  const video=file.type.startsWith("video/");
  if(!video&&!file.type.startsWith("image/")){setError("Choose a photo or video.");return;}
  if(purpose==="deposit-proof"&&video){setError("For payment review, upload a screenshot or photo rather than a video.");return;}
  if(file.size>(video?8:4)*1024*1024){setError(video?"Videos must be 8 MB or smaller.":"Photos must be 4 MB or smaller.");return;}
  const current=auth.currentUser;
  if(!current||current.uid!==userId){setError("Your sign-in session has changed. Refresh the page and try again.");return;}
  setUploading(true);setProgress(0);setError("");setNotice("");
  try{
   const token=await current.getIdToken();
   const uploaded=await uploadFiles(role==="admin"?"adminStyleMedia":"customerStyleMedia",{files:[file],headers:{Authorization:`Bearer ${token}`},onUploadProgress:({progress:percent})=>setProgress(Math.max(0,Math.min(100,Math.round(percent))))});
   const item=uploaded[0];const url=item?.ufsUrl||item?.url;
   if(!url)throw new Error("Upload completed without a media link.");
   setAttachment({url,type:video?"video":"image",name:file.name,size:file.size});
   setNotice("Attachment ready. Send your message to share it privately.");
  }catch(cause){setError(cause instanceof Error?cause.message:"The attachment could not be uploaded. Try again.");}
  finally{setUploading(false);setProgress(0);}
 }
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();setError("");setNotice("");
  if(!draft.trim()&&!attachment){setError("Write a message or attach a photo/video.");return;}
  if(purpose==="deposit-proof"&&(!attachment||attachment.type!=="image")){setError("Attach a screenshot or photo of the payment confirmation before sending.");return;}
  setSending(true);
  try{await sendConversationMessage(conversationId,userId,role,purpose==="deposit-proof"?"DEPOSIT PROOF SUBMITTED — please verify the transfer in the Orange Money account. "+draft:draft,attachment||undefined);setDraft("");setAttachment(null);setNotice("Private message sent.");}
  catch(cause){setError(cause instanceof Error?cause.message:"Your message could not be sent. Try again.");}
  finally{setSending(false);}
 }
 return <section className="jtsPrivateThread" aria-label={title}>
  <header><div><span className="jtsEyebrow">PRIVATE · ONLY CUSTOMER & JTS STAFF</span><h4>{title}</h4></div><span className="jtsPrivateStatus">{conversation?.status==="resolved"?"Resolved":conversation?.status==="waiting"?"Staff replied":"Open"}</span></header>
  <div className="jtsPrivateMessages" aria-live="polite">
   {!messages.length?<p className="jtsPrivateEmpty">No messages yet. Send a private message about this appointment.</p>:messages.map(message=><article key={message.id} className={"jtsPrivateMessage "+(message.senderRole===role?"mine":"theirs")}>
    <span>{message.senderRole==="admin"?"JTS staff":"You"} · {new Date(message.createdAt).toLocaleString("en-GB",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}</span>
    {message.text&&<p>{message.text}</p>}
    {message.attachment&&<div className="jtsPrivateAttachment">{message.attachment.type==="video"?<video src={message.attachment.url} controls playsInline preload="metadata"/>:<a href={message.attachment.url} target="_blank" rel="noreferrer"><img src={message.attachment.url} alt={message.attachment.name}/></a>}<small>{message.attachment.name}</small></div>}
   </article>)}
  </div>
  <form onSubmit={submit} className="jtsPrivateComposer">
   <label className="jtsPrivateUpload">＋ {purpose==="deposit-proof"?"Payment screenshot":"Photo/video"}<input type="file" accept={purpose==="deposit-proof"?"image/*":"image/*,video/mp4,video/webm,video/quicktime"} disabled={uploading||sending} onChange={event=>{void attach(event.target.files?.[0]);event.currentTarget.value="";}}/></label>
   <textarea value={draft} onChange={event=>setDraft(event.target.value)} rows={2} maxLength={2000} placeholder="Write a private message…" aria-label="Private message" disabled={sending}/>
   {attachment&&<div className="jtsPrivatePending"><span>{attachment.name} ready to send</span><button type="button" onClick={()=>setAttachment(null)}>Remove</button></div>}
   {uploading&&<div className="jtsPrivateProgress"><span style={{width:progress+"%"}}/></div>}
   {(error||notice)&&<p className={error?"jtsFormError":"jtsStyleStatus"} role="status">{error||notice}</p>}
   <button type="submit" disabled={sending||uploading||(!draft.trim()&&!attachment)}>{sending?"Sending…":purpose==="deposit-proof"?"Send payment proof for review ↗":"Send privately ↗"}</button>
  </form>
 </section>;
}
