import Link from "next/link";
import Image from "next/image";
import { SERVICE_AREAS } from "@/lib/bold-dimensions-config";
import BdMobileDock from "@/components/bd-mobile-dock";
import PromotionShowcase from "@/components/PromotionShowcase";

export default function Home(){
 return <main className="bdApp bdHomeCompact">
  <header className="bdHeader">
   <Link href="/" className="bdBrand"><Image src="/brand/bold-dimensions-logo.jpg" alt="Bold Dimensions" width={42} height={42} priority/><span><strong>BOLD DIMENSIONS</strong><small>SERVICE & EQUIPMENT HUB</small></span></Link>
   <nav><Link href="/services">Services</Link><Link href="/account">My requests</Link><Link className="bdHeaderCta" href="/order">Request support <span>↗</span></Link></nav>
  </header>
  <PromotionShowcase/>
  <section className="bdServicesSection bdServicesCompact"><div className="bdSectionHead"><div><span className="bdEyebrow">SERVICE DIRECTORY</span><h2>What needs <em>attention?</em></h2></div><Link href="/services">All services ↗</Link></div><div className="bdAreaGrid">{SERVICE_AREAS.map((area,index)=><Link href={"/order?area="+area.id} className="bdAreaCard" key={area.id}><span className="bdAreaNumber">0{index+1}</span><div><h3>{area.name}</h3><p>{area.id==="solar-water-heating"?"Install · maintain · repair":area.id==="air-conditioning"?"Install · service · diagnose":"Machinery · parts · repairs"}</p></div><span className="bdAreaArrow">↗</span></Link>)}</div></section>
  <footer className="bdFooter bdFooterCompact"><Link href="/account">Track a request ↗</Link><Link href="/admin">Team access</Link></footer>
  <BdMobileDock/>
 </main>;
}
