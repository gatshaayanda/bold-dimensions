"use client";

import Link from "next/link";
import JtsInstallButton from "@/app/jts-install-button";
import JtsHomeHeroVisual from "@/components/jts-home-hero-visual";
import PublicServiceCards from "@/components/public-service-cards";

function Logo() {
  return <Link href="/" className="jtsAppLogo" aria-label="John The Stylist Bw home">
    <img src="/jts.jpg" alt="" />
    <span><b>JOHN THE STYLIST BW</b><small>CUTS · COLOUR · STYLE</small></span>
  </Link>;
}

export default function Home() {
  return <main className="jtsAppHome">
    <header className="jtsAppHeader">
      <Logo />
      <span>GABORONE, BOTSWANA</span>
      <Link href="/account" className="jtsAppAccount" aria-label="My JTS account">◉</Link>
    </header>

    <section className="jtsAppHero">
      <div className="jtsAppHeroVisual"><JtsHomeHeroVisual /></div>
      <div className="jtsAppHeroCopy">
        <span className="jtsAppKicker">JOHN THE STYLIST BW · G WEST</span>
        <h1>Your look.<br /><em>Your signature.</em></h1>
        <p>Precision cuts, colour and statement styles by John.</p>
        <div className="jtsPublicHeroActions">
          <Link href="/services" className="jtsAppBook"><strong>Explore styles</strong><b>↗</b></Link>
          <Link href="/order" className="jtsPublicBookSecondary">Book with John <span>↗</span></Link>
        </div>
      </div>
    </section>

    <section className="jtsPublicLookbook" aria-labelledby="jts-public-lookbook-title">
      <div className="jtsPublicSectionHeading">
        <div><span className="jtsAppKicker">THE JTS STYLE EDIT</span><h2 id="jts-public-lookbook-title">Find your <em>starting point.</em></h2><p>Explore real service categories, see the work and choose what feels right.</p></div>
        <Link href="/services">View all services <span>↗</span></Link>
      </div>
      <PublicServiceCards />
      <p className="jtsPublicLookbookNote">Every style leads to its actual service and published price. Not sure what to choose? Ask John when you book.</p>
    </section>

    <section className="jtsAppShortcuts" aria-label="JTS customer destinations">
      <Link href="/account"><span>◉</span><strong>My appointments</strong><small>Bookings & history</small><b>↗</b></Link>
      <Link href="/services"><span>✂</span><strong>Services & prices</strong><small>Explore four categories</small><b>↗</b></Link>
      <Link href="/studio"><span>✳</span><strong>Style Studio</strong><small>Play with your next look</small><b>↗</b></Link>
      <a href="https://www.google.com/maps/search/?api=1&query=Star+Tattoos+G+West+Gaborone+Botswana" target="_blank" rel="noreferrer"><span>⌖</span><strong>Find JTS</strong><small>G West · Gaborone</small><b>↗</b></a>
    </section>

    <section className="jtsAppInstall">
      <div><span className="jtsAppKicker">KEEP JTS CLOSE</span><strong>Your next appointment, one tap away.</strong><small>Install John The Stylist Bw on your home screen.</small></div>
      <JtsInstallButton />
    </section>

    <footer className="jtsAppFooter">
      <Logo />
      <span>Beauty · Colour · Cuts · Barbering</span>
      <Link href="/admin" className="jtsAdminAccessLink" aria-label="Admin login">admin</Link>
    </footer>

    <nav className="jtsHomeDock" aria-label="Quick navigation">
      <Link href="/"><span>⌂</span><small>Home</small></Link>
      <Link href="/services"><span>✂</span><small>Looks</small></Link>
      <Link href="/order"><span>▦</span><small>Book</small></Link>
      <Link href="/account"><span>◉</span><small>Account</small></Link>
    </nav>
  </main>;
}
