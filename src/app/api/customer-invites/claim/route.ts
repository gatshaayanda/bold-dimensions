import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
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
function digest(token: string) { return createHash("sha256").update(token).digest("hex"); }
function normalizePhone(value: string) { const digits=value.replace(/\D/g, ""); return digits.startsWith("267")?digits:digits.startsWith("0")?"267"+digits.slice(1):digits.length===8?"267"+digits:digits; }

export async function POST(request: Request) {
  try {
    const bearer = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
    if (!bearer) return NextResponse.json({ error: "Open the invitation from the customer device and try again." }, { status: 401 });
    const app = adminApp();
    const decoded = await getAuth(app).verifyIdToken(bearer);
    const body = await request.json() as { token?: unknown };
    if (typeof body.token !== "string" || body.token.length < 32 || body.token.length > 200) return NextResponse.json({ error: "This customer invitation link is invalid." }, { status: 400 });
    const db = getFirestore(app);
    const inviteRef = db.collection("customerInvites").doc(digest(body.token));
    const outcome = await db.runTransaction(async transaction => {
      const inviteSnap = await transaction.get(inviteRef);
      if (!inviteSnap.exists) throw new Error("This customer invitation is invalid or has already been used.");
      const invite = inviteSnap.data()!;
      if (invite.claimedAt) throw new Error("This customer invitation has already been used. Sign in with the account previously linked.");
      if (typeof invite.expiresAt !== "string" || Date.parse(invite.expiresAt) <= Date.now()) throw new Error("This customer invitation has expired. Ask Bold Dimensions for a fresh link.");
      const ids = Array.isArray(invite.requestIds) ? invite.requestIds.filter((id: unknown): id is string => typeof id === "string").slice(0, 200) : [];
      const requestRefs = ids.map((id: string) => db.collection("serviceRequests").doc(id));
      const requestSnaps = await Promise.all(requestRefs.map(ref => transaction.get(ref)));
      const conversationRefs = ids.map((id: string) => db.collection("conversations").doc(id));
      const conversationSnaps = await Promise.all(conversationRefs.map(ref => transaction.get(ref)));
      let linked = 0;
      for (let index = 0; index < requestSnaps.length; index++) {
        const snap = requestSnaps[index];
        if (snap.exists && normalizePhone(String(snap.get("phone") || "")) === String(invite.phone)) {
          transaction.update(requestRefs[index], { customerId: decoded.uid, accountLinkedAt: new Date().toISOString() });
          if (conversationSnaps[index].exists) transaction.update(conversationRefs[index], { customerId: decoded.uid });
          linked++;
        }
      }
      transaction.update(inviteRef, { claimedAt: new Date().toISOString(), claimedBy: decoded.uid, matchedRequestCount: linked });
      return { linked };
    });
    return NextResponse.json({ success: true, linkedRequests: outcome.linked });
  } catch (error) {
    console.error("[Bold Dimensions] Customer invitation claim failed:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Your customer account could not be connected." }, { status: 400 });
  }
}
