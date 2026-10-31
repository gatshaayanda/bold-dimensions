import Link from "next/link";
import StyleStudio from "@/app/style-studio";

export default function StudioPage() {
  return <main className="jtsUtilityPage jtsStudioPage">
    <header><Link href="/" className="jtsUtilityBack">← JTS STYLES</Link><span>THE PERSONAL STYLE PLAYGROUND</span></header>
    <section><span className="jtsAppKicker">JTS / STYLE STUDY</span><h1>Try a new <em>direction.</em></h1><p>A playful style exercise between visits. Build a look, test it against a style brief and carry your choices into your next appointment request.</p><StyleStudio /></section>
    <footer><Link href="/order" className="jtsAppBook"><strong>Book an appointment</strong><b>↗</b></Link></footer>
  </main>;
}
