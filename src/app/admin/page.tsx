"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { track } from "@vercel/analytics";
import { collection, onSnapshot, updateDoc, doc, setDoc, deleteDoc, type Unsubscribe } from "firebase/firestore";
import AdminGate from "@/app/admin/admin-gate";
import JtsStyleGuide from "@/components/JtsStyleGuide";
import { auth, db } from "@/lib/firebase/client";
import { uploadFiles } from "@/lib/uploadthing";
import { DEFAULT_PUBLIC_SERVICES, mergePublicServices, PUBLIC_SERVICE_CATEGORIES, type PublicService, type PublicServiceMedia } from "@/lib/jts/public-services";

type Appointment = {
  id: string;
  customerName?: string;
  phone?: string;
  scheduledFor?: string;
  createdAt?: string;
  status?: string;
  items?: Array<{ name?: string; price?: number; quantity?: number }>;
  total?: number;
  instructions?: string;
  deliveryLocation?: string;
};
type CustomerReview = {
  id: string;
  customerName?: string;
  title?: string;
  caption?: string;
  imageUrl?: string;
  service?: string;
  rating?: number;
  comparison?: string;
  createdAt?: string;
  published?: boolean;
  status?: string;
};

type OwnerStylePost = {
  id: string; title: string; caption: string; imageUrl: string; mediaUrl?: string; mediaType?: "image" | "video"; service: string;
  tags: string[]; published: boolean; createdAt?: string; createdBy?: string; updatedAt?: string;
};
type DeleteTarget = { kind: "service" | "stylePost" | "customerReview"; id: string; name: string };

