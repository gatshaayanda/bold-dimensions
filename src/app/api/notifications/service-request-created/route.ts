import {NextResponse} from "next/server";
import {cert,getApps,initializeApp} from "firebase-admin/app";
import {getAuth} from "firebase-admin/auth";
export const runtime="nodejs";
function getAdminApp(){
 if(getApps().length)return getApps()[0];
 const raw=process.env.FIREBASE_ADMIN_KEY;if(!raw)throw new Error("FIREBASE_ADMIN_KEY is not configured.");
 let serviceAccount:Record<string,unknown>;try{serviceAccount=JSON.parse(raw) as Record<string,unknown>}catch{throw new Error("FIREBASE_ADMIN_KEY is not valid JSON.")}
 if(typeof serviceAccount.private_key==="string")serviceAccount.private_key=serviceAccount.private_key.replace(/\\n/g,"\n");
 return initializeApp({credential:cert(serviceAccount as Parameters<typeof cert>[0])});
}
export async function POST(request:Request){
 try{
  const match=(request.headers.get("authorization")||"").match(/^Bearer\s+(.+)$/i);
  if(!match)throw new Error("Missing Firebase authentication token.");
  const uid=(await getAuth(getAdminApp()).verifyIdToken(match[1])).uid;
  const body=await request.json() as {serviceRequestId?:unknown};
  if(typeof body.serviceRequestId!=="string"||!body.serviceRequestId)throw new Error("Missing service request reference.");
  const {sendNewServiceRequestNotifications}=await import("@/lib/server/pickup-reminder-runner");
  return NextResponse.json(await sendNewServiceRequestNotifications(body.serviceRequestId,uid));
 }catch(error){
  console.error("[Bold Dimensions] Service request notification failed:",error);
  return NextResponse.json({sent:0,error:error instanceof Error?error.message:"Could not notify the operations team."},{status:400});
 }
}
