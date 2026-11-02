"use client";
import Link from "next/link";
import { GoogleAuthProvider, linkWithPopup, onAuthStateChanged, signInAnonymously, signInWithPopup, type User } from "firebase/auth";
import { useEffect, useMemo, useState } from "react";
import { track } from "@vercel/analytics";
import { auth } from "@/lib/firebase/client";
import ConversationThread from "@/components/ConversationThread";
import { getCustomerOrders, subscribeToCustomerOrders, subscribeToCustomerConversations, ensureBookingConversation, type Conversation, type FoodOrder } from "@/lib/firebase/data";

const INITIAL_BOOKINGS_VISIBLE = 3;

function label(status: string) {
  return status === "New" ? "Request received" : status === "Collected" || status === "Delivered" ? "Completed" : status;
}
function dateText(value: string) {
  const d = new Date(value);
  return Number.isFinite(d.getTime()) ? d.toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : value;
}
function firebaseErrorCode(cause: unknown) {
  return typeof cause === "object" && cause && "code" in cause ? String((cause as { code?: unknown }).code ?? "") : "";
}
function googleErrorMessage(code: string) {
  if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") return { error: "", message: "Google connection was cancelled. Your current booking session is unchanged." };
  if (code === "auth/popup-blocked") return { error: "Your browser blocked the Google sign-in window. Allow pop-ups for John The Stylist Bw, then try again.", message: "" };
  if (code === "auth/unauthorized-domain") return { error: "Google sign-in is not enabled for this website address yet. Your bookings are unchanged; please try again later.", message: "" };
  if (code === "auth/operation-not-allowed") return { error: "Google sign-in is not enabled for John The Stylist Bw yet. Your bookings are unchanged; please try again later.", message: "" };
  if (code === "auth/network-request-failed" || code === "auth/timeout") return { error: "The connection was interrupted. Check your internet connection and try Google again; your booking session is unchanged.", message: "" };
  if (code === "auth/credential-already-in-use" || code === "auth/account-exists-with-different-credential" || code === "auth/email-already-in-use") return { error: "That Google account already has a separate JTS sign-in. Your current booking history has not been merged automatically. Keep this session available and contact John before switching accounts.", message: "" };
  if (code === "auth/invalid-credential" || code === "auth/invalid-oauth-client-id") return { error: "Google sign-in could not be verified. Your bookings are unchanged; please try again later.", message: "" };
  return { error: "We couldn't connect Google right now. Your current booking session is unchanged. Please try again, or contact John if it keeps happening.", message: "" };
}

