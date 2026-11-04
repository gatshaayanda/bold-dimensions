import Link from "next/link";
import Image from "next/image";
import { SERVICE_AREAS } from "@/lib/bold-dimensions";

export default function Home(){
 return <main className="bdApp">
  <header className="bdHeader">
   <Link href="/" className="bdBrand"><Image src="/brand/bold-dimensions-logo.jpg" alt="Bold Dimensions" width={48} height={48} priority/><span><strong>BOLD DIMENSIONS</strong><small>SERVICE & EQUIPMENT HUB</small></span></Link>
   <nav><Link href="/services">Services</Link><Link href="/account">My requests</Link><Link className="bdHeaderCta" href="/order">Request support <span>↗</span></Link></nav>
  </header>
  <section className="bdHero">
   <div className="bdHeroCopy"><span className="bdEyebrow">TECHNICAL SUPPORT · BOTSWANA</span><h1>Keep your<br/><em>systems working.</em></h1><p>Request support for agricultural machinery, air conditioning and solar water heating.</p><div className="bdActions"><Link className="bdPrimary" href="/order">Request a service <span>↗</span></Link><Link className="bdSecondary" href="/services">View service areas</Link></div><div className="bdTrustLine"><span>Three service areas</span><i/><span>Direct team follow-up</span></div></div>
  </section>
  <section className="bdServicesSection"><div className="bdSectionHead"><div><span className="bdEyebrow">WHAT DO YOU NEED HELP WITH?</span><h2>Choose your <em>service area.</em></h2></div><Link href="/services">All services ↗</Link></div><div className="bdAreaGrid">{SERVICE_AREAS.map((area,index)=><Link href={"/order?area="+area.id} className="bdAreaCard" key={area.id}><span className="bdAreaNumber">0{index+1}</span><div><h3>{area.name}</h3><p>{area.intro}</p></div><span className="bdAreaArrow">↗</span></Link>)}</div></section>
  <section className="bdHow"><div><span className="bdEyebrow">HOW IT WORKS</span><h2>From request<br/><em>to resolution.</em></h2></div><ol><li><b>01</b><span><strong>Tell us what you need</strong><small>Choose a service area and share the equipment details.</small></span></li><li><b>02</b><span><strong>We review your request</strong><small>The team checks the details and follows up with you.</small></span></li><li><b>03</b><span><strong>Agree the next step</strong><small>Confirm the assessment, quote or service arrangement directly.</small></span></li></ol></section>
  <section className="bdContact"><div><span className="bdEyebrow">NEED TO SPEAK TO THE TEAM?</span><h2>Let’s get the right<br/><em>support moving.</em></h2></div><div className="bdContactLinks"><a href="tel:+26773207038">+267 73 207 038</a><a href="tel:+2673961158">+267 396 1158</a><a href="mailto:sales@bolddimensions.co.bw">sales@bolddimensions.co.bw</a><Link href="/order" className="bdPrimary">Start a request ↗</Link></div></section>
  <footer className="bdFooter"><Link href="/" className="bdBrand"><Image src="/brand/bold-dimensions-logo.jpg" alt="" width={34} height={34}/><span><strong>BOLD DIMENSIONS</strong><small>SERVICE & EQUIPMENT HUB</small></span></Link><span>Technical support · Botswana</span><Link href="/admin">Team access</Link></footer>
  <nav className="bdMobileDock" aria-label="Quick navigation"><Link href="/">Home</Link><Link href="/services">Services</Link><Link href="/order">Request</Link><Link href="/account">My requests</Link></nav>
 </main>;
}
