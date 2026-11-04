import {NextResponse} from "next/server";
import {cert,getApp,getApps,initializeApp} from "firebase-admin/app";
import {getAuth} from "firebase-admin/auth";
export const runtime="nodejs";
function getAdminApp(){
  if(getApps().length)return getApp();
  const raw=process.env.FIREBASE_ADMIN_KEY;if(!raw)throw new Error("Firebase Admin is not configured.");
  let serviceAccount:Record<string,unknown>;try{serviceAccount=JSON.parse(raw) as Record<string,unknown>}catch{throw new Error("FIREBASE_ADMIN_KEY is not valid JSON.")}
  return initializeApp({credential:cert(serviceAccount as Parameters<typeof cert>[0])});
}
async function requireUid(request:Request){
 const header=request.headers.get("authorization")||"";const match=header.match(/^Bearer\s+(.+)$/i);if(!match)throw new Error("Missing Firebase authentication token.");
 return (await getAuth(getAdminApp()).verifyIdToken(match[1])).uid;
}
export async function POST(request:Request){
 try{
  const uid=await requireUid(request);const {conversationId,messageId}=await request.json() as {conversationId?:unknown;messageId?:unknown};
  if(typeof conversationId!=="string"||typeof messageId!=="string")throw new Error("Missing conversation message identifiers.");
  const {sendConversationMessageNotification}=await import("@/lib/server/pickup-reminder-runner");
  return NextResponse.json(await sendConversationMessageNotification(conversationId,messageId,uid));
 }catch(error){console.error("Bold Dimensions conversation notification failed:",error);return NextResponse.json({sent:0,error:error instanceof Error?error.message:"Bold Dimensions could not notify the recipient."},{status:400})}
}
