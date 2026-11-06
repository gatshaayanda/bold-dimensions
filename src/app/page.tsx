import Link from "next/link";
import Image from "next/image";
import { SERVICE_AREAS } from "@/lib/bold-dimensions-config";
import BdMobileDock from "@/components/bd-mobile-dock";
import PromotionShowcase from "@/components/PromotionShowcase";

export default function Home(){
 return <main className="bdApp">
  <header className="bdHeader">
   <Link href="/" className="bdBrand"><Image src="/brand/bold-dimensions-logo.jpg" alt="Bold Dimensions" width={48} height={48} priority/><span><strong>BOLD DIMENSIONS</strong><small>SERVICE & EQUIPMENT HUB</small></span></Link>
   <nav><Link href="/services">Services</Link><Link href="/account">My requests</Link><Link className="bdHeaderCta" href="/order">Request support <span>↗</span></Link></nav>
  </header>
  <PromotionShowcase/>
  <section className="bdServicesSection"><div className="bdSectionHead"><div><span className="bdEyebrow">WHAT DO YOU NEED HELP WITH?</span><h2>Choose your <em>service area.</em></h2></div><Link href="/services">All services ↗</Link></div><div className="bdAreaGrid">{SERVICE_AREAS.map((area,index)=><Link href={"/order?area="+area.id} className="bdAreaCard" key={area.id}><span className="bdAreaNumber">0{index+1}</span><div><h3>{area.name}</h3><p>{area.intro}</p></div><span className="bdAreaArrow">↗</span></Link>)}</div></section>
  <section className="bdHow"><div><span className="bdEyebrow">HOW IT WORKS</span><h2>From request<br/><em>to resolution.</em></h2></div><ol><li><b>01</b><span><strong>Tell us what you need</strong><small>Choose a service area and share the equipment details.</small></span></li><li><b>02</b><span><strong>We review your request</strong><small>The team checks the details and follows up with you.</small></span></li><li><b>03</b><span><strong>Agree the next step</strong><small>Confirm the assessment, quote or service arrangement directly.</small></span></li></ol></section>
  <section className="bdContact"><div><span className="bdEyebrow">READY TO GET STARTED?</span><h2>Tell us what your<br/><em>system needs.</em></h2></div><div className="bdContactLinks"><p>Send a service request through the app. The team can review the details and continue the conversation in your private request thread.</p><Link href="/order" className="bdPrimary">Start a service request ↗</Link><Link href="/account" className="bdSecondary">View my requests</Link></div></section>
  <footer className="bdFooter"><Link href="/" className="bdBrand"><Image src="/brand/bold-dimensions-logo.jpg" alt="" width={34} height={34}/><span><strong>BOLD DIMENSIONS</strong><small>SERVICE & EQUIPMENT HUB</small></span></Link><span>Technical support · Botswana</span><Link href="/admin">Team access</Link></footer>
  <BdMobileDock/>
 </main>;
}
