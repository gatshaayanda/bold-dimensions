"use client";
import { useEffect, useState, type FormEvent } from "react";
import { auth } from "@/lib/firebase/client";
import { uploadFiles } from "@/lib/uploadthing";
import { resolveServiceConversation, sendServiceConversationMessage, subscribeToServiceConversation, updateServiceConversationRead, type ServiceConversation, type ServiceConversationAttachment, type ServiceConversationMessage } from "@/lib/bold-dimensions-messaging";

type Props={conversationId:string;role:"customer"|"admin";userId:string;title?:string};
export default function ConversationThread({conversationId,role,userId,title="Private service conversation"}:Props){
 const [conversation,setConversation]=useState<ServiceConversation|null>(null);
 const [messages,setMessages]=useState<ServiceConversationMessage[]>([]);
 const [draft,setDraft]=useState("");
 const [attachment,setAttachment]=useState<ServiceConversationAttachment|null>(null);
 const [uploading,setUploading]=useState(false);
 const [progress,setProgress]=useState(0);
 const [sending,setSending]=useState(false);
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 useEffect(()=>subscribeToServiceConversation(conversationId,setConversation,setMessages,()=>setError("This private conversation could not be loaded. Check your connection and try again.")),[conversationId]);
 useEffect(()=>{if(conversation&&userId)void updateServiceConversationRead(conversationId,role).catch(()=>setError("Messages loaded, but read status could not be updated."))},[conversationId,conversation?.lastMessageAt,userId,role]);
 async function attach(file?:File){
  if(!file)return;
  const video=file.type.startsWith("video/");
  if(!video&&!file.type.startsWith("image/")){setError("Choose a photo or video.");return}
  if(file.size>(video?8:4)*1024*1024){setError(video?"Videos must be 8 MB or smaller.":"Photos must be 4 MB or smaller.");return}
  const current=auth.currentUser;
  if(!current||current.uid!==userId){setError("Your sign-in session has changed. Refresh the page and try again.");return}
  setUploading(true);setProgress(0);setError("");setNotice("");
  try{
   const token=await current.getIdToken();
   const uploaded=await uploadFiles(role==="admin"?"adminBusinessMedia":"customerServiceMedia",{files:[file],headers:{Authorization:"Bearer "+token},onUploadProgress:({progress:percent})=>setProgress(Math.max(0,Math.min(100,Math.round(percent))))});
   const item=uploaded[0],url=item?.ufsUrl||item?.url;
   if(!url)throw new Error("Upload completed without a media link.");
   setAttachment({url,type:video?"video":"image",name:file.name,size:file.size});
   setNotice("Attachment ready. Send your message to share it with the team.");
  }catch(cause){setError(cause instanceof Error?cause.message:"The attachment could not be uploaded. Try again.")}
  finally{setUploading(false);setProgress(0)}
 }
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();setError("");setNotice("");
  if(!draft.trim()&&!attachment){setError("Write a message or attach a photo/video.");return}
  setSending(true);
  try{await sendServiceConversationMessage(conversationId,userId,role,draft,attachment||undefined);setDraft("");setAttachment(null);setNotice("Private message sent.")}
  catch(cause){setError(cause instanceof Error?cause.message:"Your message could not be sent. Try again.")}
  finally{setSending(false)}
 }
 async function resolve(){try{await resolveServiceConversation(conversationId);setNotice("Conversation marked resolved.")}catch{setError("Conversation status could not be updated.")}}
 const statusLabel=conversation?.status==="resolved"?"Resolved":conversation?.status==="waiting"?(role==="admin"?"Awaiting customer":"Bold Dimensions replied"):messages.length?(role==="admin"?"Customer replied":"Awaiting Bold Dimensions"):"New conversation";
 return <details className="bdConversation" open>
  <summary className="bdConversationSummary"><span><small>PRIVATE · CUSTOMER & BOLD DIMENSIONS TEAM</small><strong>{title}</strong></span><b className={conversation?.status==="resolved"?"resolved":""}>{statusLabel}</b><i>＋</i></summary>
  <div className="bdConversationBody">
   <div className="bdConversationMessages" aria-live="polite">
    {!messages.length?<p className="bdConversationEmpty">No messages yet. Ask a question or share more details about this service request.</p>:messages.map(message=><article key={message.id} className={"bdConversationMessage "+(message.senderRole===role?"mine":"theirs")}><span>{message.senderRole==="admin"?"Bold Dimensions team":"You"} · {new Date(message.createdAt).toLocaleString("en-GB",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}</span>{message.text&&<p>{message.text}</p>}{message.attachment&&<div className="bdConversationAttachment">{message.attachment.type==="video"?<video src={message.attachment.url} controls playsInline preload="metadata"/>:<a href={message.attachment.url} target="_blank" rel="noreferrer"><img src={message.attachment.url} alt={message.attachment.name}/></a>}<small>{message.attachment.name}</small></div>}</article>)}
   </div>
   <form onSubmit={submit} className="bdConversationComposer">
    <label className="bdConversationUpload">＋ Add photo / video<input type="file" accept="image/*,video/mp4,video/webm,video/quicktime" disabled={uploading||sending} onChange={event=>{void attach(event.target.files?.[0]);event.currentTarget.value=""}}/></label>
    <textarea value={draft} onChange={event=>setDraft(event.target.value)} rows={2} maxLength={2000} placeholder="Write a private message…" aria-label="Private message" disabled={sending}/>
    {attachment&&<div className="bdConversationPending"><span>{attachment.name} ready to send</span><button type="button" onClick={()=>setAttachment(null)}>Remove</button></div>}
    {uploading&&<div className="bdConversationProgress"><span style={{width:progress+"%"}}/></div>}
    {(error||notice)&&<p className={error?"bdFormError":"bdInlineSuccess"} role="status">{error||notice}</p>}
    <div className="bdConversationActions"><small>Only the customer and authorized team can read this conversation.</small><button type="submit" className="bdPrimary" disabled={sending||uploading||(!draft.trim()&&!attachment)}>{sending?"Sending…":"Send privately ↗"}</button></div>
   </form>
   {role==="admin"&&conversation?.status!=="resolved"&&<button type="button" className="bdConversationResolve" onClick={()=>void resolve()}>Mark conversation resolved</button>}
  </div>
 </details>;
}
