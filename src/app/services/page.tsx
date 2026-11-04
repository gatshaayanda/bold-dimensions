import Link from "next/link";
import Image from "next/image";
import { SERVICE_AREAS } from "@/lib/bold-dimensions-config";
import BdMobileDock from "@/components/bd-mobile-dock";

export const metadata={title:"Services",description:"Agricultural machinery, air conditioning and solar water-heating service enquiries."};
export default function ServicesPage(){
 return <main className="bdUtility">
  <header className="bdUtilityHeader"><Link href="/" className="bdBrand"><Image src="/brand/bold-dimensions-logo.jpg" alt="" width={42} height={42}/><span><strong>BOLD DIMENSIONS</strong><small>SERVICE HUB</small></span></Link><Link href="/order" className="bdHeaderCta">Request support ↗</Link></header>
  <section className="bdUtilityIntro"><span className="bdEyebrow">SERVICE AREAS</span><h1>Find the right<br/><em>technical support.</em></h1><p>Choose the area that best matches your equipment or installation. Share the details and the team will follow up to understand the work required.</p></section>
  <div className="bdServiceList">{SERVICE_AREAS.map((area,index)=><section key={area.id} className="bdServiceDetail"><div className="bdServiceDetailHead"><span>0{index+1}</span><div><h2>{area.name}</h2><p>{area.intro}</p></div></div><ul>{area.options.map(option=><li key={option}>{option}</li>)}</ul><Link href={"/order?area="+area.id} className="bdPrimary">Request {area.short.toLowerCase()} support <span>↗</span></Link></section>)}</div>
  <footer className="bdUtilityFooter"><Link href="/">← Back to Bold Dimensions</Link><Link href="/account">Track a request ↗</Link></footer>
  <BdMobileDock/>\n </main>;
}
