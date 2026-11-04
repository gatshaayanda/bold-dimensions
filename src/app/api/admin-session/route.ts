import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function getAdminApp() {
  if (getApps().length) return getApps()[0];
  const raw = process.env.FIREBASE_ADMIN_KEY;
  if (!raw) throw new Error("FIREBASE_ADMIN_KEY is not configured.");
  let serviceAccount: Record<string, unknown>;
  try { serviceAccount = JSON.parse(raw) as Record<string, unknown>; }
  catch { throw new Error("FIREBASE_ADMIN_KEY is not valid JSON."); }
  if (typeof serviceAccount.private_key === "string") serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
  return initializeApp({ credential: cert(serviceAccount as Parameters<typeof cert>[0]) });
}

export async function POST(request: Request) {
  const match = (request.headers.get("authorization") || "").match(/^Bearer\\s+(.+)$/i);
  if (!match) return NextResponse.json({ error: "Sign in before checking admin access." }, { status: 401, headers: { "Cache-Control": "no-store" } });
  try {
    const app = getAdminApp();
    const decoded = await getAuth(app).verifyIdToken(match[1]);
    const admin = await getFirestore(app).collection("admins").doc(decoded.uid).get();
    const role = String(admin.data()?.role || "").toLowerCase();
    if (!admin.exists || !["owner", "staff"].includes(role)) {
      return NextResponse.json({ error: "This account has not been granted Bold Dimensions admin access." }, { status: 403, headers: { "Cache-Control": "no-store" } });
    }
    return NextResponse.json({ ok: true, role }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const configError = /FIREBASE_ADMIN_KEY|service account|private key|credential/i.test(message);
    console.error("[Bold Dimensions] Admin session check failed.", { configError });
    return NextResponse.json({ error: configError ? "Admin access is not configured on the server." : "Bold Dimensions could not verify this admin session." }, { status: configError ? 503 : 500, headers: { "Cache-Control": "no-store" } });
  }
}