const dateText = (value?: string) => {
  if (!value) return "Date not provided";
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Gaborone" }) : value;
};
const money = (value?: number) => "P" + (Number(value) || 0).toFixed(0);
const minBookableDate = () => { const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Gaborone", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date()); const part = (type: string) => parts.find(item => item.type === type)?.value ?? ""; return new Date(Date.UTC(Number(part("year")), Number(part("month")) - 1, Number(part("day")) + 1)).toISOString().slice(0, 10); };

function Dashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [adminName, setAdminName] = useState("");
  const [reviews, setReviews] = useState<CustomerReview[]>([]);
  const [services, setServices] = useState<PublicService[]>(DEFAULT_PUBLIC_SERVICES);
  const [categoryMedia, setCategoryMedia] = useState<Record<string, PublicServiceMedia>>({});
  const [stylePosts, setStylePosts] = useState<OwnerStylePost[]>([]);
  const [tab, setTab] = useState<"appointments" | "availability" | "reviews" | "services" | "styleFeed">("appointments");
  const [unavailableDates, setUnavailableDates] = useState<Array<{id:string;date:string;reason:string;updatedAt?:string}>>([]);
  const [closureDate, setClosureDate] = useState("");
  const [closureReason, setClosureReason] = useState("");
  const [availabilityNotice, setAvailabilityNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [serviceDraft, setServiceDraft] = useState<PublicService | null>(null);
  const [styleDraft, setStyleDraft] = useState<OwnerStylePost | null>(null);
  const [mediaUploading, setMediaUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [uploadPercent, setUploadPercent] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const mediaUploadingRef = useRef(false);
  const serviceEditorOpen = Boolean(serviceDraft);
  const deleteDialogOpen = Boolean(deleteTarget);

  useEffect(() => { mediaUploadingRef.current = mediaUploading; }, [mediaUploading]);

  // Success and informational notices fade after reading time; errors stay until dismissed.
  useEffect(() => {
    if (!notice || mediaUploading || /could not|not saved|failed|denied|expired|choose |exceeds|must be an image|enter a valid|temporarily unavailable|try again|no media was uploaded|upload failed|not be saved|could not be loaded|could not be removed|could not be deleted|could not be reopened|was not saved|was not published/i.test(notice)) return;
    const timeout = window.setTimeout(() => setNotice(current => current === notice ? "" : current), 6500);
    return () => window.clearTimeout(timeout);
  }, [notice, mediaUploading]);

  useEffect(() => onAuthStateChanged(auth, user => setAdminName(user?.displayName?.trim().split(" ")[0] || "")), []);

  useEffect(() => {
    if (!serviceEditorOpen && !deleteDialogOpen) return;
    const focusTarget = window.setTimeout(() => {
      const selector = deleteDialogOpen ? ".adminDeleteDialog button" : ".adminEditorModal input:not([type=file])";
      document.querySelector<HTMLElement>(selector)?.focus();
    }, 0);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || mediaUploadingRef.current) return;
      if (deleteDialogOpen) setDeleteTarget(null);
      else setServiceDraft(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(focusTarget);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [serviceEditorOpen, deleteDialogOpen]);

  useEffect(() => {
    let ready = 0;
    const done = () => { ready += 1; if (ready >= 2) setLoading(false); };
    const stopAppointments: Unsubscribe = onSnapshot(collection(db, "orders"), snapshot => {
      setAppointments(snapshot.docs.map(item => ({ id: item.id, ...item.data() } as Appointment))
        .sort((a, b) => (a.scheduledFor || "").localeCompare(b.scheduledFor || "")));
      done();
    }, () => { setNotice("Appointment requests could not be loaded. Check Firebase access and connection."); done(); });
    const stopReviews: Unsubscribe = onSnapshot(collection(db, "customerStyleReviews"), snapshot => {
      setReviews(snapshot.docs.map(item => ({ id: item.id, ...item.data() } as CustomerReview))
        .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "")));
      done();
    }, () => { setNotice("Customer reviews could not be loaded. Check Firebase access and connection."); done(); });
    return () => { stopAppointments(); stopReviews(); };
  }, []);

  useEffect(() => {
    const stop = onSnapshot(doc(db, "businessSettings", "appointmentAvailability"), snapshot => {
      const entries = snapshot.exists() && Array.isArray(snapshot.data().unavailableDates) ? snapshot.data().unavailableDates : [];
      setUnavailableDates(entries.filter((item: unknown) => !!item && typeof item === "object" && "date" in item && typeof item.date === "string").map((item: {date:string;reason?:string;updatedAt?:string}) => ({ id: item.date, date: item.date, reason: typeof item.reason === "string" ? item.reason : "Unavailable", updatedAt: item.updatedAt || "" })).sort((a: {id:string;date:string;reason:string;updatedAt?:string}, b: {id:string;date:string;reason:string;updatedAt?:string}) => a.date.localeCompare(b.date)));
      setAvailabilityNotice("");
    }, () => setAvailabilityNotice("Availability settings could not be loaded. Check Firebase access and connection."));
    return () => stop();
  }, []);

  async function markDateUnavailable(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!closureDate) { setAvailabilityNotice("Choose a date first."); return; }
    setAvailabilityNotice("");
    try {
      const next = [...unavailableDates.filter(item => item.date !== closureDate), { id: closureDate, date: closureDate, reason: closureReason.trim() || "Unavailable", updatedAt: new Date().toISOString() }].sort((a,b) => a.date.localeCompare(b.date));
      await setDoc(doc(db, "businessSettings", "appointmentAvailability"), { unavailableDates: next.map(({date,reason,updatedAt}) => ({date,reason,updatedAt})), updatedAt: new Date().toISOString() }, { merge: true });
      setAvailabilityNotice(closureDate + " is now marked unavailable to new appointment requests.");
      setClosureDate(""); setClosureReason("");
    } catch {
      setAvailabilityNotice("That date was not saved. Check your admin permissions and try again.");
    }
  }

  async function reopenDate(item: {id:string;date:string}) {
    setAvailabilityNotice("");
    try {
      const next = unavailableDates.filter(entry => entry.date !== item.date).map(({date,reason,updatedAt}) => ({date,reason,updatedAt}));
      await setDoc(doc(db, "businessSettings", "appointmentAvailability"), { unavailableDates: next, updatedAt: new Date().toISOString() }, { merge: true });
      setAvailabilityNotice(item.date + " is available for new requests again.");
    } catch {
      setAvailabilityNotice("That date could not be reopened. Check your admin permissions and try again.");
    }
  }

  useEffect(() => {
    const stopServices = onSnapshot(doc(db, "businessSettings", "publicServices"), snapshot => {
      const data = snapshot.data();
      setServices(mergePublicServices(data?.services));
      const savedCategoryMedia = data?.categoryMedia;
      setCategoryMedia(savedCategoryMedia && typeof savedCategoryMedia === "object" ? savedCategoryMedia as Record<string, PublicServiceMedia> : {});
    }, () => setNotice("Public services could not be loaded. Check Firebase access and connection."));
    const stopStylePosts = onSnapshot(collection(db, "styleFeed"), snapshot => {
      setStylePosts(snapshot.docs.map(item => ({ id: item.id, ...item.data() } as OwnerStylePost))
        .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "")));
    }, () => setNotice("John's style feed could not be loaded. Check Firebase access and connection."));
    return () => { stopServices(); stopStylePosts(); };
  }, []);


  async function uploadCategoryMedia(category: string, file: File) {
    const isVideo = file.type.startsWith("video/") || /\.(mp4|webm|mov|m4v)$/i.test(file.name);
    const isImage = file.type.startsWith("image/") || /\.(jpe?g|png|webp|gif|avif|heic)$/i.test(file.name);
    const maxBytes = isVideo ? 8 * 1024 * 1024 : 4 * 1024 * 1024;
    if ((!isImage && !isVideo) || file.size > maxBytes) {
      setNotice(isVideo ? "Choose a supported video no larger than 8 MB." : "Choose an image no larger than 4 MB.");
      return;
    }
    const currentUser = auth.currentUser;
    if (!currentUser) { setNotice("Your admin session expired. Sign in again before uploading."); return; }
    setMediaUploading(true); setNotice(""); setUploadProgress("Uploading " + category + " cover: " + file.name); setUploadPercent(0);
    try {
      const token = await currentUser.getIdToken();
      const uploaded = await uploadFiles("adminStyleMedia", {
        files: [file],
        headers: { Authorization: `Bearer ${token}` },
        onUploadProgress: ({ progress }) => setUploadPercent(Math.max(0, Math.min(100, Math.round(progress)))),
      });
      const url = uploaded[0]?.ufsUrl || uploaded[0]?.url;
      if (!url) throw new Error("Upload completed without a public media URL.");
      const next = { ...categoryMedia, [category]: { url, type: isVideo ? "video" as const : "image" as const, alt: category + " by John at JTS Styles" } };
      await setDoc(doc(db, "businessSettings", "publicServices"), { categoryMedia: next, updatedAt: new Date().toISOString() }, { merge: true });
      setCategoryMedia(next);
      setNotice(category + " category cover saved and is now used on the public service page.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Category media upload failed. Try again.");
    } finally { setMediaUploading(false); setUploadProgress(""); setUploadPercent(0); }
  }

  async function uploadServiceMedia(files: File[]) {
    if (!serviceDraft || files.length === 0) return;
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setNotice("Your admin session expired. Sign in again before uploading.");
      return;
    }

    const accepted: File[] = [];
    const rejected: string[] = [];
    for (const file of files) {
      const isVideo = file.type.startsWith("video/") || /\.(mp4|webm|mov|m4v)$/i.test(file.name);
      const isImage = file.type.startsWith("image/") || /\.(jpe?g|png|webp|gif|avif|heic)$/i.test(file.name);
      const maxBytes = isVideo ? 8 * 1024 * 1024 : 4 * 1024 * 1024;
      if ((!isVideo && !isImage) || file.size > maxBytes) {
        rejected.push(file.name + (isVideo ? " exceeds the 8 MB video limit or is not a supported video." : " must be an image no larger than 4 MB."));
      } else {
        accepted.push(file);
      }
    }
    if (accepted.length === 0) {
      setNotice(rejected.join(" ") || "Choose an image or video to upload.");
      return;
    }

    setMediaUploading(true);
    setNotice("");
    let uploadedCount = 0;
    const failures: string[] = [];
    try {
      for (let index = 0; index < accepted.length; index += 1) {
        const file = accepted[index];
        const isVideo = file.type.startsWith("video/") || /\.(mp4|webm|mov|m4v)$/i.test(file.name);
        const extension = file.name.toLowerCase().split(".").pop() || "";
        const inferredType = isVideo
          ? extension === "webm" ? "video/webm" : extension === "mov" || extension === "m4v" ? "video/quicktime" : "video/mp4"
          : extension === "png" ? "image/png" : extension === "webp" ? "image/webp" : extension === "gif" ? "image/gif" : extension === "avif" ? "image/avif" : extension === "heic" ? "image/heic" : "image/jpeg";
        const uploadFile = file.type.startsWith(isVideo ? "video/" : "image/")
          ? file
          : new File([file], file.name, { type: inferredType });
        setUploadProgress("Uploading " + (index + 1) + " of " + accepted.length + ": " + file.name);
        setUploadPercent(0);
        try {
          const token = await currentUser.getIdToken();
          const result = await uploadFiles("adminStyleMedia", {
            files: [uploadFile],
            headers: { Authorization: `Bearer ${token}` },
            onUploadProgress: ({ progress }) => {
              setUploadPercent(Math.max(0, Math.min(100, Math.round(progress))));
            },
          });
          const url = result[0]?.ufsUrl || result[0]?.url;
          if (!url) throw new Error("UploadThing returned no public media URL.");
          const media: PublicServiceMedia = {
            url,
            type: isVideo ? "video" : "image",
            alt: serviceDraft.name.trim() || "JTS service look",
          };
          setServiceDraft(current => current
            ? { ...current, media: [...(current.media || []), media] }
            : current);
          uploadedCount += 1;
        } catch (error) {
          failures.push(file.name + ": " + (error instanceof Error ? error.message : "upload failed"));
        }
      }

      const issues = [...rejected, ...failures];
      if (uploadedCount && !issues.length) {
        setNotice(uploadedCount + " media item" + (uploadedCount === 1 ? "" : "s") + " uploaded. Preview below, then save the service to publish the changes.");
      } else if (uploadedCount) {
        setNotice(uploadedCount + " media item" + (uploadedCount === 1 ? "" : "s") + " uploaded. " + issues.join(" "));
      } else {
        setNotice(issues.join(" ") || "No media was uploaded. Try again.");
      }
    } finally {
      setMediaUploading(false);
      setUploadProgress("");
      setUploadPercent(0);
    }
  }

  function removeServiceMedia(index: number) {
    setServiceDraft(current => current ? { ...current, media: (current.media || []).filter((_, itemIndex) => itemIndex !== index) } : current);
  }

  async function saveService(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!serviceDraft || !serviceDraft.name.trim()) return;
    const price = Number(serviceDraft.price);
    const maxPrice = serviceDraft.maxPrice == null || Number(serviceDraft.maxPrice) <= price ? undefined : Number(serviceDraft.maxPrice);
    if (!Number.isFinite(price) || price < 0 || (maxPrice !== undefined && (!Number.isFinite(maxPrice) || maxPrice < price))) {
      setNotice("Enter a valid service price or price range."); return;
    }
    const name = serviceDraft.name.trim();
    const id = serviceDraft.id || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const display = maxPrice ? "P" + price + "–P" + maxPrice : "P" + price;
    const nextService: PublicService = { id, name, price, display, note: serviceDraft.note.trim(), detail: serviceDraft.detail.trim(), tag: serviceDraft.tag.trim() || "THE SERVICE", media: serviceDraft.media || [], ...(maxPrice !== undefined ? { maxPrice } : {}) };
    const next = services.some(item => item.id === id) ? services.map(item => item.id === id ? nextService : item) : [...services, nextService];
    try {
      await setDoc(doc(db, "businessSettings", "publicServices"), { services: next, updatedAt: new Date().toISOString() }, { merge: true });
      setServices(next); setServiceDraft(null);
      setNotice("Service saved. The public services page and booking choices will update.");
    } catch { setNotice("Service could not be saved. Check admin access and Firebase rules."); }
  }

  async function removeService(item: PublicService) {
    const next = services.filter(service => service.id !== item.id);
    try {
      await setDoc(doc(db, "businessSettings", "publicServices"), { services: next, updatedAt: new Date().toISOString() }, { merge: true });
      setServices(next); setNotice("Service removed from the public catalogue and booking choices.");
    } catch { setNotice("Service could not be removed. Check admin access and Firebase rules."); }
  }

  async function uploadStyleMedia(file: File) {
    if (!styleDraft) return;
    const isVideo = file.type.startsWith("video/");
    const maxBytes = isVideo ? 8 * 1024 * 1024 : 4 * 1024 * 1024;
    if ((!isVideo && !file.type.startsWith("image/")) || file.size > maxBytes) {
      setNotice(isVideo ? "Choose an MP4/WebM video no larger than 8 MB." : "Choose an image no larger than 4 MB.");
      return;
    }
    const currentUser = auth.currentUser;
    if (!currentUser) { setNotice("Your admin session expired. Sign in again before uploading."); return; }
    setMediaUploading(true); setNotice("");
    setUploadProgress("Uploading style media: " + file.name);
    setUploadPercent(0);
    try {
      const token = await currentUser.getIdToken();
      const uploaded = await uploadFiles("adminStyleMedia", {
        files: [file],
        headers: { Authorization: `Bearer ${token}` },
        onUploadProgress: ({ progress }) => {
          setUploadPercent(Math.max(0, Math.min(100, Math.round(progress))));
        },
      });
      const url = uploaded[0]?.ufsUrl || uploaded[0]?.url;
      if (!url) throw new Error("Upload completed without a public media URL.");
      setStyleDraft(current => current ? { ...current, mediaUrl: url, imageUrl: url, mediaType: isVideo ? "video" : "image" } : current);
      setNotice("Media uploaded. Save the style post to publish the change.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Media upload failed. Check UploadThing configuration and try again.");
    } finally { setMediaUploading(false); setUploadProgress(""); setUploadPercent(0); }
  }

  async function saveStylePost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!styleDraft || !styleDraft.title.trim() || !(styleDraft.mediaUrl || styleDraft.imageUrl).trim()) {
      setNotice("Add a title and upload or paste a public image/video URL before saving."); return;
    }
    const now = new Date().toISOString();
    const mediaUrl = (styleDraft.mediaUrl || styleDraft.imageUrl).trim();
    const mediaType = styleDraft.mediaType || "image";
    const payload = { title: styleDraft.title.trim(), caption: styleDraft.caption.trim(), imageUrl: mediaUrl, mediaUrl, mediaType, service: styleDraft.service.trim() || "JTS STYLE", tags: styleDraft.tags, published: styleDraft.published, updatedAt: now };
    try {
      if (styleDraft.id) await updateDoc(doc(db, "styleFeed", styleDraft.id), payload);
      else {
        const uid = auth.currentUser?.uid;
        if (!uid) throw new Error("Admin session expired. Sign in again.");
        const ref = doc(collection(db, "styleFeed"));
        const newPost = { title: payload.title, caption: payload.caption, imageUrl: payload.imageUrl, mediaUrl: payload.mediaUrl, mediaType: payload.mediaType, service: payload.service, tags: payload.tags, published: payload.published };
        await setDoc(ref, { ...newPost, createdAt: now, createdBy: uid });
      }
      setStyleDraft(null);
      setNotice(styleDraft.published ? "John's style post saved and published to the public feed." : "Style post saved as a draft.");
    } catch { setNotice("Style post could not be saved. Check the image URL and Firebase rules."); }
  }

  async function removeStylePost(item: OwnerStylePost) {
    try { await deleteDoc(doc(db, "styleFeed", item.id)); setStylePosts(current => current.filter(post => post.id !== item.id)); setNotice("Style post deleted from the public feed."); }
    catch { setNotice("Style post could not be deleted. Check admin access and Firebase rules."); }
  }

  async function removeCustomerReview(item: CustomerReview) {
    try { await deleteDoc(doc(db, "customerStyleReviews", item.id)); setReviews(current => current.filter(review => review.id !== item.id)); setNotice("Customer review removed."); }
    catch { setNotice("Customer review could not be removed. Check admin access and Firebase rules."); }
  }

  const openAppointments = useMemo(() => appointments.filter(item => !["Cancelled", "Completed"].includes(item.status || "")), [appointments]);

  async function confirmDeleteTarget() {
    const target = deleteTarget;
    if (!target) return;
    setDeleteTarget(null);
    if (target.kind === "service") {
      const item = services.find(service => service.id === target.id);
      if (item) await removeService(item);
    } else if (target.kind === "stylePost") {
      const item = stylePosts.find(post => post.id === target.id);
      if (item) await removeStylePost(item);
    } else {
      const item = reviews.find(review => review.id === target.id);
      if (item) await removeCustomerReview(item);
    }
  }

  async function setAppointmentStatus(item: Appointment, status: string) {
    setNotice("");
    try {
      await updateDoc(doc(db, "orders", item.id), { status });
      track("jts_admin_appointment_status_updated", { status });
      setNotice("Appointment #" + item.id.slice(0, 8).toUpperCase() + " updated to " + status + ".");
    } catch {
      setNotice("That appointment update was not saved. Check Firebase rules and try again.");
    }
  }

  async function setReviewPublished(item: CustomerReview, published: boolean) {
    setNotice("");
    try {
      await updateDoc(doc(db, "customerStyleReviews", item.id), {
        published,
        status: published ? "published" : "hidden",
        moderatedAt: new Date().toISOString()
      });
      setNotice(published ? "Customer look is visible in the public feed." : "Customer look is hidden from the public feed.");
    } catch {
      setNotice("Review moderation was not saved. Check Firebase rules and try again.");
    }
  }

  return <main className="adminPage"><div className="adminShell">
    <header className="adminHeader">
      <div><span className="kicker">JOHN THE STYLIST BW · OPERATIONS</span><h1>Run the appointments.</h1><p>Today’s appointments, one clear action at a time.</p></div>
      <Link href="/" className="button buttonLight">View customer app</Link>
    </header>
    <section className="jtsAdminWelcome" aria-labelledby="jts-admin-welcome-title">
      <div><span className="jtsEyebrow">A CLEAR VIEW OF THE DAY</span><h2 id="jts-admin-welcome-title">{(() => { const hour = Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Gaborone", hour: "2-digit", hourCycle: "h23" }).format(new Date())); return (hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening") + ", " + (adminName || "Boss") + "."; })()}</h2><p>{appointments.filter(item => !item.status || item.status === "New").length ? "You have " + appointments.filter(item => !item.status || item.status === "New").length + " new appointment request" + (appointments.filter(item => !item.status || item.status === "New").length === 1 ? "" : "s") + " to review." : "No new appointment requests need your attention right now. You can check availability or refresh the style catalogue."}</p></div>
      <div className="jtsAdminWelcomeActions"><button type="button" className="button buttonPrimary" onClick={() => { setTab("appointments"); track("jts_admin_priority_action", { action: "review_appointments" }); }}>Review requests ↗</button><button type="button" className="button buttonLight" onClick={() => { setTab("services"); track("jts_admin_priority_action", { action: "manage_services" }); }}>Services &amp; prices</button></div>
    </section>
    {notice && <div className={"notice adminNotice adminNotice-" + (/could not|not saved|failed|denied|expired|choose |exceeds|must be an image|enter a valid|temporarily unavailable|try again|no media was uploaded|upload failed|not be saved/i.test(notice) ? "error" : /saved|uploaded|updated|removed|published|available for|marked unavailable|reopened/i.test(notice) ? "success" : "info")} role={/could not|not saved|failed|denied|expired|choose |exceeds|must be an image|enter a valid|temporarily unavailable|try again|no media was uploaded|upload failed|not be saved/i.test(notice) ? "alert" : "status"} aria-live="polite"><span className="adminNoticeIcon" aria-hidden="true">{/could not|not saved|failed|denied|expired|choose |exceeds|must be an image|enter a valid|temporarily unavailable|try again|no media was uploaded|upload failed|not be saved/i.test(notice) ? "!" : /saved|uploaded|updated|removed|published|available for|marked unavailable|reopened/i.test(notice) ? "✓" : "i"}</span><span className="adminNoticeText">{notice}</span><button type="button" className="adminNoticeDismiss" aria-label="Dismiss notification" onClick={() => setNotice("")}>×</button></div>}
    <section className="stats jtsAdminStats">
      <article><span>All requests</span><strong>{appointments.length}</strong></article>
      <article className="needsAttention"><span>New · review</span><strong>{appointments.filter(item => !item.status || item.status === "New").length}</strong></article>
      <article><span>Open appointments</span><strong>{openAppointments.length}</strong></article>
      <article><span>Looks to review</span><strong>{reviews.filter(item => !item.published && item.status !== "hidden").length}</strong></article>
    </section>
    <nav className="adminTabs" aria-label="Operations sections">
      <button className={tab === "appointments" ? "active" : ""} onClick={() => setTab("appointments")}>Appointment requests</button>
      <button className={tab === "availability" ? "active" : ""} onClick={() => setTab("availability")}>Date availability</button>
      <button className={tab === "reviews" ? "active" : ""} onClick={() => setTab("reviews")}>Customer looks & reviews</button>
      <button className={tab === "services" ? "active" : ""} onClick={() => setTab("services")}>Services & prices</button>
      <button className={tab === "styleFeed" ? "active" : ""} onClick={() => setTab("styleFeed")}>John&apos;s style feed · photos &amp; videos</button>
    </nav>
    {loading ? <section className="adminPanel"><p>Loading JTS operations…</p></section> : tab === "appointments" ? <section id="admin-appointments" className="adminPanel">
      <div className="panelHeading"><div><span className="kicker">THE APPOINTMENT QUEUE</span><h2>Appointments</h2></div><span className="jtsQueueCount">{openAppointments.length} active</span></div>
      {appointments.length === 0 ? <div className="emptyState"><h3>No appointment requests yet</h3><p>New requests submitted through the JTS booking form will appear here.</p></div> : <div className="queue">
        {appointments.map(item => {
          const status = item.status || "New";
          const serviceName = (item.items || []).map(service => service.name || "Service").join(" · ") || "Appointment request";
          const rawPhoneDigits = (item.phone || "").replace(/\D/g, "");
          const phoneDigits = rawPhoneDigits.length === 8 ? "267" + rawPhoneDigits : rawPhoneDigits;
          const guidance = status === "New" ? "Review the time and contact the customer." : status === "Reviewing" ? "Check the requested slot, then accept or confirm." : status === "Accepted" ? "Slot accepted · confirm only when the deposit is received." : status === "Confirmed" ? "Appointment confirmed · prepare for the visit." : status === "In service" ? "Customer is being served." : status === "Completed" ? "Visit completed." : "This request is closed.";
          const progress = status === "New" ? 16 : status === "Reviewing" ? 32 : status === "Accepted" ? 50 : status === "Confirmed" ? 68 : status === "In service" ? 84 : status === "Completed" ? 100 : 0;
          return <article className={"queueRow jtsAppointmentCard jtsAppointment-" + status.toLowerCase().replace(/[^a-z]+/g, "-")} key={item.id}>
            <div className="jtsAppointmentMain">
              <div className="jtsAppointmentTop"><span className="kicker">#{item.id.slice(0, 8).toUpperCase()}</span><span className={"jtsAppointmentStatus status-" + status.toLowerCase().replace(/[^a-z]+/g, "-")}>{status}</span></div>
              <h3>{item.customerName || "Customer"}</h3>
              <p className="jtsAppointmentService">{serviceName}</p>
              <div className="jtsAppointmentFacts"><span>◷ {dateText(item.scheduledFor)}</span><strong>{money(item.total)}</strong></div>
              {item.phone && <a className="jtsAppointmentContact" href={phoneDigits ? "https://wa.me/" + phoneDigits : "tel:" + item.phone}>↗ WhatsApp · {item.phone}</a>}
              <div className="jtsAppointmentProgress" aria-label={"Appointment progress: " + status}><span style={{width: progress + "%"}}/></div>
              <small className="jtsAppointmentNext">{guidance}</small>
              {item.instructions && <details className="jtsAppointmentDetails"><summary>View booking notes &amp; deposit</summary><p>{item.instructions}</p><small>50% deposit · Orange Money 75720306 · John Shumba</small></details>}
            </div>
            <div className="queueActions jtsAppointmentActions">
              <label htmlFor={"appointment-status-" + item.id}>Update status</label>
              <select id={"appointment-status-" + item.id} aria-label={"Update appointment " + item.id} value={status} onChange={event => void setAppointmentStatus(item, event.target.value)}>
                <option value="New">New request</option>
                <option value="Reviewing">Reviewing</option>
                <option value="Accepted">Accepted</option>
                <option value="Confirmed">Confirmed</option>
                <option value="In service">In service</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </article>;
        })}
      </div>}
    </section> : tab === "availability" ? <section id="admin-availability" className="adminPanel">
      <div className="panelHeading"><div><span className="kicker">CUSTOMER BOOKING CALENDAR</span><h2>Manage unavailable dates</h2></div><span>{unavailableDates.length} closed date{unavailableDates.length===1?"":"s"}</span></div>
      <p className="availabilityIntro">Dates you add here are blocked in the customer calendar. Customers can see the closure reason and the next nearest date they can request. This does not cancel or change existing requests already in the appointment queue.</p>
      <form className="availabilityForm" onSubmit={markDateUnavailable}>
        <label>Mark a date unavailable<input type="date" value={closureDate} min={minBookableDate()} onChange={event=>setClosureDate(event.target.value)} required /></label>
        <label>Reason shown to customers <span>(optional)</span><input value={closureReason} onChange={event=>setClosureReason(event.target.value)} maxLength={120} placeholder="e.g. Fully booked, personal day, salon closed" /></label>
        <button className="button buttonLight" type="submit">Save unavailable date</button>
      </form>
      {availabilityNotice && <p className="notice" role="status">{availabilityNotice}</p>}
      {unavailableDates.length===0 ? <div className="emptyState"><h3>No unavailable dates recorded</h3><p>All future dates remain available to request, subject to John confirming the exact time.</p></div> : <div className="queue">{unavailableDates.map(item=><article className="queueRow" key={item.id}><div><span className="kicker">UNAVAILABLE DATE</span><h3>{dateText(item.date+"T12:00:00+02:00")}</h3><p>{item.reason}</p><small>Customers cannot select this date in the booking calendar.</small></div><div className="queueActions"><button type="button" className="button buttonLight" onClick={()=>void reopenDate(item)}>Reopen date</button></div></article>)}</div>}
      <p className="availabilityFootnote">The calendar controls which dates can be requested; it does not auto-confirm time slots. Appointment requests still need your review and confirmation.</p>
    </section> : tab === "services" ? <section id="admin-services" className="adminPanel">
      <div className="panelHeading"><div><span className="kicker">PUBLIC CATALOGUE</span><h2>Services & prices</h2></div><span>{services.length} listed</span></div>
      <p>These records drive the public service cards, booking choices and customer account inspiration. Add photos/videos directly to each service.</p>
      <p className="adminServiceIntro">The 17 supplied services are maintained as one catalogue. Upload one cover per category below; individual service galleries are optional.</p>
      <div className="jtsAdminCategoryMedia">
        <div className="jtsAdminCategoryMediaIntro"><strong>Public category covers</strong><p>Upload just one strong photo or short MP4 for each category. You do not need 17 separate service photos. These covers appear on the customer-facing category tiles.</p></div>
        <div className="jtsAdminCategoryMediaGrid">{PUBLIC_SERVICE_CATEGORIES.map(category => {
          const media = categoryMedia[category];
          return <article key={category}>
            <div className="jtsAdminCategoryMediaPreview">{media ? media.type === "video" ? <video src={media.url} controls playsInline preload="metadata" /> : <img src={media.url} alt={media.alt || category} /> : <span>{category}</span>}</div>
            <strong>{category}</strong>
            <label className="adminUploadField"> {media ? "Replace category cover" : "Upload category cover"}
              <input type="file" accept="image/*,video/mp4,video/webm,video/quicktime,video/x-m4v" disabled={mediaUploading} onChange={event => { const file = event.currentTarget.files?.[0]; if (file) void uploadCategoryMedia(category, file); event.currentTarget.value = ""; }} />
              <small>One image or video · images up to 4 MB · videos up to 8 MB</small>
            </label>
          </article>;
        })}</div>
        {mediaUploading && <div className="adminUploadProgress" role="group" aria-label="Category media upload progress"><div className="adminUploadProgressMeta"><span>{uploadProgress || "Preparing secure upload…"}</span><strong>{uploadPercent}%</strong></div><div className="adminUploadProgressTrack" role="progressbar" aria-label="Category cover upload" aria-valuemin={0} aria-valuemax={100} aria-valuenow={uploadPercent}><span style={{width: uploadPercent + "%"}} /></div></div>}
      </div>

      {serviceDraft ? <div className="adminModalBackdrop" onMouseDown={event => { if (event.target === event.currentTarget && !mediaUploading) setServiceDraft(null); }}>
        <section className="adminEditorModal" role="dialog" aria-modal="true" aria-labelledby="admin-service-editor-title">
          <div className="adminModalHeading"><div><span className="kicker">{serviceDraft.id ? "EDIT PUBLIC SERVICE" : "NEW PUBLIC SERVICE"}</span><h2 id="admin-service-editor-title">{serviceDraft.id ? "Edit service" : "Add a service"}</h2><p>Changes here update the public catalogue and booking choices.</p></div><button type="button" className="adminModalClose" aria-label="Close service editor" disabled={mediaUploading} onClick={() => setServiceDraft(null)}>×</button></div>
          <form className="adminForm" onSubmit={saveService}>
        <label>Service name<input value={serviceDraft.name} onChange={event=>setServiceDraft({...serviceDraft,name:event.target.value})} maxLength={80} required /></label>
        <div className="adminTwoCol"><label>Price (BWP)<input type="number" min="0" step="1" value={serviceDraft.price} onChange={event=>setServiceDraft({...serviceDraft,price:Number(event.target.value)})} required /></label><label>Optional maximum price<input type="number" min={serviceDraft.price} step="1" value={serviceDraft.maxPrice ?? ""} onChange={event=>setServiceDraft({...serviceDraft,maxPrice:event.target.value===""?undefined:Number(event.target.value)})} /></label></div>
        <label>Short public description<input value={serviceDraft.note} onChange={event=>setServiceDraft({...serviceDraft,note:event.target.value})} maxLength={180} required /></label>
        <div className="adminTwoCol"><label>Booking detail<input value={serviceDraft.detail} onChange={event=>setServiceDraft({...serviceDraft,detail:event.target.value})} maxLength={80} required /></label><label>Card label<input value={serviceDraft.tag} onChange={event=>setServiceDraft({...serviceDraft,tag:event.target.value})} maxLength={40} required /></label></div>
        <div className="adminServiceMedia">
          <div><strong>Service photos &amp; videos</strong><p>Attach the finished looks or short process clips customers should see on this service card. Select multiple files if you want to add more than one.</p></div>
          <label className="adminUploadField">Add photos or videos<input type="file" multiple accept="image/*,video/mp4,video/webm,video/quicktime,video/x-m4v" disabled={mediaUploading} onChange={event=>{const files=Array.from(event.currentTarget.files || []);if(files.length)void uploadServiceMedia(files);event.currentTarget.value="";}} /><small>{mediaUploading ? uploadProgress || "Preparing upload…" : "Images up to 4 MB · videos up to 8 MB. UploadThing stores the files securely."}</small></label>
          {mediaUploading && <div className="adminUploadProgress" role="group" aria-label="Service media upload progress"><div className="adminUploadProgressMeta"><span>{uploadProgress || "Preparing secure upload…"}</span><strong>{uploadPercent}%</strong></div><div className="adminUploadProgressTrack" role="progressbar" aria-label="Current file upload" aria-valuemin={0} aria-valuemax={100} aria-valuenow={uploadPercent}><span style={{ width: uploadPercent + "%" }} /></div><small>Keep this editor open until the upload finishes.</small></div>}
          {(serviceDraft.media || []).length > 0 ? <div className="adminServiceMediaGrid">{(serviceDraft.media || []).map((media,index)=><article key={media.url}><div className="adminServiceMediaPreview">{media.type === "video" ? <video src={media.url} controls playsInline preload="metadata" aria-label={serviceDraft.name + " video " + (index + 1)} /> : <img src={media.url} alt={media.alt || serviceDraft.name} loading="lazy" />}</div><button type="button" className="button buttonLight" disabled={mediaUploading} onClick={()=>removeServiceMedia(index)}>Remove item {index + 1}</button></article>)}</div> : <div className="adminMediaEmpty"><span aria-hidden="true">＋</span><strong>No service media yet</strong><p>Uploaded items will appear here for review before you save.</p></div>}
        </div>
        <div className="adminEditorFootnote">Save publishes the service details and attached media to the public catalogue. Cancel discards unsaved edits.</div>
        <div className="queueActions"><button className="button buttonPrimary" type="submit" disabled={mediaUploading}>{mediaUploading ? "Uploading media…" : serviceDraft.id ? "Save changes" : "Add service"}</button><button className="button buttonLight" type="button" disabled={mediaUploading} onClick={() => setServiceDraft(null)}>Cancel</button></div>
      </form></section></div> : <button className="button buttonLight" type="button" onClick={()=>setServiceDraft({id:"",name:"",price:0,display:"P0",detail:"",note:"",tag:"THE SERVICE",media:[]})}>Add service</button>}
      {services.length===0 ? <div className="emptyState"><h3>No public services</h3><p>Add a service to make it available on the public site and booking form.</p></div> : <div className="queue">{services.map(item=><article className="queueRow" key={item.id}><div><span className="kicker">{item.tag}</span><h3>{item.name}</h3><strong>{item.display}</strong><p>{item.note}</p><small>Booking label: {item.detail}</small><small>{item.media?.length || 0} service media item{item.media?.length === 1 ? "" : "s"} · shown on public catalogue and customer account</small>{!!item.media?.length && <div className="adminServiceMediaGrid adminServiceMediaGridCompact">{item.media.map(media=><div className="adminServiceMediaPreview" key={media.url}>{media.type === "video" ? <video src={media.url} controls playsInline preload="metadata" /> : <img src={media.url} alt={media.alt || item.name} />}</div>)}</div>}</div><div className="queueActions"><button className="button buttonLight" type="button" onClick={()=>setServiceDraft({...item,media:item.media || []})}>Edit service &amp; media</button>{!DEFAULT_PUBLIC_SERVICES.some(base => base.id === item.id) && <button className="button buttonLight" type="button" onClick={()=>setDeleteTarget({kind:"service",id:item.id,name:item.name})}>Delete</button>}</div></article>)}</div>}
    </section> : tab === "styleFeed" ? <section id="admin-style-feed" className="adminPanel">
      <div className="panelHeading"><div><span className="kicker">JOHN&apos;S EDIT</span><h2>Public style posts</h2></div><Link href="/feed" className="button buttonLight">View public feed</Link></div>
      <p>Manage the looks customers see on the landing page and style feed. Upload finished cuts, colour transformations and short salon videos, or paste a public media URL. Only published posts appear publicly.</p>
      {styleDraft ? <form className="adminForm" onSubmit={saveStylePost}>
        <label>Post title<input value={styleDraft.title} onChange={event=>setStyleDraft({...styleDraft,title:event.target.value})} maxLength={100} required /></label>
        <label>Media type<select value={styleDraft.mediaType || "image"} onChange={event=>setStyleDraft({...styleDraft,mediaType:event.target.value as "image" | "video"})}><option value="image">Photo / finished look</option><option value="video">Video / process clip</option></select></label>
        <label className="adminUploadField">Upload {styleDraft.mediaType === "video" ? "video" : "photo"}<input type="file" accept={styleDraft.mediaType === "video" ? "video/mp4,video/webm,video/quicktime" : "image/*"} disabled={mediaUploading} onChange={event=>{const file=event.target.files?.[0];if(file)void uploadStyleMedia(file);event.currentTarget.value="";}} /> <small>{styleDraft.mediaType === "video" ? "MP4/WebM, up to 8 MB." : "Browser-supported images, up to 4 MB."} Uploads are stored by UploadThing.</small></label>
        {mediaUploading && <div className="adminUploadProgress" role="group" aria-label="Style media upload progress"><div className="adminUploadProgressMeta"><span>{uploadProgress || "Preparing secure upload…"}</span><strong>{uploadPercent}%</strong></div><div className="adminUploadProgressTrack" role="progressbar" aria-label="Current file upload" aria-valuemin={0} aria-valuemax={100} aria-valuenow={uploadPercent}><span style={{ width: uploadPercent + "%" }} /></div><small>Keep this editor open until the upload finishes.</small></div>}
        <label>Or paste public media URL<input type="url" value={styleDraft.mediaUrl || styleDraft.imageUrl} onChange={event=>setStyleDraft({...styleDraft,mediaUrl:event.target.value,imageUrl:event.target.value})} placeholder="https://…" required /></label>
        {(styleDraft.mediaUrl || styleDraft.imageUrl) && <div style={{maxWidth:260,margin:"8px 0"}}>{styleDraft.mediaType === "video" ? <video src={styleDraft.mediaUrl || styleDraft.imageUrl} controls playsInline style={{width:"100%",borderRadius:12}} /> : <img src={styleDraft.mediaUrl || styleDraft.imageUrl} alt="Style post preview" style={{width:"100%",maxHeight:300,objectFit:"cover",borderRadius:12}} />}</div>}
        <label>Caption<textarea value={styleDraft.caption} onChange={event=>setStyleDraft({...styleDraft,caption:event.target.value})} maxLength={700} rows={3} /></label>
        <label>Service / look label<input value={styleDraft.service} onChange={event=>setStyleDraft({...styleDraft,service:event.target.value})} maxLength={80} /></label>
        <label>Tags, separated by commas<input value={styleDraft.tags.join(", ")} onChange={event=>setStyleDraft({...styleDraft,tags:event.target.value.split(",").map(tag=>tag.trim().replace(/^#/,"")).filter(Boolean).slice(0,8)})} /></label>
        <label className="checkRow"><input type="checkbox" checked={styleDraft.published} onChange={event=>setStyleDraft({...styleDraft,published:event.target.checked})} /> Publish on the public feed</label>
        <div className="queueActions"><button className="button buttonPrimary" type="submit" disabled={mediaUploading}>{mediaUploading ? "Uploading media…" : "Save style post"}</button><button className="button buttonLight" type="button" onClick={()=>setStyleDraft(null)}>Cancel</button></div>
      </form> : <button className="button buttonLight" type="button" onClick={()=>setStyleDraft({id:"",title:"",caption:"",imageUrl:"",mediaUrl:"",mediaType:"image",service:"",tags:[],published:true})}>Add style post</button>}
      {stylePosts.length===0 ? <div className="emptyState"><h3>No style posts yet</h3><p>Add a post here and publish it to the public style feed.</p></div> : <div className="queue">{stylePosts.map(item=><article className="queueRow" key={item.id}>{(item.mediaUrl || item.imageUrl) && (item.mediaType === "video" ? <video src={item.mediaUrl || item.imageUrl} controls playsInline preload="metadata" style={{width:150,height:120,objectFit:"cover",borderRadius:10}} /> : <img src={item.mediaUrl || item.imageUrl} alt="" loading="lazy" style={{width:100,height:120,objectFit:"cover",borderRadius:10}}/>)}<div><span className="kicker">{item.published?"Published":"Draft"} · {item.service||"JTS STYLE"}</span><h3>{item.title}</h3><p>{item.caption}</p><small>{dateText(item.createdAt)}</small></div><div className="queueActions"><button className="button buttonLight" type="button" onClick={()=>setStyleDraft({...item,tags:item.tags||[],published:item.published!==false})}>Edit</button><button className="button buttonLight" type="button" onClick={()=>setDeleteTarget({kind:"stylePost",id:item.id,name:item.title})}>Delete</button></div></article>)}</div>}
    </section> : <section className="adminPanel">
      <div className="panelHeading"><div><span className="kicker">COMMUNITY STYLE FEED</span><h2>Customer photos & reviews</h2></div><Link href="/feed" className="button buttonLight">View public feed</Link></div>
      {reviews.length === 0 ? <div className="emptyState"><h3>No customer reviews yet</h3><p>Customer-submitted looks and reviews will appear here for moderation.</p></div> : <div className="queue">
        {reviews.map(item => <article className="queueRow" key={item.id}>
          {item.imageUrl && <img src={item.imageUrl} alt="" loading="lazy" style={{ width: 100, height: 120, objectFit: "cover", borderRadius: 10 }} />}
          <div>
            <span className="kicker">{item.published === false ? "Hidden" : "Published"} · {item.rating || 0}/5</span>
            <h3>{item.title || "Customer look"}</h3>
            <p>{item.caption || ""}</p>
            <small>{item.customerName || "JTS customer"} · {item.service || "JTS Styles"} · {dateText(item.createdAt)}</small>
            {item.comparison && <small>Repeat review: {item.comparison}</small>}
          </div>
          <div className="queueActions"><button className="button buttonLight" type="button" onClick={() => void setReviewPublished(item, item.published === false)}>{item.published === false ? "Publish" : "Hide from feed"}</button><button className="button buttonLight" type="button" onClick={() => setDeleteTarget({kind:"customerReview",id:item.id,name:item.title || item.customerName || "Customer look"})}>Delete</button></div>
        </article>)}
      </div>}
    </section>}
    {deleteTarget && <div className="adminModalBackdrop adminDeleteBackdrop" onMouseDown={event => { if (event.target === event.currentTarget) setDeleteTarget(null); }}>
      <section className="adminDeleteDialog" role="alertdialog" aria-modal="true" aria-labelledby="admin-delete-title" aria-describedby="admin-delete-description">
        <span className="kicker">CONFIRM DELETE</span>
        <h2 id="admin-delete-title">Delete this {deleteTarget.kind === "service" ? "service" : deleteTarget.kind === "stylePost" ? "style post" : "customer look"}?</h2>
        <p id="admin-delete-description"><strong>{deleteTarget.name}</strong> will be removed from the operations list and its public display where applicable. This action cannot be undone from this screen.</p>
        <div className="adminDeleteActions"><button type="button" className="button buttonLight" onClick={() => setDeleteTarget(null)}>Keep item</button><button type="button" className="button buttonDanger" onClick={() => void confirmDeleteTarget()}>Delete permanently</button></div>
      </section>
    </div>}
    <JtsStyleGuide onNavigateAdmin={setTab} />
    <p style={{ color: "#938c82", fontSize: ".8rem", marginTop: 18 }}>A request is not confirmed until John confirms the slot and deposit. Customer photos and reviews are public only while published.</p>
  </div></main>;
}

export default function AdminPage() {
  return <AdminGate><Dashboard /></AdminGate>;
}
