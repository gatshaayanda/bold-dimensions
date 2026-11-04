import Link from "next/link";

export default function OfflinePage() {
  return (
    <main className="jtsBookingPage">
      <div className="jtsContainer jtsBookingWrap">
        <div className="jtsBookingTop">
          <Link href="/" className="jtsBack"><img className="jtsOfflineLogo" src="/brand/bold-dimensions-logo.jpg" alt="" /> Bold Dimensions</Link>
          <span>OFFLINE MODE</span>
        </div>
        <section className="jtsConfirmation">
          <span className="jtsEyebrow">CONNECTION INTERRUPTED</span>
          <div className="jtsConfirmIcon">⌁</div>
          <h1>You’re offline. Your service hub is still here.</h1>
          <p>Previously loaded pages may remain available on this device. Reconnect to send a new request, receive updates or contact the Bold Dimensions team.</p>
          <div className="jtsPaymentCard">
            <span>YOUR INFORMATION</span>
            <strong>Saved data stays on this device</strong>
            <small>Offline availability does not mean a request has been submitted or a service appointment has been confirmed.</small>
          </div>
          <div className="jtsConfirmActions">
            <Link className="jtsButton jtsButtonGold" href="/">Return to Bold Dimensions →</Link>
          </div>
        </section>
      </div>
    </main>
  );
}