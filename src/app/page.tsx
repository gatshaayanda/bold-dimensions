"use client";

import Link from "next/link";
import JtsInstallButton from "@/app/jts-install-button";
import JtsHomeHeroVisual from "@/components/jts-home-hero-visual";

function Logo() {
  return <Link href="/" className="jtsAppLogo" aria-label="JTS Styles home">
    <img src="/jts.jpg" alt="" />
    <span><b>JTS STYLES</b><small>JOHN THE STYLIST BW</small></span>
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
        <span className="jtsAppKicker">JTS STYLES · G WEST</span>
        <h1>Your look.<br /><em>Your signature.</em></h1>
        <p>Precision cuts, colour and statement styles by John.</p>
        <Link href="/order" className="jtsAppBook"><span>▦</span><strong>Book an appointment</strong><b>↗</b></Link>
      </div>
    </section>

    <section className="jtsAppShortcuts" aria-label="JTS customer destinations">
      <Link href="/account"><span>◉</span><strong>My appointments</strong><small>Bookings & history</small><b>↗</b></Link>
      <Link href="/services"><span>✂</span><strong>Services & prices</strong><small>Explore four categories</small><b>↗</b></Link>
      <Link href="/studio"><span>✳</span><strong>Style Studio</strong><small>Play with your next look</small><b>↗</b></Link>
      <a href="https://www.google.com/maps/search/?api=1&query=Star+Tattoos+G+West+Gaborone+Botswana" target="_blank" rel="noreferrer"><span>⌖</span><strong>Find JTS</strong><small>G West · Gaborone</small><b>↗</b></a>
    </section>

    <section className="jtsAppInstall">
      <div><span className="jtsAppKicker">KEEP JTS CLOSE</span><strong>Your next appointment, one tap away.</strong><small>Install JTS Styles on your home screen.</small></div>
      <JtsInstallButton />
    </section>

    <footer className="jtsAppFooter">
      <Logo />
      <span>Beauty · Colour · Cuts · Barbering</span>
      <Link href="/admin" className="jtsAdminAccessLink" aria-label="Admin login">admin</Link>
    </footer>

    <nav className="jtsHomeDock" aria-label="Quick navigation">
      <Link href="/"><span>⌂</span><small>Home</small></Link>
      <Link href="/order"><span>▦</span><small>Book</small></Link>
      <Link href="/account"><span>◉</span><small>Account</small></Link>
      <Link href="/studio"><span>✳</span><small>Studio</small></Link>
    </nav>
  </main>;
}
