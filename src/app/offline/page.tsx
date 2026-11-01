import Link from "next/link";

export default function OfflinePage() {
  return (
    <main className="jtsBookingPage">
      <div className="jtsContainer jtsBookingWrap">
        <div className="jtsBookingTop">
          <Link href="/" className="jtsBack"><img className="jtsOfflineLogo" src="/jts.jpg" alt="" /> John The Stylist Bw</Link>
          <span>Demo operation</span>
        </div>
        <section className="jtsConfirmation">
          <span className="jtsEyebrow">DEMO OPERATION · OFFLINE</span>
          <div className="jtsConfirmIcon">⌁</div>
          <h1>You&apos;re offline, but John The Stylist Bw is still here.</h1>
          <p>John The Stylist Bw is currently operating this customer experience as a demo operation while the business prepares the live paid service. Previously loaded pages can remain available on this device without a connection.</p>
          <p>Any booking information saved while offline is only a local copy. It is <strong>not a confirmed appointment</strong> and does not mean a deposit or payment has been received.</p>
          <div className="jtsPaymentCard">
            <span>BEFORE GO-LIVE</span>
            <strong>Demo operation</strong>
            <small>The live customer service will only be treated as active once the business has completed its paid launch setup.</small>
          </div>
          <div className="jtsConfirmActions">
            <Link className="jtsButton jtsButtonGold" href="/order">Open booking →</Link>
            <Link className="jtsGhost" href="/">Back to John The Stylist Bw</Link>
          </div>
        </section>
      </div>
    </main>
  );
}