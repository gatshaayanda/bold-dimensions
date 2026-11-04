import {NextResponse} from "next/server";
import {cert,getApps,initializeApp} from "firebase-admin/app";
import {getAuth} from "firebase-admin/auth";
import {timingSafeEqual} from "node:crypto";

export const runtime="nodejs";

function adminAuth(){
 if(getApps().length)return getAuth(getApps()[0]);
 const raw=process.env.FIREBASE_ADMIN_KEY;
 if(!raw)throw new Error("FIREBASE_ADMIN_KEY is not configured.");
 let serviceAccount:Record<string,unknown>;
 try{serviceAccount=JSON.parse(raw) as Record<string,unknown>}catch{throw new Error("FIREBASE_ADMIN_KEY is not valid JSON.")}
 if(typeof serviceAccount.private_key==="string")serviceAccount.private_key=serviceAccount.private_key.replace(/\\n/g,"\n");
 return getAuth(initializeApp({credential:cert(serviceAccount as Parameters<typeof cert>[0])}));
}

export async function POST(request:Request){
 try{
  const expected=process.env.ADMIN_PASSWORD;
  if(!expected)throw new Error("ADMIN_PASSWORD is not configured on the server.");
  const body=await request.json().catch(()=>({})) as {password?:unknown};
  if(typeof body.password!=="string"||body.password.length>512)return NextResponse.json({error:"Enter the admin password."},{status:400});
  const supplied=Buffer.from(body.password);
  const configured=Buffer.from(expected);
  if(supplied.length!==configured.length||!timingSafeEqual(supplied,configured))return NextResponse.json({error:"Incorrect admin password."},{status:401});
  const token=await adminAuth().createCustomToken("bold-dimensions-admin",{admin:true,role:"owner"});
  return NextResponse.json({customToken:token},{headers:{"Cache-Control":"no-store"}});
 }catch(error){
  console.error("[Bold Dimensions] Admin sign-in failed:",error);
  return NextResponse.json({error:error instanceof Error?error.message:"Admin sign-in is unavailable."},{status:503});
 }
}
