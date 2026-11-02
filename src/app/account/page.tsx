"use client";
import Link from "next/link";
import { GoogleAuthProvider, linkWithPopup, onAuthStateChanged, signInAnonymously, signInWithPopup, type User } from "firebase/auth";
import { useEffect, useMemo, useState } from "react";
import { track } from "@vercel/analytics";
import { auth } from "@/lib/firebase/client";
import StyleStudio from "@/app/style-studio";
import CustomerStyleInspiration from "@/components/customer-style-inspiration";
import ConversationThread from "@/components/ConversationThread";
import JtsWeather from "@/components/JtsWeather";
import JtsStyleGuide from "@/components/JtsStyleGuide";
import { getCustomerOrders, subscribeToCustomerOrders, subscribeToCustomerConversations, type Conversation, type FoodOrder } from "@/lib/firebase/data";

const INITIAL_BOOKINGS_VISIBLE = 3;

function label(status: string) {
  return status === "New" ? "Request received" : status === "Collected" || status === "Delivered" ? "Completed" : status;
}
function dateText(value: string) {
  const d = new Date(value);
  return Number.isFinite(d.getTime()) ? d.toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : value;
}
function isPastAppointment(order: FoodOrder) {
  return new Date(order.scheduledFor).getTime() < Date.now() && order.status !== "Cancelled";
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
        setMessage("You're signed in with Google. New bookings can be saved to this account.");
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

  const pastOrders = useMemo(() => orders.filter(isPastAppointment), [orders]);
  const nextOrder = useMemo(
    () => orders.filter(order => new Date(order.scheduledFor).getTime() >= Date.now() && !["Cancelled", "Collected", "Delivered"].includes(order.status)).sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor))[0],
    [orders]
  );
  const recentOrders = useMemo(
    () => [...orders].sort((a, b) => b.scheduledFor.localeCompare(a.scheduledFor)),
    [orders]
  );
  const visibleOrders = showAllBookings ? recentOrders : recentOrders.slice(0, INITIAL_BOOKINGS_VISIBLE);
  const updates = useMemo(
    () => [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 3),
    [orders]
  );
  const nextPaymentConversation = nextOrder ? conversations.find(item => item.bookingId === nextOrder.id) : undefined;
  const nextDepositProofSent = Boolean(nextPaymentConversation?.lastMessagePreview.startsWith("DEPOSIT PROOF SUBMITTED"));

  return <main className="jtsBookingPage jtsStyleAccount"><div className="jtsContainer jtsBookingWrap">
    <div className="jtsBookingTop"><Link href="/" className="jtsBack">← John The Stylist Bw</Link><div className="jtsAccountTopLinks"><Link href="/feed" className="jtsGhost">Style feed ↗</Link><Link href="/order" className="jtsGhost">Book appointment</Link></div></div>

    <section className="jtsPersonalWelcome" aria-labelledby="jts-personal-welcome-title">
      <span className="jtsEyebrow">YOUR JTS STYLE JOURNEY</span>
      <h2 id="jts-personal-welcome-title">{(() => { const hour = Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Gaborone", hour: "2-digit", hourCycle: "h23" }).format(new Date())); const time = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"; const firstName = user && !user.isAnonymous ? user.displayName?.trim().split(/\s+/)[0] : ""; return firstName ? time + ", " + firstName + "." : "Dumela. Your next look starts here."; })()}</h2>
      <p>{nextOrder ? "You have a booking request coming up. Check its status below, or browse a fresh style idea while you plan." : orders.length ? "Your booking history and style references are together here, ready whenever you want to plan your next visit." : "Explore John’s work, check the week’s forecast, and request a day that fits your plans. No pressure to book before you’re ready."}</p>
      <div className="jtsPersonalWelcomeActions"><Link href="/order" className="jtsButton jtsButtonGold" onClick={() => track("jts_account_primary_action", { action: "request_appointment" })}>Plan my next look ↗</Link><Link href="/feed" className="jtsGhost" onClick={() => track("jts_account_primary_action", { action: "browse_style_feed" })}>Find inspiration</Link></div>
    </section>

    <section className="jtsStylePanel jtsAccountUtilityAuth" aria-labelledby="account-connection-title">
      <div className="jtsAccountUtilityHeading"><span className="jtsEyebrow">01 · ACCOUNT ACCESS</span><span className={user && !user.isAnonymous ? "jtsStyleConnected" : "jtsAccountGuestBadge"}>{user && !user.isAnonymous ? "✓ Connected" : user ? "Guest session" : "Optional"}</span></div>
      <h1 id="account-connection-title">Your account.<br /><em>Your history.</em></h1>
      {user && !user.isAnonymous
        ? <><p>Your Google sign-in is connected. Keep using it to access bookings saved to this account.</p><span className="jtsStyleConnected">Google account connected</span></>
        : user
          ? <><p>Connect Google to keep this existing guest booking identity and its history. This will not confirm or change any appointment.</p><button className="googleSignInButton jtsAccountGoogleButton" type="button" onClick={() => void connectGoogle()} disabled={busy}><GoogleBrandMark />{busy ? "Connecting…" : "Continue with Google"}</button></>
          : <><p>Sign in with Google to save new bookings to your account. If you already have a guest booking session on this device, it will be preserved when it is available to link.</p><button className="googleSignInButton jtsAccountGoogleButton" type="button" onClick={() => void connectGoogle()} disabled={!ready || busy}><GoogleBrandMark />{busy ? "Connecting…" : "Continue with Google"}</button><div className="jtsAccountAuthFallback"><span>Prefer not to sign in?</span><button type="button" className="jtsStyleTextLink" onClick={() => void startGuest()} disabled={!ready || busy}>Open guest booking history</button></div></>}
      {(error || message) && <p className={error ? "jtsFormError" : "jtsStyleStatus"} role="status" aria-live="polite">{error || message}</p>}
    </section>

    <JtsWeather />

    <section className="jtsAccountNotifications" aria-labelledby="account-notifications-title">
      <div className="jtsAccountUtilityHeading"><div><span className="jtsEyebrow">02 · NOTIFICATIONS & UPDATES</span><h2 id="account-notifications-title">Your latest activity.</h2></div><span className="jtsAccountLiveDot">Live when connected</span></div>
      {!user
        ? <div className="jtsStyleEmpty"><p>Open your account or guest booking session to see updates linked privately to this device.</p></div>
        : !ready
          ? <div className="jtsStyleEmpty">Checking your latest booking updates…</div>
          : updates.length
            ? <div className="jtsAccountUpdateList">{updates.map(order => <article key={order.id} className="jtsAccountUpdate"><span className="jtsAccountUpdateMark" aria-hidden="true">•</span><div><strong>{label(order.status)}</strong><p>{order.items.map(item => item.name).join(" · ")}</p><small>{dateText(order.scheduledFor)} · Ref #{order.id.slice(0, 8).toUpperCase()}</small></div><Link href={"/orders/" + order.id} className="jtsStyleTextLink">Details ↗</Link></article>)}</div>
            : <div className="jtsStyleEmpty"><p>No booking updates yet. When you request an appointment, its latest status will appear here.</p><Link href="/order" className="jtsButton jtsButtonGold">Request an appointment ↗</Link></div>}
      <p className="jtsAccountNotificationNote">These are in-app booking updates, not a promise of push notifications. Appointment requests remain unconfirmed until John confirms the slot and deposit.</p>
    </section>

    <section id="account-payment-proof" className="jtsAccountPrivateInbox" aria-labelledby="account-private-title">
      <div className="jtsAccountUtilityHeading"><div><span className="jtsEyebrow">03 · PRIVATE APPOINTMENT MESSAGES</span><h2 id="account-private-title">Booking messages &amp; payment proof.</h2></div><span className="jtsAccountLiveDot">Private inbox</span></div>
      {!user ? <div className="jtsStyleEmpty"><p>Open your guest booking session or connect Google above to see private replies linked to your bookings.</p></div>
      : conversations.length===0 ? <div className="jtsStyleEmpty"><p>Your appointment conversations appear here. Open the relevant booking thread to send a deposit screenshot if you did not upload it after booking.</p></div>
      : <div className="jtsAccountPrivateList">{conversations.map(conversation=><article className="jtsAccountPrivateItem" key={conversation.id}>
        <div className="jtsAccountPrivateMeta"><strong>{conversation.title}</strong><span>{conversation.unreadForCustomer?"New reply":"Private thread"}</span><small>{conversation.lastMessagePreview||"Conversation opened"} · {dateText(conversation.lastMessageAt)}</small></div>
        <ConversationThread conversationId={conversation.id} role="customer" userId={user.uid} title="Booking conversation" purpose={conversation.bookingId?"deposit-proof":undefined}/>
      </article>)}</div>}
      <p className="jtsAccountNotificationNote">Deposit screenshots and messages are private to you and authorized JTS staff. Uploading a screenshot does not verify payment; John checks the Orange Money account before marking a deposit received.</p>
    </section>

    <header className="jtsAccountHero jtsAccountUtilityHero"><span className="jtsEyebrow">YOUR JTS STYLE JOURNEY</span><p>Manage appointments, keep your booking references close, and return to your style inspiration whenever you&apos;re ready.</p><div className="jtsAccountHeroActions"><Link href="/order" className="jtsButton jtsButtonGold">Plan my next look ↗</Link><Link href="/feed" className="jtsGhost">Explore the JTS feed</Link></div></header>

    {nextOrder && <><section className="jtsStyleNext"><div><span className="jtsEyebrow">UP NEXT</span><h2>{nextOrder.items.map(item => item.name).join(" · ")}</h2><p>{dateText(nextOrder.scheduledFor)} · {label(nextOrder.status)}</p><small>Reference #{nextOrder.id.slice(0, 8).toUpperCase()} · A request is not confirmed until John confirms the slot and deposit.</small></div><Link href={"/orders/" + nextOrder.id} className="jtsButton jtsButtonGold">View booking ↗</Link></section>{nextOrder.status!=="Confirmed"&&<section className="jtsDepositReminder" aria-live="polite"><div><span className="jtsEyebrow">APPOINTMENT DEPOSIT</span><strong>{nextDepositProofSent?"Screenshot submitted · awaiting John’s review":"Your 50% deposit is still to be reviewed"}</strong><p>{nextDepositProofSent?"John will check the transfer against the Orange Money account. You do not need to send another screenshot.": "Send the 50% deposit to Orange Money 75720306 · John SHUMBA, then upload your screenshot in your private booking conversation."}</p></div><Link href="#account-payment-proof" className="jtsButton jtsButtonGold">{nextDepositProofSent?"View payment update":"Upload screenshot ↗"}</Link></section>}</>}

    <section className="jtsStyleStats" aria-label="Your style summary"><article><span>BOOKINGS</span><strong>{orders.length}</strong><small>Requests in this account</small></article><article><span>PAST DATES</span><strong>{pastOrders.length}</strong><small>Previous appointment dates</small></article><article><span>ACCOUNT</span><strong>{user && !user.isAnonymous ? "SAVED" : "GUEST"}</strong><small>{user && !user.isAnonymous ? "Connected sign-in" : "This device session"}</small></article></section>

    <section className="jtsStyleHistory"><div className="jtsStyleSectionHead"><div><span className="jtsEyebrow">YOUR PERSONAL RECORD</span><h2>Booking history.</h2><p>Showing {Math.min(INITIAL_BOOKINGS_VISIBLE, recentOrders.length)} recent {recentOrders.length === 1 ? "booking" : "bookings"} first, so the important details stay easy to scan.</p></div><Link href="/order" className="jtsStyleTextLink">New booking ↗</Link></div>
      {user && !ready ? <div className="jtsStyleEmpty">Loading your bookings…</div> : user && orders.length > 0 ? <><div className="jtsStyleBookingList">{visibleOrders.map(order => <article key={order.id} className="jtsBookingRow jtsStyleBookingRow"><div><span className="jtsEyebrow">{label(order.status)}</span><h3>{order.items.map(item => item.name).join(" · ")}</h3><p>{dateText(order.scheduledFor)}</p><small>Reference #{order.id.slice(0, 8).toUpperCase()} · {order.status}</small></div><Link href={"/orders/" + order.id} className="jtsGhost">View booking ↗</Link></article>)}</div>{recentOrders.length > INITIAL_BOOKINGS_VISIBLE && <button type="button" className="jtsAccountShowBookings" onClick={() => setShowAllBookings(value => !value)}>{showAllBookings ? "Show only the 3 most recent" : "View all " + recentOrders.length + " bookings"}</button>}</> : user ? <div className="jtsStyleEmpty"><span className="jtsEyebrow">NO BOOKINGS YET</span><h3>Your first look starts here.</h3><p>Choose a service, request a future date and keep your reference here.</p><Link href="/order" className="jtsButton jtsButtonGold">Book your first look ↗</Link></div> : <div className="jtsStyleEmpty"><p>Open your private booking session above to load its history.</p></div>}
    </section>

    <section className="jtsStyleFeedInvite"><div><span className="jtsEyebrow">INSPIRATION BETWEEN VISITS</span><h2>See what’s next.</h2><p>Explore John’s work, share your own photo and keep a record of how happy you are with each look.</p></div><Link href="/feed" className="jtsButton jtsButtonGold">Share a look & review ↗</Link></section>

    <CustomerStyleInspiration />
    <JtsStyleGuide />

    <section className="jtsAccountGame"><section className="jtsAccountStudioIntro"><span className="jtsEyebrow">OPTIONAL · STYLE STUDIO</span><h2>Try a new direction.</h2><p>A creative playground when you&apos;re in the mood to experiment. Your bookings and account tools stay first.</p></section><StyleStudio /></section>
    <div className="jtsAccountNote"><strong>Appointment truth:</strong> submitting a request does not confirm the slot or mean a deposit has been received. John confirms the appointment and deposit separately. For help, use your JTS booking history and appointment request details.</div>
  </div></main>;
}
