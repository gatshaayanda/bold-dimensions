import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Sun, Wind, Tractor } from "lucide-react";
import { SERVICE_AREAS } from "@/lib/bold-dimensions-config";
import BdMobileDock from "@/components/bd-mobile-dock";
import PromotionShowcase from "@/components/PromotionShowcase";

const serviceIcons=[Sun,Wind,Tractor];
const serviceHints=["Solar geysers · installation · repairs","Installation · servicing · diagnostics","Machinery repairs · parts enquiries"];

export default function Home(){
 return <main className="bdApp bdHomeFinal">
  <header className="bdHeader bdHomeHeader">
   <Link href="/" className="bdBrand"><Image src="/brand/bold-dimensions-logo.jpg" alt="Bold Dimensions" width={42} height={42} priority/><span><strong>BOLD DIMENSIONS</strong><small>SERVICE & EQUIPMENT HUB</small></span></Link>
   <nav aria-label="Main navigation"><Link href="#services">Services</Link><Link href="/account">My requests</Link></nav>
  </header>
  <PromotionShowcase/>
  <section className="bdServicesSection bdHomeServices" id="services">
   <div className="bdSectionHead"><div><span className="bdEyebrow">CHOOSE A SERVICE</span><h2>What do you need <em>help with?</em></h2></div><span>3 service areas</span></div>
   <div className="bdHomeServiceGrid">{SERVICE_AREAS.map((area,index)=>{const Icon=serviceIcons[index]??ArrowUpRight;return <Link href={"/order?area="+area.id} className="bdHomeService" key={area.id}>
    <span className="bdHomeServiceIcon"><Icon size={21} strokeWidth={1.8}/></span><span className="bdHomeServiceText"><strong>{area.name}</strong><small>{serviceHints[index]}</small></span><ArrowUpRight className="bdHomeServiceArrow" size={18}/>
   </Link>})}</div>
  </section>
  <footer className="bdFooter bdHomeFooter"><Link href="/account">Track a request <ArrowUpRight size={13}/></Link><Link href="/admin">Team access</Link><span>BOTSWANA</span></footer>
  <BdMobileDock/>
 </main>;
}
