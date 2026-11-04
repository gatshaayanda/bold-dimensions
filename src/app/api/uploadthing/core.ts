import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

function getAdminApp() {
  if (getApps().length) return getApp();
  const raw = process.env.FIREBASE_ADMIN_KEY;
  if (!raw) throw new Error("Firebase Admin is not configured.");
  let serviceAccount: Record<string, unknown>;
  try { serviceAccount = JSON.parse(raw) as Record<string, unknown>; }
  catch { throw new Error("FIREBASE_ADMIN_KEY is not valid JSON."); }
  if (typeof serviceAccount.private_key === "string") serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
  return initializeApp({ credential: cert(serviceAccount as Parameters<typeof cert>[0]) });
}

async function requireAdmin(request: Request) {
  const match = (request.headers.get("authorization") || "").match(/^Bearer\s+(.+)$/i);
  if (!match) throw new Error("Sign in before uploading public style media.");
  const app = getAdminApp();
  const decoded = await getAuth(app).verifyIdToken(match[1]);
  const role = await getFirestore(app).collection("admins").doc(decoded.uid).get();
  const authorized = role.exists && ["owner", "staff"].includes(String(role.data()?.role || "").toLowerCase());
  if (!authorized) throw new Error("Only authorized Bold Dimensions staff can upload business media.");
  return { uid: decoded.uid };
}

export const ourFileRouter = {
  customerStyleImage: f({
    image: { maxFileSize: "4MB", maxFileCount: 1 },
  }).middleware(async ({ req }) => {
    const match = (req.headers.get("authorization") || "").match(/^Bearer\s+(.+)$/i);
    if (!match) throw new Error("Sign in to upload a customer photo.");
    const decoded = await getAuth(getAdminApp()).verifyIdToken(match[1]);
    if (!decoded.uid) throw new Error("Customer identity could not be verified.");
    return { customerId: decoded.uid };
  }).onUploadComplete(async ({ metadata, file }) => ({
    customerId: metadata.customerId,
    imageUrl: file.ufsUrl || file.url,
    imageKey: file.key,
  })),
  customerStyleMedia: f({
    image: { maxFileSize: "4MB", maxFileCount: 1 },
    video: { maxFileSize: "8MB", maxFileCount: 1 },
  }).middleware(async ({ req }) => {
    const match = (req.headers.get("authorization") || "").match(/^Bearer\s+(.+)$/i);
    if (!match) throw new Error("Sign in to upload a hairstyle reference.");
    const decoded = await getAuth(getAdminApp()).verifyIdToken(match[1]);
    if (!decoded.uid) throw new Error("Customer identity could not be verified.");
    return { customerId: decoded.uid };
  }).onUploadComplete(async ({ metadata, file }) => ({
    customerId: metadata.customerId,
    mediaUrl: file.ufsUrl || file.url,
    mediaType: file.type.startsWith("video/") ? "video" : "image",
    fileName: file.name,
    fileSize: file.size,
  })),
  adminStyleMedia: f({
    image: { maxFileSize: "4MB", maxFileCount: 1 },
    video: { maxFileSize: "8MB", maxFileCount: 1 },
  }).middleware(async ({ req }) => requireAdmin(req))
    .onUploadComplete(async ({ metadata, file }) => ({
      uploadedBy: metadata.uid,
      mediaUrl: file.ufsUrl || file.url,
      mediaType: file.type.startsWith("video/") ? "video" : "image",
    })),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