function GoogleBrandMark() {
  return (
    <svg className="googleSignInMark" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.72 7.18l7.62 5.91c4.45-4.11 7.14-10.17 7.14-17.56z" />
      <path fill="#FBBC05" d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.87.93 7.52 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.9-5.89l-7.62-5.91c-2.12 1.42-4.84 2.26-8.28 2.26-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<FoodOrder[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showAllBookings, setShowAllBookings] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const stop = onAuthStateChanged(auth, next => {
      setUser(next);
      if (next) {
        setReady(false);
        void getCustomerOrders(next.uid)
          .then(setOrders)
          .catch(() => setError("Your bookings could not be loaded right now."))
          .finally(() => setReady(true));
      } else {
        setOrders([]);
        setReady(true);
      }
    });
    return stop;
  }, []);

  const userId = user?.uid;

  useEffect(() => {
    if (!userId) { setConversations([]); return; }
    return subscribeToCustomerConversations(userId, setConversations, () => setError("Private appointment messages could not be loaded. Check your connection and try again."));
  }, [userId]);

  useEffect(() => {
    if (!ready) return;
    track("jts_account_viewed", { session_type: !user ? "no_session" : user.isAnonymous ? "guest" : "connected" });
  }, [ready, user]);


  // Recover a booking's private proof thread if the initial post-submit setup was interrupted.
  useEffect(() => {
    if (!ready || !userId || !user) return;
    let cancelled = false;
    const knownBookingIds = new Set(conversations.map(item => item.bookingId).filter((id): id is string => Boolean(id)));
    const missing = orders.filter(order => order.customerId === userId && !knownBookingIds.has(order.id));
    if (missing.length) {
      void Promise.all(missing.map(order => ensureBookingConversation(order.id, userId, order.customerName || "JTS customer")))
        .catch(cause => {
          if (!cancelled) {
            console.error("[JTS account] private booking thread recovery failed", cause);
            setError("A private booking upload space could not be restored yet. Check your connection and refresh My Account to retry.");
          }
        });
    }
    return () => { cancelled = true; };
  }, [ready, userId, user, orders, conversations]);

  useEffect(() => {
    if (!userId) return;
    return subscribeToCustomerOrders(
      userId,
      nextOrders => { setOrders(nextOrders); setReady(true); },
      () => setError("Live booking updates are temporarily unavailable. You can still open each booking to refresh its status.")
    );
  }, [userId]);

  async function startGuest() {
    setError(""); setMessage("");
    try {
      const next = (await signInAnonymously(auth)).user;
      setUser(next);
      setOrders(await getCustomerOrders(next.uid));
    } catch (cause) {
      console.error("[JTS account] guest session failed", { code: firebaseErrorCode(cause) });
      setError("We couldn't open your private booking session. Check your connection and try again.");
    }
  }

  async function connectGoogle() {
    setBusy(true); setError(""); setMessage("");
    try {
      // Launch the popup directly from the click handler; an awaited setup step here can lose the browser user gesture.
      const current = auth.currentUser;
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      if (current?.isAnonymous) {
        const result = await linkWithPopup(current, provider);
        setUser(result.user);
        setMessage("Google is connected to this booking identity. Your existing guest booking history stays with this account.");
        track("jts_google_account_connected", { method: "guest_link" });
      } else if (current) {
        setMessage("Your JTS account is already connected. Keep using this Google sign-in when you return.");
        track("jts_google_account_connected", { method: "already_connected" });
      } else {
        const result = await signInWithPopup(auth, provider);
        setUser(result.user);
        setMessage("You&apos;re signed in with Google. New bookings can be saved to this account.");
        track("jts_google_account_connected", { method: "new_sign_in" });
      }
    } catch (cause) {
      const code = firebaseErrorCode(cause);
      // Log the Firebase error code only. Never log tokens, credentials, email, or profile data.
      console.error("[JTS account] Google auth failed", { code: code || "unknown" });
      const feedback = googleErrorMessage(code);
      setError(feedback.error);
      setMessage(feedback.message);
    } finally {
      setBusy(false);
    }
  }

  const nextOrder = useMemo(
    () => orders.filter(order => new Date(order.scheduledFor).getTime() >= Date.now() && !["Cancelled", "Collected", "Delivered"].includes(order.status)).sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor))[0],
    [orders]
  );
  const recentOrders = useMemo(
    () => [...orders].sort((a, b) => b.scheduledFor.localeCompare(a.scheduledFor)),
    [orders]
  );
  const visibleOrders = showAllBookings ? recentOrders : recentOrders.slice(0, INITIAL_BOOKINGS_VISIBLE);

  return <main className="jtsBookingPage jtsStyleAccount"><div className="jtsContainer jtsBookingWrap">
    <div className="jtsBookingTop"><Link href="/" className="jtsBack">← John The Stylist Bw</Link><div className="jtsAccountTopLinks"><Link href="/feed" className="jtsGhost">Style feed ↗</Link><Link href="/order" className="jtsGhost">Book appointment</Link></div></div>

    <header className="jtsAccountHero jtsAccountUtilityHero">
      <span className="jtsEyebrow">MY JTS ACCOUNT</span>
      <h1>Your appointments.</h1>
      <p>Booking details, updates and private messages—all in one place.</p>
      <div className="jtsAccountHeroActions"><Link href="/order" className="jtsButton jtsButtonGold">Request an appointment ↗</Link><Link href="/feed" className="jtsGhost">Browse styles</Link></div>
    </header>

    {(error || message) && <p className={error ? "jtsFormError" : "jtsStyleStatus"} role="status" aria-live="polite">{error || message}</p>}

    <section className="jtsStylePanel jtsAccountUtilityAuth" aria-labelledby="account-connection-title">
      <div className="jtsAccountUtilityHeading"><span className="jtsEyebrow">ACCOUNT ACCESS</span><span className={user && !user.isAnonymous ? "jtsStyleConnected" : "jtsAccountGuestBadge"}>{user && !user.isAnonymous ? "✓ Google connected" : user ? "Guest session" : "Not connected"}</span></div>
      <h2 id="account-connection-title">{user && !user.isAnonymous ? "Your history is saved." : "Keep your bookings together."}</h2>
      {user && !user.isAnonymous
        ? <p>You&apos;re signed in with Google. Use the same account when you return.</p>
        : user
          ? <><p>Connect Google to keep this guest booking identity and its history.</p><button className="googleSignInButton jtsAccountGoogleButton" type="button" onClick={() => void connectGoogle()} disabled={busy}><GoogleBrandMark />{busy ? "Connecting…" : "Continue with Google"}</button></>
          : <><p>Sign in to access saved bookings, or continue with a guest session on this device.</p><button className="googleSignInButton jtsAccountGoogleButton" type="button" onClick={() => void connectGoogle()} disabled={!ready || busy}><GoogleBrandMark />{busy ? "Connecting…" : "Continue with Google"}</button><div className="jtsAccountAuthFallback"><span>Prefer not to sign in?</span><button type="button" className="jtsStyleTextLink" onClick={() => void startGuest()} disabled={!ready || busy}>Open guest booking history</button></div></>}
    </section>

    <section className="jtsStyleNext" aria-labelledby="account-next-title">
      <div><span className="jtsEyebrow">NEXT APPOINTMENT</span>
        {nextOrder ? <><h2 id="account-next-title">{nextOrder.items.map(item => item.name).join(" · ")}</h2><p>{dateText(nextOrder.scheduledFor)} · {label(nextOrder.status)}</p><small>Ref #{nextOrder.id.slice(0, 8).toUpperCase()} · Requests are not confirmed until John confirms the slot and deposit.</small></>
        : <><h2 id="account-next-title">Nothing scheduled yet.</h2><p>When you request an appointment, its status will appear here.</p></>}
      </div>
      <Link href={nextOrder ? "/orders/" + nextOrder.id : "/order"} className="jtsButton jtsButtonGold">{nextOrder ? "View appointment ↗" : "Book an appointment ↗"}</Link>
    </section>

    <section className="jtsAccountPrivateInbox" id="account-payment-proof" aria-labelledby="account-private-title">
      <div className="jtsAccountUtilityHeading"><div><span className="jtsEyebrow">PRIVATE INBOX</span><h2 id="account-private-title">Messages &amp; payment proof</h2></div><span className="jtsAccountLiveDot">Private</span></div>
      {!user ? <div className="jtsStyleEmpty"><p>Connect your account or open your guest booking history to see private appointment conversations.</p></div>
      : !ready ? <div className="jtsStyleEmpty">Loading your appointment messages…</div>
      : conversations.length === 0 ? <div className="jtsStyleEmpty"><p>Your private appointment conversations will appear here.</p></div>
      : <div className="jtsAccountPrivateList">{conversations.map(conversation => <details className="jtsAccountPrivateItem" key={conversation.id}>
          <summary className="jtsAccountPrivateMeta"><strong>{conversation.title}</strong><span>{conversation.unreadForCustomer ? "New reply" : "Open conversation"}</span><small>{conversation.lastMessagePreview || "No messages yet"} · {dateText(conversation.lastMessageAt)}</small></summary>
          <ConversationThread conversationId={conversation.id} role="customer" userId={user.uid} title="Booking conversation" purpose={conversation.bookingId ? "deposit-proof" : undefined} />
        </details>)}</div>}
      <p className="jtsAccountNotificationNote">Messages and payment screenshots are private to you and authorized JTS staff. A screenshot is not payment verification; John checks the Orange Money account.</p>
    </section>

    <section className="jtsStyleHistory" aria-labelledby="account-history-title"><div className="jtsStyleSectionHead"><div><span className="jtsEyebrow">YOUR RECORD</span><h2 id="account-history-title">Booking history</h2><p>{orders.length} {orders.length === 1 ? "request" : "requests"} on this account.</p></div><Link href="/order" className="jtsStyleTextLink">New booking ↗</Link></div>
      {!user ? <div className="jtsStyleEmpty"><p>Open your private booking session above to load your history.</p></div>
      : !ready ? <div className="jtsStyleEmpty">Loading your bookings…</div>
      : orders.length > 0 ? <><div className="jtsStyleBookingList">{visibleOrders.map(order => <article key={order.id} className="jtsBookingRow jtsStyleBookingRow"><div><span className="jtsEyebrow">{label(order.status)}</span><h3>{order.items.map(item => item.name).join(" · ")}</h3><p>{dateText(order.scheduledFor)}</p><small>Reference #{order.id.slice(0, 8).toUpperCase()} · {order.status}</small></div><Link href={"/orders/" + order.id} className="jtsGhost">Details ↗</Link></article>)}</div>{recentOrders.length > INITIAL_BOOKINGS_VISIBLE && <button type="button" className="jtsAccountShowBookings" onClick={() => setShowAllBookings(value => !value)}>{showAllBookings ? "Show recent bookings" : "View all " + recentOrders.length + " bookings"}</button>}</>
      : <div className="jtsStyleEmpty"><h3>Your first appointment starts here.</h3><p>Choose a service and request a date that works for you.</p><Link href="/order" className="jtsButton jtsButtonGold">Request your first appointment ↗</Link></div>}
    </section>

    <p className="jtsAccountNote"><strong>Appointment information:</strong> a request is not confirmed until John confirms the appointment and deposit separately.</p>
  </div></main>;
}
