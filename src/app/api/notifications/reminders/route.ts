import {NextResponse} from "next/server";

export const runtime="nodejs";

export async function POST(request:Request){
  const expected=process.env.Bold Dimensions_REMINDER_CRON_SECRET?.trim();
  const supplied=request.headers.get("authorization")?.replace(/^Bearer\s+/i,"").trim();
  if(!expected||supplied!==expected)return NextResponse.json({ok:false,error:"Unauthorized."},{status:401});
  try{
    const {runPickupReminders}=await import("@/lib/server/pickup-reminder-runner");
    const summary=await runPickupReminders();
    return NextResponse.json({ok:true,...summary});
  }catch(error){
    console.error("Bold Dimensions pickup reminder route failed:",error);
    return NextResponse.json({ok:false,error:error instanceof Error?error.message:"Reminder run failed."},{status:500});
  }
}
