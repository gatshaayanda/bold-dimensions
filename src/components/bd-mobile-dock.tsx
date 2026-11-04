"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Wrench, ClipboardList, UserRound } from "lucide-react";

const items=[
 {href:"/",label:"Home",icon:Home},
 {href:"/services",label:"Services",icon:Wrench},
 {href:"/order",label:"Request",icon:ClipboardList},
 {href:"/account",label:"My requests",icon:UserRound}
];
export default function BdMobileDock(){
 const pathname=usePathname();
 return <nav className="bdMobileDock" aria-label="Main navigation">{items.map(item=>{const Icon=item.icon;const active=item.href==="/"?pathname==="/":pathname===item.href||pathname.startsWith(item.href+"/");return <Link href={item.href} key={item.href} className={active?"active":""} aria-current={active?"page":undefined}><Icon size={18} strokeWidth={active?2.5:1.8}/><small>{item.label}</small></Link>})}</nav>;
}
