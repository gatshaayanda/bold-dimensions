import Link from "next/link";
import PublicServiceCards from "@/components/public-service-cards";

export default function ServicesPage() {
  return <main className="jtsUtilityPage">
    <header><Link href="/" className="jtsUtilityBack">← JTS STYLES</Link><span>THE SERVICE EDIT</span></header>
    <section><span className="jtsAppKicker">CUT · COLOUR · CHARACTER</span><h1>Choose your <em>starting point.</em></h1><p>Explore the four service categories. Open a category to see every service and its price, then choose the one you want to request.</p><PublicServiceCards /></section>
    <footer><Link href="/order" className="jtsAppBook"><strong>Book an appointment</strong><b>↗</b></Link></footer>
  </main>;
}
