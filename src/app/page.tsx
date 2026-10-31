"use client";

import Link from "next/link";
import JtsInstallButton from "@/app/jts-install-button";
import StyleStudio from "@/app/style-studio";
import PublicServiceCards from "@/components/public-service-cards";
import OwnerStyleLandingFeed from "@/components/owner-style-landing-feed";

function Logo() {
  return <Link href="/" className="jtsEditLogo" aria-label="JTS Styles home">
    <img className="jtsOfficialLogo" src="/jts.jpg" alt="" />
    <span className="jtsEditLogoWords"><b>JTS STYLES</b><small>JOHN THE STYLIST BW</small></span>
  </Link>;
}

export default function Home() {
  return <main className="jtsSite jtsEditorialHome">
    <div className="jtsEditTopline">
      <div className="jtsEditContainer">
        <span>GABORONE, BOTSWANA</span>
        <span>PERSONAL STYLE · BY APPOINTMENT</span>
      </div>
    </div>

    <header className="jtsEditHeader">
      <div className="jtsEditContainer jtsEditHeaderInner">
        <Logo />
        <nav aria-label="Main navigation">
          <a href="#services">Services & prices</a>
          <a href="#booking">Before you book</a>
        </nav>
        <div className="jtsEditHeaderActions">
          <Link href="/account" className="jtsEditTextLink">My JTS account ↗</Link>
        </div>
      </div>
    </header>

    <section className="jtsEditHero">
      <div className="jtsEditContainer jtsEditHeroGrid">
        <div className="jtsEditHeroCopy">
          <span className="jtsEditEyebrow"><i /> JTS STYLES · G WEST</span>
          <h1>Your look.<br />Your <em>signature.</em></h1>
          <p>Precision cuts, bleach, colour and statement styles by John. Bring the idea. Let’s shape your look.</p>
          <div className="jtsEditHeroActions">
            <Link href="/order" className="jtsEditPrimary">Book an appointment <span>↗</span></Link>
            <a href="#services" className="jtsEditSecondary">View services & prices <span>↓</span></a>
          </div>
        </div>
        <div className="jtsEditHeroArt" aria-label="JTS Styles visual identity">
          <div className="jtsEditArtTop"><span>THE PERSONAL EDIT</span><span>BW / 001</span></div>
          <div className="jtsEditArtCircle"><span>J</span><i>✳</i></div>
          <div className="jtsEditArtType"><span>STYLE</span><em>IS</em><span>PERSONAL.</span></div>
          <div className="jtsEditArtSide">CUT · COLOUR · CHARACTER · CUT · COLOUR · CHARACTER ·</div>
          <div className="jtsEditArtBottom"><span>JOHN THE STYLIST BW</span><span>GABORONE, BOTSWANA</span></div>
        </div>
      </div>
    </section>

    <section className="jtsHomeActions" aria-label="JTS quick actions"><div className="jtsEditContainer"><div className="jtsHomeActionPrimary"><Link href="/order"><span className="jtsHomeActionIcon">✳</span><span><small>START HERE</small><strong>Book an appointment</strong></span><b>↗</b></Link></div><div className="jtsHomeActionGrid"><Link href="/account"><span>◉</span><strong>My appointments</strong><small>Account & booking history</small><b>↗</b></Link><a href="#services"><span>✂</span><strong>Services & prices</strong><small>Explore the four categories</small><b>↗</b></a><a href="#style-studio"><span>✳</span><strong>Style Studio</strong><small>Play with your next look</small><b>↗</b></a><a href="#visit"><span>⌖</span><strong>Find JTS</strong><small>G West · Gaborone</small><b>↗</b></a></div></div></section>

    <section id="services" className="jtsEditServices">
      <div className="jtsEditContainer">
        <div className="jtsEditSectionHead">
          <div><span className="jtsEditEyebrow">01 / THE SERVICE EDIT</span><h2>Choose the <em>starting point.</em></h2></div>
          <p>Choose a listed service and see its price before you request a time.</p>
        </div>
        <PublicServiceCards />
        <div className="jtsEditAskBand">
          <div><span>YOUR IDEA ISN’T LISTED?</span><strong>Fades, bobs, tinting or a special-event look?</strong><p>Ask about the style and price before you commit. No made-up catalogue prices.</p></div>
          <Link href="/order" className="jtsEditSecondary">Request another style <span>↗</span></Link>
        </div>
      </div>
    </section>


    <OwnerStyleLandingFeed />

    <section id="booking" className="jtsEditBooking">
      <div className="jtsEditContainer">
        <div className="jtsEditSectionHead jtsEditBookingHead">
          <div><span className="jtsEditEyebrow">BEFORE YOU BOOK</span><h2>Good style.<br /><em>No guesswork.</em></h2></div>
          <p>Three things to know before you send your appointment request.</p>
        </div>
        <div className="jtsEditBookingGrid">
          <article><span>01</span><div><h3>Choose your service</h3><p>Start with the listed look that fits. Add notes to describe what you have in mind.</p></div></article>
          <article><span>02</span><div><h3>Request a time</h3><p>Choose a date at least one day ahead, between 08:00 and 18:00. John still needs to confirm the slot.</p></div></article>
          <article><span>03</span><div><h3>Secure your spot</h3><p>A 50% deposit is required. Pay via Orange Money only after you have checked the details and follow the booking instructions.</p></div></article>
        </div>
        <div className="jtsEditPaymentBar">
          <div><span>ORANGE MONEY · DEPOSIT DETAILS</span><strong>75720306</strong><small>Account name: John SHUMBA</small></div>
          <p><b>Important:</b> submitting a request does not confirm the appointment or mean a deposit has been received. Your booking is secured when John confirms the slot and deposit.</p>
        </div>
      </div>
    </section>

    <section id="visit" className="jtsEditVisit">
      <div className="jtsEditContainer jtsEditVisitGrid">
        <div className="jtsEditVisitCopy">
          <span className="jtsEditEyebrow">03 / COME THROUGH</span>
          <h2>G West.<br /><em>Find the purple door.</em></h2>
          <p>G West shops, upstairs at Star Tattoos parlor and boutique, inside the salon with the purple door labelled “miss Emma”.</p>
          <div className="jtsEditVisitActions">
            <a href="https://www.google.com/maps/search/?api=1&query=Star+Tattoos+G+West+Gaborone+Botswana" target="_blank" rel="noreferrer" className="jtsEditPrimary">Find the location <span>↗</span></a>
          </div>
        </div>
        <aside className="jtsEditVisitCard">
          <div className="jtsEditVisitCardTop"><span>JTS STYLES</span><span>GABORONE / BW</span></div>
          <div className="jtsEditDoor"><span>J</span><b>MISS EMMA</b><small>UPSTAIRS · G WEST SHOPS</small></div>
        </aside>
      </div>
    </section>

    <section className="jtsEditKeep">
      <div className="jtsEditContainer jtsEditKeepInner">
        <img className="jtsEditKeepLogo" src="/jts.jpg" alt="JTS Styles logo" />
        <div className="jtsEditKeepCopy"><span className="jtsEditEyebrow">INSTALL JTS STYLES</span><h2>Your next appointment,<br /><em>one tap away.</em></h2><p>Add JTS Styles to your home screen for a quicker return to booking, appointment history and John’s updates.</p></div>
        <div className="jtsEditKeepAction"><JtsInstallButton /></div>
      </div>
    </section>

    <section id="style-studio" className="jtsAccountStudioIntro"><span className="jtsEyebrow">YOUR PERSONAL STYLE PLAYGROUND</span><h2>Try a new direction.</h2><p>Build a look, test it against a style brief, and carry your choices into your next appointment request.</p></section>
    <StyleStudio />

    <footer className="jtsEditFooter">
      <div className="jtsEditContainer">
        <div className="jtsEditFooterMain"><Logo /><p>Beauty · Colour · Cuts · Barbering<br />Gaborone, Botswana</p></div>
        <div className="jtsEditFooterBottom"><span>© JTS STYLES · JOHN THE STYLIST BW</span><div><Link href="/account">My JTS account</Link><Link href="/admin" className="jtsAdminAccessLink" aria-label="Admin login">admin</Link></div></div>
      </div>
    </footer>
    <nav className="jtsHomeDock" aria-label="Quick navigation"><Link href="/"><span>⌂</span><small>Home</small></Link><Link href="/order"><span>▦</span><small>Book</small></Link><Link href="/account"><span>◉</span><small>Account</small></Link><a href="#style-studio"><span>✳</span><small>Studio</small></a></nav>
  </main>;
}
