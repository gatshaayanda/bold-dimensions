import { NextResponse } from "next/server";
import { createHash, randomBytes } from "node:crypto";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

export const runtime = "nodejs";

function adminApp() {
  if (getApps().length) return getApps()[0];
  const raw = process.env.FIREBASE_ADMIN_KEY;
  if (!raw) throw new Error("FIREBASE_ADMIN_KEY is not configured.");
  const account = JSON.parse(raw) as Record<string, unknown>;
  if (typeof account.private_key === "string") account.private_key = account.private_key.replace(/\\n/g, "\n");
  return initializeApp({ credential: cert(account as Parameters<typeof cert>[0]) });
}
function normalizePhone(value: string) {
  const digits = value.replace(/\\D/g, "");
  return digits.startsWith("267") ? digits : digits.startsWith("0") ? "267" + digits.slice(1) : digits.length === 8 ? "267" + digits : digits;
}
function digest(token: string) { return createHash("sha256").update(token).digest("hex"); }

export async function POST(request: Request) {
  try {
    const bearer = request.headers.get("authorization")?.match(/^Bearer\\s+(.+)$/i)?.[1];
    if (!bearer) return NextResponse.json({ error: "Admin sign-in is required." }, { status: 401 });
    const app = adminApp();
    const decoded = await getAuth(app).verifyIdToken(bearer);
    if (decoded.admin !== true) return NextResponse.json({ error: "Admin access is required." }, { status: 403 });
    const body = await request.json() as { name?: unknown; phone?: unknown };
    if (typeof body.phone !== "string" || typeof body.name !== "string" || body.name.length > 100) return NextResponse.json({ error: "Enter a contact name and WhatsApp number." }, { status: 400 });
    const phone = normalizePhone(body.phone);
    if (!/^\\d{8,15}$/.test(phone)) return NextResponse.json({ error: "Enter a valid Botswana or international WhatsApp number." }, { status: 400 });
    const db = getFirestore(app);
    const requests = await db.collection("serviceRequests").get();
    const requestIds = requests.docs.filter(doc => normalizePhone(String(doc.get("phone") || "")) === phone).map(doc => doc.id).slice(0, 200);
    const token = randomBytes(32).toString("base64url");
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    await db.collection("customerInvites").doc(digest(token)).create({
      name: body.name.trim(), phone, requestIds, createdBy: decoded.uid,
      createdAt: now.toISOString(), expiresAt: expiresAt.toISOString(),
      claimedAt: null, claimedBy: null
    });
    const inviteUrl = new URL("/account?invite=" + encodeURIComponent(token), request.url).toString();
    return NextResponse.json({ inviteUrl, matchedRequests: requestIds.length, expiresAt: expiresAt.toISOString() });
  } catch (error) {
    console.error("[Bold Dimensions] Customer invite creation failed:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "The customer invitation could not be created." }, { status: 400 });
  }
}
