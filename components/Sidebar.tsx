'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FolderKanban, Clapperboard, CalendarDays, FileText, Users, MapPin, WalletCards, ClipboardCheck, Files, Settings } from 'lucide-react';

const items=[
['Dashboard','/dashboard',LayoutDashboard],['Projects','/projects',FolderKanban],['Scenes','/scenes',Clapperboard],['Schedule','/schedule',CalendarDays],['Call Sheets','/call-sheets',FileText],['Crew','/crew',Users],['Locations','/locations',MapPin],['Budget','/budget',WalletCards],['Daily Reports','/reports',ClipboardCheck],['Documents','/documents',Files],['Team','/team',Users],
] as const;

export default function Sidebar(){
  const path=usePathname();
  return <aside className="sidebar">
    <div className="brand"><span>PRODUCER</span><b>OS</b><small>v1.0</small></div>
    <div className="nav-section">WORKSPACE</div>
    <nav className="nav">{items.map(([label,href,Icon])=><Link key={href} href={href} className={path===href||path.startsWith(href+'/')?'active':''}><Icon size={17}/><span>{label}</span></Link>)}</nav>
    <div className="nav-section lower">SYSTEM</div>
    <Link href="/settings" className={'nav-link '+(path==='/settings'?'active':'')}><Settings size={17}/> <span>Settings</span></Link>
    <div className="sidebar-user"><div className="avatar">VP</div><div><strong>Producer</strong><small>Production account</small></div></div>
  </aside>
}
